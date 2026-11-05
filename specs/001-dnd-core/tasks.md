# Tasks 001 — Drag & Drop Core con @dnd-kit
Estado: pendiente  
Plan: `specs/001-dnd-core/plan.md` (aprobado)

---

> [!IMPORTANT] Cada tarea es atómica: se implementa, pasa `npx tsc --noEmit` y `npm run lint` en verde, y solo entonces se marca como hecha. No se avanza a la siguiente sin que la actual esté completa.

---

## Bloque A — Contratos y lógica pura

- [x] **T1. Añadir `UniqueId` a la interfaz global.** RF-3.3, RNF-3
  - Editar `src/interfaces/kanban.interface.ts`: exportar `export type UniqueId = string;`.
  - Hecho cuando: `npx tsc --noEmit` pasa limpio y el tipo es importable desde cualquier módulo con `@/interfaces/kanban.interface`.

- [x] **T2. Crear `src/kanban/core/reorder.ts` con las funciones puras.** RF-2.2, RF-2.3, RF-3.3, RNF-2, RNF-3
  - Implementar y exportar `reorderInColumn(tasks, status, activeId, overId): Task[]`.
  - Implementar y exportar `transferTask(tasks, activeId, newStatus, overId): Task[]`.
  - Implementar y exportar el helper `getColumnTasks(tasks, status): Task[]`.
  - Cero importaciones de React, Zustand o @dnd-kit en este archivo.
  - Hecho cuando: el archivo compila sin errores y todas las funciones están exportadas con sus firmas tipadas.

- [x] **T3. Crear la suite de tests unitarios en `src/kanban/core/__tests__/reorder.test.ts`.** RF-2.2, RF-2.3, RF-3.3, RNF-2, CL-1
  - Definir un fixture de 7 tareas hardcodeado (IDs como `'task-1'`…`'task-7'`), sin imports de store ni React.
  - Implementar los 12 casos TC-1 a TC-12 descritos en `plan.md §7`.
  - Hecho cuando: `npm test` ejecuta los 12 casos y todos pasan en verde con 0 fallos.

---

## Bloque B — Store Zustand

- [x] **T4. Actualizar `src/kanban/store/kanban.store.ts`: añadir `reorderTasks` y eliminar `moveTask`.** RF-2.2, RF-3.3, RF-5.1, RNF-2
  - Añadir la acción `reorderTasks: (newTasks: Task[]) => void` que llama a `set({ tasks: newTasks })`.
  - Eliminar la acción `moveTask` (obsoleta con la nueva arquitectura DnD).
  - Hecho cuando: `npx tsc --noEmit` pasa limpio y no existe ninguna referencia a `moveTask` en el codebase (`grep -r moveTask src` devuelve vacío).

---

## Bloque C — Hook de orquestación

- [x] **T5. Crear `src/kanban/hooks/useKanbanDnd.ts`.** RF-1.1, RF-1.2, RF-1.3, RF-2.1, RF-3.1, RF-4.1, RF-4.2
  - Configurar `PointerSensor` con `activationConstraint: { distance: 5 }`.
  - Configurar `KeyboardSensor` con `sortableKeyboardCoordinates`.
  - Implementar `handleDragStart`: captura `activeTask` por `active.id`.
  - Implementar `handleDragOver`: actualización optimista inter-columna llamando a `transferTask` + `reorderTasks`.
  - Implementar `handleDragEnd`: reordenación intra-columna llamando a `reorderInColumn` + `reorderTasks`; guard `!over` para RF-4.2.
  - Implementar la función privada `resolveStatus(id: UniqueId, tasks: Task[]): Status | undefined`.
  - Exportar el tipo `UseKanbanDndReturn` con las props del hook.
  - Hecho cuando: `npx tsc --noEmit` pasa limpio y el hook exporta exactamente `{ sensors, activeTask, handleDragStart, handleDragOver, handleDragEnd }`.

---

## Bloque D — Componentes visuales

- [x] **T6. Crear `src/kanban/components/Board/DragOverlayCard.tsx`.** RF-1.3, HU-3
  - Reutilizar el marcado visual de `KanbanCard` sin `useSortable`.
  - Aplicar clases Tailwind de vuelo: `rotate-1 shadow-xl opacity-95 scale-[1.02]`.
  - Props: `interface Props { task: Task }`.
  - Hecho cuando: el componente compila, no tiene estado propio ni efectos secundarios, y `npx tsc --noEmit` pasa limpio.

- [x] **T7. Modificar `src/kanban/components/Card/KanbanCard.tsx`: integrar `useSortable`.** RF-1.3, RF-1.4, RNF-3
  - Llamar a `useSortable({ id: 'task-' + task.id })` y conectar `setNodeRef`, `style` (con `CSS.Transform.toString`), `attributes` y `listeners` al `<article>`.
  - Aplicar `opacity-40` al `<article>` cuando `isDragging === true`.
  - Hecho cuando: `npx tsc --noEmit` pasa limpio y la tarjeta se muestra semitransparente en su posición original durante el arrastre (verificación visual en el navegador).

- [x] **T8. Modificar `src/kanban/components/Column/KanbanColumn.tsx`: añadir `useDroppable` y `SortableContext`.** RF-3.1, RF-3.2, CL-1, CL-3
  - Llamar a `useDroppable({ id: name })` y conectar `setNodeRef` al contenedor exterior de la columna.
  - Envolver la lista de tarjetas con `<SortableContext items={columnTasks.map(t => 'task-' + t.id)} strategy={verticalListSortingStrategy}>`.
  - Hecho cuando: `npx tsc --noEmit` pasa limpio y una columna vacía acepta tarjetas soltadas en ella (verificación visual).

- [x] **T9. Modificar `src/kanban/pages/BoardPage.tsx`: montar `DndContext` y `DragOverlay`.** RF-1.3, RF-2.1, RF-3.1, RF-4.1, RF-4.2
  - Llamar a `useKanbanDnd()` y conectar sus handlers y sensores a `<DndContext collisionDetection={closestCorners} ...>`.
  - Envolver la sección de columnas con ese `DndContext`.
  - Renderizar `<DragOverlay>{activeTask ? <DragOverlayCard task={activeTask} /> : null}</DragOverlay>` dentro del `DndContext`.
  - Hecho cuando: `npx tsc --noEmit` pasa limpio y la aplicación se ve y funciona en `http://localhost:5173`.

---

## Bloque E — Validación final

- [ ] **T10. Validación end-to-end y criterios de finalización de la spec.** Todos los RF
  - Verificar en el navegador (Chrome DevTools MCP) que:
    - [ ] Una tarjeta muestra clon flotante (`DragOverlayCard`) al arrastrarla.
    - [ ] Se puede reordenar dentro de la misma columna y el nuevo orden persiste tras `F5`.
    - [ ] Se puede mover entre columnas y el contador de cada columna se actualiza.
    - [ ] Soltar fuera del tablero devuelve la tarjeta a su posición original sin corromper el estado.
    - [ ] Pulsar `Escape` cancela el arrastre sin alterar el estado.
    - [ ] `localStorage['kanban-storage']` refleja el nuevo orden tras cada movimiento.
  - Pasar `npx tsc --noEmit` con 0 errores.
  - Pasar `npm run lint` con 0 warnings ni errores.
  - Hecho cuando: todos los criterios de finalización de `spec.md` están marcados en verde.

- [ ] **T11. Actualizar `MEMORY.md` y marcar la spec como implementada.**
  - Cambiar `Estado: aprobada` → `Estado: implementada` en `specs/001-dnd-core/spec.md`.
  - Registrar en `MEMORY.md`: decisiones tomadas, archivos creados/modificados y errores a evitar.
  - Hecho cuando: `MEMORY.md` y `spec.md` reflejan el estado final de la implementación.
