import { describe, expect, it } from 'vitest'
import { CHAT_LIMITS, isObjectionable, validateChatMessage, validateDisplayName } from './chat'

describe('chat', () => {
  it('accepts ordinary messages', () => {
    expect(validateChatMessage('Manita’s oysters are on till 6!')).toBeNull()
    expect(validateChatMessage('Anyone at Bar Koukla? Scunthorpe fans welcome')).toBeNull()
    expect(validateChatMessage('That shiitake pizza at Libretto 🍕')).toBeNull()
  })

  it('rejects empty, long and objectionable messages', () => {
    expect(validateChatMessage('   ')).toBe('Write a message first.')
    expect(validateChatMessage(undefined)).toBe('Write a message first.')
    expect(validateChatMessage('a'.repeat(CHAT_LIMITS.body + 1))).toBe(`Keep it under ${CHAT_LIMITS.body} characters.`)
    expect(validateChatMessage('you b1tch')).toBe('That message breaks the chat rules.')
    expect(validateChatMessage('kys')).toBe('That message breaks the chat rules.')
  })

  it('allows swearing in messages but not in names', () => {
    expect(validateChatMessage('what the fuck, $4 pints?!')).toBeNull()
    expect(validateChatMessage('this patio is the shit')).toBeNull()
    expect(validateDisplayName('fuck')).toBe('Pick a different name.')
  })

  it('sees through simple disguises', () => {
    expect(isObjectionable('F.U.C.K this')).toBe(true)
    expect(isObjectionable('fuuuuck')).toBe(true)
    expect(isObjectionable('sh1t')).toBe(true)
    expect(isObjectionable('f u c k')).toBe(true)
    expect(isObjectionable('passing the class')).toBe(false)
  })

  it('checks display names', () => {
    expect(validateDisplayName('Connor')).toBeNull()
    expect(validateDisplayName('Zoë O’Brien')).toBeNull()
    expect(validateDisplayName('')).toBe('Pick a name for the chat.')
    expect(validateDisplayName('x'.repeat(CHAT_LIMITS.name + 1))).toBe(`Keep your name under ${CHAT_LIMITS.name} characters.`)
    expect(validateDisplayName('<script>')).toBe('Use letters, numbers and spaces in your name.')
    expect(validateDisplayName('shithead')).toBeNull()
    expect(validateDisplayName('bitch')).toBe('Pick a different name.')
  })
})
