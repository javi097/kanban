import { CalendarDays, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, Priority } from '@/interfaces/kanban.interface';

const PRIORITY_STYLES: Record<Priority, string> = {
  High: 'bg-rose-50 text-rose-700 ring-rose-100',
  Medium: 'bg-amber-50 text-amber-700 ring-amber-100',
  Low: 'bg-slate-100 text-slate-600 ring-slate-200',
};

interface Props {
  task: Task;
}

export function DragOverlayCard({ task }: Props) {
  if (!task || typeof task.id !== 'number') {
    return null;
  }

  return (
    <article className="group cursor-grabbing rounded-lg border border-[#e5e5e1] bg-white p-4 shadow-xl opacity-95 rotate-1 scale-[1.02] transition-transform">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-[14px] font-semibold leading-5 text-[#292a2f]">
          {task.title}
        </h3>
        <button
          type="button"
          aria-label={`More options for ${task.title}`}
          className="text-[#b1b2b3] opacity-0"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      <p className="mb-4 text-xs leading-5 text-[#85868b]">{task.description}</p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {task.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-[#f1f1ee] px-2 py-1 text-[10px] font-medium text-[#77787d]"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-[#f0f0ed] pt-3">
        <span
          className={cn(
            'rounded-md px-2 py-1 text-[10px] font-semibold ring-1 ring-inset',
            PRIORITY_STYLES[task.priority],
          )}
        >
          {task.priority}
        </span>
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
