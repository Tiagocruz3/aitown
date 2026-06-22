import { describe, expect, it } from 'vitest'
import { fetchTokens, parseSource, resolveSource, SOURCE_ENV } from './source.ts'

describe('parseSource', () => {
  it('parses fs:// with an absolute path', () => {
    expect(parseSource('fs:///Users/x/design-tokens')).toEqual({
      scheme: 'fs',
      location: '/Users/x/design-tokens',
    })
  })

  it('parses fs:// with a relative path', () => {
    expect(parseSource('fs://../../design-tokens')).toEqual({
      scheme: 'fs',
      location: '../../design-tokens',
    })
  })

  it('parses git:// (recognised even though unimplemented)', () => {
    expect(parseSource('git://github.com/higgsfield-ai/design-tokens')).toEqual({
      scheme: 'git',
      location: 'github.com/higgsfield-ai/design-tokens',
    })
  })

  it('rejects an unsupported scheme', () => {
    expect(() => parseSource('s3://bucket/path')).toThrow(/Unsupported .* scheme "s3:\/\/"/)
  })

  it('rejects a value without ://', () => {
    expect(() => parseSource('/just/a/path')).toThrow(/expected "<scheme>:\/\/<path>"/)
  })

  it('rejects an empty path', () => {
    expect(() => parseSource('fs://')).toThrow(/missing path/)
  })
})

describe('resolveSource', () => {
  it('prefers a CLI arg, wrapping a bare path as fs://', () => {
    expect(resolveSource({}, '/abs/design-tokens')).toEqual({ scheme: 'fs', location: '/abs/design-tokens' })
  })

  it('accepts a full URI as the CLI arg', () => {
    expect(resolveSource({}, 'git://host/repo')).toEqual({ scheme: 'git', location: 'host/repo' })
  })

  it('falls back to the env var when no arg is given', () => {
    expect(resolveSource({ [SOURCE_ENV]: 'fs:///from/env' })).toEqual({ scheme: 'fs', location: '/from/env' })
  })

  it('falls back to the default upstream when neither arg nor env is set', () => {
    const source = resolveSource({})
    expect(source.scheme).toBe('fs')
    expect(source.location.endsWith('design-tokens')).toBe(true)
  })
})

describe('fetchTokens', () => {
  it('throws not-implemented for a git source', () => {
    expect(() => fetchTokens({ scheme: 'git', location: 'host/repo' }, '/tmp/dest')).toThrow(/not implemented/)
  })
})
