import * as React from 'react'
import { Checkbox as BaseCheckbox } from '@base-ui-components/react/checkbox'

const rootClasses = [
  'peer h-4 w-4 shrink-0 rounded-sm border border-[--border]',
  'ring-offset-[--background] transition-colors',
  'focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-[--ring] focus-visible:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'data-[checked]:bg-[--primary]',
  'data-[checked]:text-[--primary-foreground]',
].join(' ')

export const Checkbox = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof BaseCheckbox.Root>
>(({ className = '', ...props }, ref) => (
  <BaseCheckbox.Root ref={ref} className={`${rootClasses} ${className}`} {...props}>
    <BaseCheckbox.Indicator className="flex items-center justify-center text-current">
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
    </BaseCheckbox.Indicator>
  </BaseCheckbox.Root>
))
Checkbox.displayName = 'Checkbox'
