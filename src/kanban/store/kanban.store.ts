import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Task,
  Status,
  UpdateTaskPayload,
  Priority,
  KanbanViewMode,
  KanbanFilters,
} from '@/interfaces/kanban.interface';
import { validateTaskPayload } from '@/kanban/core/validator';

const INITIAL_FILTERS: KanbanFilters = {
  searchQuery: '',
  priorities: [],
  tags: [],
};

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
  selectedTaskId: number | null;
  viewMode: KanbanViewMode;
  filters: KanbanFilters;

  // Acciones existentes
  setAddingTo: (status: Status | null) => void;
  setSelectedTaskId: (id: number | null) => void;
  addTask: (title: string, status: Status) => void;
  updateTask: (id: number, payload: UpdateTaskPayload) => void;
  deleteTask: (id: number) => void;
  reorderTasks: (newTasks: Task[]) => void;

  // Nuevas acciones de filtros y vistas (Spec 003)
  setViewMode: (mode: KanbanViewMode) => void;
  setSearchQuery: (query: string) => void;
  togglePriorityFilter: (priority: Priority) => void;
  toggleTagFilter: (tag: string) => void;
  clearFilters: () => void;
}

export const useKanbanStore = create<KanbanState>()(
  persist(
    (set) => ({
      tasks: INITIAL_TASKS,
      addingTo: null,
      selectedTaskId: null,
      viewMode: 'board',
      filters: INITIAL_FILTERS,

      setAddingTo: (status) =>
        set({ addingTo: status }),

      setSelectedTaskId: (id) =>
        set({ selectedTaskId: id }),

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

      updateTask: (id, payload) => {
        const currentTasks = useKanbanStore.getState().tasks;
        const targetTask = currentTasks.find((t) => t && t.id === id);
        if (!targetTask) return;

        const validation = validateTaskPayload(payload);
        if (!validation.isValid) return;

        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...validation.sanitizedPayload, id: task.id } : task,
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task && task.id !== id),
          selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
        }));
      },

      reorderTasks: (newTasks) => {
        if (!Array.isArray(newTasks)) return;
        const validTasks = newTasks.filter(
          (t): t is Task => Boolean(t && typeof t.id === 'number' && t.status),
        );
        set({ tasks: validTasks });
      },

      setViewMode: (mode) =>
        set({ viewMode: mode }),

      setSearchQuery: (query) =>
        set((state) => ({
          filters: { ...state.filters, searchQuery: query },
        })),

      togglePriorityFilter: (priority) =>
        set((state) => {
          const exists = state.filters.priorities.includes(priority);
          const newPriorities = exists
            ? state.filters.priorities.filter((p) => p !== priority)
            : [...state.filters.priorities, priority];
          return {
            filters: { ...state.filters, priorities: newPriorities },
          };
        }),

      toggleTagFilter: (tag) =>
        set((state) => {
          const normalizedTag = tag.trim();
          if (!normalizedTag) return state;
          const exists = state.filters.tags.some(
            (t) => t.toLowerCase() === normalizedTag.toLowerCase(),
          );
          const newTags = exists
            ? state.filters.tags.filter(
                (t) => t.toLowerCase() !== normalizedTag.toLowerCase(),
              )
            : [...state.filters.tags, normalizedTag];
          return {
            filters: { ...state.filters, tags: newTags },
          };
        }),

      clearFilters: () =>
        set({ filters: INITIAL_FILTERS }),
    }),
    {
      name: 'kanban-storage',
      partialize: (state) => ({ tasks: state.tasks }),
      migrate: (persistedState: unknown) => {
        const state = persistedState as { tasks?: Task[] } | undefined;
        if (!state || !Array.isArray(state.tasks)) {
          return {
            tasks: INITIAL_TASKS,
            addingTo: null,
            selectedTaskId: null,
            viewMode: 'board',
            filters: INITIAL_FILTERS,
          };
        }
        const validTasks = state.tasks.filter(
          (t): t is Task => Boolean(t && typeof t.id === 'number' && t.status),
        );
        return {
          ...state,
          tasks: validTasks.length > 0 ? validTasks : INITIAL_TASKS,
          addingTo: null,
          selectedTaskId: null,
          viewMode: 'board',
          filters: INITIAL_FILTERS,
        };
      },
    },
  ),
);
