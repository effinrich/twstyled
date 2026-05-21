import type { OmitTransient } from './types'

export function filterTransientProps<P extends Record<string, unknown>>(
  props: P,
): OmitTransient<P> {
  const result: Record<string, unknown> = {}
  for (const key in props) {
    if (!key.startsWith('$')) result[key] = props[key]
  }
  return result as OmitTransient<P>
}
