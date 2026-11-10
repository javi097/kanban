import type { KanbanFilters, Priority, Task } from '@/interfaces/kanban.interface';

/**
 * Normaliza una cadena de texto para comparaciones de búsqueda:
 * - Convierte a minúsculas
 * - Elimina espacios extremos
 * - Descompone y elimina caracteres diacríticos / tildes (normalización NFD)
 */
export function normalizeSearchText(text: unknown): string {
  if (typeof text !== 'string') {
    return '';
  }

  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Determina si una tarea coincide con una búsqueda de texto normalizada.
 * Si la query está vacía, devuelve true.
 * Busca coincidencias tanto en el título como en la descripción de la tarea.
 */
export function matchesSearch(task: Task, normalizedQuery: string): boolean {
  if (!normalizedQuery) {
    return true;
  }

  const normalizedTitle = normalizeSearchText(task.title);
  const normalizedDescription = normalizeSearchText(task.description);

  return (
    normalizedTitle.includes(normalizedQuery) ||
    normalizedDescription.includes(normalizedQuery)
  );
}

/**
 * Evalúa si una tarea coincide con los filtros de prioridad seleccionados.
 * Si no hay prioridades seleccionadas, devuelve true.
 * Aplica lógica OR: la tarea debe tener alguna de las prioridades elegidas.
 */
export function matchesPriorities(
  task: Task,
  selectedPriorities: readonly Priority[]
): boolean {
  if (!selectedPriorities || selectedPriorities.length === 0) {
    return true;
  }

  return selectedPriorities.includes(task.priority);
}

/**
 * Evalúa si una tarea coincide con las etiquetas seleccionadas.
 * Si no hay etiquetas seleccionadas, devuelve true.
 * Aplica lógica OR inclusiva: la tarea debe contener al menos una de las etiquetas.
 * La comparación es insensible a mayúsculas y espacios extremos.
 */
export function matchesTags(
  task: Task,
  selectedTags: readonly string[]
): boolean {
  if (!selectedTags || selectedTags.length === 0) {
    return true;
  }

  if (!task.tags || task.tags.length === 0) {
    return false;
  }

  const normalizedSelected = selectedTags.map((t) => t.trim().toLowerCase());

  return task.tags.some((tag) =>
    normalizedSelected.includes(tag.trim().toLowerCase())
  );
}

/**
 * Filtra una colección de tareas aplicando la combinación lógica AND entre:
 * 1. Búsqueda por texto (en título o descripción con insensibilidad a tildes/caja)
 * 2. Prioridades seleccionadas (OR)
 * 3. Etiquetas seleccionadas (OR inclusivo)
 *
 * Función 100% pura: devuelve un nuevo array y no muta el array original.
 */
export function filterTasks(
  tasks: readonly Task[],
  filters: KanbanFilters
): Task[] {
  if (!Array.isArray(tasks)) {
    return [];
  }

  if (!filters) {
    return [...tasks];
  }

  const normalizedQuery = normalizeSearchText(filters.searchQuery);

  return tasks.filter((task) => {
    const matchesQuery = matchesSearch(task, normalizedQuery);
    const matchesPriorityCriteria = matchesPriorities(task, filters.priorities);
    const matchesTagCriteria = matchesTags(task, filters.tags);

    return matchesQuery && matchesPriorityCriteria && matchesTagCriteria;
  });
}

/**
 * Extrae todas las etiquetas únicas presentes en el conjunto de tareas vivas,
 * eliminando duplicados sin distinguir mayúsculas/minúsculas y ordenándolas
 * alfabéticamente.
 */
export function getAvailableTags(tasks: readonly Task[]): string[] {
  if (!Array.isArray(tasks)) {
    return [];
  }

  const tagMap = new Map<string, string>();

  for (const task of tasks) {
    if (Array.isArray(task.tags)) {
      for (const tag of task.tags) {
        if (typeof tag === 'string') {
          const trimmed = tag.trim();
          if (trimmed.length > 0) {
            const key = trimmed.toLowerCase();
            if (!tagMap.has(key)) {
              tagMap.set(key, trimmed);
            }
          }
        }
      }
    }
  }

  return Array.from(tagMap.values()).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );
}

/**
 * Cuenta la cantidad total de criterios activos en el objeto de filtros:
 * - 1 si searchQuery contiene texto no vacío (tras trim)
 * - + número de prioridades seleccionadas
 * - + número de etiquetas seleccionadas
 */
export function countActiveFilters(filters: KanbanFilters): number {
  if (!filters) {
    return 0;
  }

  const queryActive =
    typeof filters.searchQuery === 'string' &&
    filters.searchQuery.trim().length > 0
      ? 1
      : 0;

  const prioritiesCount = Array.isArray(filters.priorities)
    ? filters.priorities.length
    : 0;

  const tagsCount = Array.isArray(filters.tags) ? filters.tags.length : 0;

  return queryActive + prioritiesCount + tagsCount;
}

/**
 * Determina si existe al menos un criterio de filtrado activo.
 */
export function hasActiveFilters(filters: KanbanFilters): boolean {
  return countActiveFilters(filters) > 0;
}
