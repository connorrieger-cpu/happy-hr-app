// Renders the React logo to static SVG + PNG app icons.
// Run with: npm run icons
import { mkdir, writeFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import sharp from 'sharp'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { LogoMark } = await server.ssrLoadModule('/src/brand/Logo.tsx')
await server.close()

const mark = renderToStaticMarkup(createElement(LogoMark, { size: 128 }))
  .replace(/^<svg[^>]*>/, '')
  .replace(/<\/svg>$/, '')

/** Full-bleed square app icon: warm dark glass background with the mark centred. */
function appIcon({ inset = 0.14 } = {}) {
  const size = 1024
  const pad = size * inset
  const scale = (size - pad * 2) / 128
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="75%">
      <stop offset="0" stop-color="#4A3300"/>
      <stop offset="0.55" stop-color="#1E1504"/>
      <stop offset="1" stop-color="#0E0B05"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="55%" r="45%">
      <stop offset="0" stop-color="#FFD60A" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#FFD60A" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
  <rect width="${size}" height="${size}" fill="url(#glow)"/>
  <g transform="translate(${pad} ${pad}) scale(${scale})">${mark}</g>
</svg>`
}

const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">${mark}</svg>`

await mkdir('public/icons', { recursive: true })
await writeFile('public/favicon.svg', markSvg)
await writeFile('public/icons/app-icon.svg', appIcon())

const targets = [
  ['public/icons/apple-touch-icon.png', 180, appIcon()],
  ['public/icons/icon-192.png', 192, appIcon()],
  ['public/icons/icon-512.png', 512, appIcon()],
  ['public/icons/icon-maskable-512.png', 512, appIcon({ inset: 0.22 })],
]
for (const [file, px, svg] of targets) {
  await sharp(Buffer.from(svg)).resize(px, px).png().toFile(file)
}

// Link-preview card (og:image), 1200×630: the same background with the mark centred.
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="80%">
      <stop offset="0" stop-color="#4A3300"/>
      <stop offset="0.55" stop-color="#1E1504"/>
      <stop offset="1" stop-color="#0E0B05"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <g transform="translate(405 120) scale(${390 / 128})">${mark}</g>
</svg>`
await sharp(Buffer.from(og)).flatten({ background: '#0E0B05' }).png().toFile('public/icons/og.png')
console.log('Icons written to public/ and public/icons/')

// The iOS app (../ios): a 1024 px App Store icon with no transparency, and the
// mark as a vector image for the splash and top bar.
const assets = '../ios/HappyHR/Assets.xcassets'
const json = (value) => JSON.stringify(value, null, 2) + '\n'
const info = { author: 'xcode', version: 1 }
await mkdir(`${assets}/AppIcon.appiconset`, { recursive: true })
await mkdir(`${assets}/LogoMark.imageset`, { recursive: true })
await writeFile(`${assets}/Contents.json`, json({ info }))
await sharp(Buffer.from(appIcon())).resize(1024, 1024).flatten({ background: '#0E0B05' }).removeAlpha().png().toFile(`${assets}/AppIcon.appiconset/AppIcon-1024.png`)
await writeFile(
  `${assets}/AppIcon.appiconset/Contents.json`,
  json({ images: [{ filename: 'AppIcon-1024.png', idiom: 'universal', platform: 'ios', size: '1024x1024' }], info }),
)
await writeFile(`${assets}/LogoMark.imageset/LogoMark.svg`, markSvg)
await writeFile(
  `${assets}/LogoMark.imageset/Contents.json`,
  json({ images: [{ filename: 'LogoMark.svg', idiom: 'universal' }], info, properties: { 'preserves-vector-representation': true } }),
)
console.log('iOS icon and logo written to ../ios/HappyHR/Assets.xcassets/')
