# MEMORY.md — Kanban Board

## Estado Actual
- [x] Repositorio Git inicializado y vinculado.
- [x] Configuración base de Vite + React 19 + TypeScript.
- [x] Tailwind CSS v4 con variables y directivas de diseño v0.
- [x] Manifiesto `AGENTS.md` y `docs/constitution.md` aprobados.
- [x] Spec 001 implementada y validada (`specs/001-dnd-core/`):
  - Lógica pura: `src/kanban/core/reorder.ts` (`reorderInColumn`, `transferTask`, `getColumnTasks`).
  - Tests unitarios: `src/kanban/core/__tests__/reorder.test.ts` (12/12 en verde).
  - Store: `reorderTasks` en Zustand con persistencia en `localStorage['kanban-storage']`.
  - Hook & DnD: `useKanbanDnd`, `<DndContext>`, `closestCorners`, `DragOverlay` y `DragOverlayCard`.
  - Componentes accesibles e interactivos con soporte de teclado y puntero (`PointerSensor`, `KeyboardSensor`).
- [ ] Spec 002 pendiente: Controles, filtros por texto/prioridad/tags y acciones en columna.

## Decisiones Clave de Arquitectura
- **2026-11-04:** Adopción estricta de SDD (*Spec-Driven Development*).
- **2026-11-05:** Colocalización de tests unitarios del core en `src/kanban/core/__tests__/` (constitution.md §1).
- **2026-11-05:** `UniqueId` como string formateado (`'task-{id}'` vs `Status`) para evitar colisiones entre tarjetas y columnas droppables.
- **2026-11-05:** Actualización optimista inter-columna en `handleDragOver` y commit en `handleDragEnd` para 60 FPS estables sin tirones visuales.
- **2026-11-05:** Reemplazo de `moveTask` por `reorderTasks(Task[])` en el store, asegurando que la posición ordinal en el array sea la única fuente de verdad.

## Errores a Evitar
- No importar módulos fuera de su dominio sin contrato tipado en `interfaces/`.
- No usar `closestCenter` en tableros Kanban con columnas vacías; usar `closestCorners`.
- No pasar índices de array numéricos a `useSortable`; usar siempre identificadores estables `task-${id}`.
- Nunca mutar arrays directamente en las acciones del store ni en los eventos de DnD; utilizar siempre desestructuración o utilidades inmutables.
