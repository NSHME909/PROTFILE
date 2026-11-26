import { useEffect, useState } from 'react'
import { profile } from '../data'

const links = [['about', 'About'], ['projects', 'Projects'], ['skills', 'Skills'], ['contact', 'Contact']]

export default function Nav() {
    const [p, setP] = useState(0)

    useEffect(() => {
        const on = () => {
            const max = document.documentElement.scrollHeight - innerHeight
            setP(max > 0 ? (scrollY / max) * 100 : 0)
        }
        on()
        addEventListener('scroll', on, { passive: true })
        return () => removeEventListener('scroll', on)
    }, [])

    return (
        <header className="nav">
            <a href="#home" className="brand"><img src="/logo.png" alt="" className="logo" />{profile.name}</a>
            <nav>{links.map(([id, l]) => <a key={id} href={`#${id}`}>{l}</a>)}</nav>
            <div className="progress" style={{ width: `${p}%` }} />
        </header>
    )
}