import { useEffect, useState } from 'react'
import { profile } from '../data'

const WORDS = ['clean code.', 'scalable APIs.', 'tested features.', 'real products.']

export default function Hero() {
    const [i, setI] = useState(0)
    const [n, setN] = useState(0)
    const [del, setDel] = useState(false)

    useEffect(() => {
        const w = WORDS[i]
        const wait = !del && n === w.length ? 1400 : del ? 35 : 80
        const id = setTimeout(() => {
            if (!del && n < w.length) setN(n + 1)
            else if (!del) setDel(true)
            else if (n > 0) setN(n - 1)
            else { setDel(false); setI((i + 1) % WORDS.length) }
        }, wait)
        return () => clearTimeout(id)
    }, [n, del, i])

    return (
        <section id="home" className="section hero">
            <div className="wrap">
                <p className="hello">$ whoami</p>
                <h1 className="hero-title">
                    Hi, I'm <em>{profile.name}</em>.<br />
                    I build {WORDS[i].slice(0, n)}<i className="caret" />
                </h1>
                <p className="role">{profile.role}</p>
                <div className="cta">
                    <a href="#projects" className="btn">View projects</a>
                    <a href="#contact" className="btn ghost">Contact me</a>
                </div>
            </div>
            <div className="scroll-hint">scroll ↓</div>
        </section>
    )
}