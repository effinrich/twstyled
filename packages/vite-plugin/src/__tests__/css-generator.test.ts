import { describe, it, expect } from 'vitest'
import { generateCSS, accumulateFileCSS } from '../css-generator'
import type { ExtractedComponent } from '../types'

function makeComponent(overrides: Partial<ExtractedComponent> = {}): ExtractedComponent {
  return {
    scopeClass: 'tw-abc1234',
    staticClasses: ['p-4', 'text-red-500'],
    ordinal: 0,
    sourceLocation: { line: 1, col: 1 },
    ...overrides,
  }
}

describe('generateCSS', () => {
  it('generates correct CSS for a single component', () => {
    const result = generateCSS([makeComponent()])

    expect(result).toContain('@layer components')
    expect(result).toContain('.tw-abc1234')
    expect(result).toContain('p-4')
    expect(result).toContain('text-red-500')
    // Verify structure: @layer wraps the scope class rule
    expect(result).toMatch(/@layer components \{\n\s+\.tw-abc1234 \{[\s\S]*\}\n\}/)
  })

  it('emits utility classes directly, not via @apply', () => {
    const result = generateCSS([makeComponent()])

    // Should NOT use @apply
    expect(result).not.toContain('@apply')
    // Classes should appear directly in the output
    expect(result).toContain('p-4')
    expect(result).toContain('text-red-500')
  })

  it('handles multiple components', () => {
    const components = [
      makeComponent({ scopeClass: 'tw-aaa0001', staticClasses: ['flex', 'gap-2'] }),
      makeComponent({ scopeClass: 'tw-bbb0002', staticClasses: ['grid', 'p-8'] }),
    ]

    const result = generateCSS(components)

    expect(result).toContain('.tw-aaa0001')
    expect(result).toContain('.tw-bbb0002')
    expect(result).toContain('flex')
    expect(result).toContain('gap-2')
    expect(result).toContain('grid')
    expect(result).toContain('p-8')
    // All rules inside a single @layer block
    const layerCount = (result.match(/@layer components/g) || []).length
    expect(layerCount).toBe(1)
  })

  it('preserves CSS custom property references', () => {
    const component = makeComponent({
      staticClasses: ['bg-[--primary]', 'text-[--foreground]', 'rounded-[--radius]'],
    })

    const result = generateCSS([component])

    expect(result).toContain('bg-[--primary]')
    expect(result).toContain('text-[--foreground]')
    expect(result).toContain('rounded-[--radius]')
  })

  it('handles empty class lists', () => {
    const component = makeComponent({ staticClasses: [] })
    const result = generateCSS([component])

    // A component with no classes should not produce a rule
    expect(result).toBe('')
  })

  it('returns empty string for empty component array', () => {
    expect(generateCSS([])).toBe('')
  })

  it('skips components with empty classes among non-empty ones', () => {
    const components = [
      makeComponent({ scopeClass: 'tw-aaa0001', staticClasses: [] }),
      makeComponent({ scopeClass: 'tw-bbb0002', staticClasses: ['flex'] }),
    ]

    const result = generateCSS(components)

    expect(result).not.toContain('tw-aaa0001')
    expect(result).toContain('tw-bbb0002')
    expect(result).toContain('flex')
  })
})

describe('accumulateFileCSS', () => {
  it('adds CSS entry for a file with components', () => {
    const cssMap = new Map<string, string>()
    const components = [makeComponent({ scopeClass: 'tw-file001', staticClasses: ['flex'] })]

    accumulateFileCSS(cssMap, '/src/App.tsx', components)

    expect(cssMap.has('/src/App.tsx')).toBe(true)
    expect(cssMap.get('/src/App.tsx')).toContain('tw-file001')
    expect(cssMap.get('/src/App.tsx')).toContain('flex')
  })

  it('removes stale entry when file has no extractable components', () => {
    const cssMap = new Map<string, string>([
      ['/src/App.tsx', '@layer components { .tw-old { /* flex */ } }'],
    ])

    accumulateFileCSS(cssMap, '/src/App.tsx', [])

    expect(cssMap.has('/src/App.tsx')).toBe(false)
  })

  it('removes stale entry when all components have empty classes', () => {
    const cssMap = new Map<string, string>([
      ['/src/App.tsx', '@layer components { .tw-old { /* flex */ } }'],
    ])

    accumulateFileCSS(cssMap, '/src/App.tsx', [makeComponent({ staticClasses: [] })])

    expect(cssMap.has('/src/App.tsx')).toBe(false)
  })

  it('accumulates CSS from multiple files', () => {
    const cssMap = new Map<string, string>()

    accumulateFileCSS(cssMap, '/src/A.tsx', [
      makeComponent({ scopeClass: 'tw-aaa0001', staticClasses: ['flex'] }),
    ])
    accumulateFileCSS(cssMap, '/src/B.tsx', [
      makeComponent({ scopeClass: 'tw-bbb0002', staticClasses: ['grid'] }),
    ])

    expect(cssMap.size).toBe(2)
    expect(cssMap.get('/src/A.tsx')).toContain('flex')
    expect(cssMap.get('/src/B.tsx')).toContain('grid')
  })

  it('returns the same map reference', () => {
    const cssMap = new Map<string, string>()
    const result = accumulateFileCSS(cssMap, '/src/A.tsx', [makeComponent()])

    expect(result).toBe(cssMap)
  })
})

import fc from 'fast-check'

// Feature: tw-styled, Property 7: Static extraction completeness
// **Validates: Requirements 6.3, 6.7**
describe('Property 7: Static extraction completeness', () => {
  it('every static class token appears in the emitted CSS', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.stringMatching(/^[a-z][a-z0-9-]{1,15}$/), {
          minLength: 1,
          maxLength: 20,
        }),
        (tokens) => {
          const component = makeComponent({
            staticClasses: tokens,
          })
          const css = generateCSS([component])

          for (const token of tokens) {
            if (!css.includes(token)) return false
          }
          return true
        },
      ),
      { numRuns: 100 },
    )
  })
})

// Feature: tw-styled, Property 11: CSS custom property passthrough
// **Validates: Requirements 10.1, 10.2**
describe('Property 11: CSS custom property passthrough', () => {
  it('CSS custom property classes appear unmodified in output', () => {
    const varNameArb = fc.stringMatching(/^[a-z][a-z0-9-]{0,10}$/)
    const prefixArb = fc.constantFrom('bg', 'text', 'border', 'rounded', 'ring', 'shadow')

    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(prefixArb, varNameArb).map(([prefix, name]) => `${prefix}-[--${name}]`),
          { minLength: 1, maxLength: 10 },
        ),
        (classes) => {
          const component = makeComponent({ staticClasses: classes })
          const css = generateCSS([component])

          for (const cls of classes) {
            if (!css.includes(cls)) return false
          }
          return true
        },
      ),
      { numRuns: 100 },
    )
  })
})
