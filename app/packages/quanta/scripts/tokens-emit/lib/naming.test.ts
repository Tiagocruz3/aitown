import { describe, expect, it } from 'vitest'
import {
  aliasToVar,
  isAlias,
  primitiveVar,
  semanticVar,
  tailwindAlias,
} from './naming.ts'

describe('Naming convention', () => {
  describe('isAlias', () => {
    it.each([
      ['{color-primitives.grey.050}', true],
      ['{x.y}', true],
      ['{}', true],
      ['#ffffff', false],
      ['color-primitives.grey', false],
      ['{half', false],
      ['half}', false],
    ])('%s → %s', (input, expected) => {
      expect(isAlias(input)).toBe(expected)
    })
  })

  describe('aliasToVar', () => {
    it('strips `-primitives` from collection segment', () => {
      expect(aliasToVar('{color-primitives.grey.050}')).toBe('--hf-color-grey-050')
    })

    it('strips `-semantic` from collection segment', () => {
      expect(aliasToVar('{color-semantic.background.primary}')).toBe('--hf-color-background-primary')
    })

    it('joins deep paths with dashes', () => {
      expect(aliasToVar('{color-primitives.transparent.dark.05}')).toBe('--hf-color-transparent-dark-05')
    })

    it('throws on non-alias input', () => {
      expect(() => aliasToVar('#ffffff')).toThrow(/not an alias/)
    })
  })

  describe('primitiveVar / semanticVar / tailwindAlias', () => {
    it('primitiveVar joins path with category prefix', () => {
      expect(primitiveVar('color', { path: ['grey', '050'], value: '#f8f8f8' })).toBe('--hf-color-grey-050')
    })

    it('semanticVar joins path with category prefix', () => {
      expect(semanticVar('color', { path: ['background', 'primary'], light: '#fff', dark: '#000' })).toBe('--hf-color-background-primary')
    })

    it('tailwindAlias omits the hf prefix', () => {
      expect(tailwindAlias('color', ['surface', 'default'])).toBe('--color-surface-default')
      expect(tailwindAlias('spacing', ['4'])).toBe('--spacing-4')
    })
  })
})
