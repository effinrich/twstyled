# Core API

## `styled`

`styled` is the main factory. It supports:

- intrinsic elements (`styled.button`, `styled.div`, ...)
- React components (`styled(MyComponent)`) that accept `className`

### Basic button example

```tsx
import { styled } from 'tw-styled'

export const Button = styled.button`
  inline-flex items-center justify-center rounded-md
  px-4 py-2 text-sm font-medium
  bg-blue-600 text-white hover:bg-blue-700
`
```

### Dynamic classes with transient props

```tsx
import { styled, type Props } from 'tw-styled'

type Tone = 'success' | 'danger' | 'neutral'
type PillProps = Props<{ $tone: Tone }>

const toneClasses: Record<Tone, string> = {
  success: 'bg-green-100 text-green-800',
  danger: 'bg-red-100 text-red-800',
  neutral: 'bg-gray-100 text-gray-800',
}

export const Pill = styled.span<PillProps>`
  inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
  ${(p: PillProps) => toneClasses[p.$tone]}
`
```

`$tone` is used for styling and filtered before props are forwarded to the DOM.

### Consumer `className` precedence

`tw-styled` uses `tailwind-merge` so caller classes override conflicting defaults:

```tsx
const Card = styled.div`shadow-sm rounded-lg`

// "shadow-lg" wins over "shadow-sm"
<Card className="shadow-lg" />
```

### Ref forwarding

All styled components are `React.forwardRef` components:

```tsx
const Input = styled.input`border rounded px-3 py-2`
```

```tsx
const ref = useRef<HTMLInputElement>(null)
<Input ref={ref} />
```

## Composition patterns

### Wrap another component

```tsx
type LinkButtonProps = React.ComponentProps<'a'> & { className?: string }

function LinkButton(props: LinkButtonProps) {
  return <a {...props} />
}

const StyledLinkButton = styled(LinkButton)`
  inline-flex items-center rounded-md px-4 py-2 text-sm
  bg-indigo-600 text-white hover:bg-indigo-700
`
```

### Extend from a styled component

```tsx
const BaseButton = styled.button`rounded-md px-4 py-2 text-sm`
const DangerButton = styled(BaseButton)`bg-red-600 text-white hover:bg-red-700`
```

## `as` / polymorphic props

`tw-styled` does **not** provide built-in polymorphic `as` typing for intrinsic styled elements.

If your own component already supports an `as` prop, wrap that component instead:

```tsx
type PolymorphicProps = {
  as?: 'button' | 'a'
  className?: string
  children?: React.ReactNode
}

function PolymorphicBase({ as: Tag = 'button', ...rest }: PolymorphicProps) {
  return <Tag {...rest} />
}

const PolymorphicStyled = styled(PolymorphicBase)`
  inline-flex items-center rounded-md px-3 py-2
`
```

## Types you can import

- `Props<V>`: helper alias for variant/transient prop objects
- `StyledProps<T, V>`
- `StyledComponent<T, V>`
- `Interpolation<P>`
- `TransientKeys<P>`, `OmitTransient<P>`
