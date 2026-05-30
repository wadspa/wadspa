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

    const workletNode = new AudioWorkletNode(ctx, `wadspa-${meta.label}`, {
        numberOfInputs:    audioIn.length  || 1,
        numberOfOutputs:   audioOut.length || 1,
        outputChannelCount: Array(audioOut.length || 1).fill(1),
    });

    const inBufs  = audioIn.map(p  => `_shim_input_buf_${symbolName(p.name)}`);
    const outBufs = audioOut.map(p => `_shim_output_buf_${symbolName(p.name)}`);
    const setterMap = Object.fromEntries(
        ctrlIn.map(p => [p.index, `_shim_set_${symbolName(p.name)}`])
    );

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

    return new WadspNode(workletNode, meta);
}

class WadspNode {
    #node;
    #meta;
    #controls;

    constructor(workletNode, meta) {
        this.#node = workletNode;
        this.#meta = meta;
        this.#controls = new Map(
            meta.ports
                .filter(p => p.type === 'control' && p.dir === 'input')
                .map(p => [normalizeKey(p.name), p])
        );
        this.input  = workletNode;
        this.output = workletNode;
    }

    set(portName, value) {
        const port = this.#resolve(portName);
        this.#node.port.postMessage({ type: 'set', index: port.index, value: Number(value) });
        return this;
    }

    get node()  { return this.#node; }
    get ports() { return this.#meta.ports; }

    #resolve(name) {
        const port = this.#controls.get(normalizeKey(name));
        if (!port) throw new Error(`Unknown control port: "${name}"`);
        return port;
    }
}

function normalizeKey(name) {
    return name.toLowerCase().replace(/[\s_()[\]-]+/g, '');
}
