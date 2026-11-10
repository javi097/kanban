import { SlidersHorizontal, X, Check } from 'lucide-react';
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
  PopoverDescription,
  PopoverClose,
} from '@/components/ui/popover';
import { CardPriorityBadge } from '@/kanban/components/Card/CardPriorityBadge';
import { useKanbanStore } from '@/kanban/store/kanban.store';
import {
  countActiveFilters,
  getAvailableTags,
  hasActiveFilters,
} from '@/kanban/core/filter';
import { cn } from '@/lib/utils';
import type { Priority } from '@/interfaces/kanban.interface';

const ALL_PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];

interface Props {
  className?: string;
}

export function BoardFilterPopover({ className }: Props) {
  const tasks = useKanbanStore((s) => s.tasks);
  const filters = useKanbanStore((s) => s.filters);
  const togglePriorityFilter = useKanbanStore((s) => s.togglePriorityFilter);
  const toggleTagFilter = useKanbanStore((s) => s.toggleTagFilter);
  const clearFilters = useKanbanStore((s) => s.clearFilters);

  const activeCount = countActiveFilters(filters);
  const hasFilters = hasActiveFilters(filters);
  const availableTags = getAvailableTags(tasks);

  const isPrioritySelected = (priority: Priority) =>
    filters.priorities.includes(priority);

  const isTagSelected = (tag: string) =>
    filters.tags.some((t) => t.toLowerCase() === tag.trim().toLowerCase());

  return (
    <PopoverRoot>
      <PopoverTrigger
        aria-label="Filter board"
        className={cn(
          'relative inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#e3e3df] bg-white text-[#74757b] transition-all hover:bg-[#f1f1ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#252a45]',
          hasFilters && 'border-[#252a45] text-[#1e2025] bg-[#f8f8f6]',
          className,
        )}
      >
        <SlidersHorizontal className="size-4" />
        {activeCount > 0 && (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#252a45] text-[10px] font-bold text-white shadow-sm">
            {activeCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-80 p-4"
      >
        <div className="flex items-center justify-between border-b border-[#f0f0ec] pb-2.5 mb-3">
          <div>
            <PopoverTitle className="text-sm font-semibold text-[#1e2025]">
              Filtros del tablero
            </PopoverTitle>
            <PopoverDescription className="text-xs text-[#85868b]">
              Refina las tarjetas por prioridad o etiqueta
            </PopoverDescription>
          </div>
          <PopoverClose
            className="rounded-md p-1 text-[#85868b] hover:bg-[#f1f1ed] hover:text-[#1e2025] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#252a45] cursor-pointer"
            aria-label="Cerrar panel de filtros"
          >
            <X className="size-4" />
          </PopoverClose>
        </div>

        {/* Sección de Prioridades */}
        <div className="mb-4">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#85868b] mb-2">
            Prioridad
          </span>
          <div className="flex flex-wrap gap-1.5">
            {ALL_PRIORITIES.map((priority) => {
              const isSelected = isPrioritySelected(priority);
              return (
                <button
                  key={priority}
                  type="button"
                  onClick={() => togglePriorityFilter(priority)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#252a45]',
                    isSelected
                      ? 'border-[#252a45] bg-[#f1f1ed] font-medium shadow-xs'
                      : 'border-[#e5e5e1] bg-white hover:bg-[#f8f8f6] text-[#55565d]',
                  )}
                >
                  <CardPriorityBadge priority={priority} />
                  {isSelected && <Check className="size-3 text-[#252a45]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sección de Etiquetas Dinámicas (CL-2) */}
        <div className="mb-4">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#85868b] mb-2">
            Etiquetas
          </span>
          {availableTags.length === 0 ? (
            <p className="text-xs text-[#85868b] italic">
              No hay etiquetas en el tablero
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {availableTags.map((tag) => {
                const isSelected = isTagSelected(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTagFilter(tag)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#252a45]',
                      isSelected
                        ? 'bg-[#252a45] text-white font-medium shadow-xs'
                        : 'bg-[#f1f1ee] text-[#77787d] hover:bg-[#e7e7e3]',
                    )}
                  >
                    <span>{tag}</span>
                    {isSelected && <Check className="size-3" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pie de panel con botón para limpiar filtros (RF-2.3) */}
        {hasFilters && (
          <div className="border-t border-[#f0f0ec] pt-3 flex items-center justify-between">
            <span className="text-xs text-[#85868b]">
              {activeCount} {activeCount === 1 ? 'criterio activo' : 'criterios activos'}
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline cursor-pointer focus-visible:outline-none"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </PopoverContent>
    </PopoverRoot>
  );
}
