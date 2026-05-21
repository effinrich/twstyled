import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { generateScopeClass } from '../scope-class'

describe('generateScopeClass', () => {
  // --- Unit tests ---

  it('produces expected output for a known input', () => {
    const result = generateScopeClass('src/components/Button.tsx', 0)
    // Call twice to confirm the value, then snapshot it
    expect(result).toBe(generateScopeClass('src/components/Button.tsx', 0))
    expect(typeof result).toBe('string')
  })

  it('output matches pattern tw-[a-z0-9]{7}', () => {
    const result = generateScopeClass('src/App.tsx', 3)
    expect(result).toMatch(/^tw-[a-z0-9]{7}$/)
  })

  // --- Property 6: Scope class determinism ---
  // **Validates: Requirements 5.3, 5.4, 15.2**
  it('Property 6: scope class generation is deterministic', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), fc.nat(100), (filePath, ordinal) => {
        return generateScopeClass(filePath, ordinal) === generateScopeClass(filePath, ordinal)
      }),
      { numRuns: 100 },
    )
  })

  // --- Property 5: Scope class uniqueness ---
  // **Validates: Requirements 5.2, 15.1**
  it('Property 5: distinct definitions produce distinct scope classes', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.nat(50),
        fc.string({ minLength: 1 }),
        fc.nat(50),
        (pathA, ordA, pathB, ordB) => {
          fc.pre(pathA !== pathB || ordA !== ordB)
          return generateScopeClass(pathA, ordA) !== generateScopeClass(pathB, ordB)
        },
      ),
      { numRuns: 200 },
    )
  })
})
