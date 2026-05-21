import { twMerge } from 'tailwind-merge'
import type { Interpolation } from './types'

export function resolveClasses<P extends object>(
  staticClasses: string,
  scopeClass: string,
  interpolations: Interpolation<P>[],
  props: P,
  consumerClassName?: string,
  displayName = 'StyledComponent',
): string {
  const parts: string[] = [scopeClass, staticClasses]

  for (let i = 0; i < interpolations.length; i++) {
    try {
      const result = interpolations[i](props)
      if (result) parts.push(result)
    } catch (err) {
      console.warn(
        `[tw-styled] Warning: interpolation ${i} in <${displayName}> threw: ${(err as Error).message}`,
      )
    }
  }

  if (consumerClassName) parts.push(consumerClassName)

  return twMerge(parts.join(' '))
}
