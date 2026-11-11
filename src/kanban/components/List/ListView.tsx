import { Circle, Clock3, CheckCircle2, Calendar, ChevronRight, Inbox } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CardPriorityBadge } from '@/kanban/components/Card/CardPriorityBadge';
import { CardTag } from '@/kanban/components/Card/CardTag';
import { useKanbanStore } from '@/kanban/store/kanban.store';
import { filterTasks, hasActiveFilters } from '@/kanban/core/filter';
import { cn } from '@/lib/utils';
import type { Status, Task } from '@/interfaces/kanban.interface';

interface ColumnGroupDef {
  name: Status;
  icon: LucideIcon;
  color: string;
}

const COLUMN_GROUPS: ColumnGroupDef[] = [
  { name: 'To Do', icon: Circle, color: 'text-muted-foreground' },
  { name: 'In Progress', icon: Clock3, color: 'text-amber-600' },
  { name: 'Done', icon: CheckCircle2, color: 'text-emerald-600' },
];

interface Props {
  className?: string;
}

export function ListView({ className }: Props) {
  const tasks = useKanbanStore((s) => s.tasks);
  const filters = useKanbanStore((s) => s.filters);
  const clearFilters = useKanbanStore((s) => s.clearFilters);
  const setSelectedTaskId = useKanbanStore((s) => s.setSelectedTaskId);

  const filteredTasks = filterTasks(tasks, filters);
  const isFiltered = hasActiveFilters(filters);

  if (filteredTasks.length === 0) {
    return (
      <section
        className={cn(
          'flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#d9d9d4] bg-white p-8 text-center',
          className,
        )}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-[#f1f1ee] text-[#85868b]">
          <Inbox className="size-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-[#1e2025]">
          {isFiltered ? 'Sin tarjetas coincidentes' : 'No hay tarjetas en el tablero'}
        </h3>
        <p className="mt-1 text-sm text-[#85868b]">
          {isFiltered
            ? 'Prueba a modificar los filtros seleccionados o el término de búsqueda.'
            : 'Comienza creando una nueva tarjeta desde el botón "Add card".'}
        </p>
        {isFiltered && (
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 rounded-lg bg-[#252a45] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#333957] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#252a45] cursor-pointer"
          >
            Limpiar filtros
          </button>
        )}
      </section>
    );
  }

  return (
    <section className={cn('flex flex-col gap-6', className)}>
      {COLUMN_GROUPS.map(({ name, icon: Icon, color }) => {
        const groupTasks = filteredTasks.filter((t) => t.status === name);

        if (groupTasks.length === 0) {
          return null;
        }

        return (
          <div key={name} className="flex flex-col gap-3">
            {/* Header del grupo de estado */}
            <div className="flex items-center gap-2 px-1">
              <Icon className={cn('size-4', color)} />
              <h2 className="text-sm font-semibold text-[#35363b]">{name}</h2>
              <span className="flex size-5 items-center justify-center rounded-full bg-[#e2e2de] text-[11px] font-semibold text-[#85868a]">
                {groupTasks.length}
              </span>
            </div>

            {/* Listado de filas */}
            <div className="flex flex-col gap-2" role="list">
              {groupTasks.map((task: Task) => (
                <div
                  key={task.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedTaskId(task.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedTaskId(task.id);
                    }
                  }}
                  className="group flex flex-col gap-3 rounded-xl border border-[#e5e5e1] bg-white p-3.5 transition-all hover:border-[#d1d1cc] hover:bg-[#fafaf8] hover:shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#252a45]"
                >
                  {/* Título y descripción */}
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="text-sm font-medium text-[#1e2025] group-hover:text-[#252a45] transition-colors truncate">
                      {task.title}
                    </span>
                    {task.description && (
                      <p className="text-xs text-[#77787d] line-clamp-1">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Metadatos: tags, due date, prioridad y chevron */}
                  <div className="flex flex-wrap items-center gap-2.5 sm:shrink-0">
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {task.tags.map((tag) => (
                          <CardTag key={tag} tag={tag} />
                        ))}
                      </div>
                    )}

                    {task.due && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#77787d] bg-[#f8f8f6] px-2 py-0.5 rounded-md border border-[#e8e8e4]">
                        <Calendar className="size-3 text-[#9a9b9e]" />
                        {task.due}
                      </span>
                    )}

                    <CardPriorityBadge priority={task.priority} />

                    <div className="text-[#b0b1b5] group-hover:text-[#252a45] group-hover:translate-x-0.5 transition-all">
                      <ChevronRight className="size-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
