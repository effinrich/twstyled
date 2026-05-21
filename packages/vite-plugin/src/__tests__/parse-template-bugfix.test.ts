import { describe, it, expect, vi } from 'vitest'
import fc from 'fast-check'
import { parseTemplate } from '../parse-template'

/**
 * Bug Condition Exploration Test
 *
 * Property 1: Bug Condition - Standalone Arbitrary Variant Selectors Rejected
 *
 * This test encodes the EXPECTED (correct) behavior: standalone arbitrary variant
 * selectors like `data-[state=checked]` should be recognized as valid Tailwind
 * classes without emitting console warnings.
 *
 * On UNFIXED code, this test is EXPECTED TO FAIL because the current regex
 * incorrectly rejects these tokens and emits warnings.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3**
 */
describe('Property 1: Bug Condition - Standalone Arbitrary Variant Selectors Rejected', () => {
  it('standalone arbitrary variant selectors should be recognized without warnings', () => {
    // Generate tokens matching pattern `word-[content]` where:
    // - word is from [data, aria, group, peer]
    // - content is arbitrary non-`]` characters (at least 1 char)
    const prefixes = ['data', 'aria', 'group', 'peer'] as const

    const standaloneVariantSelector = fc
      .tuple(
        fc.constantFrom(...prefixes),
        fc.stringOf(
          fc.char().filter((c) => c !== ']' && c !== ' ' && c !== '\n' && c !== '\t'),
          { minLength: 1, maxLength: 30 }
        )
      )
      .map(([prefix, content]) => `${prefix}-[${content}]`)

    fc.assert(
      fc.property(standaloneVariantSelector, (token) => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        try {
          const result = parseTemplate([token])

          // Expected behavior: no console.warn should be called
          // (the token is a valid Tailwind arbitrary variant selector)
          expect(warnSpy).not.toHaveBeenCalled()

          // Expected behavior: the token should appear in normalizedClasses
          expect(result.normalizedClasses).toContain(token)
        } finally {
          warnSpy.mockRestore()
        }
      }),
      { numRuns: 100 }
    )
  })
})
