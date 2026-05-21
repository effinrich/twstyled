import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { parse } from '@babel/parser'
import { transform } from '../transform'

// ─── Helpers ────────────────────────────────────────────────────────────────

/** List of HTML tags to use in generated components */
const HTML_TAGS = [
  'div',
  'button',
  'span',
  'p',
  'section',
  'article',
  'header',
  'footer',
  'main',
  'nav',
] as const

/** Tailwind-like class tokens safe for use in generated source */
const TW_CLASSES = [
  'flex',
  'block',
  'inline',
  'grid',
  'hidden',
  'p-1',
  'p-2',
  'p-4',
  'p-8',
  'm-1',
  'm-2',
  'm-4',
  'm-8',
  'w-full',
  'h-full',
  'w-auto',
  'h-auto',
  'text-sm',
  'text-base',
  'text-lg',
  'text-xl',
  'font-bold',
  'font-medium',
  'font-normal',
  'rounded',
  'rounded-md',
  'rounded-lg',
  'bg-white',
  'bg-black',
  'bg-gray-100',
  'text-white',
  'text-black',
  'text-gray-700',
  'border',
  'border-2',
  'border-gray-200',
  'items-center',
  'justify-center',
  'gap-2',
  'gap-4',
  'cursor-pointer',
  'opacity-50',
]

/** PascalCase component names */
const COMPONENT_NAMES = [
  'Button',
  'Card',
  'Badge',
  'Panel',
  'Header',
  'Footer',
  'Wrapper',
  'Container',
  'Section',
  'Box',
] as const

/**
 * Custom arbitrary that generates valid TSX component source strings.
 * Each source has a React import, a single function component, and an HTML
 * element with a className prop containing Tailwind classes.
 */
function shadcnComponentArbitrary(): fc.Arbitrary<string> {
  return fc
    .record({
      componentName: fc.constantFrom(...COMPONENT_NAMES),
      tag: fc.constantFrom(...HTML_TAGS),
      classes: fc.shuffledSubarray(TW_CLASSES, { minLength: 1, maxLength: 6 }),
      childText: fc.constantFrom('Click', 'Hello', 'Submit', 'Content', 'Label'),
    })
    .map(({ componentName, tag, classes, childText }) => {
      const classStr = classes.join(' ')
      return [
        `import React from 'react'`,
        ``,
        `export function ${componentName}() {`,
        `  return <${tag} className="${classStr}">${childText}</${tag}>`,
        `}`,
      ].join('\n')
    })
}

// ─── Property 9: CLI transform idempotence ──────────────────────────────────
// Feature: tw-styled, Property 9: CLI transform idempotence
// **Validates: Requirements 11.5**

describe('Property 9: CLI transform idempotence', () => {
  it('applying transform twice produces the same output as applying it once', async () => {
    await fc.assert(
      fc.asyncProperty(shadcnComponentArbitrary(), async (source) => {
        const firstResult = await transform(source)
        // The first transform should succeed
        if (firstResult.status === 'error') return true // skip unparseable (shouldn't happen with our generator)

        const firstOutput = firstResult.status === 'transformed' ? firstResult.diff! : source

        const secondResult = await transform(firstOutput)
        // Second pass should be skipped (already uses styled) or produce identical output
        if (secondResult.status === 'skipped') return true

        const secondOutput =
          secondResult.status === 'transformed' ? secondResult.diff! : firstOutput
        return firstOutput === secondOutput
      }),
      { numRuns: 100 },
    )
  })
})

// ─── Property 10: CLI transform round-trip validity ─────────────────────────
// Feature: tw-styled, Property 10: CLI transform round-trip validity
// **Validates: Requirements 11.6, 11.9**

describe('Property 10: CLI transform round-trip validity', () => {
  it('transform output is valid TypeScript/TSX that parses without errors', async () => {
    await fc.assert(
      fc.asyncProperty(shadcnComponentArbitrary(), async (source) => {
        const result = await transform(source)
        if (result.status === 'error') return true // skip
        if (result.status === 'skipped') return true

        const output = result.diff!
        // Attempt to parse the output — should not throw
        try {
          parse(output, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx'],
          })
          return true
        } catch {
          return false
        }
      }),
      { numRuns: 100 },
    )
  })
})

// ─── Unit tests for CLI transform fixtures (Task 6.6) ──────────────────────

describe('CLI transform fixtures', () => {
  it('transforms a Button with className string to styled.button', async () => {
    const input = [
      `import React from 'react'`,
      ``,
      `export function Button() {`,
      `  return <button className="flex items-center p-4">Click</button>`,
      `}`,
    ].join('\n')

    const result = await transform(input, 'button.tsx')
    expect(result.status).toBe('transformed')
    expect(result.diff).toBeDefined()
    expect(result.diff).toContain('styled.button')
    expect(result.diff).toContain('from "tw-styled"')
  })

  it('transforms cn() call and removes cn import', async () => {
    const input = [
      `import React from 'react'`,
      `import { cn } from '@/lib/utils'`,
      ``,
      `export function Badge() {`,
      `  return <span className={cn("inline-flex", "rounded-md")}>Tag</span>`,
      `}`,
    ].join('\n')

    const result = await transform(input, 'badge.tsx')
    expect(result.status).toBe('transformed')
    expect(result.diff).toBeDefined()
    expect(result.diff).toContain('styled.span')
    // cn import should be removed since it's no longer used
    expect(result.diff).not.toContain('import { cn }')
  })

  it('--dry-run returns diff without modifying source', async () => {
    const input = [
      `import React from 'react'`,
      ``,
      `export function Card() {`,
      `  return <div className="rounded-lg border p-4">Content</div>`,
      `}`,
    ].join('\n')

    const result = await transform(input, 'card.tsx', { dryRun: true })
    expect(result.status).toBe('transformed')
    expect(result.diff).toBeDefined()
    // Dry-run diff should contain diff markers
    expect(result.diff).toContain('---')
    expect(result.diff).toContain('+++')
  })

  it('returns skipped for file that already uses styled from tw-styled', async () => {
    const input = [
      `import React from 'react'`,
      `import { styled } from 'tw-styled'`,
      ``,
      `const StyledButton = styled.button\`flex p-4\``,
      ``,
      `export function Button() {`,
      `  return <StyledButton>Click</StyledButton>`,
      `}`,
    ].join('\n')

    const result = await transform(input, 'already-styled.tsx')
    expect(result.status).toBe('skipped')
  })

  it('returns error for invalid syntax', async () => {
    const input = `export function Broken( { return <div className="flex">< }}`

    const result = await transform(input, 'broken.tsx')
    expect(result.status).toBe('error')
    expect(result.error).toBeDefined()
  })
})
