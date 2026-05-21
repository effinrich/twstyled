import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { styled } from 'tw-styled'

const StyledRoot = styled(CheckboxPrimitive.Root)`
  peer h-4 w-4 shrink-0 rounded-sm border border-[--border]
  ring-offset-[--background] transition-colors
  focus-visible:outline-none focus-visible:ring-2
  focus-visible:ring-[--ring] focus-visible:ring-offset-2
  disabled:cursor-not-allowed disabled:opacity-50
  data-[state=checked]:bg-[--primary]
  data-[state=checked]:text-[--primary-foreground]
`

const StyledIndicator = styled(CheckboxPrimitive.Indicator)`
  flex items-center justify-center text-current
`

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>((props, ref) => (
  <StyledRoot ref={ref} {...props}>
    <StyledIndicator>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3 w-3"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </StyledIndicator>
  </StyledRoot>
))
Checkbox.displayName = 'Checkbox'
