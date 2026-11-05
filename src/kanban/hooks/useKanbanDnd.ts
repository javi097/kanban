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

const COLUMN_STATUSES: readonly Status[] = ['To Do', 'In Progress', 'Done'] as const;

function resolveStatus(id: UniqueId | undefined | null, tasks: Task[]): Status | undefined {
  if (!id || !Array.isArray(tasks)) return undefined;

  if ((COLUMN_STATUSES as readonly string[]).includes(id)) {
    return id as Status;
  }

  const found = tasks.find((t) => t && `task-${t.id}` === id);
  return found?.status;
}

export interface UseKanbanDndReturn {
  sensors: ReturnType<typeof useSensors>;
  activeTask: Task | null;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleDragCancel: () => void;
}

export function useKanbanDnd(): UseKanbanDndReturn {
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
    if (!event.active || !event.active.id) {
      setActiveTask(null);
      return;
    }

    const activeId = String(event.active.id);
    const currentTasks = useKanbanStore.getState().tasks;
    const task = currentTasks.find((t) => t && `task-${t.id}` === activeId);
    setActiveTask(task ?? null);
  }

  function handleDragOver() {
    // Intencionalmente no se muta el estado del store durante dragOver para prevenir
    // oscilaciones rápidas ("ping-pong flapping") y la excepción de React
    // "Maximum update depth exceeded". La reordenación y la transferencia inter-columna
    // se confirman de forma atómica y determinista exclusivamente en handleDragEnd.
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);

    const { active, over } = event;
    if (!active || !over || !active.id || !over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const currentTasks = useKanbanStore.getState().tasks;
    const activeTaskItem = currentTasks.find((t) => t && `task-${t.id}` === activeId);

    if (!activeTaskItem || !activeTaskItem.status) return;

    const activeStatus = activeTaskItem.status;
    const overStatus = resolveStatus(overId, currentTasks);

    if (!overStatus) return;

    if (activeStatus === overStatus) {
      const newTasks = reorderInColumn(currentTasks, activeStatus, activeId, overId);
      reorderTasks(newTasks);
    } else {
      const newTasks = transferTask(currentTasks, activeId, overStatus, overId);
      reorderTasks(newTasks);
    }
  }

  function handleDragCancel() {
    setActiveTask(null);
  }

  return {
    sensors,
    activeTask,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}
