import type { ParsedTemplate } from './types'

/**
 * Matches tokens that look like valid Tailwind utility classes.
 * Covers: standard utilities (p-4, flex), negative values (-mt-2),
 * modifiers (hover:bg-red-500, dark:md:text-lg), arbitrary values (bg-[#fff]),
 * CSS variable references (bg-[--primary]), important modifier (!font-bold),
 * and arbitrary variant selectors (data-[state=checked]:bg-blue-500,
 * aria-[selected=true]:text-white, group-[.is-active]:opacity-100).
 */
const TAILWIND_CLASS_RE =
  /^!?(?:(?:[\w-]+(?:\[[^\]]*\])?):)*-?[a-zA-Z][\w-]*(?:\[[^\]]*\])?(?:\/[\w.[\]-]+)?$/

/**
 * Parse raw quasi strings from a tagged template literal AST node.
 *
 * Accepts the array of static string segments (TemplateElement.value.cooked),
 * normalizes whitespace, deduplicates class tokens, and warns on
 * unrecognized tokens.
 */
export function parseTemplate(quasis: string[], sourceStart = 0, sourceEnd = 0): ParsedTemplate {
  const staticSegments = quasis
  const seen = new Set<string>()
  const normalizedClasses: string[] = []

  for (const segment of quasis) {
    const tokens = segment.split(/\s+/).filter(Boolean)
    for (const token of tokens) {
      if (!TAILWIND_CLASS_RE.test(token)) {
        console.warn(
          `[tw-styled] Warning: unrecognized token "${token}" — not a known Tailwind class pattern`,
        )
      }
      if (!seen.has(token)) {
        seen.add(token)
        normalizedClasses.push(token)
      }
    }
  }

  return {
    staticSegments,
    interpolationCount: Math.max(0, quasis.length - 1),
    normalizedClasses,
    sourceSpan: { start: sourceStart, end: sourceEnd },
  }
}
