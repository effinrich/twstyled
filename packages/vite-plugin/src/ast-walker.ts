import { parseSync } from 'oxc-parser'
import { generateScopeClass } from 'tw-styled'
import { parseTemplate } from './parse-template'
import type { ExtractedComponent } from './types'

export function walkAST(code: string, fileId: string, projectRoot: string): ExtractedComponent[] {
  const relPath = fileId.startsWith(projectRoot)
    ? fileId.slice(projectRoot.length).replace(/^\//, '')
    : fileId

  let result: ReturnType<typeof parseSync>
  try {
    result = parseSync(fileId, code, { sourceType: 'module' })
  } catch {
    return []
  }

  // Only bail on actual parse errors, not warnings/advice
  if (result.errors.some((e) => e.severity === 'Error')) return []

  const components: ExtractedComponent[] = []
  let ordinal = 0

  function walk(node: any) {
    if (!node || typeof node !== 'object') return

    if (node.type === 'TaggedTemplateExpression' && isStyledCall(node.tag)) {
      const quasis: string[] = (node.quasi.quasis ?? []).map(
        (q: any) => q.value?.cooked ?? q.value?.raw ?? '',
      )
      const parsed = parseTemplate(quasis, node.start, node.end)
      const scopeClass = generateScopeClass(relPath, ordinal)

      // Use magicString for accurate line/column from byte offset
      const loc = result.magicString.getLineColumnNumber(node.start)

      components.push({
        scopeClass,
        staticClasses: parsed.normalizedClasses,
        ordinal,
        sourceLocation: { line: loc.line, col: loc.column },
      })
      ordinal++
    }

    for (const key of Object.keys(node)) {
      const child = node[key]
      if (Array.isArray(child)) child.forEach(walk)
      else if (child && typeof child === 'object' && child.type) walk(child)
    }
  }

  walk(result.program)
  return components
}

function isStyledCall(node: any): boolean {
  if (!node) return false

  // styled.div, styled.button, etc. — OXC emits StaticMemberExpression
  if (
    node.type === 'StaticMemberExpression' &&
    node.object?.type === 'Identifier' &&
    node.object.name === 'styled'
  ) {
    return true
  }

  // styled(Component) — OXC emits CallExpression
  if (
    node.type === 'CallExpression' &&
    node.callee?.type === 'Identifier' &&
    node.callee.name === 'styled'
  ) {
    return true
  }

  return false
}
