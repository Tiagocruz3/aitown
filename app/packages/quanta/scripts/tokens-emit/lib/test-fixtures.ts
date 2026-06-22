/**
 * Test-only fixture builders. Produce minimal valid `ParsedTokens` shapes
 * so each unit test can override only the slice it exercises.
 */

import type { ParsedTokens } from './types.ts'

export function mkTokens(overrides: Partial<ParsedTokens> = {}): ParsedTokens {
  return {
    color: {
      primitives: [
        { path: ['grey', '050'], value: '#f8f8f8' },
        { path: ['grey', '900'], value: '#1a1a1a' },
        { path: ['blue', '500'], value: '#0066ff' },
      ],
      semantic: [
        {
          path: ['background', 'primary'],
          light: '#ffffff',
          dark: '{color-primitives.grey.900}',
        },
        {
          path: ['text', 'primary'],
          light: '{color-primitives.grey.900}',
          dark: '#ffffff',
        },
      ],
    },
    typography: {
      primitives: {
        family: { primary: 'Inter', secondary: 'Inter', mono: 'Menlo' },
        weight: { regular: 400, medium: 500, bold: 700 },
        size: {
          400: { mobile: 14, tablet: 16, desktop: 18 },
          500: { mobile: 16, tablet: 18, desktop: 20 },
        },
        lineHeight: {
          400: { mobile: 20, tablet: 24, desktop: 28 },
          500: { mobile: 24, tablet: 28, desktop: 32 },
        },
        letterSpacing: { tight: -0.5, none: 0, loose: 0.5 },
      },
      semantic: {
        roles: [
          {
            role: 'body',
            size: 'md',
            weight: 'regular',
            composite: {
              family: 'primary',
              size: '500',
              weight: 'regular',
              lineHeight: '500',
              letterSpacing: 'none',
            },
          },
        ],
      },
    },
    spacing: { 4: 4, 8: 8, 16: 16 },
    breakpoints: { mobile: 320, tablet: 768, desktop: 1280, wide: 1920 },
    // 8 semantic keys in canonical layering order — primitivesZIndex iterates
    // a fixed name list, missing keys would render as `undefined` in the CSS.
    zIndex: {
      base: 0,
      dropdown: 10,
      sticky: 20,
      overlay: 30,
      modal: 40,
      popover: 50,
      toast: 60,
      tooltip: 70,
    },
    borderWidth: { none: 0, thin: 1, medium: 1.5, thick: 2 },
    // Numeric keys (px → rem) plus the `full` sentinel (9999 → px). Order is
    // re-derived by the emitter via sortedKeys, so insertion order is free.
    radius: { 0: 0, '050': 2, 100: 4, 200: 8, full: 9999 },
    // Full key sets — motion emitters iterate fixed lists; missing keys would
    // render as `undefined`. Durations in ms, easings as raw timing strings.
    motion: {
      duration: { instant: 0, fast: 100, normal: 200, slow: 300, slower: 500 },
      easing: {
        'in': 'cubic-bezier(0.4, 0, 1, 1)',
        'out': 'cubic-bezier(0, 0, 0.2, 1)',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'linear': 'linear',
      },
    },
    ...overrides,
  }
}
