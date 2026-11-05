import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, MoreHorizontal, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { KanbanCard } from '@/kanban/components/Card/KanbanCard';
import { useKanbanStore } from '@/kanban/store/kanban.store';
import type { Status } from '@/interfaces/kanban.interface';

interface Props {
  name: Status;
  icon: LucideIcon;
  color: string;
}

export function KanbanColumn({ name, icon: Icon, color }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: name });

  const tasks = useKanbanStore((s) => s.tasks);
  const addingTo = useKanbanStore((s) => s.addingTo);
  const setAddingTo = useKanbanStore((s) => s.setAddingTo);
  const addTask = useKanbanStore((s) => s.addTask);

  const [newTitle, setNewTitle] = useState('');

  const columnTasks = Array.isArray(tasks)
    ? tasks.filter((task) => Boolean(task && task.status === name && typeof task.id === 'number'))
    : [];

  const isAdding = addingTo === name;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addTask(newTitle, name);
    setNewTitle('');
  }

  function handleCancel() {
    setAddingTo(null);
    setNewTitle('');
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[520px] flex-col rounded-xl border border-[#e8e8e4] bg-[#f1f1ee] p-3.5 sm:p-4 transition-colors',
        isOver && 'border-blue-400/60 bg-[#ebebe6] ring-2 ring-blue-400/20',
      )}
    >
      {/* Column header */}
      <div className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Icon className={`size-4 ${color}`} />
          <h2 className="text-sm font-semibold text-[#35363b]">{name}</h2>
          <span className="flex size-5 items-center justify-center rounded-full bg-[#e2e2de] text-[11px] font-semibold text-[#85868a]">
            {columnTasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-[#9a9b9e]"
          aria-label={`More options for ${name}`}
        >
          <MoreHorizontal />
        </Button>
      </div>

      {/* Task list */}
      <div className="flex flex-1 flex-col gap-3">
        <SortableContext
          items={columnTasks.map((t) => `task-${t.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {columnTasks.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {/* Inline add form or add button */}
        {isAdding ? (
          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-[#d9d9d4] bg-white p-3 shadow-sm"
          >
            <input
              id={`new-task-title-${name}`}
              name="title"
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What needs doing?"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#b0b1b2]"
            />
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
                <X data-icon="inline-start" />
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#252a45] text-white hover:bg-[#333957]"
              >
                Add card
              </Button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAddingTo(name)}
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-[#97989c] transition-colors hover:bg-white hover:text-[#55565d]"
          >
            <Plus className="size-4" />
            Add card
          </button>
        )}
      </div>
    </div>
  );
}
