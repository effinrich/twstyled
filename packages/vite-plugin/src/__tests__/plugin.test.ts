import { describe, it, expect } from 'vitest'
import { walkAST } from '../ast-walker'
import { generateCSS, accumulateFileCSS } from '../css-generator'
import { twStyled } from '../index'

const PROJECT_ROOT = '/project'

describe('Vite plugin transform — unit tests', () => {
  describe('Simple static classes', () => {
    it('walkAST extracts a styled.div with static classes', () => {
      const code = `
        import { styled } from 'tw-styled'
        const Box = styled.div\`flex p-4\`
      `
      const components = walkAST(code, '/project/src/Box.tsx', PROJECT_ROOT)

      expect(components).toHaveLength(1)
      expect(components[0].staticClasses).toEqual(['flex', 'p-4'])
      expect(components[0].scopeClass).toMatch(/^tw-[a-z0-9]{7}$/)
      expect(components[0].ordinal).toBe(0)
    })

    it('generateCSS produces CSS with the scope class for static classes', () => {
      const code = `
        import { styled } from 'tw-styled'
        const Box = styled.div\`flex p-4\`
      `
      const components = walkAST(code, '/project/src/Box.tsx', PROJECT_ROOT)
      const css = generateCSS(components)

      expect(css).toContain('@layer components')
      expect(css).toContain(`.${components[0].scopeClass}`)
      expect(css).toContain('flex')
      expect(css).toContain('p-4')
    })
  })

  describe('Dynamic interpolations', () => {
    it('correctly counts interpolations in a template with dynamic expressions', () => {
      const code = `
        import { styled } from 'tw-styled'
        const Btn = styled.button\`
          px-4 py-2
          \${p => p.$variant === 'primary' ? 'bg-blue-500' : ''}
          rounded
        \`
      `
      const components = walkAST(code, '/project/src/Btn.tsx', PROJECT_ROOT)

      expect(components).toHaveLength(1)
      // Static classes from the quasis (segments around the interpolation)
      expect(components[0].staticClasses).toContain('px-4')
      expect(components[0].staticClasses).toContain('py-2')
      expect(components[0].staticClasses).toContain('rounded')
      // The dynamic expression itself is not in staticClasses
      expect(components[0].staticClasses).not.toContain('bg-blue-500')
    })

    it('counts multiple interpolations correctly', () => {
      const code = `
        import { styled } from 'tw-styled'
        const Btn = styled.button\`
          px-4
          \${p => p.$variant === 'primary' ? 'bg-blue-500' : ''}
          \${p => p.$size === 'lg' ? 'text-lg' : 'text-sm'}
          rounded
        \`
      `
      const components = walkAST(code, '/project/src/Btn.tsx', PROJECT_ROOT)

      expect(components).toHaveLength(1)
      // With 2 interpolations, there are 3 quasis (segments)
      // Static classes from segments around interpolations
      expect(components[0].staticClasses).toContain('px-4')
      expect(components[0].staticClasses).toContain('rounded')
    })
  })

  describe('Multiple components per file', () => {
    it('extracts all components with unique scope classes', () => {
      const code = `
        import { styled } from 'tw-styled'
        const Header = styled.header\`flex items-center h-16\`
        const Main = styled.main\`flex-1 p-8\`
        const Footer = styled.footer\`border-t py-4\`
      `
      const components = walkAST(code, '/project/src/Layout.tsx', PROJECT_ROOT)

      expect(components).toHaveLength(3)

      // Each has a unique scope class
      const scopeClasses = components.map((c) => c.scopeClass)
      const uniqueClasses = new Set(scopeClasses)
      expect(uniqueClasses.size).toBe(3)

      // Each scope class matches the expected pattern
      for (const cls of scopeClasses) {
        expect(cls).toMatch(/^tw-[a-z0-9]{7}$/)
      }

      // Ordinals are sequential
      expect(components[0].ordinal).toBe(0)
      expect(components[1].ordinal).toBe(1)
      expect(components[2].ordinal).toBe(2)

      // Correct classes extracted per component
      expect(components[0].staticClasses).toEqual(['flex', 'items-center', 'h-16'])
      expect(components[1].staticClasses).toEqual(['flex-1', 'p-8'])
      expect(components[2].staticClasses).toEqual(['border-t', 'py-4'])
    })
  })

  describe('Virtual CSS module (cssMap accumulation)', () => {
    it('concatenated cssMap contains expected scope class rules after processing', () => {
      const code = `
        import { styled } from 'tw-styled'
        const Card = styled.div\`rounded-lg shadow-md p-6\`
        const Title = styled.h2\`text-xl font-bold\`
      `
      const fileId = '/project/src/Card.tsx'
      const components = walkAST(code, fileId, PROJECT_ROOT)
      const cssMap = new Map<string, string>()

      accumulateFileCSS(cssMap, fileId, components)

      // The cssMap should have an entry for this file
      expect(cssMap.has(fileId)).toBe(true)

      const css = cssMap.get(fileId)!

      // Both scope classes should be present
      expect(css).toContain(`.${components[0].scopeClass}`)
      expect(css).toContain(`.${components[1].scopeClass}`)

      // All static classes should appear
      expect(css).toContain('rounded-lg')
      expect(css).toContain('shadow-md')
      expect(css).toContain('p-6')
      expect(css).toContain('text-xl')
      expect(css).toContain('font-bold')
    })

    it('concatenating multiple file entries produces combined CSS', () => {
      const codeA = `
        import { styled } from 'tw-styled'
        const A = styled.div\`flex gap-4\`
      `
      const codeB = `
        import { styled } from 'tw-styled'
        const B = styled.span\`inline-block text-sm\`
      `
      const cssMap = new Map<string, string>()

      const componentsA = walkAST(codeA, '/project/src/A.tsx', PROJECT_ROOT)
      const componentsB = walkAST(codeB, '/project/src/B.tsx', PROJECT_ROOT)

      accumulateFileCSS(cssMap, '/project/src/A.tsx', componentsA)
      accumulateFileCSS(cssMap, '/project/src/B.tsx', componentsB)

      // Simulate virtual module load: concatenate all values
      const virtualCSS = Array.from(cssMap.values()).join('\n')

      expect(virtualCSS).toContain('flex')
      expect(virtualCSS).toContain('gap-4')
      expect(virtualCSS).toContain('inline-block')
      expect(virtualCSS).toContain('text-sm')
      expect(virtualCSS).toContain(`.${componentsA[0].scopeClass}`)
      expect(virtualCSS).toContain(`.${componentsB[0].scopeClass}`)
    })
  })

  describe('CSS custom property passthrough', () => {
    it('bg-[--primary] appears in CSS output unmodified', () => {
      const code = `
        import { styled } from 'tw-styled'
        const Themed = styled.div\`bg-[--primary] text-[--foreground] rounded-[--radius]\`
      `
      const components = walkAST(code, '/project/src/Themed.tsx', PROJECT_ROOT)

      expect(components).toHaveLength(1)
      expect(components[0].staticClasses).toContain('bg-[--primary]')
      expect(components[0].staticClasses).toContain('text-[--foreground]')
      expect(components[0].staticClasses).toContain('rounded-[--radius]')

      const css = generateCSS(components)

      expect(css).toContain('bg-[--primary]')
      expect(css).toContain('text-[--foreground]')
      expect(css).toContain('rounded-[--radius]')
    })

    it('CSS custom properties are preserved through the full pipeline', () => {
      const code = `
        import { styled } from 'tw-styled'
        const Button = styled.button\`bg-[--primary] hover:bg-[--primary-hover]\`
      `
      const fileId = '/project/src/Button.tsx'
      const components = walkAST(code, fileId, PROJECT_ROOT)
      const cssMap = new Map<string, string>()

      accumulateFileCSS(cssMap, fileId, components)

      const css = cssMap.get(fileId)!
      expect(css).toContain('bg-[--primary]')
      expect(css).toContain('hover:bg-[--primary-hover]')
    })
  })
})

describe('Vite plugin hooks — integration tests', () => {
  function createPlugin() {
    return twStyled({ projectRoot: '/test' })
  }

  function getTransformHook(plugin: ReturnType<typeof twStyled>) {
    return (plugin as any).transform as (
      this: any,
      code: string,
      id: string,
    ) => ReturnType<typeof Function> | null | undefined
  }

  function getLoadHook(plugin: ReturnType<typeof twStyled>) {
    return (plugin as any).load as (this: any, id: string) => string | undefined
  }

  function getResolveIdHook(plugin: ReturnType<typeof twStyled>) {
    return (plugin as any).resolveId as (this: any, id: string) => string | undefined
  }

  describe('Simple static classes via plugin hooks', () => {
    it('transform processes a file with styled import and load returns CSS with scope class and static classes', () => {
      const plugin = createPlugin()
      const transformHook = getTransformHook(plugin)
      const loadHook = getLoadHook(plugin)
      const resolveIdHook = getResolveIdHook(plugin)

      const code = `import { styled } from 'tw-styled'\nconst Box = styled.div\`flex p-4\``
      const fileId = '/test/src/Box.tsx'

      // Transform the file
      transformHook.call({}, code, fileId)

      // Resolve the virtual module ID
      const resolvedId = resolveIdHook.call({}, 'virtual:tw-styled.css')
      expect(resolvedId).toBe('\0virtual:tw-styled.css')

      // Load the virtual CSS module
      const css = loadHook.call({}, '\0virtual:tw-styled.css')

      expect(css).toBeDefined()
      expect(css).toContain('@layer components')
      expect(css).toMatch(/\.tw-[a-z0-9]{7}/)
      expect(css).toContain('flex')
      expect(css).toContain('p-4')
    })
  })

  describe('Dynamic interpolations via plugin hooks', () => {
    it('CSS output contains only static classes, not dynamic interpolation content', () => {
      const plugin = createPlugin()
      const transformHook = getTransformHook(plugin)
      const loadHook = getLoadHook(plugin)

      const code = `import { styled } from 'tw-styled'
const Btn = styled.button\`
  px-4 py-2
  \${p => p.$variant === 'primary' ? 'bg-blue-500' : 'bg-gray-200'}
  rounded
\``
      const fileId = '/test/src/Btn.tsx'

      transformHook.call({}, code, fileId)

      const css = loadHook.call({}, '\0virtual:tw-styled.css')

      // Static classes are present
      expect(css).toContain('px-4')
      expect(css).toContain('py-2')
      expect(css).toContain('rounded')

      // Dynamic classes are NOT in the CSS (they're runtime-only)
      expect(css).not.toContain('bg-blue-500')
      expect(css).not.toContain('bg-gray-200')
    })
  })

  describe('Multiple components per file via plugin hooks', () => {
    it('each component gets a unique scope class in the CSS output', () => {
      const plugin = createPlugin()
      const transformHook = getTransformHook(plugin)
      const loadHook = getLoadHook(plugin)

      const code = `import { styled } from 'tw-styled'
const Header = styled.header\`flex items-center h-16\`
const Main = styled.main\`flex-1 p-8\`
const Footer = styled.footer\`border-t py-4\``
      const fileId = '/test/src/Layout.tsx'

      transformHook.call({}, code, fileId)

      const css = loadHook.call({}, '\0virtual:tw-styled.css')!

      // Find all scope classes in the CSS
      const scopeClassMatches = css.match(/\.tw-[a-z0-9]{7}/g)
      expect(scopeClassMatches).not.toBeNull()

      const uniqueScopeClasses = new Set(scopeClassMatches)
      expect(uniqueScopeClasses.size).toBe(3)

      // All static classes from each component are present
      expect(css).toContain('flex')
      expect(css).toContain('items-center')
      expect(css).toContain('h-16')
      expect(css).toContain('flex-1')
      expect(css).toContain('p-8')
      expect(css).toContain('border-t')
      expect(css).toContain('py-4')
    })
  })

  describe('File without tw-styled import', () => {
    it('transform returns undefined/null for files without tw-styled import', () => {
      const plugin = createPlugin()
      const transformHook = getTransformHook(plugin)

      const code = `import React from 'react'\nconst App = () => <div className="flex">Hello</div>`
      const fileId = '/test/src/App.tsx'

      const result = transformHook.call({}, code, fileId)

      expect(result).toBeUndefined()
    })

    it('transform returns undefined for files that mention tw-styled but have no styled calls', () => {
      const plugin = createPlugin()
      const transformHook = getTransformHook(plugin)

      // File contains the string 'tw-styled' in a comment but no actual styled usage
      const code = `// This file will use tw-styled later\nimport React from 'react'\nconst App = () => <div>Hello</div>`
      const fileId = '/test/src/App.tsx'

      const result = transformHook.call({}, code, fileId)

      // The transform hook returns null when no components are found
      expect(result == null).toBe(true)
    })
  })

  describe('Virtual CSS module via load hook', () => {
    it('load concatenates CSS from multiple transformed files', () => {
      const plugin = createPlugin()
      const transformHook = getTransformHook(plugin)
      const loadHook = getLoadHook(plugin)

      const codeA = `import { styled } from 'tw-styled'\nconst A = styled.div\`flex gap-4\``
      const codeB = `import { styled } from 'tw-styled'\nconst B = styled.span\`inline-block text-sm\``

      transformHook.call({}, codeA, '/test/src/A.tsx')
      transformHook.call({}, codeB, '/test/src/B.tsx')

      const css = loadHook.call({}, '\0virtual:tw-styled.css')!

      // CSS from both files is present
      expect(css).toContain('flex')
      expect(css).toContain('gap-4')
      expect(css).toContain('inline-block')
      expect(css).toContain('text-sm')

      // Both files contribute scope classes
      const scopeClassMatches = css.match(/\.tw-[a-z0-9]{7}/g)
      expect(scopeClassMatches).not.toBeNull()
      const uniqueScopeClasses = new Set(scopeClassMatches)
      expect(uniqueScopeClasses.size).toBe(2)
    })

    it('load returns placeholder comment when no files have been transformed', () => {
      const plugin = createPlugin()
      const loadHook = getLoadHook(plugin)

      const css = loadHook.call({}, '\0virtual:tw-styled.css')

      expect(css).toContain('no styles extracted yet')
    })

    it('load returns undefined for non-virtual module IDs', () => {
      const plugin = createPlugin()
      const loadHook = getLoadHook(plugin)

      const result = loadHook.call({}, '/test/src/some-file.ts')

      expect(result).toBeUndefined()
    })
  })
})
