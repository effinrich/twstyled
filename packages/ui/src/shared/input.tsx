import { styled } from 'tw-styled'

export const Input = styled.input`
  flex h-9 w-full rounded-[--radius] border border-[--border]
  bg-transparent px-3 py-1 text-sm shadow-sm transition-colors
  placeholder:text-[--muted-foreground]
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ring]
  disabled:cursor-not-allowed disabled:opacity-50
`
