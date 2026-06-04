/**
 * @wadspa/core — runtime host for wadspa WASM plugins
 *
 * Usage:
 *   import { loadPlugin } from '@wadspa/core';
 *   import * as amp from '@wadspa/amp';
 *
 *   const node = await loadPlugin(audioContext, amp);
 *   node.set('Gain (dB)', -6);
 *   source.connect(node.input);
 *   node.output.connect(audioContext.destination);
 */

function symbolName(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

export async function loadPlugin(ctx, pluginModule) {
    const { meta, wasmUrl, processorUrl } = pluginModule;
    if (!meta || !wasmUrl || !processorUrl) {
        throw new Error('@wadspa/core: plugin module must export { meta, wasmUrl, processorUrl }');
    }

    const wasmBytes = await fetch(wasmUrl).then(r => {
        if (!r.ok) throw new Error(`Failed to fetch WASM: ${r.status} ${wasmUrl}`);
        return r.arrayBuffer();
    });

    await ctx.audioWorklet.addModule(processorUrl);

    const audioIn  = meta.ports.filter(p => p.type === 'audio' && p.dir === 'input');
    const audioOut = meta.ports.filter(p => p.type === 'audio' && p.dir === 'output');
    const ctrlIn   = meta.ports.filter(p => p.type === 'control' && p.dir === 'input');

    const stereoOut = audioOut.length === 2;
    const stereoIn  = stereoOut && audioIn.length === 2;
    const nIn  = audioIn.length === 0 ? 0 : (stereoIn ? 1 : audioIn.length);
    // Stereo plugins get 2 separate mono outputs merged via ChannelMergerNode.
    // Using outputChannelCount:[2] on a single output is unreliable in Safari.
    const nOut = stereoOut ? 2 : (audioOut.length || 1);
    const workletNode = new AudioWorkletNode(ctx, `wadspa-${meta.label}`, {
        numberOfInputs:     nIn,
        numberOfOutputs:    nOut,
        outputChannelCount: Array(nOut).fill(1),
        ...(stereoIn ? { channelCount: 2, channelCountMode: 'explicit' } : {}),
    });

    const inBufs  = audioIn.map(p  => `_shim_input_buf_${symbolName(p.name)}`);
    const outBufs = audioOut.map(p => `_shim_output_buf_${symbolName(p.name)}`);
    const setterMap = Object.fromEntries(
        ctrlIn.map(p => [p.index, `_shim_set_${symbolName(p.name)}`])
    );

    const hasMidi = meta.ports.some(p => p.type === 'midi' && p.dir === 'input');

    await new Promise((resolve, reject) => {
        workletNode.port.onmessage = ({ data }) => {
            if (data.type === 'ready') resolve();
            if (data.type === 'error') reject(new Error(data.message));
        };
        workletNode.port.postMessage(
            { type: 'setup', wasm: wasmBytes, inBufs, outBufs, setters: setterMap },
            [wasmBytes]
        );
    });

    // For stereo plugins, merge the two mono outputs into a stereo node.
    let outputNode = workletNode;
    if (stereoOut) {
        const merger = ctx.createChannelMerger(2);
        workletNode.connect(merger, 0, 0);
        workletNode.connect(merger, 1, 1);
        outputNode = merger;
    }

    return new WadspNode(workletNode, outputNode, meta, hasMidi, ctx);
}

class WadspNode {
    #node;
    #meta;
    #controls;
    #hasMidi;
    #ctx;

    constructor(workletNode, outputNode, meta, hasMidi = false, ctx = null) {
        this.#node     = workletNode;
        this.#meta     = meta;
        this.#hasMidi  = hasMidi;
        this.#ctx      = ctx;
        this.#controls = controlMap(meta);
        this.input  = workletNode;
        this.output = outputNode;
    }

    set(portName, value) {
        const port = this.#resolve(portName);
        const numeric = Number(value);
        const scaled = shouldScaleBySampleRate(port, numeric, this.#ctx)
            ? numeric * this.#ctx.sampleRate
            : numeric;
        // LV2 controls use symbol; LADSPA controls use index
        const msg = port.symbol
            ? { type: 'set', symbol: port.symbol, value: scaled }
            : { type: 'set', index:  port.index,  value: scaled };
        this.#node.port.postMessage(msg);
        return this;
    }

    // Send a raw MIDI message to an LV2 instrument.
    // status: MIDI status byte (e.g. 0x90 for note-on ch 0)
    // data1, data2: MIDI data bytes
    midi(status, data1, data2 = 0) {
        if (!this.#hasMidi) throw new Error('This plugin does not have a MIDI input port');
        this.#node.port.postMessage({ type: 'midi', status, data1, data2 });
        return this;
    }

    // Load an SF2 soundfont into a TSF-capable plugin.
    // urlOrBuffer: a URL string (fetched) or an ArrayBuffer (used directly).
    // Returns a Promise that resolves to this node when the SF2 is loaded.
    async loadSF2(urlOrBuffer) {
        let buffer;
        if (typeof urlOrBuffer === 'string') {
            const res = await fetch(urlOrBuffer);
            if (!res.ok) throw new Error(`Failed to fetch SF2: ${res.status} ${urlOrBuffer}`);
            buffer = await res.arrayBuffer();
        } else {
            buffer = urlOrBuffer;
        }
        return new Promise((resolve, reject) => {
            this.#node.port.onmessage = ({ data }) => {
                if (data.type === 'sf2loaded') resolve(this);
                else if (data.type === 'error') reject(new Error(data.message));
            };
            this.#node.port.postMessage({ type: 'loadSF2', buffer }, [buffer]);
        });
    }

    noteOn(note, velocity = 100, channel = 0) {
        return this.midi(0x90 | channel, note, velocity);
    }

    noteOff(note, channel = 0) {
        return this.midi(0x80 | channel, note, 0);
    }

    cc(controller, value, channel = 0) {
        return this.midi(0xB0 | channel, controller, value);
    }

    polyPressure(note, value, channel = 0) {
        return this.midi(0xA0 | channel, note, value);
    }

    channelPressure(value, channel = 0) {
        return this.midi(0xD0 | channel, value, 0);
    }

    pitchBend(semitones, channel = 0) {
        const bend = Math.round(semitones * 8192 / 2) + 8192;
        const clamped = Math.max(0, Math.min(16383, bend));
        return this.midi(0xE0 | channel, clamped & 0x7F, clamped >> 7);
    }

    get node()     { return this.#node; }
    get ports()    { return this.#meta.ports; }
    get hasMidi()  { return this.#hasMidi; }

    #resolve(name) {
        const port = this.#controls.get(normalizeKey(name));
        if (!port) throw new Error(`Unknown control port: "${name}"`);
        return port;
    }
}

function normalizeKey(name) {
    return String(name).toLowerCase().replace(/[\s_()[\]-]+/g, '');
}

function controlMap(meta) {
    const controls = new Map();
    for (const port of meta.ports.filter(p => p.type === 'control' && p.dir === 'input')) {
        for (const alias of [port.name, port.symbol, port.index]) {
            if (alias !== undefined && alias !== null) controls.set(normalizeKey(alias), port);
        }
    }
    return controls;
}

function shouldScaleBySampleRate(port, value, ctx) {
    if (!ctx || !port.sampleRate || !Number.isFinite(value)) return false;
    const min = Number(port.min);
    const max = Number(port.max);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return true;
    return value >= Math.min(min, max) && value <= Math.max(min, max);
}
