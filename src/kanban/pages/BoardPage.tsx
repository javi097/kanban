import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import { CalendarDays, Circle, Clock3, CheckCircle2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BoardHeader } from '@/kanban/components/Board/BoardHeader';
import { KanbanColumn } from '@/kanban/components/Column/KanbanColumn';
import { DragOverlayCard } from '@/kanban/components/Board/DragOverlayCard';
import { useKanbanDnd } from '@/kanban/hooks/useKanbanDnd';
import { useKanbanStore } from '@/kanban/store/kanban.store';
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

export function BoardPage() {
  const tasks = useKanbanStore((s) => s.tasks);
  const { sensors, activeTask, handleDragStart, handleDragOver, handleDragEnd } =
    useKanbanDnd();

  return (
    <main className="min-h-screen bg-[#f8f8f6] text-[#202124]">
      <div className="mx-auto max-w-[1480px] px-5 py-6 sm:px-8 sm:py-9 lg:px-12">
        <BoardHeader />

        {/* Sub-header: date and view toggle */}
        <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-[#77787d]">
            <CalendarDays className="size-4" />
            <span>October 2026</span>
            <span className="text-[#c6c6c2]">·</span>
            <span>{tasks.length} cards</span>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-[#e5e5e1] bg-white p-1 text-xs font-medium text-[#898a8f]">
            <button className="rounded-md bg-[#f1f1ed] px-3 py-1.5 text-[#30323a]">
              Board
            </button>
            <button className="px-3 py-1.5">List</button>
          </div>
        </div>

        {/* DndContext & Columns grid */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
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

        <footer className="flex items-center justify-between pt-7 text-[11px] text-[#aaa9a5]">
          <span>Last updated just now</span>
          <span>Drag cards to update status</span>
        </footer>
      </div>
    </main>
  );
}
