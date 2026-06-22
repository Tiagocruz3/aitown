import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkTokens } from './test-fixtures.ts'
import { CONTRAST_KNOWN_BELOW_AA, validate } from './validator.ts'

describe('validate', () => {
  it('passes on a well-formed fixture', () => {
    expect(validate(mkTokens())).toEqual({ ok: true, errors: [] })
  })

  // ────────────────────────────────────────────────────────────────────
  describe('Schema integrity', () => {
    it('flags empty color primitives', () => {
      const result = validate(mkTokens({ color: { primitives: [], semantic: [{ path: ['x'], light: '#fff', dark: '#000' }] } }))
      expect(result.ok).toBe(false)
      expect(result.errors.some(e => e.includes('color.primitives is empty'))).toBe(true)
    })

    it('flags empty color semantic', () => {
      const result = validate(mkTokens({ color: { primitives: [{ path: ['x'], value: '#fff' }], semantic: [] } }))
      expect(result.errors.some(e => e.includes('color.semantic is empty'))).toBe(true)
    })

    it('flags missing z-index key (emitter iterates fixed 8-key list)', () => {
      const tokens = mkTokens()
      delete (tokens.zIndex as Record<string, number>).modal
      const result = validate(tokens)
      expect(result.errors.some(e => /zIndex\.modal: missing required key/.test(e))).toBe(true)
    })

    it('flags missing breakpoint key as non-finite', () => {
      const tokens = mkTokens()
      // simulate upstream JSON dropping a key — runtime field becomes undefined
      delete (tokens.breakpoints as Partial<typeof tokens.breakpoints>).tablet
      const result = validate(tokens)
      expect(result.errors.some(e => /breakpoints\.tablet: missing or non-finite/.test(e))).toBe(true)
    })
  })

  // ────────────────────────────────────────────────────────────────────
  describe('Value validity', () => {
    it('flags spacing off the 2px half-grid', () => {
      const result = validate(mkTokens({ spacing: { 5: 5, 9: 9 } }))
      expect(result.errors.some(e => e.includes('spacing.5: 5 is not divisible by 2'))).toBe(true)
      expect(result.errors.some(e => e.includes('spacing.9: 9 is not divisible by 2'))).toBe(true)
    })

    it('accepts 0 and N_5 half-step keys on the 2px grid', () => {
      const result = validate(mkTokens({ spacing: { 0: 0, '0_5': 2, '1_5': 6, 2: 8, '2_5': 10 } }))
      expect(result.errors.some(e => e.includes('spacing'))).toBe(false)
    })

    it('flags non-numeric spacing keys', () => {
      const result = validate(mkTokens({ spacing: { foo: 4 } }))
      expect(result.errors.some(e => e.includes('spacing: non-numeric key "foo"'))).toBe(true)
    })

    it('flags non-integer / negative z-index', () => {
      const result = validate(mkTokens({ zIndex: { weird: -1, dot: 1.5 } }))
      expect(result.errors.some(e => /zIndex\.weird/.test(e))).toBe(true)
      expect(result.errors.some(e => /zIndex\.dot/.test(e))).toBe(true)
    })

    it('flags negative borderWidth, accepts decimals', () => {
      const result = validate(mkTokens({ borderWidth: { neg: -1, dec: 1.5 } }))
      expect(result.errors.some(e => /borderWidth\.neg/.test(e))).toBe(true)
      expect(result.errors.some(e => /borderWidth\.dec/.test(e))).toBe(false)
    })

    it('flags NaN in typography size (would emit NaNrem to CSS)', () => {
      const tokens = mkTokens()
      tokens.typography.primitives.size['500'].mobile = Number.NaN
      const result = validate(tokens)
      expect(result.errors.some(e => /typography\.size\.500\.mobile: must be a finite number/.test(e))).toBe(true)
    })

    it('flags missing breakpoint value in typography lineHeight', () => {
      const tokens = mkTokens()
      // simulate upstream dropping a breakpoint key — runtime field is undefined
      delete (tokens.typography.primitives.lineHeight['400'] as Partial<{ tablet: number }>).tablet
      const result = validate(tokens)
      expect(result.errors.some(e => /typography\.lineHeight\.400\.tablet: must be a finite number/.test(e))).toBe(true)
    })

    // ── contrast (WCAG AA) ─────────────────────────────────────────────
    describe('Contrast (WCAG AA)', () => {
      let warnSpy: ReturnType<typeof vi.spyOn>

      beforeEach(() => {
        warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      })

      afterEach(() => {
        warnSpy.mockRestore()
      })

      it('passes when text/background pairs meet 4.5:1 ratio', () => {
        // Fixture has text.primary (resolves to grey.900 = #1a1a1a) on
        // background.primary (#ffffff) — high contrast in both modes.
        const result = validate(mkTokens())
        expect(result.errors.filter(e => /contrast/.test(e))).toEqual([])
      })

      it('flags new contrast violation not on the allowlist', () => {
        // text.primary on background.primary is REQUIRED to meet 4.5:1.
        // Inject a pale grey foreground that fails (~1.6:1 on white).
        const tokens = mkTokens({
          color: {
            primitives: [{ path: ['grey', '900'], value: '#1a1a1a' }],
            semantic: [
              { path: ['background', 'primary'], light: '#ffffff', dark: '#000000' },
              { path: ['text', 'primary'], light: '#cccccc', dark: '#ffffff' },
            ],
          },
        })
        const result = validate(tokens)
        expect(
          result.errors.some(e => /contrast text\.primary on background\.primary \(light\)/.test(e)),
        ).toBe(true)
      })

      it('warns via console.warn but does not error on allowlisted pairs', () => {
        // text.secondary on background.primary (light) is currently allowlisted.
        // Inject a failing value — should produce console.warn, not error.
        const tokens = mkTokens({
          color: {
            primitives: [{ path: ['grey', '900'], value: '#1a1a1a' }],
            semantic: [
              { path: ['background', 'primary'], light: '#ffffff', dark: '#000000' },
              { path: ['text', 'primary'], light: '#000000', dark: '#ffffff' },
              { path: ['text', 'secondary'], light: '#888888', dark: '#ffffff' },
            ],
          },
        })
        const result = validate(tokens)
        // Not in errors (allowlisted)
        expect(result.errors.some(e => /text\.secondary/.test(e))).toBe(false)
        // But visible as warning
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('[a11y-warning] contrast text.secondary on background.primary (light)'),
        )
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('allowlisted'))
      })

      it('does not warn for pairs that meet contrast (no false positives)', () => {
        validate(mkTokens())
        expect(warnSpy).not.toHaveBeenCalled()
      })

      // Audit trail. Any change to the allowlist forces this test to update,
      // which forces a code review on the underlying TODO entries. Prevents
      // the allowlist from silently growing.
      it('locks current allowlist contents (audit trail)', () => {
        expect(Array.from(CONTRAST_KNOWN_BELOW_AA).sort()).toEqual([
          'text.secondary on background.primary (light)',
          'text.tertiary on background.primary (dark)',
          'text.tertiary on background.primary (light)',
        ])
      })
    })
  })

  // ────────────────────────────────────────────────────────────────────
  describe('Cross-reference parity', () => {
    it('flags unresolved typography composite refs', () => {
      const tokens = mkTokens()
      tokens.typography.semantic.roles.push({
        role: 'body',
        size: 'lg',
        weight: 'regular',
        composite: {
          family: 'ghost',
          size: '500',
          weight: 'regular',
          lineHeight: '500',
          letterSpacing: 'none',
        },
      })
      const result = validate(tokens)
      expect(result.errors.some(e => /body\.lg\.regular.*unknown family "ghost"/.test(e))).toBe(true)
    })

    it('rejects aliases in primitives (atomic layer, must be literals)', () => {
      const result = validate(mkTokens({
        color: {
          primitives: [
            { path: ['grey', '050'], value: '{color-primitives.grey.900}' },
            { path: ['grey', '900'], value: '#1a1a1a' },
          ],
          semantic: [{ path: ['bg'], light: '#fff', dark: '#000' }],
        },
      }))
      expect(result.errors.some(e => /color\.primitives\.grey\.050.*aliases not allowed/.test(e))).toBe(true)
    })

    it('rejects semantic → semantic aliases (only color-primitives allowed)', () => {
      const result = validate(mkTokens({
        color: {
          primitives: [{ path: ['grey', '900'], value: '#1a1a1a' }],
          semantic: [
            { path: ['text', 'primary'], light: '#000', dark: '#fff' },
            { path: ['text', 'secondary'], light: '{color-semantic.text.primary}', dark: '#fff' },
          ],
        },
      }))
      expect(result.errors.some(e => /text\.secondary\.light.*alias must reference color-primitives.*"color-semantic"/.test(e))).toBe(true)
    })

    it('rejects aliases pointing at unknown collection ending in -primitives', () => {
      // {foo-primitives.grey.900} previously passed because the guard only
      // checked the `-primitives` suffix. Even though grey.900 exists in
      // color primitives, emit would produce `var(--hf-foo-grey-900)` —
      // a dangling reference with no backing variable.
      const result = validate(mkTokens({
        color: {
          primitives: [{ path: ['grey', '900'], value: '#1a1a1a' }],
          semantic: [
            { path: ['bg'], light: '{foo-primitives.grey.900}', dark: '#000' },
          ],
        },
      }))
      expect(result.errors.some(e => /bg\.light.*alias must reference color-primitives.*"foo-primitives"/.test(e))).toBe(true)
    })

    it('rejects dangling semantic alias (primitive path does not exist)', () => {
      const result = validate(mkTokens({
        color: {
          primitives: [{ path: ['grey', '900'], value: '#1a1a1a' }],
          semantic: [
            { path: ['bg'], light: '{color-primitives.grey.000}', dark: '#000' },
          ],
        },
      }))
      expect(result.errors.some(e => /bg\.light.*dangling alias.*grey\.000 not found/.test(e))).toBe(true)
    })

    it('accepts semantic → existing primitive alias', () => {
      const result = validate(mkTokens())
      expect(result.ok).toBe(true)
    })
  })

  // ────────────────────────────────────────────────────────────────────
  describe('Ordering invariants', () => {
    it('flags non-monotonic breakpoints', () => {
      const result = validate(mkTokens({ breakpoints: { mobile: 320, tablet: 768, desktop: 700, wide: 1920 } }))
      expect(result.errors.some(e => e.includes('tablet (768) >= desktop (700)'))).toBe(true)
    })

    it('flags strictly-decreasing typography size at mobile breakpoint', () => {
      const tokens = mkTokens()
      tokens.typography.primitives.size['500'].mobile = 10 // < size['400'].mobile = 14
      const result = validate(tokens)
      expect(result.errors.some(e => /typography\.size: 500\.mobile \(10\) < 400\.mobile \(14\)/.test(e))).toBe(true)
    })

    it('flags strictly-decreasing typography size at tablet breakpoint', () => {
      const tokens = mkTokens()
      tokens.typography.primitives.size['500'].tablet = 12 // < size['400'].tablet = 16
      const result = validate(tokens)
      expect(result.errors.some(e => /typography\.size: 500\.tablet \(12\) < 400\.tablet \(16\)/.test(e))).toBe(true)
    })

    it('flags strictly-decreasing typography lineHeight', () => {
      const tokens = mkTokens()
      tokens.typography.primitives.lineHeight['500'].desktop = 20 // < lineHeight['400'].desktop = 28
      const result = validate(tokens)
      expect(result.errors.some(e => /typography\.lineHeight: 500\.desktop \(20\) < 400\.desktop \(28\)/.test(e))).toBe(true)
    })

    it('allows equal adjacent values (mobile-scale plateau is intentional)', () => {
      const tokens = mkTokens()
      tokens.typography.primitives.size['500'].mobile = 14 // == size['400'].mobile
      tokens.typography.primitives.lineHeight['500'].mobile = 20 // == lineHeight['400'].mobile
      const result = validate(tokens)
      expect(result.errors.filter(e => /typography\.(size|lineHeight):/.test(e))).toEqual([])
    })

    it('passes on properly ascending size scale', () => {
      const result = validate(mkTokens())
      expect(result.errors.filter(e => /typography\.size:/.test(e))).toEqual([])
      expect(result.errors.filter(e => /typography\.lineHeight:/.test(e))).toEqual([])
    })

    it('skips ordering check for non-numeric size keys (semantic scale)', () => {
      const tokens = mkTokens()
      tokens.typography.primitives.size = {
        xs: { mobile: 12, tablet: 14, desktop: 16 },
        sm: { mobile: 10, tablet: 12, desktop: 14 }, // smaller than xs — would fail if numeric, but key isn't numeric
      } as typeof tokens.typography.primitives.size
      // ensure no role refs into the now-missing '400'/'500' keys
      tokens.typography.semantic.roles = []
      tokens.typography.primitives.lineHeight = {
        xs: { mobile: 16, tablet: 18, desktop: 20 },
        sm: { mobile: 14, tablet: 16, desktop: 18 },
      } as typeof tokens.typography.primitives.lineHeight
      const result = validate(tokens)
      expect(result.errors.filter(e => /typography\.(size|lineHeight):/.test(e))).toEqual([])
    })
  })
})
