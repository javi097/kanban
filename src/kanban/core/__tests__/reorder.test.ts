import { describe, it, expect } from 'vitest';
import { reorderInColumn, transferTask, getColumnTasks } from '@/kanban/core/reorder';
import type { Task } from '@/interfaces/kanban.interface';

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
    // 1→2→3 debe quedar 2→3→1
    expect(col.map((t) => t.id)).toEqual([2, 3, 1]);
  });

  it('TC-2: mueve una tarjeta hacia arriba dentro de la columna', () => {
    const result = reorderInColumn(tasks(), 'To Do', 'task-3', 'task-1');
    const col = getColumnTasks(result, 'To Do');
    // 1→2→3 debe quedar 3→1→2
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
});

// ---------------------------------------------------------------------------
// transferTask
// ---------------------------------------------------------------------------
describe('transferTask', () => {
  it('TC-7: inserta la tarjeta antes de la tarjeta destino en otra columna', () => {
    // Mover task-1 (To Do) → In Progress, antes de task-4
    const result = transferTask(tasks(), 'task-1', 'In Progress', 'task-4');
    const col = getColumnTasks(result, 'In Progress');
    // Debe quedar: task-1, task-4, task-5
    expect(col.map((t) => t.id)).toEqual([1, 4, 5]);
  });

  it('TC-8: transfiere a columna vacía (CL-1) → la tarjeta queda sola', () => {
    // Eliminar las tareas de Done para simular columna vacía
    const withoutDone = tasks().filter((t) => t.status !== 'Done');
    const result = transferTask(withoutDone, 'task-1', 'Done', 'Done');
    const col = getColumnTasks(result, 'Done');
    expect(col).toHaveLength(1);
    expect(col[0].id).toBe(1);
  });

  it('TC-9: devuelve la lista sin cambios si la tarjeta activa no existe', () => {
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
    // Mover task-1 (To Do) → In Progress usando el Status como overId
    const result = transferTask(tasks(), 'task-1', 'In Progress', 'In Progress');
    const col = getColumnTasks(result, 'In Progress');
    // task-4, task-5 ya estaban; task-1 se añade al final
    expect(col.map((t) => t.id)).toEqual([4, 5, 1]);
  });
});
