import { describe, expect, it } from 'vitest'
import { OSSINGTON, VENUES } from '../data/ossington'
import { dailyBoard, dailyHours, dailyLabel, dailyOn, dailyToday } from './daily'
import { allOf, rankVenues } from './deals'
import type { Clock } from './time'

const venue = (id: string) => VENUES.find((v) => v.id === id)!
const tuesday6pm: Clock = { day: 2, minutes: 18 * 60 }

describe('daily specials', () => {
  it("finds the Roxton's Tuesday burger", () => {
    const today = dailyOn(venue('roxton-public-house'), 2)
    expect(today.flatMap((d) => d.specials.map((s) => s.item))).toContain('cheeseburger')
    expect(dailyLabel(dailyToday(venue('roxton-public-house'), tuesday6pm)!)).toBe('$12 Cheeseburger')
  })

  it('drops a special once its hours are over', () => {
    // Roxton's specials run 2–10 PM.
    expect(dailyToday(venue('roxton-public-house'), { day: 2, minutes: 22 * 60 + 30 })).toBeUndefined()
  })

  it('prefers a weekly special over an every-day one', () => {
    // Central has a $5 shot every day and Half Off Tuesday.
    expect(dailyLabel(dailyToday(venue('central'), tuesday6pm)!)).toBe('Half Off Tuesday')
  })

  it('says "All day" for specials without hours', () => {
    expect(dailyHours(dailyOn(venue('la-chingada'), 2)[0])).toBe('All day')
  })

  it('builds the week: today first, then the following days, every-day specials once', () => {
    const items = allOf(rankVenues(VENUES, tuesday6pm, OSSINGTON.origin, 'daily'))
    const board = dailyBoard(items, tuesday6pm)
    expect(board.today.map((e) => e.rv.venue.id)).toContain('roxton-public-house')
    expect(board.week[0].label).toBe('Tomorrow')
    expect(board.week.flatMap((d) => d.entries).every((e) => e.special.days.length < 7)).toBe(true)
    // Things on now come before things later today.
    const firstLater = board.today.findIndex((e) => e.special.start != null && e.special.start > tuesday6pm.minutes)
    if (firstLater >= 0) expect(board.today.slice(firstLater).every((e) => e.special.start != null)).toBe(true)
  })
})
