import { useEffect, useMemo, useState } from 'react'
import { AREA_LIST, areaById, DEFAULT_AREA, LOADERS, type AreaData } from '../data/areas'
import { areaAt } from '../lib/areas'
import type { Area, LatLng, Venue } from '../lib/types'

const AREA_KEY = 'happyhr:area'

function remembered(): Area | undefined {
  try {
    return areaById(localStorage.getItem(AREA_KEY))
  } catch {
    return undefined
  }
}

export interface AreaState {
  area: Area
  /** The area's listed spots; empty while they load. */
  venues: Venue[]
  loading: boolean
  /** The area someone's location puts them in, if any. */
  here?: Area
  /** Set when location moved the app to the area someone is in. */
  detected?: Area
  choose: (id: string) => void
}

/**
 * Which area the app shows: a shared link's, else (once, when someone's location is first
 * known, unless they've picked one) the area they're in, else the last one shown.
 */
export function useArea(linked: string | undefined, position: LatLng | undefined): AreaState {
  const [area, setArea] = useState<Area>(() => areaById(linked) ?? remembered() ?? DEFAULT_AREA)
  // A link or a choice from the menu wins over location for the rest of the visit.
  const [settled, setSettled] = useState(() => Boolean(areaById(linked)))
  const [detected, setDetected] = useState<Area>()
  const [data, setData] = useState<AreaData>()
  const here = useMemo(() => (position ? areaAt(position, AREA_LIST) : undefined), [position])

  // Switch during render, so nothing ever shows the old area with the new location.
  if (here && !settled) {
    setSettled(true)
    if (here.id !== area.id) {
      setArea(here)
      setDetected(here)
    }
  }

  useEffect(() => {
    try {
      localStorage.setItem(AREA_KEY, area.id)
    } catch {
      // Storage unavailable: the app opens on the default area next time.
    }
    let current = true
    void LOADERS[area.id]().then((d) => current && setData(d))
    return () => {
      current = false
    }
  }, [area])

  const loaded = data?.area.id === area.id
  return {
    area,
    venues: loaded ? data.venues : [],
    loading: !loaded,
    here,
    detected,
    choose: (id) => {
      const next = areaById(id)
      if (!next) return
      setSettled(true)
      setDetected(undefined)
      setArea(next)
    },
  }
}
