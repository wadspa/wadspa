export const AUDIBLE_PEAK_FLOOR = 0.005;
export const AUDIBLE_RMS_FLOOR = 0.0005;

export const CONTROL_RMS_DIFF_FLOOR = 2.5e-5;
export const CONTROL_REL_DIFF_FLOOR = 1e-3;
export const CONTROL_MAX_DIFF_FLOOR = 2.5e-4;
export const CONTROL_ABSOLUTE_DIFF_FLOOR = 1e-3;

export function isAudibleRender(render) {
    return render.peak >= AUDIBLE_PEAK_FLOOR && render.rms >= AUDIBLE_RMS_FLOOR;
}

export function audibleRenderSummary(render) {
    return `peak ${fmtMetric(render.peak)}, rms ${fmtMetric(render.rms)}`;
}

export function fmtMetric(value) {
    if (!Number.isFinite(value)) return String(value);
    if (Math.abs(value) >= 0.001) return value.toFixed(5);
    if (value === 0) return '0';
    return value.toExponential(3);
}
