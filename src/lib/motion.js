export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
export const lerp = (a, b, p) => a + (b - a) * p
export const seg = (t, a, b) => clamp((t - a) / (b - a))
export const expOut = (x) => (x >= 1 ? 1 : x <= 0 ? 0 : 1 - Math.pow(2, -10 * x))

// Damped spring on 0..1, ~4% overshoot, settles exactly at x = 1
export const spring = (x, z = 0.72, settle = 5.3) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    const wn = settle / z
    const wd = wn * Math.sqrt(1 - z * z)
    return 1 - Math.exp(-settle * x) * (Math.cos(wd * x) + (z / Math.sqrt(1 - z * z)) * Math.sin(wd * x))
}