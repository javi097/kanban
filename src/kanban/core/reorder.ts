import { arrayMove } from '@dnd-kit/sortable';
import type { Task, Status, UniqueId } from '@/interfaces/kanban.interface';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_VALUES: readonly Status[] = ['To Do', 'In Progress', 'Done'] as const;

/**
 * Extrae las tareas de una columna concreta conservando su orden relativo.
 * Pura: sin estado externo ni efectos secundarios.
 */
export function getColumnTasks(tasks: Task[], status: Status): Task[] {
  if (!Array.isArray(tasks)) return [];
  return tasks.filter((t): t is Task => Boolean(t && t.status === status));
}

/**
 * Convierte un task.id numérico al formato de UniqueId usado por @dnd-kit.
 * Las tarjetas se identifican como 'task-{id}'; las columnas por su Status.
 */
function toUniqueId(taskId: number | undefined | null): UniqueId {
  if (taskId === undefined || taskId === null) return '';
  return `task-${taskId}`;
}

// ---------------------------------------------------------------------------
// Reordenación intra-columna
// ---------------------------------------------------------------------------

/**
 * Reordena las tarjetas dentro de una misma columna usando arrayMove.
 * Pura: no lee ni escribe ningún estado externo.
 *
 * @param tasks    - Lista completa de tareas del tablero (inmutable).
 * @param status   - Nombre de la columna que contiene ambas tarjetas.
 * @param activeId - UniqueId ('task-{n}') de la tarjeta arrastrada.
 * @param overId   - UniqueId ('task-{n}') de la tarjeta destino.
 * @returns Nueva lista de tareas con el orden actualizado dentro de la columna.
 *          Devuelve la misma referencia si no hay cambios (RF-2.3).
 */
export function reorderInColumn(
  tasks: Task[],
  status: Status,
  activeId: UniqueId,
  overId: UniqueId,
): Task[] {
  if (!Array.isArray(tasks) || !status || !activeId || !overId) {
    return tasks || [];
  }

  if (activeId === overId) return tasks;

  const columnTasks = getColumnTasks(tasks, status).filter(
    (t): t is Task => Boolean(t && typeof t.id === 'number'),
  );

  const oldIndex = columnTasks.findIndex((t) => toUniqueId(t.id) === activeId);
  let newIndex = columnTasks.findIndex((t) => toUniqueId(t.id) === overId);

  // Si overId es el status de la columna (soltado en el contenedor/espacio vacío)
  if (newIndex === -1 && overId === status) {
    newIndex = columnTasks.length - 1;
  }

  // Tarjeta no encontrada o misma posición → sin cambios (RF-2.3)
  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return tasks;

  const reordered = arrayMove(columnTasks, oldIndex, newIndex);

  // Reconstruir la lista global sustituyendo solo el bloque de esta columna
  // y preservando el orden relativo de las tareas de otras columnas.
  let reorderedIndex = 0;
  const result: Task[] = [];

  for (const task of tasks) {
    if (!task) continue;

    if (task.status === status) {
      const nextTask = reordered[reorderedIndex++];
      if (nextTask) {
        result.push(nextTask);
      } else {
        result.push(task);
      }
    } else {
      result.push(task);
    }
  }

  return result.filter(
    (t): t is Task => Boolean(t && typeof t.id === 'number' && t.status),
  );
}

// ---------------------------------------------------------------------------
// Transferencia inter-columna
// ---------------------------------------------------------------------------

/**
 * Transfiere una tarjeta de una columna a otra, insertándola en la posición
 * indicada por overId.
 * Pura: no lee ni escribe ningún estado externo.
 *
 * @param tasks     - Lista completa de tareas del tablero (inmutable).
 * @param activeId  - UniqueId ('task-{n}') de la tarjeta arrastrada.
 * @param newStatus - Status de la columna destino.
 * @param overId    - UniqueId de la tarjeta sobre la que se inserta, o el
 *                    valor de Status de la columna destino si está vacía (CL-1).
 * @returns Nueva lista de tareas con la tarjeta transferida y su status actualizado.
 */
export function transferTask(
  tasks: Task[],
  activeId: UniqueId,
  newStatus: Status,
  overId: UniqueId,
): Task[] {
  if (!Array.isArray(tasks) || !activeId || !newStatus || !overId) {
    return tasks || [];
  }

  const activeTask = tasks.find(
    (t): t is Task => Boolean(t && toUniqueId(t.id) === activeId),
  );

  // Si la tarjeta activa no se encuentra, no continuar ni acceder a .status
  if (!activeTask || typeof activeTask.id !== 'number') return tasks;

  // Actualizar status manteniendo ID y resto de propiedades intactas
  const updated: Task = {
    ...activeTask,
    id: activeTask.id, // Preservar ID estrictamente
    status: newStatus,
  };

  // Eliminar la tarjeta original de la lista de forma inmutable
  const withoutActive = tasks.filter(
    (t): t is Task => Boolean(t && toUniqueId(t.id) !== activeId),
  );

  // Determinar si overId corresponde a un Status (columna vacía / encabezado)
  // o a un task UniqueId ('task-{n}')
  const overIsColumn = (STATUS_VALUES as readonly string[]).includes(overId);

  let result: Task[];

  if (overIsColumn) {
    // CL-1 / CL-3: soltar sobre columna vacía o su encabezado →
    // insertar al final del bloque de esa columna en la lista global.
    const lastDestIndex = withoutActive.reduce<number>(
      (lastIdx, task, idx) => (task && task.status === newStatus ? idx : lastIdx),
      -1,
    );
    const insertAt = lastDestIndex === -1 ? withoutActive.length : lastDestIndex + 1;
    result = [
      ...withoutActive.slice(0, insertAt),
      updated,
      ...withoutActive.slice(insertAt),
    ];
  } else {
    // overId es un 'task-{n}': insertar antes de esa tarjeta en la lista global
    const overIndex = withoutActive.findIndex(
      (t) => t && toUniqueId(t.id) === overId,
    );

    if (overIndex === -1) {
      // La tarjeta destino no existe → insertar al final
      result = [...withoutActive, updated];
    } else {
      result = [
        ...withoutActive.slice(0, overIndex),
        updated,
        ...withoutActive.slice(overIndex),
      ];
    }
  }

  // Garantizar que NUNCA se introduzca un elemento undefined ni se altere el contrato
  return result.filter(
    (t): t is Task => Boolean(t && typeof t.id === 'number' && t.status),
  );
}
