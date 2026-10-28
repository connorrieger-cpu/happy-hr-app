import { useEffect, useRef } from 'react'
import { AREA_LIST } from '../data/areas'
import { torontoDate } from '../lib/time'
import type { LatLng } from '../lib/types'
import { cellKey, usageCell, type UsageReport } from '../lib/usage'
import { deviceId } from './useCommunity'

// The web app's anonymous usage counts (the rules are in lib/usage.ts). Taps add up per area
// and day, and go to the API when the page is hidden. Nothing is tied to a person.

/** How long after the splash to count the visit, so location can settle the area first. */
const OPEN_DELAY_MS = 4000

const pending = new Map<string, { area: string; day: string; cell?: string; events: Record<string, number> }>()
let shown: string | undefined
let opened = false

function add(area: string, name: string, cell?: string) {
  const day = torontoDate()
  const key = `${area}|${day}`
  const batch = pending.get(key) ?? { area, day, events: {} }
  batch.events[name] = (batch.events[name] ?? 0) + 1
  if (cell) batch.cell = cell
  pending.set(key, batch)
}

/** Counts a tap ("venue", "share", "area:guelph") in the area on screen. */
export function track(name: string) {
  if (shown) add(shown, name)
}

function flush() {
  if (!pending.size || typeof navigator.sendBeacon !== 'function') return
  const device = deviceId()
  for (const { area, day, cell, events } of pending.values()) {
    const report: UsageReport = { platform: 'web', device, area, day, cell, events }
    navigator.sendBeacon('/api/usage', new Blob([JSON.stringify(report)], { type: 'application/json' }))
  }
  pending.clear()
}

/**
 * Counts this visit once the splash is done (with the rough square it's in, when location
 * is on), keeps `track` pointed at the area on screen, and sends the counts when the page
 * is hidden.
 */
export function useUsage(areaId: string, position: LatLng | undefined, ready: boolean) {
  const latest = useRef({ areaId, position })
  useEffect(() => {
    latest.current = { areaId, position }
    shown = areaId
  }, [areaId, position])

  useEffect(() => {
    if (!ready) return
    const timer = setTimeout(() => {
      // Once a visit, even if the splash plays again.
      if (opened) return
      opened = true
      const { areaId: area, position: at } = latest.current
      add(area, 'open', at ? cellKey(usageCell(at, AREA_LIST)) : undefined)
    }, OPEN_DELAY_MS)
    return () => clearTimeout(timer)
  }, [ready])

  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && flush()
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', flush)
    }
  }, [])
}
