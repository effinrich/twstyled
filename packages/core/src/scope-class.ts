// FNV-1a 32-bit hash
function fnv1a32(str: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = (hash * 0x01000193) >>> 0
  }
  return hash
}

/**
 * Generate a deterministic scoped class name from a relative file path and
 * the component's ordinal index within that file.
 * Pattern: tw-[a-z0-9]{7}
 */
export function generateScopeClass(relativeFilePath: string, ordinal: number): string {
  const input = `${relativeFilePath}:${ordinal}`
  const hash = fnv1a32(input)
  return `tw-${hash.toString(16).padStart(8, '0').slice(0, 7)}`
}
