import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { RenderStage } from './components/Intro'
import { renderSoundtrack, toWav } from './lib/audio'

const render = new URLSearchParams(location.search).has('render')
if (render) {
    window.renderWav = async () => {
        const bytes = new Uint8Array(toWav(await renderSoundtrack()))
        let s = ''
        for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
        return btoa(s)
    }
}
createRoot(document.getElementById('root')).render(render ? <RenderStage /> : <App />)