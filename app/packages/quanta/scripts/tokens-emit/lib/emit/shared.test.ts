import { describe, expect, it } from 'vitest'
import { rem, sortedKeys } from './shared.ts'

describe('Pure helper correctness', () => {
  describe('rem', () => {
    it.each([
      [0, '0'],
      [4, '0.25rem'],
      [8, '0.5rem'],
      [16, '1rem'],
      [-1.2, '-0.075rem'],
    ])('rem(%s) → %s', (input, expected) => {
      expect(rem(input)).toBe(expected)
    })

    it('drops trailing-zero noise for whole numbers', () => {
      expect(rem(32)).toBe('2rem')
    })
  })

  describe('sortedKeys', () => {
    it('sorts integer-string keys numerically (not lexicographically)', () => {
      expect(sortedKeys({ 10: 0, 2: 0, 1: 0 })).toEqual(['1', '2', '10'])
    })

    it('puts numeric keys before alpha keys', () => {
      expect(sortedKeys({ a: 0, 1: 0, b: 0, 2: 0 })).toEqual(['1', '2', 'a', 'b'])
    })

    it('falls back to byte-order for alpha keys', () => {
      expect(sortedKeys({ tight: 0, none: 0, loose: 0 })).toEqual(['loose', 'none', 'tight'])
    })
  })
})
