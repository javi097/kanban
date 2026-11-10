import { Popover } from '@base-ui/react/popover';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Tipos de las partes del Popover
// ---------------------------------------------------------------------------
interface PopoverRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean | 'trap-focus';
  children: ReactNode;
}

interface PopoverContentProps {
  className?: string;
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  alignOffset?: number;
}

interface PopoverTitleProps {
  className?: string;
  children: ReactNode;
}

interface PopoverDescriptionProps {
  className?: string;
  children: ReactNode;
}

interface PopoverCloseProps {
  className?: string;
  children?: ReactNode;
}

// ---------------------------------------------------------------------------
// Componentes basados en @base-ui/react/popover
// ---------------------------------------------------------------------------

function PopoverRoot({
  children,
  open,
  defaultOpen,
  onOpenChange,
  modal = false,
}: PopoverRootProps) {
  return (
    <Popover.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      modal={modal}
    >
      {children}
    </Popover.Root>
  );
}

function PopoverPortal({ children }: { children: ReactNode }) {
  return <Popover.Portal>{children}</Popover.Portal>;
}

function PopoverContent({
  className,
  children,
  align = 'end',
  side = 'bottom',
  sideOffset = 8,
  alignOffset = 0,
}: PopoverContentProps) {
  return (
    <PopoverPortal>
      <Popover.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        className="z-50 outline-none"
      >
        <Popover.Popup
          className={cn(
            'z-50 w-72 rounded-xl border border-[#e5e5e1] bg-white p-4 shadow-lg text-[#202124] outline-none',
            'data-[starting-style]:opacity-0 data-[starting-style]:scale-95',
            'data-[ending-style]:opacity-0 data-[ending-style]:scale-95',
            'transition-all duration-150 ease-out',
            className,
          )}
        >
          {children}
        </Popover.Popup>
      </Popover.Positioner>
    </PopoverPortal>
  );
}

function PopoverTitle({ className, children }: PopoverTitleProps) {
  return (
    <Popover.Title
      className={cn('text-sm font-semibold text-[#202124]', className)}
    >
      {children}
    </Popover.Title>
  );
}

function PopoverDescription({ className, children }: PopoverDescriptionProps) {
  return (
    <Popover.Description
      className={cn('text-xs text-[#77787d]', className)}
    >
      {children}
    </Popover.Description>
  );
}

function PopoverClose({ className, children }: PopoverCloseProps) {
  return (
    <Popover.Close className={cn(className)}>
      {children}
    </Popover.Close>
  );
}

const PopoverTrigger = Popover.Trigger;

export {
  PopoverRoot,
  PopoverPortal,
  PopoverContent,
  PopoverTrigger,
  PopoverTitle,
  PopoverDescription,
  PopoverClose,
};
