import { projects } from '../data'
import useReveal from './useReveal'

export default function Projects() {
    const r = useReveal()
    return (
        <section id="projects" className="section">
            <div ref={r} className="wrap reveal">
                <h2 className="title">My <em>projects</em>.</h2>
                <div className="grid">
                    {projects.map((p, i) => (
                        <a key={p.title} className="card" href={p.url} target="_blank" rel="noreferrer">
                            <span className="num">0{i + 1}</span>
                            <h3>{p.title}</h3>
                            <p>{p.desc}</p>
                            <div className="tags">{p.tags.map((t) => <span key={t}>{t}</span>)}</div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    )
}