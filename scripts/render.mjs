// npm i -D playwright && npx playwright install chromium   (وبدك ffmpeg منصّب)
// شغّل الموقع: npm run dev   ثم: node scripts/render.mjs         (الفيديو الكامل)
//                              node scripts/render.mjs --beats    (فريم لكل beat للمراجعة)
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

const FPS = 60, SUB = 3, DUR = 15
const beats = process.argv.includes('--beats')
const dir = beats ? 'beats' : 'sub'
mkdirSync(dir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto('http://localhost:5173/?render')
await page.waitForFunction(() => window.seek)
await page.evaluate(() => document.fonts.ready)

if (beats) {
    for (let b = 0; b < 30; b++) {
        await page.evaluate((t) => window.seek(t), b * 0.5 + 0.25)
        await page.screenshot({ path: `${dir}/${String(b).padStart(2, '0')}.png` })
    }
    await browser.close()
    process.exit(0)
}

for (let i = 0; i < FPS * DUR * SUB; i++) {
    await page.evaluate((t) => window.seek(t), i / (FPS * SUB))
    await page.screenshot({ path: `${dir}/${String(i).padStart(5, '0')}.png` })
}
writeFileSync('audio.wav', Buffer.from(await page.evaluate(() => window.renderWav()), 'base64'))
await browser.close()

execSync(`ffmpeg -y -framerate ${FPS * SUB} -i ${dir}/%05d.png -vf "tmix=frames=${SUB},select='not(mod(n\\,${SUB}))',setpts=N/${FPS}/TB" -r ${FPS} -c:v libx264 -pix_fmt yuv420p silent.mp4`, { stdio: 'inherit' })
execSync(`ffmpeg -y -i silent.mp4 -i audio.wav -c:v copy -c:a aac -shortest intro.mp4`, { stdio: 'inherit' })