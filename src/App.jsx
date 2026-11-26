import { useState } from 'react'
import { IntroPlayer } from './components/Intro'
import Background from './components/Background'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import About from './components/About'
import Projects from './components/Projects'
import Skills from './components/Skills'
import Contact from './components/Contact'

export default function App() {
    const [done, setDone] = useState(false)
    return (
        <>
            {!done && <IntroPlayer onDone={() => setDone(true)} />}
            <Background />
            <Nav />
            <main>
                <Hero />
                <Marquee />
                <About />
                <Projects />
                <Skills />
                <Contact />
            </main>
        </>
    )
}