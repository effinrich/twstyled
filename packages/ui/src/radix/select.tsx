import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { styled } from 'tw-styled'

const StyledTrigger = styled(SelectPrimitive.Trigger)`
  flex h-9 w-full items-center justify-between whitespace-nowrap
  rounded-[--radius] border border-[--input] bg-transparent
  px-3 py-2 text-sm shadow-sm
  focus:outline-none focus:ring-1 focus:ring-[--ring]
  disabled:cursor-not-allowed disabled:opacity-50
`

const StyledContent = styled(SelectPrimitive.Content)`
  relative z-50 max-h-96 min-w-32 overflow-hidden
  rounded-[--radius] border border-[--border]
  bg-[--popover] text-[--popover-foreground] shadow-md
`

const StyledViewport = styled(SelectPrimitive.Viewport)`p-1`

const StyledItem = styled(SelectPrimitive.Item)`
  relative flex w-full cursor-default select-none items-center
  rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none
  focus:bg-[--accent] focus:text-[--accent-foreground]
  data-[disabled]:pointer-events-none data-[disabled]:opacity-50
`

const StyledLabel = styled(SelectPrimitive.Label)`
  px-2 py-1.5 text-sm font-semibold text-[--foreground]
`

const StyledSeparator = styled(SelectPrimitive.Separator)`
  -mx-1 my-1 h-px bg-[--muted]
`

export const Select = SelectPrimitive.Root
export const SelectGroup = SelectPrimitive.Group
export const SelectValue = SelectPrimitive.Value
export const SelectLabel = StyledLabel
export const SelectSeparator = StyledSeparator

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ children, ...props }, ref) => (
  <StyledTrigger ref={ref} {...props}>
    {children}
    <SelectPrimitive.Icon asChild>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 opacity-50"
      >
        <path d="m7 15 5 5 5-5" />
        <path d="m7 9 5-5 5 5" />
      </svg>
    </SelectPrimitive.Icon>
  </StyledTrigger>
))
SelectTrigger.displayName = 'SelectTrigger'

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <StyledContent position={position} ref={ref} {...props}>
      <StyledViewport>{children}</StyledViewport>
    </StyledContent>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = 'SelectContent'

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ children, ...props }, ref) => (
  <StyledItem ref={ref} {...props}>
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </StyledItem>
))
SelectItem.displayName = 'SelectItem'
