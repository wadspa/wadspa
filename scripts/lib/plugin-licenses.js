const SWH_PLUGIN_IDS = new Set([
    'amp',
    'bandpass_iir',
    'butterworth',
    'chorus',
    'comb',
    'crossover_dist',
    'dc_remove',
    'decimator',
    'declip',
    'delay',
    'diode',
    'dj_eq',
    'dyson_compress',
    'fast_lookahead_limiter',
    'flanger',
    'foverdrive',
    'gate',
    'gverb',
    'hard_limiter',
    'highpass_iir',
    'lowpass_iir',
    'notch_iir',
    'plate',
    'retro_flange',
    'satan_maximiser',
    'sc4',
    'single_para',
    'svf',
    'tape_delay',
    'triple_para',
    'valve',
    'vynil',
]);

const EXACT_PLUGIN_LICENSES = new Map([
    ['wadspa_synth', 'MIT'],
    ['fm_synth', 'MIT'],
    ['amsynth', 'GPL-2.0-or-later'],
    ['drumkv1', 'GPL-2.0-or-later'],
    ['so-404', 'GPL-2.0-or-later'],
    ['so-kl5', 'GPL-3.0-only'],
    ['so-666', 'GPL-2.0-or-later'],
    ['padthv1', 'GPL-2.0-or-later'],
    ['synthv1', 'GPL-2.0-or-later'],
    ['tsf', 'MIT'],
    ['samplv1', 'GPL-2.0-or-later'],
    ['fil4', 'GPL-2.0-or-later'],
    ['sorcer', 'GPL-3.0-only'],
    ['noise-repellent', 'LGPL-3.0-or-later'],
    ['string-machine', 'BSL-1.0'],
    ['wolf-shaper', 'GPL-3.0-only'],
    ['geonkick', 'GPL-3.0-only'],
    ['setbfree', 'GPL-2.0-or-later'],
    ['nekobi', 'GPL-2.0-or-later'],
    ['vl1-emulator', 'CC0-1.0 OR MIT'],
    ['casynth', 'GPL-2.0-or-later'],
    ['dexed', 'GPL-3.0-or-later'],
    ['juce-opl', 'GPL-2.0-or-later'],
    ['obxd', 'GPL-2.0-only'],
    ['chowkick', 'BSD-3-Clause'],
    ['calf-monosynth', 'LGPL-2.1-or-later/GPL-2.0-or-later'],
    ['adlplug', 'BSL-1.0'],
    ['helm', 'GPL-3.0-only'],
    ['zynaddsubfx', 'GPL-2.0-or-later'],
]);

const PREFIX_PLUGIN_LICENSES = [
    [/^mda_/, 'GPL-3.0-or-later'],
    [/^fomp-/, 'GPL-2.0-or-later'],
    [/^tap-/, 'GPL-2.0-or-later'],
    [/^(Za|Zam)/, 'GPL-2.0-or-later'],
    [/^setBfree-/, 'GPL-2.0-or-later'],
];

export function inferPluginLicense(id) {
    if (EXACT_PLUGIN_LICENSES.has(id)) return EXACT_PLUGIN_LICENSES.get(id);
    if (SWH_PLUGIN_IDS.has(id)) return 'GPL-2.0-or-later';
    for (const [pattern, license] of PREFIX_PLUGIN_LICENSES) {
        if (pattern.test(id)) return license;
    }
    return null;
}

export function withInferredPluginLicense(entry) {
    const license = entry.license ?? inferPluginLicense(entry.id);
    return license ? { ...entry, license } : entry;
}
