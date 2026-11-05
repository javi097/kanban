import { describe, it, expect } from 'vitest';
import { reorderInColumn, transferTask, getColumnTasks } from '@/kanban/core/reorder';
import type { Task, Status } from '@/interfaces/kanban.interface';

// ---------------------------------------------------------------------------
// Fixture: 7 tareas distribuidas en 3 columnas (sin imports de store ni React)
// IDs de sensor con formato 'task-{n}'; columnas identificadas por su Status.
// ---------------------------------------------------------------------------
const FIXTURE: Task[] = [
  { id: 1, title: 'Task 1', description: '', tags: [], priority: 'High',   status: 'To Do'      },
  { id: 2, title: 'Task 2', description: '', tags: [], priority: 'Medium', status: 'To Do'      },
  { id: 3, title: 'Task 3', description: '', tags: [], priority: 'Low',    status: 'To Do'      },
  { id: 4, title: 'Task 4', description: '', tags: [], priority: 'High',   status: 'In Progress' },
  { id: 5, title: 'Task 5', description: '', tags: [], priority: 'Medium', status: 'In Progress' },
  { id: 6, title: 'Task 6', description: '', tags: [], priority: 'Low',    status: 'Done'       },
  { id: 7, title: 'Task 7', description: '', tags: [], priority: 'Medium', status: 'Done'       },
];

/** Devuelve una copia profunda del fixture para aislar cada test. */
function tasks(): Task[] {
  return FIXTURE.map((t) => ({ ...t }));
}

// ---------------------------------------------------------------------------
// reorderInColumn
// ---------------------------------------------------------------------------
describe('reorderInColumn', () => {
  it('TC-1: mueve una tarjeta hacia abajo dentro de la columna', () => {
    const result = reorderInColumn(tasks(), 'To Do', 'task-1', 'task-3');
    const col = getColumnTasks(result, 'To Do');
    expect(col.map((t) => t.id)).toEqual([2, 3, 1]);
  });

  it('TC-2: mueve una tarjeta hacia arriba dentro de la columna', () => {
    const result = reorderInColumn(tasks(), 'To Do', 'task-3', 'task-1');
    const col = getColumnTasks(result, 'To Do');
    expect(col.map((t) => t.id)).toEqual([3, 1, 2]);
  });

  it('TC-3: devuelve la misma referencia si activeId === overId (RF-2.3)', () => {
    const original = tasks();
    const result = reorderInColumn(original, 'To Do', 'task-1', 'task-1');
    expect(result).toBe(original);
  });

  it('TC-4: devuelve la lista sin cambios si la tarjeta activa no existe', () => {
    const original = tasks();
    const result = reorderInColumn(original, 'To Do', 'task-99', 'task-1');
    expect(result).toBe(original);
  });

  it('TC-5: no muta el array original (RNF-2)', () => {
    const original = tasks();
    const snapshot = original.map((t) => ({ ...t }));
    reorderInColumn(original, 'To Do', 'task-1', 'task-3');
    expect(original).toEqual(snapshot);
  });

  it('TC-6: las tareas de otras columnas no cambian de posición ni status', () => {
    const result = reorderInColumn(tasks(), 'To Do', 'task-1', 'task-3');
    const inProgress = getColumnTasks(result, 'In Progress');
    const done       = getColumnTasks(result, 'Done');
    expect(inProgress.map((t) => t.id)).toEqual([4, 5]);
    expect(done.map((t) => t.id)).toEqual([6, 7]);
  });

  it('TC-GUARD-1: maneja arrays con valores nulos sin introducir undefined ni romper', () => {
    const corruptedTasks = [
      ...tasks(),
      undefined as unknown as Task,
      null as unknown as Task,
    ];
    const result = reorderInColumn(corruptedTasks, 'To Do', 'task-1', 'task-2');
    expect(result.every((t) => t !== undefined && t !== null)).toBe(true);
    expect(result.every((t) => typeof t.id === 'number')).toBe(true);
  });

  it('TC-GUARD-COLUMN: soltar sobre el ID de la columna mueve la tarjeta al final', () => {
    const result = reorderInColumn(tasks(), 'To Do', 'task-1', 'To Do');
    const col = getColumnTasks(result, 'To Do');
    expect(col.map((t) => t.id)).toEqual([2, 3, 1]);
  });
});

// ---------------------------------------------------------------------------
// transferTask
// ---------------------------------------------------------------------------
describe('transferTask', () => {
  it('TC-7: inserta la tarjeta antes de la tarjeta destino en otra columna', () => {
    const result = transferTask(tasks(), 'task-1', 'In Progress', 'task-4');
    const col = getColumnTasks(result, 'In Progress');
    expect(col.map((t) => t.id)).toEqual([1, 4, 5]);
  });

  it('TC-8: transfiere a columna vacía (CL-1) → la tarjeta queda sola', () => {
    const withoutDone = tasks().filter((t) => t.status !== 'Done');
    const result = transferTask(withoutDone, 'task-1', 'Done', 'Done');
    const col = getColumnTasks(result, 'Done');
    expect(col).toHaveLength(1);
    expect(col[0].id).toBe(1);
  });

  it('TC-9: devuelve la lista sin cambios si la tarjeta activa no existe (sin acceder a .status)', () => {
    const original = tasks();
    const result = transferTask(original, 'task-99', 'In Progress', 'task-4');
    expect(result).toBe(original);
  });

  it('TC-10: actualiza el status de la tarjeta transferida al nuevo valor', () => {
    const result = transferTask(tasks(), 'task-1', 'Done', 'task-6');
    const moved = result.find((t) => t.id === 1);
    expect(moved?.status).toBe('Done');
  });

  it('TC-11: no muta el array original (RNF-2)', () => {
    const original = tasks();
    const snapshot = original.map((t) => ({ ...t }));
    transferTask(original, 'task-1', 'In Progress', 'task-4');
    expect(original).toEqual(snapshot);
  });

  it('TC-12: insertar con overId=Status añade la tarjeta al final del bloque destino', () => {
    const result = transferTask(tasks(), 'task-1', 'In Progress', 'In Progress');
    const col = getColumnTasks(result, 'In Progress');
    expect(col.map((t) => t.id)).toEqual([4, 5, 1]);
  });

  it('TC-GUARD-2: nunca introduce un elemento undefined en el array resultante', () => {
    const corruptedTasks = [
      ...tasks(),
      undefined as unknown as Task,
      null as unknown as Task,
    ];
    const result = transferTask(corruptedTasks, 'task-1', 'In Progress', 'task-4');
    expect(result.every((t) => t !== undefined && t !== null)).toBe(true);
    expect(result.some((t) => t === undefined)).toBe(false);
  });

  it('TC-GUARD-3: preserva estrictamente los IDs sin mutarlos', () => {
    const original = tasks();
    const originalIds = original.map((t) => t.id);
    const result = transferTask(original, 'task-2', 'Done', 'task-6');
    const resultIds = result.map((t) => t.id);

    // Mismo conjunto de IDs exactamente
    expect(resultIds.sort((a, b) => a - b)).toEqual(originalIds.sort((a, b) => a - b));

    // La tarjeta transferida mantiene su ID inalterado
    const transferred = result.find((t) => t.id === 2);
    expect(transferred).toBeDefined();
    expect(transferred?.id).toBe(2);
    expect(transferred?.status).toBe('Done');
  });

  it('TC-GUARD-4: retorna el array seguro si los parámetros son inválidos', () => {
    const original = tasks();
    expect(transferTask(null as unknown as Task[], 'task-1', 'Done', 'Done')).toEqual([]);
    expect(transferTask(original, '', 'Done', 'Done')).toBe(original);
    expect(transferTask(original, 'task-1', '' as unknown as Status, 'Done')).toBe(original);
  });
});
