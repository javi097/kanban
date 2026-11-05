import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, Status } from '@/interfaces/kanban.interface';

const INITIAL_TASKS: Task[] = [
  {
    id: 1,
    title: 'Redesign landing page',
    description: 'Explore a cleaner visual direction for the new homepage.',
    tags: ['Design', 'Website'],
    priority: 'High',
    status: 'To Do',
    due: 'Today',
  },
  {
    id: 2,
    title: 'Set up analytics events',
    description: 'Track signups, activation, and the first meaningful action.',
    tags: ['Engineering'],
    priority: 'Medium',
    status: 'To Do',
    due: 'Oct 28',
  },
  {
    id: 3,
    title: 'Write onboarding copy',
    description: 'Draft the welcome flow and empty states for new users.',
    tags: ['Content'],
    priority: 'Low',
    status: 'To Do',
  },
  {
    id: 4,
    title: 'Build component library',
    description: 'Create the core primitives and document usage patterns.',
    tags: ['Engineering', 'Design system'],
    priority: 'High',
    status: 'In Progress',
    due: 'Today',
  },
  {
    id: 5,
    title: 'User interviews',
    description: 'Synthesize notes from the latest round of customer calls.',
    tags: ['Research'],
    priority: 'Medium',
    status: 'In Progress',
    due: 'Oct 30',
  },
  {
    id: 6,
    title: 'Project kickoff',
    description: 'Align the team on goals, scope, and a first milestone.',
    tags: ['Planning'],
    priority: 'Low',
    status: 'Done',
  },
  {
    id: 7,
    title: 'Define visual direction',
    description: 'Choose a focused visual language for the product.',
    tags: ['Design'],
    priority: 'Medium',
    status: 'Done',
  },
];

interface KanbanState {
  tasks: Task[];
  addingTo: Status | null;

  setAddingTo: (status: Status | null) => void;
  addTask: (title: string, status: Status) => void;
  reorderTasks: (newTasks: Task[]) => void;
}

export const useKanbanStore = create<KanbanState>()(
  persist(
    (set) => ({
      tasks: INITIAL_TASKS,
      addingTo: null,

      setAddingTo: (status) =>
        set({ addingTo: status }),

      addTask: (title, status) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        const newTask: Task = {
          id: Date.now(),
          title: trimmed,
          description: 'New task added to your board.',
          tags: ['New'],
          priority: 'Medium',
          status,
        };
        set((state) => ({ tasks: [...state.tasks, newTask], addingTo: null }));
      },

      reorderTasks: (newTasks) => {
        if (!Array.isArray(newTasks)) return;
        const validTasks = newTasks.filter(
          (t): t is Task => Boolean(t && typeof t.id === 'number' && t.status),
        );
        set({ tasks: validTasks });
      },
    }),
    {
      name: 'kanban-storage',
      migrate: (persistedState: unknown) => {
        const state = persistedState as { tasks?: Task[] } | undefined;
        if (!state || !Array.isArray(state.tasks)) {
          return { tasks: INITIAL_TASKS, addingTo: null };
        }
        const validTasks = state.tasks.filter(
          (t): t is Task => Boolean(t && typeof t.id === 'number' && t.status),
        );
        return {
          ...state,
          tasks: validTasks.length > 0 ? validTasks : INITIAL_TASKS,
        };
      },
    },
  ),
);
