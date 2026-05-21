import { styled, type Props } from 'tw-styled'

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

type ButtonProps = Props<{ $variant?: ButtonVariant; $size?: ButtonSize }>

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-[--primary] text-[--primary-foreground] hover:opacity-90',
  outline: 'border border-[--border] bg-transparent hover:bg-[--muted]',
  ghost: 'bg-transparent hover:bg-[--muted]',
  destructive: 'bg-[--destructive] text-white hover:opacity-90',
}

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-9 px-4 py-2 text-sm',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-11 px-8 text-base',
  icon: 'h-9 w-9',
}

export const Button = styled.button<ButtonProps>`
  inline-flex items-center justify-center gap-2 rounded-[--radius]
  font-medium transition-colors
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ring]
  disabled:pointer-events-none disabled:opacity-50
  ${(p: ButtonProps) => variantClasses[p.$variant ?? 'default']}
  ${(p: ButtonProps) => sizeClasses[p.$size ?? 'default']}
`
