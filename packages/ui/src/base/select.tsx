import * as React from 'react'
import { Select as BaseSelect } from '@base-ui-components/react/select'
import { styled } from 'tw-styled'

const triggerClasses = [
  'flex h-9 w-full items-center justify-between whitespace-nowrap',
  'rounded-[--radius] border border-[--input] bg-transparent',
  'px-3 py-2 text-sm shadow-sm',
  'focus:outline-none focus:ring-1 focus:ring-[--ring]',
  'disabled:cursor-not-allowed disabled:opacity-50',
].join(' ')

const popupClasses = [
  'relative z-50 max-h-96 min-w-32 overflow-hidden',
  'rounded-[--radius] border border-[--border]',
  'bg-[--popover] p-1 text-[--popover-foreground] shadow-md',
].join(' ')

const itemClasses = [
  'relative flex w-full cursor-default select-none items-center',
  'rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none',
  'focus:bg-[--accent] focus:text-[--accent-foreground]',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
].join(' ')

export const Select = BaseSelect.Root
export const SelectGroup = BaseSelect.Group
export const SelectValue = BaseSelect.Value

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof BaseSelect.Trigger>
>(({ className = '', children, ...props }, ref) => (
  <BaseSelect.Trigger ref={ref} className={`${triggerClasses} ${className}`} {...props}>
    {children}
    <BaseSelect.Icon>
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
    </BaseSelect.Icon>
  </BaseSelect.Trigger>
))
SelectTrigger.displayName = 'SelectTrigger'

export const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BaseSelect.Popup>
>(({ className = '', children, ...props }, ref) => (
  <BaseSelect.Portal>
    <BaseSelect.Positioner>
      <BaseSelect.Popup ref={ref} className={`${popupClasses} ${className}`} {...props}>
        {children}
      </BaseSelect.Popup>
    </BaseSelect.Positioner>
  </BaseSelect.Portal>
))
SelectContent.displayName = 'SelectContent'

export const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BaseSelect.Item>
>(({ className = '', children, ...props }, ref) => (
  <BaseSelect.Item ref={ref} className={`${itemClasses} ${className}`} {...props}>
    <BaseSelect.ItemIndicator className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
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
    </BaseSelect.ItemIndicator>
    <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
  </BaseSelect.Item>
))
SelectItem.displayName = 'SelectItem'

export const SelectLabel = styled.div`px-2 py-1.5 text-sm font-semibold text-[--foreground]`
export const SelectSeparator = styled.div`-mx-1 my-1 h-px bg-[--muted]`
