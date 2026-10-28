import { describe, expect, it } from 'vitest'
import { MAX_FAVOURITES, normalizeEmail, validateCode, validateEmail, validateFavourites } from './account'

describe('accounts', () => {
  it('tidies emails', () => {
    expect(normalizeEmail('  Pat@Example.COM ')).toBe('pat@example.com')
  })

  it('checks emails', () => {
    expect(validateEmail('pat@example.com')).toBeNull()
    expect(validateEmail(' Pat@Example.com ')).toBeNull()
    expect(validateEmail('')).toBe('Enter your email.')
    expect(validateEmail(undefined)).toBe('Enter your email.')
    expect(validateEmail('pat@example')).toBe('That email doesn’t look right.')
    expect(validateEmail('pat example@x.com')).toBe('That email doesn’t look right.')
    expect(validateEmail(`${'a'.repeat(250)}@x.com`)).toBe('That email doesn’t look right.')
  })

  it('checks codes', () => {
    expect(validateCode('012345')).toBeNull()
    expect(validateCode(' 012345 ')).toBeNull()
    expect(validateCode('12345')).not.toBeNull()
    expect(validateCode('12a456')).not.toBeNull()
    expect(validateCode(123456)).not.toBeNull()
  })

  it('checks favourites', () => {
    expect(validateFavourites([])).toBeNull()
    expect(validateFavourites(['central', 'c-1a2b3c4d-5e6f'])).toBeNull()
    expect(validateFavourites('central')).not.toBeNull()
    expect(validateFavourites(['Central!'])).toBe('One of those isn’t a venue.')
    expect(validateFavourites(Array.from({ length: MAX_FAVOURITES + 1 }, (_, i) => `v-${i}`))).not.toBeNull()
  })
})
