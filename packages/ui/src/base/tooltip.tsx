import * as React from 'react'
import { Tooltip as BaseTooltip } from '@base-ui-components/react/tooltip'

const popupClasses = [
  'z-50 overflow-hidden rounded-[--radius] border border-[--border]',
  'bg-[--popover] px-3 py-1.5 text-sm text-[--popover-foreground] shadow-md',
].join(' ')

export const TooltipProvider = BaseTooltip.Provider
export const Tooltip = BaseTooltip.Root
export const TooltipTrigger = BaseTooltip.Trigger

export const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BaseTooltip.Popup>
>(({ className = '', ...props }, ref) => (
  <BaseTooltip.Portal>
    <BaseTooltip.Positioner>
      <BaseTooltip.Popup ref={ref} className={`${popupClasses} ${className}`} {...props} />
    </BaseTooltip.Positioner>
  </BaseTooltip.Portal>
))
TooltipContent.displayName = 'TooltipContent'
