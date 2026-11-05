import { useState } from 'react';
import {
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Task, Status, UniqueId } from '@/interfaces/kanban.interface';
import { useKanbanStore } from '@/kanban/store/kanban.store';
import { reorderInColumn, transferTask } from '@/kanban/core/reorder';

const COLUMN_STATUSES: Status[] = ['To Do', 'In Progress', 'Done'];

function resolveStatus(id: UniqueId, tasks: Task[]): Status | undefined {
  if (COLUMN_STATUSES.includes(id as Status)) {
    return id as Status;
  }
  return tasks.find((t) => `task-${t.id}` === id)?.status;
}

export interface UseKanbanDndReturn {
  sensors: ReturnType<typeof useSensors>;
  activeTask: Task | null;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
}

export function useKanbanDnd(): UseKanbanDndReturn {
  const tasks = useKanbanStore((s) => s.tasks);
  const reorderTasks = useKanbanStore((s) => s.reorderTasks);

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    const activeId = String(event.active.id);
    const task = tasks.find((t) => `task-${t.id}` === activeId);
    setActiveTask(task ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const activeTaskItem = tasks.find((t) => `task-${t.id}` === activeId);
    if (!activeTaskItem) return;

    const activeStatus = activeTaskItem.status;
    const overStatus = resolveStatus(overId, tasks);

    if (!overStatus) return;

    if (activeStatus !== overStatus) {
      const newTasks = transferTask(tasks, activeId, overStatus, overId);
      reorderTasks(newTasks);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const activeTaskItem = tasks.find((t) => `task-${t.id}` === activeId);
    if (!activeTaskItem) return;

    const activeStatus = activeTaskItem.status;
    const overStatus = resolveStatus(overId, tasks);

    if (!overStatus) return;

    if (activeStatus === overStatus) {
      const newTasks = reorderInColumn(tasks, activeStatus, activeId, overId);
      reorderTasks(newTasks);
    }
  }

  return {
    sensors,
    activeTask,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
