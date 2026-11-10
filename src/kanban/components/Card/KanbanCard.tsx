import type { CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '@/interfaces/kanban.interface';
import { useKanbanStore } from '@/kanban/store/kanban.store';
import { CardPriorityBadge } from '@/kanban/components/Card/CardPriorityBadge';
import { CardTag } from '@/kanban/components/Card/CardTag';

interface Props {
  task: Task;
}

/**
 * Tarjeta interactiva y arrastrable del tablero Kanban (RF-1.1, CL-1).
 * Soporta arrastre suave mediante @dnd-kit/sortable y apertura del modal de detalle
 * al hacer clic, asegurando el desacoplamiento entre el clic y el umbral de arrastre.
 */
export function KanbanCard({ task }: Props) {
  const setSelectedTaskId = useKanbanStore((s) => s.setSelectedTaskId);

  const taskId = task?.id ?? 0;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: `task-${taskId}`,
      disabled: !task || typeof task.id !== 'number',
    });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!task || typeof task.id !== 'number') {
    return null;
  }

  function handleClick() {
    // Si se está produciendo un arrastre, descartar apertura del modal (CL-1)
    if (isDragging) return;
    setSelectedTaskId(task.id);
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={cn(
        'group cursor-pointer rounded-lg border border-[#e5e5e1] bg-white p-4 shadow-[0_1px_2px_rgba(20,20,20,0.03)] transition-shadow hover:shadow-md select-none',
        isDragging && 'opacity-40 cursor-grabbing',
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-[14px] font-semibold leading-5 text-[#292a2f]">
          {task.title}
        </h3>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTaskId(task.id);
          }}
          aria-label={`More options for ${task.title}`}
          className="text-[#b1b2b3] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#55565d] cursor-pointer"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      <p className="mb-4 text-xs leading-5 text-[#85868b]">{task.description}</p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {task.tags.map((tag) => (
          <CardTag key={tag} tag={tag} />
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-[#f0f0ed] pt-3">
        <CardPriorityBadge priority={task.priority} />
        {task.due && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-[#999a9e]">
            <CalendarDays className="size-3" />
            {task.due}
          </span>
        )}
      </div>
    </article>
  );
}
