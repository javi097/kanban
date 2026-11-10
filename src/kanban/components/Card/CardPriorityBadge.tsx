import { cn } from '@/lib/utils';
import type { Priority } from '@/interfaces/kanban.interface';

const PRIORITY_STYLES: Record<Priority, string> = {
  High: 'bg-rose-50 text-rose-700 ring-rose-100',
  Medium: 'bg-amber-50 text-amber-700 ring-amber-100',
  Low: 'bg-slate-100 text-slate-600 ring-slate-200',
};

interface Props {
  priority: Priority;
  className?: string;
}

/**
 * Badge visual reutilizable para mostrar la prioridad de una tarea (RF-1.2, RF-2.3).
 * Soporta variantes High, Medium y Low con estilos de Tailwind y ring perimetral.
 */
export function CardPriorityBadge({ priority, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-1 text-[10px] font-semibold ring-1 ring-inset',
        PRIORITY_STYLES[priority],
        className,
      )}
    >
      {priority}
    </span>
  );
}
