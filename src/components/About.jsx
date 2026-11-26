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
                    <div className="editor">
                        <div className="editor-bar">
                            <span className="lights"><i /><i /><i /></span>
                            <span className="file">engineer.js</span>
                        </div>
                        <div className="editor-body">
                            {code.split('\n').map((ln, i) => (
                                <div key={i} className="ln">
                                    <span className="no">{i + 1}</span>
                                    <span className="tx">{ln}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}