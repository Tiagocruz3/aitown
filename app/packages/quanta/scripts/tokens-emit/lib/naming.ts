/**
 * Naming — all "what to call things in CSS" lives here.
 *
 * Two namespaces:
 *   --hf-*    — quanta canonical names (primitives.css, theme.css)
 *   --color-* — Tailwind alias names (tailwind.css @theme inline)
 *
 * Plus DTCG bridge:
 *   `{collection.path}` alias references → `--hf-*` var names.
 */

import type { FlatPrimitive, FlatSemantic } from './types.ts'

const HF_PREFIX = 'hf'

// ────────────────────────────────────────────────────────────────────
// DTCG alias bridge
// ────────────────────────────────────────────────────────────────────

export function isAlias(value: string): boolean {
  return value.startsWith('{') && value.endsWith('}')
}

/**
 * `{color-primitives.grey.050}` → `--hf-color-grey-050`
 * `{color-primitives.transparent.dark.05}` → `--hf-color-transparent-dark-05`
 *
 * Strips `-primitives` / `-semantic` suffix from the collection segment to
 * collapse both upstream layers onto the same `--hf-color-*` namespace.
 */
export function aliasToVar(alias: string): string {
  if (!isAlias(alias)) {
    throw new Error(`aliasToVar: not an alias: ${alias}`)
  }
  const inner = alias.slice(1, -1)
  const [collection, ...path] = inner.split('.')
  const category = collection.replace(/-(primitives|semantic)$/, '')
  return `--${HF_PREFIX}-${category}-${path.join('-')}`
}

// ────────────────────────────────────────────────────────────────────
// Var names by token kind
// ────────────────────────────────────────────────────────────────────

export function primitiveVar(category: string, p: FlatPrimitive): string {
  return `--${HF_PREFIX}-${category}-${p.path.join('-')}`
}

export function semanticVar(category: string, s: FlatSemantic): string {
  return `--${HF_PREFIX}-${category}-${s.path.join('-')}`
}

export function tailwindAlias(category: string, path: string[]): string {
  return `--${category}-${path.join('-')}`
}
