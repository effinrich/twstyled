import { describe, it, expect } from 'vitest'
import { walkAST } from '../ast-walker'

describe('walkAST', () => {
  const projectRoot = '/project'

  it('extracts styled.div tagged template', () => {
    const code = `
      import { styled } from 'tw-styled'
      const Box = styled.div\`flex items-center p-4\`
    `
    const result = walkAST(code, '/project/src/Box.tsx', projectRoot)
    expect(result).toHaveLength(1)
    expect(result[0].ordinal).toBe(0)
    expect(result[0].staticClasses).toEqual(['flex', 'items-center', 'p-4'])
    expect(result[0].scopeClass).toMatch(/^tw-[a-z0-9]{7}$/)
    expect(result[0].sourceLocation.line).toBeGreaterThanOrEqual(0)
  })

  it('extracts styled(Component) tagged template', () => {
    const code = `
      import { styled } from 'tw-styled'
      const Fancy = styled(Base)\`text-lg font-bold\`
    `
    const result = walkAST(code, '/project/src/Fancy.tsx', projectRoot)
    expect(result).toHaveLength(1)
    expect(result[0].staticClasses).toEqual(['text-lg', 'font-bold'])
  })

  it('extracts multiple components with correct ordinals', () => {
    const code = `
      import { styled } from 'tw-styled'
      const A = styled.div\`p-2\`
      const B = styled.button\`px-4 py-2\`
      const C = styled(Icon)\`w-6 h-6\`
    `
    const result = walkAST(code, '/project/src/Multi.tsx', projectRoot)
    expect(result).toHaveLength(3)
    expect(result[0].ordinal).toBe(0)
    expect(result[1].ordinal).toBe(1)
    expect(result[2].ordinal).toBe(2)
    expect(result[0].staticClasses).toEqual(['p-2'])
    expect(result[1].staticClasses).toEqual(['px-4', 'py-2'])
    expect(result[2].staticClasses).toEqual(['w-6', 'h-6'])
  })

  it('returns empty array for unparseable code', () => {
    const code = `const x = {{{`
    const result = walkAST(code, '/project/src/bad.ts', projectRoot)
    expect(result).toEqual([])
  })

  it('returns empty array for code with no styled calls', () => {
    const code = `const x = 42; export default x;`
    const result = walkAST(code, '/project/src/plain.ts', projectRoot)
    expect(result).toEqual([])
  })

  it('generates deterministic scope classes from relative path', () => {
    const code = `
      import { styled } from 'tw-styled'
      const Box = styled.div\`flex\`
    `
    const r1 = walkAST(code, '/project/src/Box.tsx', projectRoot)
    const r2 = walkAST(code, '/project/src/Box.tsx', projectRoot)
    expect(r1[0].scopeClass).toBe(r2[0].scopeClass)
  })

  it('handles template with interpolations (quasis only)', () => {
    const code = `
      import { styled } from 'tw-styled'
      const Btn = styled.button\`
        px-4 py-2
        \${p => p.active ? 'bg-blue-500' : 'bg-gray-500'}
        rounded
      \`
    `
    const result = walkAST(code, '/project/src/Btn.tsx', projectRoot)
    expect(result).toHaveLength(1)
    // Should extract static segments only (px-4, py-2, rounded)
    expect(result[0].staticClasses).toContain('px-4')
    expect(result[0].staticClasses).toContain('py-2')
    expect(result[0].staticClasses).toContain('rounded')
  })
})
