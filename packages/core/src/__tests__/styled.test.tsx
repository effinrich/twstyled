import { describe, it, expect } from 'vitest'
import * as React from 'react'
import { render } from '@testing-library/react'
import { styled } from '../styled'

describe('styled factory', () => {
  it('renders a styled.div with static classes', () => {
    const Box = styled.div`flex items-center p-4`
    const { container } = render(<Box />)
    const el = container.firstElementChild!
    expect(el.tagName).toBe('DIV')
    // resolveClasses merges via twMerge; static classes should be present
    expect(el.className).toContain('flex')
    expect(el.className).toContain('items-center')
    expect(el.className).toContain('p-4')
  })

  it('forwards non-transient props to the DOM element', () => {
    const Box = styled.div`p-2`
    const { container } = render(<Box id="test-id" data-testid="box" />)
    const el = container.firstElementChild!
    expect(el.getAttribute('id')).toBe('test-id')
    expect(el.getAttribute('data-testid')).toBe('box')
  })

  it('strips $-prefixed props from the DOM element', () => {
    const Button = styled.button`px-4`
    // Use type assertion to pass transient props without TS complaint
    const props = { $variant: 'primary', $size: 'lg', id: 'btn' } as any
    const { container } = render(<Button {...props} />)
    const el = container.firstElementChild!
    expect(el.getAttribute('id')).toBe('btn')
    const attrNames = Array.from(el.attributes).map((a) => a.name)
    expect(attrNames.every((name) => !name.startsWith('$'))).toBe(true)
  })

  it('merges consumer className with component classes', () => {
    const Box = styled.div`p-4 bg-red-500`
    const { container } = render(<Box className="bg-blue-500" />)
    const el = container.firstElementChild!
    // Consumer className should win over component's conflicting class
    expect(el.className).toContain('bg-blue-500')
    // p-4 is non-conflicting, should remain
    expect(el.className).toContain('p-4')
  })

  it('styled(Component) wrapping form works', () => {
    const Inner = React.forwardRef<HTMLDivElement, { className?: string; title?: string }>(
      (props, ref) => <div ref={ref} className={props.className} title={props.title} />,
    )
    Inner.displayName = 'Inner'

    const Wrapped = styled(Inner)`mt-2 text-sm`
    const { container } = render(<Wrapped title="hello" />)
    const el = container.firstElementChild!
    expect(el.className).toContain('mt-2')
    expect(el.className).toContain('text-sm')
    expect(el.getAttribute('title')).toBe('hello')
  })

  it('sets displayName correctly for HTML tags', () => {
    const Box = styled.div`p-2`
    expect(Box.displayName).toBe('Styled(div)')
  })

  it('sets displayName correctly for wrapped components', () => {
    const Inner = React.forwardRef<HTMLSpanElement, { className?: string }>((props, ref) => (
      <span ref={ref} className={props.className} />
    ))
    Inner.displayName = 'MyInner'

    const Wrapped = styled(Inner)`text-lg`
    expect(Wrapped.displayName).toBe('Styled(MyInner)')
  })

  it('forwards ref to the underlying element', () => {
    const Box = styled.div`p-2`
    const ref = React.createRef<HTMLDivElement>()
    render(<Box ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
})
