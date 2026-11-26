import { skills } from '../data'

const items = skills.flatMap((g) => g.items)

export default function Marquee() {
    return (
        <div className="marquee">
            <div className="track">
                {[...items, ...items].map((s, i) => <span key={i}>{s}<b>/</b></span>)}
            </div>
        </div>
    )
}