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

export function KanbanCard({ task }: Props) {
  return (
    <article className="group rounded-lg border border-[#e5e5e1] bg-white p-4 shadow-[0_1px_2px_rgba(20,20,20,0.03)] transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-[14px] font-semibold leading-5 text-[#292a2f]">
          {task.title}
        </h3>
        <button
          aria-label={`More options for ${task.title}`}
          className="text-[#b1b2b3] opacity-0 transition-opacity group-hover:opacity-100"
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
