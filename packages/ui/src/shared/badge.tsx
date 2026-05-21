import { styled, type Props } from 'tw-styled'

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive'
type BadgeProps = Props<{ $variant?: BadgeVariant }>

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[--primary] text-[--primary-foreground]',
  secondary: 'bg-[--secondary] text-[--secondary-foreground]',
  outline: 'border border-[--border] text-[--foreground]',
  destructive: 'bg-[--destructive] text-white',
}

export const Badge = styled.span<BadgeProps>`
  inline-flex items-center rounded-full px-2.5 py-0.5
  text-xs font-semibold transition-colors
  ${(p: BadgeProps) => variantClasses[p.$variant ?? 'default']}
`
