/// <reference types="node" />
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildFixtures } from './fixtures'

// The shared fixtures (../shared/fixtures) must match what this code computes.
// `npm run shared` rewrites them after an intended change.
const DIR = join(import.meta.dirname, '..', '..', '..', 'shared', 'fixtures')
const update = process.env.UPDATE_SHARED === '1'

describe('shared fixtures', () => {
  const fixtures = buildFixtures()

  for (const [name, data] of Object.entries(fixtures)) {
    it(`${name} is up to date`, () => {
      const text = JSON.stringify(data, null, 2) + '\n'
      const path = join(DIR, name)
      if (update) {
        mkdirSync(DIR, { recursive: true })
        writeFileSync(path, text)
      }
      expect(readFileSync(path, 'utf8'), `${name} is stale: run npm run shared`).toBe(text)
    })
  }
})
