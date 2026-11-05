# MEMORY.md — Kanban Board

## Estado Actual
- [x] Repositorio Git inicializado y vinculado.
- [x] Configuración Vite + React 18 + TypeScript con tipado estricto (cero `any`).
- [x] Tailwind CSS v4 con variables y directivas de diseño v0.
- [x] Manifiesto `AGENTS.md` y `docs/constitution.md` aprobados.
- [x] Spec 001 blindada al 100% y validada (`specs/001-dnd-core/`):
  - Lógica pura: `src/kanban/core/reorder.ts` (`reorderInColumn`, `transferTask`, `getColumnTasks`) blindada con sanitización estricta.
  - Tests unitarios: `src/kanban/core/__tests__/reorder.test.ts` (17/17 en verde).
  - Store: `reorderTasks` en Zustand con middleware `persist` y hook `migrate` para sanitizar `localStorage['kanban-storage']`.
  - Hook & DnD: `useKanbanDnd` sin mutación mid-drag en `handleDragOver` (previene "Maximum update depth exceeded"), commit atómico en `handleDragEnd`.
  - Detección de colisiones: híbrida determinista (`pointerWithin` -> `rectIntersection` -> `closestCorners`).
  - Resiliencia UI: `ErrorBoundary` en `src/components/custom/ErrorBoundary.tsx` envolviendo `App.tsx`.
- [ ] Spec 002 pendiente: Controles, filtros por texto/prioridad/tags y acciones en columna.

## Decisiones Clave de Arquitectura
- **2026-11-04:** Adopción estricta de SDD (*Spec-Driven Development*).
- **2026-11-05:** Colocalización de tests unitarios del core en `src/kanban/core/__tests__/` (constitution.md §1).
- **2026-11-05:** `UniqueId` como string formateado (`'task-{id}'` vs `Status`) para evitar colisiones entre tarjetas y columnas.
- **2026-11-05:** Inclusión de `migrate` en `persist` de Zustand para autosanitizar estados cacheados en navegadores clientes.
- **2026-11-05:** Incorporación de `ErrorBoundary` en la raíz para garantizar cero pantallas en negro ante excepciones.
- **2026-11-05:** Desacoplar estado de `onDragOver`: la transferencia inter-columna y reordenación se ejecuta exclusivamente en `onDragEnd` para erradicar loops de render ("Maximum update depth exceeded"). Feedback visual mid-drag gestionado con `DragOverlay` y `isOver`.

## Errores a Evitar
- Prohibido llamar a `setState` o `store.reorderTasks` en `handleDragOver`: provoca oscilación y loop infinito de render.
- No dejar componentes sin validación defensiva (`task && task.status === name`).
- En Zustand persist, proveer siempre función `migrate` para evitar estados cacheados corruptos.
- No omitir `onDragCancel` en `<DndContext>`.
- Prohibido dejar que `reorderInColumn` o `transferTask` puedan retornar arrays con elementos `undefined`.
