import { describe, it, expect, vi } from 'vitest'
import { parseTemplate } from './parse-template'

describe('parseTemplate', () => {
  it('parses single-segment template with space-separated classes', () => {
    const result = parseTemplate(['flex items-center gap-4'])
    expect(result.normalizedClasses).toEqual(['flex', 'items-center', 'gap-4'])
    expect(result.interpolationCount).toBe(0)
    expect(result.staticSegments).toEqual(['flex items-center gap-4'])
  })

  it('normalizes multiline whitespace to single tokens', () => {
    const result = parseTemplate([
      `
      flex
      items-center
      gap-4
    `,
    ])
    expect(result.normalizedClasses).toEqual(['flex', 'items-center', 'gap-4'])
  })

  it('deduplicates class tokens across segments', () => {
    const result = parseTemplate(['flex p-4 ', ' p-4 flex gap-2'])
    expect(result.normalizedClasses).toEqual(['flex', 'p-4', 'gap-2'])
  })

  it('counts interpolation holes as quasis.length - 1', () => {
    // 3 quasis means 2 interpolation holes
    const result = parseTemplate(['flex ', ' items-center ', ' gap-4'])
    expect(result.interpolationCount).toBe(2)
  })

  it('handles empty quasis gracefully', () => {
    const result = parseTemplate(['', '', ''])
    expect(result.normalizedClasses).toEqual([])
    expect(result.interpolationCount).toBe(2)
  })

  it('preserves CSS custom property references', () => {
    const result = parseTemplate(['bg-[--primary] text-[--foreground] rounded-[--radius]'])
    expect(result.normalizedClasses).toEqual([
      'bg-[--primary]',
      'text-[--foreground]',
      'rounded-[--radius]',
    ])
  })

  it('passes through sourceSpan from arguments', () => {
    const result = parseTemplate(['flex'], 10, 42)
    expect(result.sourceSpan).toEqual({ start: 10, end: 42 })
  })

  it('warns on unrecognized tokens but still includes them', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = parseTemplate(['flex ??? items-center'])
    expect(result.normalizedClasses).toContain('???')
    expect(result.normalizedClasses).toContain('flex')
    expect(result.normalizedClasses).toContain('items-center')
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('unrecognized token "???"'))
    warnSpy.mockRestore()
  })

  it('handles arbitrary value classes', () => {
    const result = parseTemplate(['w-[200px] bg-[#ff0000] p-[10%]'])
    expect(result.normalizedClasses).toEqual(['w-[200px]', 'bg-[#ff0000]', 'p-[10%]'])
  })

  it('handles modifier prefixes', () => {
    const result = parseTemplate(['hover:bg-red-500 dark:md:text-lg focus:ring-2'])
    expect(result.normalizedClasses).toEqual([
      'hover:bg-red-500',
      'dark:md:text-lg',
      'focus:ring-2',
    ])
  })

  it('handles negative value classes', () => {
    const result = parseTemplate(['-mt-2 -translate-x-1/2'])
    expect(result.normalizedClasses).toEqual(['-mt-2', '-translate-x-1/2'])
  })

  it('handles important modifier', () => {
    const result = parseTemplate(['!font-bold !p-4'])
    expect(result.normalizedClasses).toEqual(['!font-bold', '!p-4'])
  })
})

import fc from 'fast-check'

// Feature: tw-styled, Property 8: Template literal parser round-trip
// **Validates: Requirements 7.4**
describe('Property 8: Template literal parser round-trip', () => {
  it('parsing a serialized class list then re-parsing produces the same token set', () => {
    const validClassToken = fc.stringMatching(/^[a-z][a-z0-9-]{0,15}$/)

    fc.assert(
      fc.property(fc.array(validClassToken, { minLength: 0, maxLength: 20 }), (tokens) => {
        // Deduplicate the input tokens to get the expected set
        const expectedSet = new Set(tokens)

        // Serialize to a single whitespace-separated string (simulating a template quasi)
        const serialized = tokens.join(' ')

        // Parse with parseTemplate
        const parsed = parseTemplate([serialized])

        // The resulting normalizedClasses set should equal the original token set
        const resultSet = new Set(parsed.normalizedClasses)

        // Sets must be equal
        if (resultSet.size !== expectedSet.size) return false
        for (const token of expectedSet) {
          if (!resultSet.has(token)) return false
        }
        return true
      }),
      { numRuns: 100 },
    )
  })
})
