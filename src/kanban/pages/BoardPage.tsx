import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  closestCorners,
  type CollisionDetection,
} from '@dnd-kit/core';
import { CalendarDays, Circle, Clock3, CheckCircle2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BoardHeader } from '@/kanban/components/Board/BoardHeader';
import { KanbanColumn } from '@/kanban/components/Column/KanbanColumn';
import { DragOverlayCard } from '@/kanban/components/Board/DragOverlayCard';
import { CardDetailModal } from '@/kanban/components/Card/CardDetailModal';
import { ListView } from '@/kanban/components/List/ListView';
import { useKanbanDnd } from '@/kanban/hooks/useKanbanDnd';
import { useKanbanStore } from '@/kanban/store/kanban.store';
import { filterTasks, hasActiveFilters } from '@/kanban/core/filter';
import { cn } from '@/lib/utils';
import type { Status } from '@/interfaces/kanban.interface';

interface ColumnDef {
  name: Status;
  icon: LucideIcon;
  color: string;
}

const COLUMNS: ColumnDef[] = [
  { name: 'To Do', icon: Circle, color: 'text-muted-foreground' },
  { name: 'In Progress', icon: Clock3, color: 'text-amber-600' },
  { name: 'Done', icon: CheckCircle2, color: 'text-emerald-600' },
];

const collisionDetectionStrategy: CollisionDetection = (args) => {
  // 1. Prioridad alta: puntero directo dentro del contenedor o tarjeta objetivo
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }

  // 2. Intersección de rectángulos
  const rectCollisions = rectIntersection(args);
  if (rectCollisions.length > 0) {
    return rectCollisions;
  }

  // 3. Fallback de esquinas más cercanas (ej. navegación con teclado)
  return closestCorners(args);
};

export function BoardPage() {
  const tasks = useKanbanStore((s) => s.tasks);
  const viewMode = useKanbanStore((s) => s.viewMode);
  const setViewMode = useKanbanStore((s) => s.setViewMode);
  const filters = useKanbanStore((s) => s.filters);

  const {
    sensors,
    activeTask,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useKanbanDnd();

  const filteredTasks = filterTasks(tasks, filters);
  const isFiltered = hasActiveFilters(filters);
  const cardCountText = isFiltered
    ? `${filteredTasks.length} de ${tasks.length} tarjetas`
    : `${tasks.length} ${tasks.length === 1 ? 'tarjeta' : 'tarjetas'}`;

  return (
    <main className="min-h-screen bg-[#f8f8f6] text-[#202124]">
      <div className="mx-auto max-w-[1480px] px-5 py-6 sm:px-8 sm:py-9 lg:px-12">
        <BoardHeader />

        {/* Sub-header: date, active cards count and view toggle (RF-2.4, RF-3.1, RF-3.2) */}
        <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-[#77787d]">
            <CalendarDays className="size-4" />
            <span>October 2026</span>
            <span className="text-[#c6c6c2]">·</span>
            <span className={cn(isFiltered && 'font-medium text-[#1e2025]')}>
              {cardCountText}
            </span>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-[#e5e5e1] bg-white p-1 text-xs font-medium text-[#898a8f]">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={cn(
                'rounded-md px-3 py-1.5 transition-colors cursor-pointer',
                viewMode === 'board'
                  ? 'bg-[#f1f1ed] text-[#30323a] font-medium shadow-2xs'
                  : 'hover:text-[#30323a]',
              )}
            >
              Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'rounded-md px-3 py-1.5 transition-colors cursor-pointer',
                viewMode === 'list'
                  ? 'bg-[#f1f1ed] text-[#30323a] font-medium shadow-2xs'
                  : 'hover:text-[#30323a]',
              )}
            >
              List
            </button>
          </div>
        </div>

        {/* Renderizado condicional según viewMode */}
        {viewMode === 'board' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetectionStrategy}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <section className="grid gap-5 lg:grid-cols-3">
              {COLUMNS.map(({ name, icon, color }) => (
                <KanbanColumn key={name} name={name} icon={icon} color={color} />
              ))}
            </section>

            <DragOverlay>
              {activeTask ? <DragOverlayCard task={activeTask} /> : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <ListView />
        )}

        <CardDetailModal />

        <footer className="flex items-center justify-between pt-7 text-[11px] text-[#aaa9a5]">
          <span>Last updated just now</span>
          <span>
            {viewMode === 'board'
              ? 'Drag cards to update status'
              : 'Click cards to view details'}
          </span>
        </footer>
      </div>
    </main>
  );
}
