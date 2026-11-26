import { profile } from '../data'
import useReveal from './useReveal'

export default function About() {
    const r = useReveal()
    const code = `const engineer = {
  name: '${profile.name}',
  role: '${profile.role}',
  focus: [${profile.focus.map((f) => `'${f}'`).join(', ')}],
}`
    return (
        <section id="about" className="section">
            <div ref={r} className="wrap reveal">
                <h1 className="title">About <em>me</em>.</h1>
                <div className="about-grid">
                    <div>
                        <p className="role">{profile.role}</p>
                        <p className="lead">{profile.bio}</p>
                        <div className="links">
                            {profile.links.map((l) => <a key={l.label} href={l.url} target="_blank" rel="noreferrer">{l.label} ↗</a>)}
                        </div>
                    </div>
                    <pre className="code">{code}</pre>
                </div>
            </div>
        </section>
    )
}