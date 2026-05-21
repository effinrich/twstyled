import type * as React from 'react'

// All standard lowercase HTML element tag names
export type HtmlTagName = keyof JSX.IntrinsicElements

// Extract props from a tag name or component type
export type PropsOf<T> = T extends HtmlTagName
  ? JSX.IntrinsicElements[T]
  : T extends React.ComponentType<infer P>
    ? P
    : never

// Identifies $-prefixed keys in a props type
export type TransientKeys<P> = {
  [K in keyof P]: K extends `$${string}` ? K : never
}[keyof P]

// Strips $-prefixed keys from the forwarded props type
export type OmitTransient<P> = Omit<P, TransientKeys<P>>

// Interpolation function type
export type Interpolation<P> = (props: P) => string | false | null | undefined

// Friendly shorthand for variant/transient prop maps.
// Helps IDEs surface prop completion when reused across map lookups/interpolations.
// Usage: type ButtonProps = Props<{ $variant?: 'primary' | 'ghost' }>
export type Props<V extends Record<string, unknown>> = V

// Full props for a styled component = element attrs + variant props
export type StyledProps<
  T extends HtmlTagName | React.ComponentType<any>,
  V extends Record<string, unknown> = {},
> = PropsOf<T> & V & { className?: string | undefined }

// The type of a styled component
export type StyledComponent<
  T extends HtmlTagName | React.ComponentType<any>,
  V extends Record<string, unknown> = {},
> = React.ForwardRefExoticComponent<
  Omit<PropsOf<T>, keyof V> & V & { className?: string | undefined }
> & {
  displayName: string
}
