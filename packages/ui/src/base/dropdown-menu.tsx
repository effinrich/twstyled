import * as React from 'react'
import { Menu } from '@base-ui-components/react/menu'
import { styled } from 'tw-styled'

const popupClasses = [
  'z-50 min-w-32 overflow-hidden rounded-[--radius]',
  'border border-[--border] bg-[--popover] p-1',
  'text-[--popover-foreground] shadow-md',
].join(' ')

const itemClasses = [
  'relative flex cursor-default select-none items-center gap-2',
  'rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
  'focus:bg-[--accent] focus:text-[--accent-foreground]',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
].join(' ')

export const DropdownMenu = Menu.Root
export const DropdownMenuTrigger = Menu.Trigger
export const DropdownMenuGroup = Menu.Group
export const DropdownMenuPortal = Menu.Portal
export const DropdownMenuRadioGroup = Menu.RadioGroup

export const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Menu.Popup>
>(({ className = '', ...props }, ref) => (
  <Menu.Portal>
    <Menu.Positioner>
      <Menu.Popup ref={ref} className={`${popupClasses} ${className}`} {...props} />
    </Menu.Positioner>
  </Menu.Portal>
))
DropdownMenuContent.displayName = 'DropdownMenuContent'

export const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Menu.Item>
>(({ className = '', ...props }, ref) => (
  <Menu.Item ref={ref} className={`${itemClasses} ${className}`} {...props} />
))
DropdownMenuItem.displayName = 'DropdownMenuItem'

export const DropdownMenuSeparator = styled.div`-mx-1 my-1 h-px bg-[--muted]`
export const DropdownMenuLabel = styled.div`px-2 py-1.5 text-sm font-semibold text-[--foreground]`
