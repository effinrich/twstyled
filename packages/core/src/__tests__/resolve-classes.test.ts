import { describe, it, expect, vi } from 'vitest'
import * as fc from 'fast-check'
import { twMerge } from 'tailwind-merge'
import { resolveClasses } from '../resolve-classes'
import type { Interpolation } from '../types'

describe('resolveClasses', () => {
  // Requirement 1.3: applies resolved class string as className
  it('concatenates scopeClass, staticClasses, and passes through twMerge', () => {
    const result = resolveClasses('px-4 py-2', 'tw-abc1234', [], {})
    expect(result).toContain('tw-abc1234')
    expect(result).toContain('px-4')
    expect(result).toContain('py-2')
  })

  // Requirement 3.1, 3.2: dynamic interpolation evaluation
  it('includes truthy interpolation results', () => {
    const interpolations: Interpolation<{ $variant: string }>[] = [
      (props) => (props.$variant === 'primary' ? 'bg-blue-500' : 'bg-gray-500'),
    ]
    const result = resolveClasses('px-4', 'tw-abc1234', interpolations, { $variant: 'primary' })
    expect(result).toContain('bg-blue-500')
    expect(result).not.toContain('bg-gray-500')
  })

  // Requirement 3.3: falsy interpolation results are omitted
  it('omits false, null, and undefined interpolation results', () => {
    const interpolations: Interpolation<object>[] = [
      () => false,
      () => null,
      () => undefined,
      () => 'text-red-500',
    ]
    const result = resolveClasses('px-4', 'tw-abc1234', interpolations, {})
    expect(result).toContain('text-red-500')
    expect(result).toContain('px-4')
  })

  // Requirement 3.4: multiple interpolations concatenated
  it('evaluates multiple interpolations left-to-right', () => {
    const interpolations: Interpolation<object>[] = [() => 'font-bold', () => 'text-lg']
    const result = resolveClasses('px-4', 'tw-abc1234', interpolations, {})
    expect(result).toContain('font-bold')
    expect(result).toContain('text-lg')
    expect(result).toContain('px-4')
  })

  // Requirement 1.4, 4.4: consumer className takes precedence
  it('merges consumer className with precedence (last wins in twMerge)', () => {
    const result = resolveClasses('px-4 bg-red-500', 'tw-abc1234', [], {}, 'bg-blue-500')
    expect(result).toContain('bg-blue-500')
    expect(result).not.toContain('bg-red-500')
    expect(result).toContain('px-4')
  })

  // Requirement 4.1, 4.2: twMerge conflict resolution
  it('resolves conflicting Tailwind classes via twMerge', () => {
    const result = resolveClasses('p-4 p-6', 'tw-abc1234', [], {})
    // twMerge keeps the last conflicting class
    expect(result).toContain('p-6')
    expect(result).not.toContain('p-4')
  })

  // Requirement 16.1: interpolation error handling
  it('catches interpolation errors and logs a warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const interpolations: Interpolation<object>[] = [
      () => {
        throw new Error('test error')
      },
      () => 'text-sm',
    ]
    const result = resolveClasses('px-4', 'tw-abc1234', interpolations, {}, undefined, 'MyButton')
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('interpolation 0 in <MyButton> threw: test error'),
    )
    // Continues with remaining interpolations
    expect(result).toContain('text-sm')
    expect(result).toContain('px-4')
    warnSpy.mockRestore()
  })

  // Requirement 8.3: only string concat + twMerge, no DOM manipulation
  it('returns a string result (no side effects)', () => {
    const result = resolveClasses('flex items-center', 'tw-abc1234', [], {})
    expect(typeof result).toBe('string')
  })

  it('handles empty staticClasses and no interpolations', () => {
    const result = resolveClasses('', 'tw-abc1234', [], {})
    expect(result).toContain('tw-abc1234')
  })

  it('handles empty scopeClass', () => {
    const result = resolveClasses('px-4', '', [], {})
    expect(result).toContain('px-4')
  })

  // Requirement 3.5: union of static + truthy dynamic after twMerge
  it('result contains union of static classes and truthy interpolation results', () => {
    const interpolations: Interpolation<object>[] = [
      () => 'font-bold',
      () => false,
      () => 'underline',
    ]
    const result = resolveClasses('px-4 text-sm', 'tw-abc1234', interpolations, {})
    expect(result).toContain('px-4')
    expect(result).toContain('text-sm')
    expect(result).toContain('font-bold')
    expect(result).toContain('underline')
    expect(result).toContain('tw-abc1234')
  })

  // Feature: tw-styled, Property 2: Dynamic interpolation completeness
  // **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
  it('all truthy interpolation results appear in resolved className', () => {
    const classTokenArb = fc.nat({ max: 49 }).map((n) => `cls-${n}`)
    const interpolationResultArb = fc.oneof(
      classTokenArb.map((c): string | false | null => c),
      fc.constant(false as const),
      fc.constant(null as null),
    )

    fc.assert(
      fc.property(fc.array(interpolationResultArb, { minLength: 0, maxLength: 10 }), (results) => {
        const interpolations: Interpolation<object>[] = results.map((r) => () => r)
        const resolved = resolveClasses('', 'tw-scope', interpolations, {})
        const truthyResults = results.filter(
          (r): r is string => typeof r === 'string' && r.length > 0,
        )
        for (const token of truthyResults) {
          if (!resolved.includes(token)) return false
        }
        return true
      }),
      { numRuns: 100 },
    )
  })

  // Feature: tw-styled, Property 3: twMerge idempotence
  // **Validates: Requirements 4.3**
  it('twMerge is idempotent', () => {
    fc.assert(
      fc.property(fc.array(fc.string(), { minLength: 1 }), (classes) => {
        const joined = classes.join(' ')
        const once = twMerge(joined)
        const twice = twMerge(once)
        return once === twice
      }),
      { numRuns: 100 },
    )
  })

  // Feature: tw-styled, Property 4: Consumer className precedence
  // **Validates: Requirements 1.4, 4.4**
  it('consumer className wins over component own classes for conflicting pairs', () => {
    const conflictPairs = [
      ['p-1', 'p-2'],
      ['m-1', 'm-2'],
      ['text-sm', 'text-lg'],
      ['bg-red-500', 'bg-blue-500'],
      ['w-4', 'w-8'],
      ['h-4', 'h-8'],
      ['rounded-sm', 'rounded-lg'],
      ['font-normal', 'font-bold'],
      ['opacity-50', 'opacity-100'],
      ['gap-1', 'gap-4'],
    ] as const

    fc.assert(
      fc.property(fc.nat({ max: conflictPairs.length - 1 }), (pairIdx) => {
        const [ownClass, consumerClass] = conflictPairs[pairIdx]
        const resolved = resolveClasses(ownClass, 'tw-scope', [], {}, consumerClass)
        return resolved.includes(consumerClass) && !resolved.includes(ownClass)
      }),
      { numRuns: 100 },
    )
  })
})
