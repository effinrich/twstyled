import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { styled } from 'tw-styled'

const StyledContent = styled(TooltipPrimitive.Content)`
  z-50 overflow-hidden rounded-[--radius] border border-[--border]
  bg-[--popover] px-3 py-1.5 text-sm text-[--popover-foreground] shadow-md
`

export const TooltipProvider = TooltipPrimitive.Provider
export const Tooltip = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <StyledContent ref={ref} sideOffset={sideOffset} {...props} />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = 'TooltipContent'
