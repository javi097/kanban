import { Dialog } from '@base-ui/react/dialog';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Tipos de las partes del diálogo
// ---------------------------------------------------------------------------
interface DialogRootProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

interface DialogContentProps {
  className?: string;
  children: ReactNode;
}

interface DialogHeaderProps {
  className?: string;
  children: ReactNode;
}

interface DialogFooterProps {
  className?: string;
  children: ReactNode;
}

interface DialogTitleProps {
  className?: string;
  children: ReactNode;
}

interface DialogDescriptionProps {
  className?: string;
  children: ReactNode;
}

interface DialogCloseProps {
  className?: string;
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// Primitivas re-exportadas de @base-ui/react/dialog
// ---------------------------------------------------------------------------

function DialogRoot({ children, open, onOpenChange }: DialogRootProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog.Root>
  );
}

function DialogPortal({ children }: { children: ReactNode }) {
  return <Dialog.Portal>{children}</Dialog.Portal>;
}

function DialogBackdrop({ className }: { className?: string }) {
  return (
    <Dialog.Backdrop
      className={cn(
        'fixed inset-0 z-40 bg-black/50',
        'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
        'transition-opacity duration-200 ease-out',
        className,
      )}
    />
  );
}

function DialogContent({ className, children }: DialogContentProps) {
  return (
    <DialogPortal>
      <DialogBackdrop />
      <Dialog.Popup
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
          'rounded-xl border border-[#e5e5e1] bg-white shadow-lg',
          'max-h-[90vh] overflow-y-auto',
          'outline-none',
          'data-[starting-style]:opacity-0 data-[starting-style]:scale-95',
          'data-[ending-style]:opacity-0 data-[ending-style]:scale-95',
          'transition-all duration-200 ease-out',
          className,
        )}
      >
        {children}
      </Dialog.Popup>
    </DialogPortal>
  );
}

function DialogHeader({ className, children }: DialogHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-1.5 p-6 pb-0', className)}>
      {children}
    </div>
  );
}

function DialogFooter({ className, children }: DialogFooterProps) {
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end gap-2 p-6 pt-4', className)}
    >
      {children}
    </div>
  );
}

function DialogTitle({ className, children }: DialogTitleProps) {
  return (
    <Dialog.Title
      className={cn('text-base font-semibold leading-none text-[#202124]', className)}
    >
      {children}
    </Dialog.Title>
  );
}

function DialogDescription({ className, children }: DialogDescriptionProps) {
  return (
    <Dialog.Description
      className={cn('text-sm text-[#77787d]', className)}
    >
      {children}
    </Dialog.Description>
  );
}

function DialogClose({ className, children }: DialogCloseProps) {
  return (
    <Dialog.Close className={cn(className)}>
      {children}
    </Dialog.Close>
  );
}

// Trigger re-exportado directamente
const DialogTrigger = Dialog.Trigger;

export {
  DialogRoot,
  DialogPortal,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogTrigger,
};
