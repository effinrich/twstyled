import { parse } from '@babel/parser'
import _traverse from '@babel/traverse'
import _generate from '@babel/generator'
import * as t from '@babel/types'
import type { TransformResult } from './types'

// Handle CJS/ESM default export interop
const traverse = (
  typeof _traverse === 'function' ? _traverse : (_traverse as any).default
) as typeof _traverse
const generate = (
  typeof _generate === 'function' ? _generate : (_generate as any).default
) as typeof _generate

/** Utility helper names that we recognise as class-merging calls */
const MERGE_HELPERS = new Set(['cn', 'clsx', 'twMerge'])

/**
 * Transform a source file from className-based patterns to tw-styled `styled` syntax.
 *
 * @param source   - The source code string
 * @param filePath - File path (used in the result and for display)
 * @param dryRun   - When true, populate `diff` with a before/after comparison
 *                   instead of the transformed source
 */
export async function transform(
  source: string,
  filePath = '<input>',
  options?: { dryRun?: boolean },
): Promise<TransformResult> {
  const dryRun = options?.dryRun ?? false
  // ── 1. Parse ──────────────────────────────────────────────────────────
  let ast: ReturnType<typeof parse>
  try {
    ast = parse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    })
  } catch (err) {
    return {
      filePath,
      status: 'error',
      componentsTransformed: 0,
      error: (err as Error).message,
    }
  }

  // ── 2. Check idempotence — skip if already using styled from tw-styled ─
  let alreadyUsesStyled = false
  traverse(ast, {
    ImportDeclaration(path) {
      if (
        path.node.source.value === 'tw-styled' &&
        path.node.specifiers.some(
          (s) =>
            t.isImportSpecifier(s) && t.isIdentifier(s.imported) && s.imported.name === 'styled',
        )
      ) {
        alreadyUsesStyled = true
        path.stop()
      }
    },
  })
  if (alreadyUsesStyled) {
    return { filePath, status: 'skipped', componentsTransformed: 0 }
  }

  // ── 3. Collect JSX elements that need transformation ──────────────────
  interface TransformTarget {
    /** The JSX opening element path */
    jsxPath: any // NodePath<t.JSXOpeningElement>
    /** The HTML tag name (e.g. "button", "div") */
    tagName: string
    /** The extracted class string */
    classes: string
    /** Whether the className came from a merge helper call */
    fromMergeHelper: boolean
    /** Name of the merge helper (cn, clsx, twMerge) if applicable */
    helperName?: string
  }

  const targets: TransformTarget[] = []

  traverse(ast, {
    JSXOpeningElement(path) {
      // Only handle intrinsic HTML elements (lowercase tag names)
      const nameNode = path.node.name
      if (!t.isJSXIdentifier(nameNode)) return
      const tagName = nameNode.name
      if (tagName[0] !== tagName[0].toLowerCase()) return // skip PascalCase components

      // Find className attribute
      const classNameAttr = path.node.attributes.find(
        (attr): attr is t.JSXAttribute =>
          t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === 'className',
      )
      if (!classNameAttr || !classNameAttr.value) return

      // Case A: className="literal string"
      if (t.isStringLiteral(classNameAttr.value)) {
        const classes = classNameAttr.value.value.trim()
        if (!classes) return
        targets.push({ jsxPath: path, tagName, classes, fromMergeHelper: false })
        return
      }

      // Case B: className={expr} — look for JSXExpressionContainer
      if (t.isJSXExpressionContainer(classNameAttr.value)) {
        const expr = classNameAttr.value.expression
        if (t.isJSXEmptyExpression(expr)) return

        // Direct string literal inside braces: className={"flex p-4"}
        if (t.isStringLiteral(expr)) {
          const classes = expr.value.trim()
          if (!classes) return
          targets.push({ jsxPath: path, tagName, classes, fromMergeHelper: false })
          return
        }

        // Template literal: className={`flex p-4`}
        if (t.isTemplateLiteral(expr) && expr.expressions.length === 0) {
          const classes = expr.quasis
            .map((q) => q.value.cooked ?? q.value.raw)
            .join('')
            .trim()
          if (!classes) return
          targets.push({ jsxPath: path, tagName, classes, fromMergeHelper: false })
          return
        }

        // CallExpression: className={cn("flex", "p-4")} or clsx(...) or twMerge(...)
        if (
          t.isCallExpression(expr) &&
          t.isIdentifier(expr.callee) &&
          MERGE_HELPERS.has(expr.callee.name)
        ) {
          const helperName = expr.callee.name
          const classes = extractClassesFromCallArgs(expr.arguments)
          if (!classes) return
          targets.push({
            jsxPath: path,
            tagName,
            classes,
            fromMergeHelper: true,
            helperName,
          })
        }
      }
    },
  })

  // Nothing to transform
  if (targets.length === 0) {
    return { filePath, status: 'skipped', componentsTransformed: 0 }
  }

  // ── 4. Group targets by enclosing component ───────────────────────────
  // We track which styled component names we've generated to avoid collisions
  const usedNames = new Set<string>()
  const styledDefs: Array<{ name: string; tagName: string; classes: string }> = []
  const helperNamesUsed = new Set<string>()

  for (const target of targets) {
    if (target.helperName) {
      helperNamesUsed.add(target.helperName)
    }
  }

  // Process each target: generate styled component and rewrite JSX
  for (const target of targets) {
    const styledName = generateStyledName(target.tagName, usedNames)
    usedNames.add(styledName)
    styledDefs.push({ name: styledName, tagName: target.tagName, classes: target.classes })

    // Remove the className attribute from the JSX element
    const attrIndex = target.jsxPath.node.attributes.findIndex(
      (attr: t.Node) =>
        t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === 'className',
    )
    if (attrIndex !== -1) {
      target.jsxPath.node.attributes.splice(attrIndex, 1)
    }

    // Replace the element name with the styled component name
    target.jsxPath.node.name = t.jsxIdentifier(styledName)

    // Also replace the closing element if it exists
    const parent = target.jsxPath.parent
    if (t.isJSXElement(parent) && parent.closingElement) {
      parent.closingElement.name = t.jsxIdentifier(styledName)
    }
  }

  // ── 5. Insert styled component definitions ────────────────────────────
  // Find the first component/function declaration and insert styled defs before it
  const styledStatements = styledDefs.map(({ name, tagName, classes }) => {
    // const StyledButton = styled.button`flex p-4`
    const tagExpression = t.memberExpression(t.identifier('styled'), t.identifier(tagName))
    const quasi = t.templateLiteral(
      [t.templateElement({ raw: classes, cooked: classes }, true)],
      [],
    )
    const tagged = t.taggedTemplateExpression(tagExpression, quasi)
    return t.variableDeclaration('const', [t.variableDeclarator(t.identifier(name), tagged)])
  })

  // Insert styled definitions before the first function/component that uses them,
  // or at the top of the program body (after imports)
  const body = ast.program.body
  let insertIndex = 0
  for (let i = 0; i < body.length; i++) {
    if (
      t.isImportDeclaration(body[i]) ||
      (t.isExportNamedDeclaration(body[i]) && (body[i] as t.ExportNamedDeclaration).source)
    ) {
      insertIndex = i + 1
    } else {
      break
    }
  }
  // Find the last import index more robustly
  for (let i = 0; i < body.length; i++) {
    if (t.isImportDeclaration(body[i])) {
      insertIndex = i + 1
    }
  }

  body.splice(insertIndex, 0, ...styledStatements)

  // ── 6. Add `import { styled } from 'tw-styled'` if not present ────────
  const hasStyledImport = body.some(
    (node) =>
      t.isImportDeclaration(node) &&
      node.source.value === 'tw-styled' &&
      node.specifiers.some(
        (s) => t.isImportSpecifier(s) && t.isIdentifier(s.imported) && s.imported.name === 'styled',
      ),
  )
  if (!hasStyledImport) {
    const importDecl = t.importDeclaration(
      [t.importSpecifier(t.identifier('styled'), t.identifier('styled'))],
      t.stringLiteral('tw-styled'),
    )
    // Insert at the top of the file (after any existing imports, or at position 0)
    let importInsertIndex = 0
    for (let i = 0; i < body.length; i++) {
      if (t.isImportDeclaration(body[i])) {
        importInsertIndex = i + 1
      }
    }
    body.splice(importInsertIndex, 0, importDecl)
  }

  // ── 7. Remove cn/clsx/twMerge imports if no longer referenced ─────────
  removeUnusedHelperImports(ast, helperNamesUsed)

  // ── 8. Generate output code ───────────────────────────────────────────
  const output = generate(ast, { retainLines: false }, source)
  const transformedCode = output.code

  // ── 9. Return result ──────────────────────────────────────────────────
  if (dryRun) {
    const diff = createSimpleDiff(source, transformedCode, filePath)
    return {
      filePath,
      status: 'transformed',
      componentsTransformed: styledDefs.length,
      diff,
    }
  }

  return {
    filePath,
    status: 'transformed',
    componentsTransformed: styledDefs.length,
    diff: transformedCode,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Extract static class strings from the arguments of a cn/clsx/twMerge call.
 * Only extracts string literal arguments; skips conditional/dynamic args.
 */
function extractClassesFromCallArgs(args: Array<t.Node>): string {
  const parts: string[] = []
  for (const arg of args) {
    if (t.isStringLiteral(arg)) {
      parts.push(arg.value)
    } else if (t.isTemplateLiteral(arg) && arg.expressions.length === 0) {
      parts.push(arg.quasis.map((q) => q.value.cooked ?? q.value.raw).join(''))
    }
    // Skip non-string arguments (conditionals, variables, etc.)
  }
  return parts.join(' ').trim()
}

/**
 * Generate a PascalCase styled component name from an HTML tag name.
 * e.g. "button" → "StyledButton", "div" → "StyledDiv"
 * Handles collisions by appending a numeric suffix.
 */
function generateStyledName(tagName: string, usedNames: Set<string>): string {
  const base = 'Styled' + tagName.charAt(0).toUpperCase() + tagName.slice(1)
  if (!usedNames.has(base)) return base
  let i = 2
  while (usedNames.has(`${base}${i}`)) i++
  return `${base}${i}`
}

/**
 * Remove import declarations for helper functions (cn, clsx, twMerge)
 * if they are no longer referenced anywhere in the AST.
 */
function removeUnusedHelperImports(
  ast: ReturnType<typeof parse>,
  helperNamesUsed: Set<string>,
): void {
  if (helperNamesUsed.size === 0) return

  // Check if any helper is still referenced in the AST (outside of import declarations)
  const stillReferenced = new Set<string>()

  traverse(ast, {
    Identifier(path) {
      if (!MERGE_HELPERS.has(path.node.name)) return
      // Skip if this is the import specifier itself
      if (path.parent && t.isImportSpecifier(path.parent)) return
      stillReferenced.add(path.node.name)
    },
  })

  // Remove import specifiers for helpers that are no longer referenced
  traverse(ast, {
    ImportDeclaration(path) {
      const specifiers = path.node.specifiers
      const remaining = specifiers.filter((s) => {
        if (!t.isImportSpecifier(s)) return true
        const importedName = t.isIdentifier(s.imported) ? s.imported.name : ''
        if (MERGE_HELPERS.has(importedName) && !stillReferenced.has(importedName)) {
          return false // remove this specifier
        }
        return true
      })

      if (remaining.length === 0 && specifiers.length > 0) {
        // All specifiers removed — remove the entire import declaration
        path.remove()
      } else if (remaining.length < specifiers.length) {
        path.node.specifiers = remaining
      }
    },
  })
}

/**
 * Create a simple before/after diff string for dry-run mode.
 */
function createSimpleDiff(before: string, after: string, filePath: string): string {
  const lines: string[] = [`--- ${filePath} (original)`, `+++ ${filePath} (transformed)`]
  const beforeLines = before.split('\n')
  const afterLines = after.split('\n')

  const maxLen = Math.max(beforeLines.length, afterLines.length)
  for (let i = 0; i < maxLen; i++) {
    const bLine = beforeLines[i]
    const aLine = afterLines[i]
    if (bLine === aLine) {
      lines.push(` ${bLine ?? ''}`)
    } else {
      if (bLine !== undefined) lines.push(`-${bLine}`)
      if (aLine !== undefined) lines.push(`+${aLine}`)
    }
  }

  return lines.join('\n')
}
