import { skills } from '../data'
import useReveal from './useReveal'

export default function Skills() {
    const r = useReveal()
    return (
        <section id="skills" className="section">
            <div ref={r} className="wrap reveal">
                <h2 className="title">My <em>skills</em>.</h2>
                <div className="skills">
                    {skills.map((g) => (
                        <div key={g.group} className="group">
                            <h3>{g.group}</h3>
                            <div className="chips">{g.items.map((i) => <span key={i}>{i}</span>)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}