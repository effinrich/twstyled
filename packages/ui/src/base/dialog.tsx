import * as React from 'react'
import { Dialog as BaseDialog } from '@base-ui-components/react/dialog'
import { styled } from 'tw-styled'

const backdropClasses = 'fixed inset-0 z-50 bg-black/80'
const popupClasses = [
  'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg',
  '-translate-x-1/2 -translate-y-1/2 gap-4',
  'border border-[--border] bg-[--background] p-6 shadow-lg',
  'duration-200 sm:rounded-[--radius]',
].join(' ')

export const Dialog = BaseDialog.Root
export const DialogTrigger = BaseDialog.Trigger
export const DialogClose = BaseDialog.Close
export const DialogTitle = BaseDialog.Title
export const DialogDescription = BaseDialog.Description

export const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Popup>
>(({ className = '', children, ...props }, ref) => (
  <BaseDialog.Portal>
    <BaseDialog.Backdrop className={backdropClasses} />
    <BaseDialog.Popup ref={ref} className={`${popupClasses} ${className}`} {...props}>
      {children}
    </BaseDialog.Popup>
  </BaseDialog.Portal>
))
DialogContent.displayName = 'DialogContent'

export const DialogHeader = styled.div`flex flex-col space-y-1.5 text-center sm:text-left`
export const DialogFooter = styled.div`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2`
