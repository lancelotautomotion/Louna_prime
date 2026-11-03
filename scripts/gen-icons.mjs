// Génère les icônes PNG de la PWA à partir de public/favicon.svg (via Chromium/Playwright).
import { createRequire } from 'node:module'
const require = createRequire(process.env.PW_ROOT ? process.env.PW_ROOT + '/' : import.meta.url)
const { chromium } = require('playwright')
import { readFileSync } from 'node:fs'

const svg = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8')
const targets = [
  { file: 'icon-192.png', size: 192, pad: 0, radius: true },
  { file: 'icon-512.png', size: 512, pad: 0, radius: true },
  { file: 'icon-maskable-512.png', size: 512, pad: 0, radius: false },
  { file: 'apple-touch-icon.png', size: 180, pad: 0, radius: false },
]
const browser = await chromium.launch()
const page = await browser.newPage()
for (const t of targets) {
  const s = t.radius ? svg : svg.replace('rx="114"', 'rx="0"')
  await page.setViewportSize({ width: t.size, height: t.size })
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{width:${t.size}px;height:${t.size}px;display:block}</style>${s}`)
  await page.screenshot({ path: new URL(`../public/icons/${t.file}`, import.meta.url).pathname, omitBackground: true })
}
await browser.close()
console.log('icons ok')
