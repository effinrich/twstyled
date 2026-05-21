import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { styled } from 'tw-styled'

const StyledOverlay = styled(DialogPrimitive.Overlay)`
  fixed inset-0 z-50 bg-black/80
`

const StyledContent = styled(DialogPrimitive.Content)`
  fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg
  -translate-x-1/2 -translate-y-1/2 gap-4
  border border-[--border] bg-[--background] p-6 shadow-lg
  duration-200 sm:rounded-[--radius]
`

const StyledTitle = styled(DialogPrimitive.Title)`
  text-lg font-semibold leading-none tracking-tight text-[--foreground]
`

const StyledDescription = styled(DialogPrimitive.Description)`
  text-sm text-[--muted-foreground]
`

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogPortal = DialogPrimitive.Portal
export const DialogClose = DialogPrimitive.Close
export const DialogTitle = StyledTitle
export const DialogDescription = StyledDescription

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>((props, ref) => <StyledOverlay ref={ref} {...props} />)
DialogOverlay.displayName = 'DialogOverlay'

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <StyledContent ref={ref} {...props}>
      {children}
    </StyledContent>
  </DialogPortal>
))
DialogContent.displayName = 'DialogContent'

export const DialogHeader = styled.div`flex flex-col space-y-1.5 text-center sm:text-left`
export const DialogFooter = styled.div`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2`
