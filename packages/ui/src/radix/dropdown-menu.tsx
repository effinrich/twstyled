import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { styled } from 'tw-styled'

const StyledContent = styled(DropdownMenuPrimitive.Content)`
  z-50 min-w-32 overflow-hidden rounded-[--radius]
  border border-[--border] bg-[--popover] p-1
  text-[--popover-foreground] shadow-md
`

const StyledItem = styled(DropdownMenuPrimitive.Item)`
  relative flex cursor-default select-none items-center gap-2
  rounded-sm px-2 py-1.5 text-sm outline-none transition-colors
  focus:bg-[--accent] focus:text-[--accent-foreground]
  data-[disabled]:pointer-events-none data-[disabled]:opacity-50
`

const StyledLabel = styled(DropdownMenuPrimitive.Label)`
  px-2 py-1.5 text-sm font-semibold text-[--foreground]
`

const StyledSeparator = styled(DropdownMenuPrimitive.Separator)`
  -mx-1 my-1 h-px bg-[--muted]
`

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
export const DropdownMenuGroup = DropdownMenuPrimitive.Group
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal
export const DropdownMenuSub = DropdownMenuPrimitive.Sub
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup
export const DropdownMenuLabel = StyledLabel
export const DropdownMenuSeparator = StyledSeparator

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <StyledContent sideOffset={sideOffset} ref={ref} {...props} />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = 'DropdownMenuContent'

export const DropdownMenuItem = StyledItem
