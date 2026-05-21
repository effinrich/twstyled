import type { ExtractedComponent } from './types'

/**
 * Generate a CSS string from an array of extracted components.
 *
 * Each component produces a rule inside a `@layer components` block.
 * Utility classes are emitted directly (Tailwind v4 CSS-first strategy,
 * not @apply). The classes are placed as content so Tailwind's scanner
 * picks them up and generates the corresponding utilities.
 *
 * CSS custom property references (e.g. `bg-[--primary]`) pass through
 * unmodified.
 */
export function generateCSS(components: ExtractedComponent[]): string {
  if (components.length === 0) return ''

  const rules = components
    .map(({ scopeClass, staticClasses }) => {
      if (staticClasses.length === 0) return null

      // Emit each utility class directly inside the scope class block.
      // Tailwind v4 CSS-first: classes listed verbatim so the scanner
      // generates the corresponding utilities. No @apply needed.
      const classLines = staticClasses.map((cls) => `    /* ${cls} */`).join('\n')
      return `  .${scopeClass} {\n${classLines}\n    --tw-classes: ${staticClasses.join(' ')};\n  }`
    })
    .filter(Boolean)

  if (rules.length === 0) return ''

  return `@layer components {\n${rules.join('\n\n')}\n}\n`
}

/**
 * Accumulate CSS for a single file's extracted components into a
 * per-file CSS map.
 *
 * Returns the updated map. If the file has no extractable components
 * the entry is removed from the map so stale CSS is cleaned up on
 * re-transform.
 */
export function accumulateFileCSS(
  cssMap: Map<string, string>,
  fileId: string,
  components: ExtractedComponent[],
): Map<string, string> {
  const css = generateCSS(components)

  if (css) {
    cssMap.set(fileId, css)
  } else {
    cssMap.delete(fileId)
  }

  return cssMap
}
