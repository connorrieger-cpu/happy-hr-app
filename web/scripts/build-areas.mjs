// Builds each area's venues.json from its research and Google details (see
// src/data/areas/merge.ts). Run after changing deals.json, directory.json or
// candidates.json in any area:
//
//   npm run areas
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { mergeArea } from '../src/data/areas/merge.ts'

const root = fileURLToPath(new URL('../src/data/areas/', import.meta.url))
const read = (path, fallback) => (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback)

for (const id of readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
  const dir = `${root}${id}/`
  if (!existsSync(`${dir}area.ts`) || !existsSync(`${dir}candidates.json`)) continue
  const module = await import(pathToFileURL(`${dir}area.ts`).href)
  const area = Object.values(module).find((v) => v?.id === id)
  const venues = mergeArea(area, read(`${dir}deals.json`, []), read(`${dir}directory.json`, []), read(`${dir}candidates.json`, { candidates: [] }).candidates)
  writeFileSync(`${dir}venues.json`, JSON.stringify(venues, null, 1) + '\n')
  console.log(`${area.name}: ${venues.length} venues, ${venues.filter((v) => v.deals !== 'none').length} with deals`)
}
