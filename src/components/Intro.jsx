import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { clamp, lerp, seg, spring, expOut } from '../lib/motion'
import { renderSoundtrack } from '../lib/audio'
import { profile } from '../data'

export const DURATION = 15
const ACCENT = '#A3324D', BG = '#141417', PANEL = '#26262C', LINE = '#3B3B43', SAND = '#E8DCC4', MUTE = '#8D897F'
const FONT = "'JetBrains Mono', ui-monospace, Consolas, monospace"

const SCENES = [0, 2, 5, 8, 11, 13, 15]
const FOCUS = [[960, 540], [760, 500], [900, 520], [960, 540], [1000, 540], [960, 540]]
const TABS = [
    { l: 'build.ts', x: 470, at: 2.6 },
    { l: 'git', x: 650, at: 5 },
    { l: 'test', x: 790, at: 8 },
    { l: 'deploy', x: 940, at: 11 },
]
const CLICKS = [[5, 650, 240], [8, 790, 240], [11, 940, 240], [12, 1180, 552]]

// Code typed in scene 1 (monospace: every character is exactly CW px wide)
const CODE = ['function ship(idea) {', '  const code = design(idea)', '  test(code)', '  return deploy(code)', '}']
const TOTAL = CODE.reduce((n, l) => n + l.length, 0)
const CW = 18, LH = 52, CX = 420, CY = 436
function typed(t) {
    let n = Math.floor(clamp((t - 2.7) / 1.9) * TOTAL), l = 0
    while (l < CODE.length - 1 && n > CODE[l].length) { n -= CODE[l].length; l++ }
    return { l, c: Math.min(n, CODE[l].length) }
}

const TESTS = ['unit', 'integration', 'e2e']
const SWEEP = [[8.4, 9.0], [9.2, 9.8], [10.0, 10.6]]
const NODES = [[480, 700, 5.9, 'init', 1], [700, 700, 5.9, 'feat', 1], [820, 560, 6.4, 'fix', 0], [1000, 560, 6.9, 'test', 0], [1100, 700, 7.4, 'merge', 1]]

// End card: name (size 100 mono = 60px per char) centered, caret right after it
const CAPX = 960 + 30 * profile.name.length + 45

// The through-line object: one caret that changes role in every scene.
const K = (t, x, y, w, h, br = Math.min(w, h) / 2) => ({ t, x, y, w, h, br })
const KEYS = [
    K(0, 2300, 635, 56, 130, 6), K(1.5, 1000, 635, 56, 130, 6),           // hook: caret interrupts the text
    K(2.5, 429, 436, 18, 38, 3), K(4.8, 447, 644, 18, 38, 3),             // editor cursor (typing drives it)
    K(5, 650, 240, 30, 30),                                                 // click "git"
    K(5.5, 480, 700, 40, 40), K(6, 700, 700, 40, 40), K(6.5, 820, 560, 40, 40), K(7, 1000, 560, 40, 40), K(7.5, 1100, 700, 40, 40), // commits + branch + merge
    K(8, 790, 240, 30, 30),                                                 // click "test"
    K(8.4, 700, 520, 44, 44), K(9, 1240, 520, 44, 44), K(9.2, 700, 600, 44, 44), K(9.8, 1240, 600, 44, 44), K(10, 700, 680, 44, 44), K(10.6, 1240, 680, 44, 44), // test runner
    K(11, 940, 240, 30, 30),                                                // click "deploy"
    K(11.5, 1180, 552, 260, 64, 32), K(12, 1180, 552, 260, 64, 32),        // deploy button
    K(12.5, 960, 540, 3600, 3600),                                          // fills the frame past all corners
    K(13.5, CAPX, 540, 50, 100, 6), K(15, CAPX, 540, 50, 100, 6),          // caret after the name = logo
]

function dotAt(t) {
    if (t >= 2.5 && t < 4.8) {
        const s = typed(t)
        return { x: CX + CW * s.c + CW / 2, y: CY + LH * s.l, w: 18, h: 38, br: 3 }
    }
    let i = 0
    while (i < KEYS.length - 2 && t >= KEYS[i + 1].t) i++
    const a = KEYS[i], b = KEYS[i + 1]
    const p = spring(seg(t, a.t, b.t))
    return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p), br: lerp(a.br, b.br, p) }
}

// Pure function of time: no CSS animations, no timers, no carried state.
export function Frame({ t, scale = 1 }) {
    const E = (a, b) => expOut(seg(t, a, b))
    const d = dotAt(t), prev = dotAt(t - 1 / 60)
    const typing = t >= 2.5 && t < 4.8
    const blur = typing ? 0 : Math.min(10, (Math.hypot(d.x - prev.x, d.y - prev.y) + Math.abs(d.w - prev.w) * 0.3) * 0.15)

    // camera: push 1.0 -> 1.04 per scene, each scene starts where the last ended
    let i = SCENES.findIndex((s, k) => t < SCENES[k + 1])
    if (i < 0) i = 5
    const z = 1 + 0.04 * (i + seg(t, SCENES[i], SCENES[i + 1]))
    const f0 = FOCUS[Math.max(i - 1, 0)], f1 = FOCUS[i]
    const fp = i === 0 ? 1 : expOut(seg(t, SCENES[i], SCENES[i] + 0.8))
    const fx = lerp(f0[0], f1[0], fp), fy = lerp(f0[1], f1[1], fp)

    // masked text: rises in, rises out. Separate in/out timing so letters never overlap.
    const Txt = ({ x, y, h, size = 40, a, b, c = 99, d: dd = 100, color = SAND, weight = 800, w, align = 'left', children }) => (
        <div style={{ position: 'absolute', left: x, top: y, height: h, width: w, overflow: 'hidden', textAlign: align }}>
            <div style={{
                transform: `translateY(${(1 - E(a, b)) * 110 - E(c, dd) * 110}%)`,
                fontSize: size, lineHeight: `${h}px`, fontWeight: weight, color, whiteSpace: 'nowrap',
            }}>{children}</div>
        </div>
    )
    const Bar = ({ x, y, w, h, a, b, c = 99, d: dd = 100, color = LINE }) => {
        const e = E(a, b), q = E(c, dd)
        return <div style={{ position: 'absolute', left: x + w * q, top: y, width: Math.max(0, w * (e - q)), height: h, borderRadius: h / 2, background: color }} />
    }
    const Key = ({ children }) => <span style={{ color: ACCENT }}>{children}</span>

    const active = TABS.reduce((a, tb, n) => (t >= tb.at ? n : a), 0)
    const ux = lerp(TABS[Math.max(active - 1, 0)].x, TABS[active].x, spring(seg(t, TABS[active].at, TABS[active].at + 0.4)))
    const press = CLICKS.reduce((m, [c]) => m + Math.exp(-Math.pow((t - c) / 0.07, 2)), 0)
    const beat = Math.exp(-(t % 0.5) * 14)
    const dotScale = d.w < 400 ? 1 + 0.05 * beat - 0.08 * press : 1
    const ws = t < 2 ? 0 : spring(seg(t, 2, 2.7))

    return (
        <div style={{ width: 1920 * scale, height: 1080 * scale, overflow: 'hidden', position: 'relative', background: BG, fontFamily: FONT }}>
            <div style={{ width: 1920, height: 1080, position: 'absolute', transformOrigin: '0 0', transform: `scale(${scale})` }}>
                <div style={{ position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `translate(${fx * (1 - z)}px, ${fy * (1 - z)}px) scale(${z})` }}>

                    {/* HOOK (beats 0-3) */}
                    {t < 2.1 && <>
                        <Txt x={510} y={350} h={190} size={150} a={0.1} b={0.7} c={1.6} d={2.0}>IDEAS NEED</Txt>
                        <Txt x={510} y={540} h={190} size={150} a={0.25} b={0.85} c={1.7} d={2.1}><Key>CODE.</Key></Txt>
                    </>}

                    {/* The editor window */}
                    {t >= 2 && t < 12.5 && <div style={{ position: 'absolute', left: 360, top: 190, width: 1200, height: 700, borderRadius: 24, background: PANEL, boxShadow: `0 0 0 1px ${LINE}`, transformOrigin: '200px 290px', transform: `scale(${Math.max(ws, 0.001)})` }} />}
                    {t >= 2.6 && t < 12.5 && <>
                        {TABS.map((tb, n) => (
                            <Txt key={tb.l} x={tb.x - 70} y={205} h={36} w={140} align="center" size={22} weight={600} a={2.6 + n * 0.08} b={3.1 + n * 0.08} color={n === active ? SAND : MUTE}>{tb.l}</Txt>
                        ))}
                        <div style={{ position: 'absolute', left: ux - 30, top: 254, width: 60, height: 4, borderRadius: 2, background: SAND, transform: `scaleX(${E(2.7, 3)})` }} />
                    </>}

                    {/* S1 WRITE (beats 4-9): the caret types a function */}
                    {t > 2.5 && t < 5.1 && <>
                        <Txt x={420} y={290} h={90} size={64} a={2.5} b={3.1} c={4.6} d={5.0}>Write <Key>clean</Key> code.</Txt>
                        {(() => {
                            const s = typed(t)
                            return <div style={{ position: 'absolute', left: CX, top: CY - 26, width: 760, height: LH * CODE.length, overflow: 'hidden', clipPath: `inset(0 0 ${100 * E(4.7, 5.1)}% 0)` }}>
                                {CODE.map((ln, n) => {
                                    const cnt = n < s.l ? ln.length : n === s.l ? s.c : 0
                                    return <div key={n} style={{ position: 'absolute', left: 0, top: LH * n, height: LH, lineHeight: `${LH}px`, fontSize: 30, fontWeight: 500, color: SAND, whiteSpace: 'pre' }}>{ln.slice(0, cnt)}</div>
                                })}
                            </div>
                        })()}
                    </>}

                    {/* S2 COMMIT (beats 10-15): the caret becomes a commit, branches and merges */}
                    {t > 5.3 && t < 8.05 && (() => {
                        const out = E(7.6, 8.0)
                        const stroke = (dd, e) => <path d={dd} pathLength="1" fill="none" stroke={SAND} strokeWidth="4" strokeDasharray={`${Math.max(0, e - out)} 2`} strokeDashoffset={-out} />
                        return <>
                            <Txt x={420} y={290} h={90} size={64} a={5.5} b={6.1} c={7.6} d={8.0}>Commit <Key>often</Key>.</Txt>
                            <svg style={{ position: 'absolute', left: 0, top: 0 }} width="1920" height="1080">
                                {stroke('M480 700 L1100 700', E(5.4, 6.2))}
                                {stroke('M700 700 L820 560 L1000 560 L1100 700', E(5.9, 6.8))}
                            </svg>
                            {NODES.map(([x, y, a, label, main]) => (
                                <div key={label}>
                                    <div style={{ position: 'absolute', left: x - 20, top: y - 20, width: 40, height: 40, boxSizing: 'border-box', borderRadius: '50%', background: PANEL, border: `4px solid ${SAND}`, transform: `scale(${spring(seg(t, a, a + 0.4)) * (1 - out)})` }} />
                                    <Txt x={x - 70} y={main ? y + 34 : y - 66} w={140} h={32} align="center" size={20} weight={600} color={MUTE} a={a + 0.1} b={a + 0.5} c={7.6} d={8.0}>{label}</Txt>
                                </div>
                            ))}
                        </>
                    })()}

                    {/* S3 TEST (beats 16-21): the caret runs three tests */}
                    {t > 8.5 && t < 11.05 && <>
                        <Txt x={420} y={290} h={90} size={64} a={8.5} b={9.1} c={10.6} d={11.0}>Test <Key>everything</Key>.</Txt>
                        {TESTS.map((name, n) => {
                            const y = 520 + n * 80, a = 8.5 + n * 0.2, [s0, s1] = SWEEP[n]
                            const fill = clamp(540 * spring(seg(t, s0, s1)), 0, 540) * (1 - E(10.6, 11.0))
                            return <div key={name}>
                                <Txt x={420} y={y - 24} h={48} size={26} weight={600} a={a} b={a + 0.5} c={10.6} d={11.0}>{name}</Txt>
                                <Bar x={700} y={y - 7} w={540} h={14} a={a} b={a + 0.5} c={10.6} d={11.0} />
                                <div style={{ position: 'absolute', left: 700, top: y - 7, height: 14, borderRadius: 7, background: SAND, width: fill }} />
                                <Txt x={1290} y={y - 20} h={40} size={24} a={s1 + 0.05} b={s1 + 0.45} c={10.6} d={11.0}>PASS</Txt>
                            </div>
                        })}
                    </>}

                    {/* S4 DEPLOY (beats 22-25): the caret becomes the deploy button */}
                    {t > 11.5 && t < 12.55 && <>
                        <Txt x={420} y={290} h={90} size={64} a={11.5} b={12.1} c={12.3} d={12.5}>Deploy <Key>fearlessly</Key>.</Txt>
                        <div style={{ position: 'absolute', left: 440, top: 520, width: 640, height: 64, boxSizing: 'border-box', borderRadius: 16, border: `2px solid ${SAND}`, transformOrigin: 'left', transform: `scaleX(${spring(seg(t, 11.5, 12))})` }} />
                        <Txt x={480} y={532} h={40} size={24} weight={500} color={MUTE} a={11.8} b={12.2} c={12.3} d={12.5}>$ npm run deploy</Txt>
                    </>}

                    {/* END CARD: the frame-filling caret shrinks into the logo */}
                    {t >= 12.5 && <>
                        <Txt x={0} y={480} w={1920} h={120} align="center" size={100} a={13.0} b={13.6}>{profile.name}</Txt>
                        <Txt x={0} y={650} w={1920} h={44} align="center" size={28} weight={500} a={13.5} b={14.0}>Let’s build it <Key>together</Key> · {profile.email}</Txt>
                    </>}

                    {/* click rings */}
                    {CLICKS.map(([c, x, y]) => {
                        const p = seg(t, c, c + 0.45)
                        if (p <= 0 || p >= 1) return null
                        const s = 30 + 120 * expOut(p)
                        return <div key={c} style={{ position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, boxSizing: 'border-box', borderRadius: '50%', border: `${3 * (1 - p)}px solid ${ACCENT}` }} />
                    })}

                    {/* THE CARET */}
                    <div style={{ position: 'absolute', left: d.x - d.w / 2, top: d.y - d.h / 2, width: d.w, height: d.h, borderRadius: d.br, background: ACCENT, transform: `scale(${dotScale})`, filter: blur > 0.3 ? `blur(${blur}px)` : 'none' }} />
                    {t > 11.8 && t < 12.5 && <Txt x={d.x - 130} y={d.y - 24} w={260} h={48} align="center" size={26} weight={800} a={11.9} b={12.3} c={12.3} d={12.45}>Deploy</Txt>}
                </div>
                <div style={{ position: 'absolute', left: 0, bottom: 0, height: 6, width: (1920 * t) / DURATION, background: SAND }} />
            </div>
        </div>
    )
}

export function IntroPlayer({ onDone }) {
    const [t, setT] = useState(0)
    const [scale, setScale] = useState(1)
    const start = useRef(performance.now())
    const audio = useRef(null)

    useEffect(() => {
        const fit = () => setScale(Math.min(innerWidth / 1920, innerHeight / 1080))
        fit(); addEventListener('resize', fit)
        return () => removeEventListener('resize', fit)
    }, [])

    useEffect(() => {
        let raf
        const loop = (now) => {
            const x = (now - start.current) / 1000
            if (x >= DURATION) { setT(DURATION - 0.001); onDone?.(); return }
            setT(x); raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(raf)
    }, [onDone])

    const sound = async () => {
        const buf = await renderSoundtrack()
        const ctx = new AudioContext()
        const src = ctx.createBufferSource()
        src.buffer = buf; src.connect(ctx.destination)
        audio.current?.stop?.()
        audio.current = src
        start.current = performance.now() // restart so picture and sound start together
        src.start()
    }

    return (
        <div className="intro">
            <Frame t={t} scale={scale} />
            <button className="skip" onClick={() => { audio.current?.stop?.(); onDone?.() }}>Skip</button>
        </div>
    )
}

// ?render mode: Playwright calls window.seek(t)
export function RenderStage() {
    const [t, setT] = useState(0)
    useEffect(() => { window.seek = (x) => flushSync(() => setT(x)) }, [])
    return <Frame t={t} />
}