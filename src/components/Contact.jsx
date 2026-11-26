import { useState } from 'react'
import { profile } from '../data'
import useReveal from './useReveal'

export default function Contact() {
    const r = useReveal()
    const [f, setF] = useState({ name: '', email: '', message: '' })
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
    const send = () => {
        const body = `${f.message}\n\n— ${f.name} (${f.email})`
        location.href = `mailto:${profile.email}?subject=${encodeURIComponent('Hello from your portfolio')}&body=${encodeURIComponent(body)}`
    }
    return (
        <section id="contact" className="section">
            <div ref={r} className="wrap reveal">
                <h2 className="title">Contact <em>me</em>.</h2>
                <div className="form">
                    <input placeholder="Your name" value={f.name} onChange={set('name')} />
                    <input placeholder="Your email" value={f.email} onChange={set('email')} />
                    <textarea rows="4" placeholder="Your message" value={f.message} onChange={set('message')} />
                    <button onClick={send}>Send</button>
                </div>
            </div>
        </section>
    )
}