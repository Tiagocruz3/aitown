/**
 * Shared types — single source of truth for shapes that flow through the pipeline.
 *
 *   Reader  ──▶ RawTokens     (un-parsed DTCG JSON)
 *   Parser  ──▶ ParsedTokens  (flat, typed, alias-preserving)
 *   Validator ──▶ ValidationResult
 *   Emitters ──▶ string       (CSS file content)
 */

// ────────────────────────────────────────────────────────────────────
// Raw — what the Reader produces
// ────────────────────────────────────────────────────────────────────

export interface RawTokenCollection {
  $metadata?: { name?: string, modes?: string[] }
  [key: string]: unknown
}

export interface RawTokens {
  colorPrimitives: RawTokenCollection
  colorSemantic: RawTokenCollection
  typePrimitives: RawTokenCollection
  typeScales: RawTokenCollection
  typeSemantic: RawTokenCollection
  breakpoint: RawTokenCollection
  space: RawTokenCollection
  zIndex: RawTokenCollection
  borderWidth: RawTokenCollection
  radius: RawTokenCollection
  motion: RawTokenCollection
}

// ────────────────────────────────────────────────────────────────────
// Parsed — color (unchanged)
// ────────────────────────────────────────────────────────────────────

export interface FlatPrimitive {
  /** Path segments, e.g. ["grey", "050"] or ["transparent", "dark", "05"]. */
  path: string[]
  /** Literal value (hex / hex-with-alpha / color string). */
  value: string
}

export interface FlatSemantic {
  /** Path segments, e.g. ["background", "primary"]. */
  path: string[]
  /** Light mode value — alias `{collection.path}` or literal. */
  light: string
  /** Dark mode value — alias or literal. */
  dark: string
}

// ────────────────────────────────────────────────────────────────────
// Parsed — typography
// ────────────────────────────────────────────────────────────────────

export interface ResponsiveSize {
  mobile: number
  tablet: number
  desktop: number
}

export interface TypographyPrimitives {
  family: Record<string, string> // primary | secondary | mono → "Inter Display" etc.
  weight: Record<string, number> // regular | medium | semi-bold | bold | black → 400..900
  size: Record<string, ResponsiveSize> // "100".."1400" → { mobile, tablet, desktop } in px
  lineHeight: Record<string, ResponsiveSize>
  letterSpacing: Record<string, number> // tight | slight | none | loose | wide → -1.2..0.2 (px)
}

export interface CompositeRole {
  family: string // key into TypographyPrimitives.family
  weight: string // key into TypographyPrimitives.weight
  size: string // key into TypographyPrimitives.size
  lineHeight: string // key into TypographyPrimitives.lineHeight
  letterSpacing: string // key into TypographyPrimitives.letterSpacing
}

export interface TypographyRole {
  role: string // 'display' | 'headline' | 'title' | 'body' | 'label' | 'caption' | 'mono'
  size: string // 'lg' | 'md' | 'sm'
  weight: string // weight name from CompositeRole.weight
  composite: CompositeRole
}

export interface TypographySemantic {
  roles: TypographyRole[]
}

export interface Breakpoints {
  mobile: number
  tablet: number
  desktop: number
  wide: number
}

// ────────────────────────────────────────────────────────────────────
// Parsed — top level
// ────────────────────────────────────────────────────────────────────

export interface ParsedTokens {
  color: {
    primitives: FlatPrimitive[]
    semantic: FlatSemantic[]
  }
  typography: {
    primitives: TypographyPrimitives
    semantic: TypographySemantic
  }
  spacing: Record<string, number> // upstream raw px-equivalents; emitter converts to rem
  breakpoints: Breakpoints // shared across categories (typography @media, Tailwind variants)
  zIndex: Record<string, number> // unitless integers, semantic keys (base/dropdown/modal/…)
  borderWidth: Record<string, number> // px values (allow decimals like 1.5); emitter inlines px
  radius: Record<string, number> // px values (e.g. 8, 9999); emitter converts to rem, full→px sentinel
  motion: Motion // duration (ms) + easing (cubic-bezier/linear strings)
}

// ────────────────────────────────────────────────────────────────────
// Parsed — motion
// ────────────────────────────────────────────────────────────────────

export interface Motion {
  duration: Record<string, number> // instant/fast/normal/slow/slower → ms integers
  easing: Record<string, string> // in/out/in-out/linear → cubic-bezier(...) | "linear"
}

// ────────────────────────────────────────────────────────────────────
// Validation result
// ────────────────────────────────────────────────────────────────────

export interface ValidationResult {
  ok: boolean
  errors: string[]
}

// ────────────────────────────────────────────────────────────────────
// Output — declarative emit registry
// ────────────────────────────────────────────────────────────────────

export interface Output {
  /** Path relative to the quanta package root. */
  path: string
  /** Function that produces the file content from parsed tokens. */
  emit: (tokens: ParsedTokens) => string
}
