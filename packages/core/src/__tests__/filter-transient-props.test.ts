import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { filterTransientProps } from '../filter-transient-props'

describe('filterTransientProps', () => {
  // Unit tests
  it('removes $-prefixed keys and keeps non-$ keys', () => {
    const result = filterTransientProps({
      $variant: 'primary',
      $size: 'lg',
      id: 'btn-1',
      'data-testid': 'my-btn',
    })
    expect(result).toEqual({ id: 'btn-1', 'data-testid': 'my-btn' })
  })

  it('returns empty object when all keys are transient', () => {
    const result = filterTransientProps({ $a: 1, $b: 2 })
    expect(result).toEqual({})
  })

  it('returns all keys when none are transient', () => {
    const result = filterTransientProps({ foo: 'bar', baz: 42 })
    expect(result).toEqual({ foo: 'bar', baz: 42 })
  })

  it('handles empty props', () => {
    const result = filterTransientProps({})
    expect(result).toEqual({})
  })

  // Property 1: Transient prop isolation
  // **Validates: Requirements 2.1, 2.2, 2.3**
  it('Property 1: no $-prefixed keys in output (transient prop isolation)', () => {
    // Arbitrary that generates objects with a mix of $-prefixed and normal keys
    const propsArb = fc.dictionary(
      fc.oneof(
        // $-prefixed keys
        fc.string({ minLength: 1, maxLength: 10 }).map((s) => `$${s}`),
        // normal keys (no $ prefix)
        fc.string({ minLength: 1, maxLength: 10 }).filter((s) => !s.startsWith('$')),
      ),
      fc.oneof(fc.string(), fc.integer(), fc.boolean()),
    )

    fc.assert(
      fc.property(propsArb, (props) => {
        const filtered = filterTransientProps(props)
        const keys = Object.keys(filtered)
        // No key in the output should start with $
        return keys.every((k) => !k.startsWith('$'))
      }),
      { numRuns: 100 },
    )
  })

  // Additional property: non-transient keys are preserved
  it('Property 1 (corollary): all non-$ keys are preserved in output', () => {
    const propsArb = fc.dictionary(
      fc.oneof(
        fc.string({ minLength: 1, maxLength: 10 }).map((s) => `$${s}`),
        fc
          .string({ minLength: 1, maxLength: 10 })
          .filter((s) => !s.startsWith('$') && s !== '__proto__' && s !== 'constructor'),
      ),
      fc.oneof(fc.string(), fc.integer(), fc.boolean()),
    )

    fc.assert(
      fc.property(propsArb, (props) => {
        const filtered = filterTransientProps(props)
        // Every non-$ key from input should be in output with same value
        for (const key of Object.keys(props)) {
          if (!key.startsWith('$')) {
            if (filtered[key as keyof typeof filtered] !== props[key]) return false
          }
        }
        return true
      }),
      { numRuns: 100 },
    )
  })
})
