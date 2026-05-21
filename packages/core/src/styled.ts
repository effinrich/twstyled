import * as React from 'react'
import { filterTransientProps } from './filter-transient-props'
import { resolveClasses } from './resolve-classes'
import type { HtmlTagName, Interpolation, PropsOf, StyledComponent } from './types'

type TagFunction<T extends HtmlTagName | React.ComponentType<any>> = <
  V extends Record<string, unknown> = {},
>(
  strings: TemplateStringsArray,
  ...interpolations: Array<Interpolation<PropsOf<T> & V>>
) => StyledComponent<T, V>

type StyledFactory = {
  [K in HtmlTagName]: TagFunction<K>
} & {
  <C extends React.ComponentType<any>>(component: C): TagFunction<C>
}

function createTagFunction<T extends HtmlTagName | React.ComponentType<any>>(
  tag: T,
): TagFunction<T> {
  return (strings: TemplateStringsArray, ...interpolations: Array<Interpolation<any>>) => {
    // At runtime, derive static classes from the template (joined, whitespace-normalized)
    const staticClasses = strings.raw.join(' ').replace(/\s+/g, ' ').trim()
    // Scope class is empty at runtime; the Vite plugin injects the real value at build time
    const scopeClass = ''
    const tagName = typeof tag === 'string' ? tag : ((tag as any).displayName ?? 'Component')
    const displayName = `Styled(${tagName})`

    const Component = React.forwardRef<any, any>((props, ref) => {
      const { className: consumerClassName, ...rest } = props
      const resolved = resolveClasses(
        staticClasses,
        scopeClass,
        interpolations,
        props,
        consumerClassName,
        displayName,
      )
      const forwarded = filterTransientProps(rest)

      if (typeof tag === 'string') {
        return React.createElement(tag, { ...forwarded, className: resolved, ref })
      }
      return React.createElement(tag as any, { ...forwarded, className: resolved, ref })
    }) as unknown as StyledComponent<T, any>

    Component.displayName = displayName
    return Component
  }
}

/**
 * Main tw-styled factory.
 *
 * Supports:
 * - styled.div`...`
 * - styled(Component)`...` where Component accepts className
 */
export const styled = new Proxy(
  function <C extends React.ComponentType<any>>(component: C) {
    return createTagFunction(component)
  } as unknown as StyledFactory,
  {
    get(_target, prop: string) {
      return createTagFunction(prop as HtmlTagName)
    },
  },
)
