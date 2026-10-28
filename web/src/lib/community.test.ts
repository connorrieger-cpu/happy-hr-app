import { describe, expect, it } from 'vitest'
import { AREA_LIST } from '../data/areas'
import { OSSINGTON, VENUES } from '../data/ossington'
import { mergeCommunity, validateSubmission, validateVote, voteSummary, type CommunitySubmission, type SubmissionInput } from './community'

const valid: SubmissionInput = {
  device: 'device-12345678',
  venueId: 'manita',
  venueName: 'Manita',
  days: [5],
  start: 15 * 60,
  end: 18 * 60,
  specials: [{ kind: 'drink', item: 'spritzes', price: 8 }],
}

const stored = (patch: Partial<CommunitySubmission>): CommunitySubmission => ({
  id: 'abc123',
  createdAt: '2026-10-26T17:00:00Z',
  venueName: 'Manita',
  venueId: 'manita',
  days: [5],
  start: 15 * 60,
  end: 18 * 60,
  specials: [{ kind: 'drink', item: 'spritzes', price: 8 }],
  ...patch,
})

describe('validateSubmission', () => {
  it('accepts a complete update to a listed venue', () => {
    expect(validateSubmission(valid)).toBeNull()
  })

  it('needs days, a sensible window and at least one special', () => {
    expect(validateSubmission({ ...valid, days: [] })).toMatch(/day/)
    expect(validateSubmission({ ...valid, end: valid.start })).toMatch(/after the start/)
    expect(validateSubmission({ ...valid, start: 6 * 60, end: 23 * 60 })).toMatch(/longer/)
    expect(validateSubmission({ ...valid, specials: [] })).toMatch(/special/)
    expect(validateSubmission({ ...valid, specials: [{ kind: 'drink', item: '  ' }] })).toMatch(/Describe/)
  })

  it('needs an address in one of the areas for a new place', () => {
    const fresh = { ...valid, venueId: undefined, venueName: 'Bar Raval' }
    expect(validateSubmission(fresh)).toMatch(/address/)
    expect(validateSubmission({ ...fresh, address: '505 College St', lat: 45.5, lng: -73.6 }, AREA_LIST)).toMatch(/areas/)
    expect(validateSubmission({ ...fresh, address: '505 College St', lat: 43.6557, lng: -79.4101 }, AREA_LIST)).toBeNull()
    expect(validateSubmission({ ...fresh, address: '49 Norfolk St', lat: 43.5452, lng: -80.2508 }, AREA_LIST)).toBeNull()
  })

  it('takes a daily special with or without hours, but a happy hour needs them', () => {
    const { start: _s, end: _e, ...noHours } = valid
    expect(validateSubmission({ ...noHours, kind: 'daily', title: 'Burger Tuesday' })).toBeNull()
    expect(validateSubmission({ ...valid, kind: 'daily', start: 11 * 60, end: 23 * 60 })).toBeNull()
    expect(validateSubmission(noHours)).toMatch(/start and end/)
    expect(validateSubmission({ ...noHours, kind: 'daily', title: 'x'.repeat(41) })).toMatch(/too long/)
  })

  it('rejects junk', () => {
    expect(validateSubmission({ ...valid, device: 'x' })).toMatch(/device/)
    expect(validateSubmission({ ...valid, days: [7 as never] })).toMatch(/day/)
    expect(validateSubmission({ ...valid, specials: [{ kind: 'drink', item: 'beer', price: -1 }] })).toMatch(/price/)
  })
})

describe('validateVote', () => {
  it('needs a venue and a yes or no', () => {
    expect(validateVote({ device: 'device-12345678', venueId: 'central', worked: true })).toBeNull()
    expect(validateVote({ device: 'device-12345678', venueId: 'central' })).toMatch(/worked/)
  })
})

describe('mergeCommunity', () => {
  it('adds windows to a listed venue without replacing the curated ones', () => {
    const manita = VENUES.find((v) => v.id === 'manita')!
    const merged = mergeCommunity(VENUES, [stored({})], OSSINGTON.origin).find((v) => v.id === 'manita')!
    expect(merged.happyHours).toHaveLength(manita.happyHours.length + 1)
    expect(merged.happyHours.at(-1)?.community?.id).toBe('abc123')
    expect(manita.happyHours.some((w) => w.community)).toBe(false)
  })

  it('marks a listed spot with no researched deal as community once someone adds one', () => {
    const union = VENUES.find((v) => v.id === 'union')!
    expect(union.deals).toBe('none')
    const merged = mergeCommunity(VENUES, [stored({ venueId: 'union', venueName: 'Union' })], OSSINGTON.origin)
    expect(merged.find((v) => v.id === 'union')).toMatchObject({ deals: 'community', happyHours: [expect.anything()] })
    expect(union.deals).toBe('none')
  })

  it('adds a community daily special to the venue’s daily specials, not its happy hours', () => {
    const daily = stored({ venueId: 'union', venueName: 'Union', kind: 'daily', title: 'Steak Night', start: undefined, end: undefined })
    const union = mergeCommunity(VENUES, [daily], OSSINGTON.origin).find((v) => v.id === 'union')!
    expect(union.happyHours).toHaveLength(0)
    expect(union.dailySpecials).toEqual([expect.objectContaining({ title: 'Steak Night', days: [5], community: expect.anything() })])
    expect(union.dailySpecials![0].start).toBeUndefined()
  })

  it('turns a new place into a community venue, grouping repeats', () => {
    const place = { venueId: undefined, venueName: 'Bar Raval', address: '505 College St', lat: 43.6557, lng: -79.4101 }
    const merged = mergeCommunity(VENUES, [stored({ ...place, id: 'one' }), stored({ ...place, id: 'two', days: [6] })], OSSINGTON.origin)
    const raval = merged.filter((v) => v.name === 'Bar Raval')
    expect(raval).toHaveLength(1)
    expect(raval[0]).toMatchObject({ id: 'c-one', deals: 'community', lat: 43.6557 })
    expect(raval[0].happyHours).toHaveLength(2)
  })

  it('lets later submissions add to a community-added place', () => {
    const first = stored({ id: 'one', venueId: undefined, venueName: 'Bar Raval', address: '505 College St', lat: 43.6557, lng: -79.4101 })
    const second = stored({ id: 'two', venueId: 'c-one', venueName: 'Bar Raval', days: [2] })
    const raval = mergeCommunity(VENUES, [first, second], OSSINGTON.origin).filter((v) => v.name === 'Bar Raval')
    expect(raval).toHaveLength(1)
    expect(raval[0].happyHours).toHaveLength(2)
  })
})

describe('voteSummary', () => {
  const now = Date.parse('2026-10-26T20:00:00Z')

  it('says nothing much without votes', () => {
    expect(voteSummary(undefined, now).mood).toBe('none')
  })

  it('confirms when people said it worked', () => {
    const s = voteSummary({ yes: 3, no: 1, lastYes: '2026-10-24T20:00:00Z', lastNo: '2026-10-20T20:00:00Z' }, now)
    expect(s).toEqual({ mood: 'confirmed', text: 'Worked for 3 people · last 2 days ago · 1 said it didn’t' })
  })

  it('flags recent failures that outnumber successes', () => {
    expect(voteSummary({ yes: 1, no: 2, lastYes: '2026-10-10T20:00:00Z', lastNo: '2026-10-26T19:00:00Z' }, now).mood).toBe('disputed')
  })
})
