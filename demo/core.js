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
    // Safari requires numberOfInputs >= 1 or it won't call process() on the worklet.
    const nIn  = audioIn.length === 0 ? 1 : (stereoIn ? 1 : audioIn.length);
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

    const pending = {};

    await new Promise((resolve, reject) => {
        workletNode.port.onmessage = ({ data }) => {
            if (data.type === 'ready') resolve();
            if (data.type === 'error') reject(new Error(data.message));
            if (data.type === 'sf2loaded' && pending.sf2) { pending.sf2(); delete pending.sf2; }
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

    return new WadspNode(workletNode, outputNode, meta, hasMidi, pending);
}

class WadspNode {
    #node;
    #meta;
    #controls;
    #hasMidi;
    #pending;

    constructor(workletNode, outputNode, meta, hasMidi = false, pending = {}) {
        this.#node     = workletNode;
        this.#meta     = meta;
        this.#hasMidi  = hasMidi;
        this.#pending  = pending;
        this.#controls = new Map(
            meta.ports
                .filter(p => p.type === 'control' && p.dir === 'input')
                .map(p => [normalizeKey(p.name), p])
        );
        this.input  = workletNode;
        this.output = outputNode;
    }

    set(portName, value) {
        const port = this.#resolve(portName);
        // LV2 controls use symbol; LADSPA controls use index
        const msg = port.symbol
            ? { type: 'set', symbol: port.symbol, value: Number(value) }
            : { type: 'set', index:  port.index,  value: Number(value) };
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

    noteOn(note, velocity = 100, channel = 0) {
        return this.midi(0x90 | channel, note, velocity);
    }

    noteOff(note, channel = 0) {
        return this.midi(0x80 | channel, note, 0);
    }

    cc(controller, value, channel = 0) {
        return this.midi(0xB0 | channel, controller, value);
    }

    pitchBend(semitones, channel = 0) {
        const bend = Math.round(semitones * 8192 / 2) + 8192;
        const clamped = Math.max(0, Math.min(16383, bend));
        return this.midi(0xE0 | channel, clamped & 0x7F, clamped >> 7);
    }

    async loadSF2(urlOrBuffer) {
        let buffer;
        if (typeof urlOrBuffer === 'string') {
            const resp = await fetch(urlOrBuffer, { cache: 'no-cache' });
            if (!resp.ok) throw new Error(`Failed to fetch SF2: ${resp.status} ${urlOrBuffer}`);
            buffer = await resp.arrayBuffer();
        } else {
            buffer = urlOrBuffer;
        }
        return new Promise(resolve => {
            this.#pending.sf2 = resolve;
            this.#node.port.postMessage({ type: 'loadSF2', buffer }, [buffer]);
        });
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
    return name.toLowerCase().replace(/[\s_()[\]-]+/g, '');
}
