const SR = 44100, DUR = 15, BEAT = 0.5

export async function renderSoundtrack() {
    const ctx = new OfflineAudioContext(2, SR * DUR, SR)
    const master = ctx.createDynamicsCompressor()
    master.connect(ctx.destination)

    const noise = ctx.createBuffer(1, SR, SR)
    const nd = noise.getChannelData(0)
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1

    const env = (g, t, peak, dur) => {
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(peak, t + 0.005)
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    }
    const tone = (type, f0, f1, t, dur, peak) => {
        const o = ctx.createOscillator(), g = ctx.createGain()
        o.type = type
        o.frequency.setValueAtTime(f0, t)
        o.frequency.exponentialRampToValueAtTime(f1, t + dur)
        env(g, t, peak, dur)
        o.connect(g).connect(master)
        o.start(t); o.stop(t + dur + 0.05)
    }
    const hiss = (t, dur, peak, f0, f1) => {
        const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain()
        s.buffer = noise
        f.type = 'highpass'
        f.frequency.setValueAtTime(f0, t)
        f.frequency.exponentialRampToValueAtTime(f1, t + dur)
        env(g, t, peak, dur)
        s.connect(f).connect(g).connect(master)
        s.start(t); s.stop(t + dur)
    }

    const bass = [55, 55, 82.4, 73.4]
    const scale = [440, 523.3, 587.3, 659.3, 784]
    for (let b = 0; b < 30; b++) {
        const t = b * BEAT
        tone('sine', 150, 42, t, 0.4, 0.9)                 // kick on every beat
        hiss(t + 0.25, 0.05, 0.12, 6000, 9000)             // off-beat hat
        if (b >= 4) tone('triangle', bass[b % 4], bass[b % 4], t, 0.28, 0.28)
        if (b >= 4 && b < 26) tone('triangle', scale[(b * 3) % 5], scale[(b * 3) % 5], t + 0.25, 0.2, 0.12)
    }
    // hit on every scene change (all on beats); the last one is the payoff
    ;[2, 5, 8, 11, 12.5, 13.5].forEach((h, i) => {
        const big = h === 12.5
        hiss(h, big ? 0.7 : 0.4, big ? 0.9 : 0.5, 300, 8000)
        tone('sine', 110, 40, h, big ? 0.9 : 0.6, big ? 1 : 0.8)
    })
    hiss(12, 0.5, 0.4, 500, 9000) // riser into the payoff

    return ctx.startRendering()
}

export function toWav(buf) {
    const ch = buf.numberOfChannels, n = buf.length
    const out = new ArrayBuffer(44 + n * ch * 2), v = new DataView(out)
    const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)))
    w(0, 'RIFF'); v.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVEfmt ')
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true)
    v.setUint32(24, buf.sampleRate, true); v.setUint32(28, buf.sampleRate * ch * 2, true)
    v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * ch * 2, true)
    const d = [...Array(ch)].map((_, c) => buf.getChannelData(c))
    let o = 44
    for (let i = 0; i < n; i++)
        for (let c = 0; c < ch; c++) {
            v.setInt16(o, Math.max(-1, Math.min(1, d[c][i])) * 32767, true)
            o += 2
        }
    return out
}