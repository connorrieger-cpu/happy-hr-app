import type { Venue } from '../../../lib/types'
import json from './venues.json'

// Built by `npm run areas` from deals.json, directory.json and candidates.json.
export { LIBERTY_VILLAGE as area } from './area'
export const venues = json as unknown as Venue[]
