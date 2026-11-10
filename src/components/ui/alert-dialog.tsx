import { AlertDialog } from '@base-ui/react/alert-dialog';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Tipos de las partes del AlertDialog
// ---------------------------------------------------------------------------
interface AlertDialogRootProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

interface AlertDialogContentProps {
  className?: string;
  children: ReactNode;
}

interface AlertDialogHeaderProps {
  className?: string;
  children: ReactNode;
}

interface AlertDialogFooterProps {
  className?: string;
  children: ReactNode;
}

interface AlertDialogTitleProps {
  className?: string;
  children: ReactNode;
}

interface AlertDialogDescriptionProps {
  className?: string;
  children: ReactNode;
}

interface AlertDialogActionProps {
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}

interface AlertDialogCancelProps {
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// Primitivas re-exportadas de @base-ui/react/alert-dialog
// RNF-1: semántica alertdialog para acciones destructivas (RF-4.2)
// ---------------------------------------------------------------------------

function AlertDialogRoot({ children, open, onOpenChange }: AlertDialogRootProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </AlertDialog.Root>
  );
}

function AlertDialogPortal({ children }: { children: ReactNode }) {
  return <AlertDialog.Portal>{children}</AlertDialog.Portal>;
}

function AlertDialogBackdrop({ className }: { className?: string }) {
  return (
    <AlertDialog.Backdrop
      className={cn(
        'fixed inset-0 z-40 bg-black/50',
        'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
        'transition-opacity duration-200 ease-out',
        className,
      )}
    />
  );
}

function AlertDialogContent({ className, children }: AlertDialogContentProps) {
  return (
    <AlertDialogPortal>
      <AlertDialogBackdrop />
      <AlertDialog.Popup
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2',
          'rounded-xl border border-[#e5e5e1] bg-white shadow-lg p-6',
          'outline-none',
          'data-[starting-style]:opacity-0 data-[starting-style]:scale-95',
          'data-[ending-style]:opacity-0 data-[ending-style]:scale-95',
          'transition-all duration-200 ease-out',
          className,
        )}
      >
        {children}
      </AlertDialog.Popup>
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({ className, children }: AlertDialogHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-2 mb-4', className)}>
      {children}
    </div>
  );
}

function AlertDialogFooter({ className, children }: AlertDialogFooterProps) {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6', className)}>
      {children}
    </div>
  );
}

function AlertDialogTitle({ className, children }: AlertDialogTitleProps) {
  return (
    <AlertDialog.Title
      className={cn('text-base font-semibold text-[#202124]', className)}
    >
      {children}
    </AlertDialog.Title>
  );
}

function AlertDialogDescription({ className, children }: AlertDialogDescriptionProps) {
  return (
    <AlertDialog.Description
      className={cn('text-sm text-[#77787d]', className)}
    >
      {children}
    </AlertDialog.Description>
  );
}

/**
 * Botón de acción: confirma la acción destructiva (RF-4.2).
 * No captura el foco inicial para evitar confirmación accidental.
 */
function AlertDialogAction({ className, onClick, children }: AlertDialogActionProps) {
  return (
    <AlertDialog.Close
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium',
        'bg-rose-600 text-white hover:bg-rose-700 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1',
        className,
      )}
    >
      {children}
    </AlertDialog.Close>
  );
}

/**
 * Botón de cancelación: recibe el foco inicial (CL-1 seguridad accidental).
 * Cierra el dialog sin ejecutar la acción.
 */
function AlertDialogCancel({ className, onClick, children }: AlertDialogCancelProps) {
  return (
    <AlertDialog.Close
      autoFocus
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium',
        'border border-[#e5e5e1] bg-white text-[#55565d] hover:bg-[#f1f1ee] transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6c6c2] focus-visible:ring-offset-1',
        className,
      )}
    >
      {children}
    </AlertDialog.Close>
  );
}

// Trigger re-exportado directamente
const AlertDialogTrigger = AlertDialog.Trigger;

export {
  AlertDialogRoot,
  AlertDialogPortal,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTrigger,
};
