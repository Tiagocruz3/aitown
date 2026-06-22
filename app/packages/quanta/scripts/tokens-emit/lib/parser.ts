/**
 * Parser — DTCG raw tokens → flat, typed shape.
 *
 * Primitives: walks arbitrary depth until a `$value: string` leaf
 *   (handles `transparent.dark.05` style nesting).
 *
 * Semantic: walks until `$value: { light, dark }` leaf. Values may be
 *   alias references (`{collection.path}`) or literals; the parser
 *   preserves both — `lib/naming.ts` does alias→var conversion at emit time.
 */

import type {
  Breakpoints,
  CompositeRole,
  FlatPrimitive,
  FlatSemantic,
  Motion,
  ParsedTokens,
  RawTokens,
  ResponsiveSize,
  TypographyPrimitives,
  TypographyRole,
  TypographySemantic,
} from './types.ts'

export function parse(raw: RawTokens): ParsedTokens {
  const scales = parseTypeScales(raw.typeScales)
  return {
    color: {
      primitives: walkPrimitives(raw.colorPrimitives),
      semantic: walkSemantic(raw.colorSemantic),
    },
    typography: {
      primitives: parseTypographyPrimitives(raw.typePrimitives, scales),
      semantic: parseTypographySemantic(raw.typeSemantic),
    },
    spacing: parseSpacing(raw.space),
    breakpoints: parseBreakpoints(raw.breakpoint),
    zIndex: parseZIndex(raw.zIndex),
    borderWidth: parseBorderWidth(raw.borderWidth),
    radius: parseRadius(raw.radius),
    motion: parseMotion(raw.motion),
  }
}

// ────────────────────────────────────────────────────────────────────
// Internal — DTCG walkers
// ────────────────────────────────────────────────────────────────────

interface DtcgNode {
  $type?: string
  $value?: string | Record<string, string>
  [key: string]: unknown
}

function walkPrimitives(node: unknown, path: string[] = []): FlatPrimitive[] {
  if (typeof node !== 'object' || node === null)
    return []
  const n = node as DtcgNode
  if (typeof n.$value === 'string')
    return [{ path, value: n.$value }]

  const out: FlatPrimitive[] = []
  for (const [key, child] of Object.entries(n)) {
    if (key.startsWith('$'))
      continue
    out.push(...walkPrimitives(child, [...path, key]))
  }
  return out
}

function walkSemantic(node: unknown, path: string[] = []): FlatSemantic[] {
  if (typeof node !== 'object' || node === null)
    return []
  const n = node as DtcgNode
  if (typeof n.$value === 'object' && n.$value !== null && !Array.isArray(n.$value)) {
    const v = n.$value as Record<string, string>
    return [{
      path,
      light: typeof v.light === 'string' ? v.light : '',
      dark: typeof v.dark === 'string' ? v.dark : '',
    }]
  }

  const out: FlatSemantic[] = []
  for (const [key, child] of Object.entries(n)) {
    if (key.startsWith('$'))
      continue
    out.push(...walkSemantic(child, [...path, key]))
  }
  return out
}

// ────────────────────────────────────────────────────────────────────
// Typography parsers
// ────────────────────────────────────────────────────────────────────

interface ScalesValue {
  Desktop: number
  Tablet: number
  Mobile: number
}

/**
 * type-scales.json → flat Record<scaleKey, ResponsiveSize>.
 * Source values are unitless numbers; emitter appends `px`.
 */
function parseTypeScales(raw: unknown): Record<string, ResponsiveSize> {
  const root = (raw as { scale?: Record<string, { $value?: ScalesValue }> }).scale
  if (!root)
    throw new Error('parseTypeScales: missing `scale` root')
  const out: Record<string, ResponsiveSize> = {}
  for (const [key, node] of Object.entries(root)) {
    const v = node.$value
    if (!v || typeof v.Mobile !== 'number')
      throw new Error(`parseTypeScales: bad value for scale.${key}`)
    out[key] = { mobile: v.Mobile, tablet: v.Tablet, desktop: v.Desktop }
  }
  return out
}

/**
 * Resolve an alias like `{type-scales.scale.400}` against a scales map.
 * Returns the ResponsiveSize triple. Throws if not an alias or unresolved.
 */
function resolveScaleRef(value: string, scales: Record<string, ResponsiveSize>): ResponsiveSize {
  if (!value.startsWith('{') || !value.endsWith('}'))
    throw new Error(`resolveScaleRef: not an alias: ${value}`)
  const inner = value.slice(1, -1)
  const parts = inner.split('.')
  const key = parts[parts.length - 1]
  const hit = scales[key]
  if (!hit)
    throw new Error(`resolveScaleRef: unknown scale key: ${key}`)
  return hit
}

export function parseTypographyPrimitives(
  rawPrims: unknown,
  scales: Record<string, ResponsiveSize>,
): TypographyPrimitives {
  const root = rawPrims as Record<string, Record<string, { $value?: unknown }>>

  const family: Record<string, string> = {}
  for (const [key, node] of Object.entries(root.family ?? {})) {
    if (typeof node.$value !== 'string')
      throw new Error(`typography primitives: bad family.${key}`)
    family[key] = node.$value
  }

  const weight: Record<string, number> = {}
  for (const [key, node] of Object.entries(root.weight ?? {})) {
    if (typeof node.$value !== 'number')
      throw new Error(`typography primitives: bad weight.${key}`)
    weight[key] = node.$value
  }

  const size: Record<string, ResponsiveSize> = {}
  for (const [key, node] of Object.entries(root.size ?? {})) {
    if (typeof node.$value !== 'string')
      throw new Error(`typography primitives: size.${key} must be an alias`)
    size[key] = resolveScaleRef(node.$value, scales)
  }

  const lineHeight: Record<string, ResponsiveSize> = {}
  for (const [key, node] of Object.entries(root['line-height'] ?? {})) {
    if (typeof node.$value !== 'string')
      throw new Error(`typography primitives: line-height.${key} must be an alias`)
    lineHeight[key] = resolveScaleRef(node.$value, scales)
  }

  const letterSpacing: Record<string, number> = {}
  for (const [key, node] of Object.entries(root['letter-spacing'] ?? {})) {
    if (typeof node.$value !== 'number')
      throw new Error(`typography primitives: bad letter-spacing.${key}`)
    letterSpacing[key] = node.$value
  }

  return { family, weight, size, lineHeight, letterSpacing }
}

/**
 * Extract a leaf-token key from a `{type-primitives.<field>.<key>}` alias.
 * For `{type-primitives.family.primary}` → "primary".
 * For `{type-primitives.letter-spacing.tight}` → "tight".
 */
function aliasLeafKey(value: string): string {
  if (!value.startsWith('{') || !value.endsWith('}'))
    throw new Error(`aliasLeafKey: not an alias: ${value}`)
  const parts = value.slice(1, -1).split('.')
  return parts[parts.length - 1]
}

interface CompositeNode {
  'family'?: { $value?: string }
  'weight'?: { $value?: string }
  'size'?: { $value?: string }
  'line-height'?: { $value?: string }
  'letter-spacing'?: { $value?: string }
}

function isCompositeLeaf(node: unknown): node is CompositeNode {
  if (typeof node !== 'object' || node === null)
    return false
  const n = node as Record<string, unknown>
  return 'family' in n && 'weight' in n && 'size' in n && 'line-height' in n && 'letter-spacing' in n
}

export function parseTypographySemantic(raw: unknown): TypographySemantic {
  const roles: TypographyRole[] = []

  function walk(node: unknown, path: string[]): void {
    if (typeof node !== 'object' || node === null)
      return
    if (isCompositeLeaf(node)) {
      const [role, size, weight] = path
      if (!role || !size || !weight)
        throw new Error(`typography semantic: unexpected leaf depth at ${path.join('.')}`)
      const composite: CompositeRole = {
        family: aliasLeafKey(node.family?.$value ?? ''),
        weight: aliasLeafKey(node.weight?.$value ?? ''),
        size: aliasLeafKey(node.size?.$value ?? ''),
        lineHeight: aliasLeafKey(node['line-height']?.$value ?? ''),
        letterSpacing: aliasLeafKey(node['letter-spacing']?.$value ?? ''),
      }
      roles.push({ role, size, weight, composite })
      return
    }
    for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
      if (key.startsWith('$'))
        continue
      walk(child, [...path, key])
    }
  }

  walk(raw, [])
  return { roles }
}

/**
 * space.json → flat Record<key, px-equivalent>.
 * Source values are unitless numbers (e.g. 4, 8, 12); emitter converts to rem.
 */
export function parseSpacing(raw: unknown): Record<string, number> {
  const root = (raw as { space?: Record<string, { $value?: number }> }).space
  if (!root)
    throw new Error('parseSpacing: missing `space` root')
  const out: Record<string, number> = {}
  for (const [k, node] of Object.entries(root)) {
    if (typeof node.$value !== 'number')
      throw new Error(`parseSpacing: bad value for space.${k}`)
    out[k] = node.$value
  }
  return out
}

/**
 * z-index.json → flat Record<key, integer>.
 * Source: `{ "z-index": { "modal": { "$type": "number", "$value": 40 }, ... } }`
 */
export function parseZIndex(raw: unknown): Record<string, number> {
  const root = (raw as { 'z-index'?: Record<string, { $value?: number }> })['z-index']
  if (!root)
    throw new Error('parseZIndex: missing `z-index` root')
  const out: Record<string, number> = {}
  for (const [k, node] of Object.entries(root)) {
    if (typeof node.$value !== 'number')
      throw new Error(`parseZIndex: bad value for z-index.${k}`)
    out[k] = node.$value
  }
  return out
}

/**
 * border-width.json → flat Record<key, px-value>.
 * Source: `{ "border-width": { "thin": { "$type": "dimension", "$value": 1 }, ... } }`
 * Values may be decimals (e.g. medium = 1.5); emitter appends `px`.
 */
export function parseBorderWidth(raw: unknown): Record<string, number> {
  const root = (raw as { 'border-width'?: Record<string, { $value?: number }> })['border-width']
  if (!root)
    throw new Error('parseBorderWidth: missing `border-width` root')
  const out: Record<string, number> = {}
  for (const [k, node] of Object.entries(root)) {
    if (typeof node.$value !== 'number')
      throw new Error(`parseBorderWidth: bad value for border-width.${k}`)
    out[k] = node.$value
  }
  return out
}

/**
 * radius.json → flat Record<key, px-value>.
 * Source: `{ "radius": { "200": { "$type": "dimension", "$value": 8 }, "full": { … 9999 } } }`
 * Numeric keys are px (emitter converts to rem); `full` is a 9999 sentinel
 * (emitter special-cases it to a px value — see emit/radius.ts).
 *
 * Bespoke number-parser (local `{ $value?: number }` cast + `typeof number`
 * guard), mirroring `parseBorderWidth`/`parseZIndex` — NOT the generic
 * `walkPrimitives` path (its `DtcgNode.$value` type excludes `number`).
 */
export function parseRadius(raw: unknown): Record<string, number> {
  const root = (raw as { radius?: Record<string, { $value?: number }> }).radius
  if (!root)
    throw new Error('parseRadius: missing `radius` root')
  const out: Record<string, number> = {}
  for (const [k, node] of Object.entries(root)) {
    if (typeof node.$value !== 'number')
      throw new Error(`parseRadius: bad value for radius.${k}`)
    out[k] = node.$value
  }
  return out
}

/**
 * motion.json → { duration: Record<key, ms>, easing: Record<key, string> }.
 * Source: `{ "duration": { "fast": { "$type": "duration", "$value": 100 }, … },
 *            "easing":   { "out":  { "$type": "cubicBezier", "$value": "cubic-bezier(…)" }, … } }`
 *
 * A NEW walker (not reusable from the number-only parsers): `duration` values
 * are numbers (ms), `easing` values are strings (cubic-bezier(…) | "linear").
 */
export function parseMotion(raw: unknown): Motion {
  const root = raw as {
    duration?: Record<string, { $value?: number }>
    easing?: Record<string, { $value?: string }>
  }
  if (!root.duration)
    throw new Error('parseMotion: missing `duration` root')
  if (!root.easing)
    throw new Error('parseMotion: missing `easing` root')

  const duration: Record<string, number> = {}
  for (const [k, node] of Object.entries(root.duration)) {
    if (typeof node.$value !== 'number')
      throw new Error(`parseMotion: bad value for duration.${k}`)
    duration[k] = node.$value
  }

  const easing: Record<string, string> = {}
  for (const [k, node] of Object.entries(root.easing)) {
    if (typeof node.$value !== 'string')
      throw new Error(`parseMotion: bad value for easing.${k}`)
    easing[k] = node.$value
  }

  return { duration, easing }
}

export function parseBreakpoints(raw: unknown): Breakpoints {
  const maybeRoot = (raw as { breakpoint?: Record<string, { $value?: number }> }).breakpoint
  if (!maybeRoot)
    throw new Error('parseBreakpoints: missing `breakpoint` root')
  const root: Record<string, { $value?: number }> = maybeRoot
  function pick(name: keyof Breakpoints): number {
    const v = root[name]?.$value
    if (typeof v !== 'number')
      throw new Error(`parseBreakpoints: missing or non-numeric ${name}`)
    return v
  }
  return {
    mobile: pick('mobile'),
    tablet: pick('tablet'),
    desktop: pick('desktop'),
    wide: pick('wide'),
  }
}
