import type { Area, Venue } from '../../lib/types'
import { OSSINGTON } from '../ossington'
import { BURLINGTON } from './burlington/area'
import { GUELPH } from './guelph/area'
import { KENSINGTON } from './kensington/area'
import { KING_WEST } from './king-west/area'
import { LIBERTY_VILLAGE } from './liberty-village/area'

// Every area the app covers. To add one, make a folder like the others (README.md says
// how), then add it to AREA_LIST and LOADERS below. To take one away, remove those two lines.

/** In the order the area menu lists them; the first is where people far from every area start. */
export const AREA_LIST: Area[] = [OSSINGTON, KENSINGTON, KING_WEST, LIBERTY_VILLAGE, GUELPH, BURLINGTON]
export const DEFAULT_AREA = OSSINGTON
/** New places the community added before there were areas carry no location check; they stay here. */
export const LEGACY_AREA_ID = OSSINGTON.id

export interface AreaData {
  area: Area
  venues: Venue[]
}

/** Each area's venues, loaded when someone opens it, so the web app only downloads the area it shows. */
export const LOADERS: Record<string, () => Promise<AreaData>> = {
  ossington: () => import('./ossington'),
  kensington: () => import('./kensington'),
  'king-west': () => import('./king-west'),
  'liberty-village': () => import('./liberty-village'),
  guelph: () => import('./guelph'),
  burlington: () => import('./burlington'),
}

export const areaById = (id: string | null | undefined): Area | undefined => AREA_LIST.find((a) => a.id === id)
