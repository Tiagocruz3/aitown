/**
 * Outputs registry — declarative list of files this codegen produces.
 *
 * Adding a new category (radius, spacing, shadow, motion, …):
 *   1. Add `lib/emit/<category>.ts` with emit functions
 *   2. Append entries to the list below
 *   3. Add the raw collection to `lib/reader.ts` and `lib/types.ts`
 *
 * emit.ts iterates this list — it does not change as categories grow.
 */

import type { Output } from './types.ts'
import { primitivesBorderWidth, tailwindBorderWidth } from './emit/border-width.ts'
import { primitivesBreakpoint, tailwindBreakpoint } from './emit/breakpoint.ts'
import { primitivesColor, tailwindColor, themeColor } from './emit/color.ts'
import { primitivesMotion, tailwindMotion } from './emit/motion.ts'
import { primitivesRadius, tailwindRadius } from './emit/radius.ts'
import { primitivesSpacing, tailwindSpacing } from './emit/spacing.ts'
import { primitivesTypography, tailwindTypography, themeTypography } from './emit/typography.ts'
import { primitivesZIndex, tailwindZIndex } from './emit/z-index.ts'

export const outputs: Output[] = [
  { path: 'src/css/primitives/color.css', emit: primitivesColor },
  { path: 'src/css/theme/color.css', emit: themeColor },
  { path: 'src/css/tailwind/color.css', emit: tailwindColor },
  { path: 'src/css/primitives/border-width.css', emit: primitivesBorderWidth },
  { path: 'src/css/tailwind/border-width.css', emit: tailwindBorderWidth },
  { path: 'src/css/primitives/breakpoint.css', emit: primitivesBreakpoint },
  { path: 'src/css/tailwind/breakpoint.css', emit: tailwindBreakpoint },
  { path: 'src/css/primitives/spacing.css', emit: primitivesSpacing },
  { path: 'src/css/tailwind/spacing.css', emit: tailwindSpacing },
  { path: 'src/css/primitives/typography.css', emit: primitivesTypography },
  { path: 'src/css/theme/typography.css', emit: themeTypography },
  { path: 'src/css/tailwind/typography.css', emit: tailwindTypography },
  { path: 'src/css/primitives/z-index.css', emit: primitivesZIndex },
  { path: 'src/css/tailwind/z-index.css', emit: tailwindZIndex },
  { path: 'src/css/primitives/radius.css', emit: primitivesRadius },
  { path: 'src/css/tailwind/radius.css', emit: tailwindRadius },
  { path: 'src/css/primitives/motion.css', emit: primitivesMotion },
  { path: 'src/css/tailwind/motion.css', emit: tailwindMotion },
]
