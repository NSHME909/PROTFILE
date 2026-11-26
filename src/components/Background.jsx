import { useEffect, useRef } from 'react'

export default function Background() {
    const ref = useRef(null)

    useEffect(() => {
        const c = ref.current
        const g = c.getContext('2d')
        const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
        let w = 0, h = 0, pts = [], raf
        const mouse = { x: -9999, y: -9999 }

        const resize = () => {
            const dpr = devicePixelRatio || 1
            w = innerWidth; h = innerHeight
            c.width = w * dpr; c.height = h * dpr
            g.setTransform(dpr, 0, 0, dpr, 0, 0)
            const n = Math.min(90, Math.floor((w * h) / 18000))
            pts = Array.from({ length: n }, () => ({
                x: Math.random() * w, y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
            }))
        }
        const move = (e) => { mouse.x = e.clientX; mouse.y = e.clientY }
        const leave = () => { mouse.x = -9999; mouse.y = -9999 }

        const draw = () => {
            g.clearRect(0, 0, w, h)
            for (const p of pts) {
                p.x += p.vx; p.y += p.vy
                if (p.x < 0 || p.x > w) p.vx *= -1
                if (p.y < 0 || p.y > h) p.vy *= -1
            }
            for (let i = 0; i < pts.length; i++) {
                const a = pts[i]
                for (let j = i + 1; j < pts.length; j++) {
                    const b = pts[j]
                    const d = Math.hypot(a.x - b.x, a.y - b.y)
                    if (d < 140) {
                        g.strokeStyle = `rgba(232,220,196,${(1 - d / 140) * 0.12})`
                        g.lineWidth = 1
                        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke()
                    }
                }
                const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y)
                if (dm < 200) {
                    g.strokeStyle = `rgba(163,50,77,${(1 - dm / 200) * 0.7})`
                    g.lineWidth = 1.2
                    g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(mouse.x, mouse.y); g.stroke()
                }
                g.fillStyle = dm < 200 ? 'rgba(163,50,77,.9)' : 'rgba(232,220,196,.35)'
                g.beginPath(); g.arc(a.x, a.y, 2, 0, Math.PI * 2); g.fill()
            }
            if (!reduce) raf = requestAnimationFrame(draw)
        }

        resize()
        draw()
        addEventListener('resize', resize)
        addEventListener('mousemove', move)
        addEventListener('mouseout', leave)
        return () => {
            cancelAnimationFrame(raf)
            removeEventListener('resize', resize)
            removeEventListener('mousemove', move)
            removeEventListener('mouseout', leave)
        }
    }, [])

    return <canvas ref={ref} className="bg" />
}