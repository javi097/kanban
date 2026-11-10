# MEMORY.md — Kanban Board

## Estado Actual
- [x] Repositorio Git inicializado y vinculado.
- [x] Configuración Vite + React 18 + TypeScript con tipado estricto (cero `any`).
- [x] Tailwind CSS v4 con variables y directivas de diseño v0.
- [x] Manifiesto `AGENTS.md` y `docs/constitution.md` aprobados.
- [x] Spec 001 blindada al 100% y validada (`specs/001-dnd-core/`).
- [x] Spec 002 implementada al 100% y validada (`specs/002-task-crud-and-modal/`):
  - Lógica pura: `src/kanban/core/validator.ts` (`validateTaskTitle`, `validateTag`, `sanitizeTags`, `validateTaskPayload`).
  - Tests unitarios: 32/32 tests en verde (17 reorder + 15 validator en `src/kanban/core/__tests__/`).
  - Store: `updateTask`, `deleteTask`, `selectedTaskId` con `partialize` aislando el estado volátil de UI en `kanban-storage`.
  - UI Accesible: `dialog.tsx` y `alert-dialog.tsx` (`@base-ui/react`), `ConfirmDialog.tsx`, `CardPriorityBadge.tsx`, `CardTag.tsx`.
  - Componente modal: `CardDetailModal.tsx` con edición inline, validación reactiva y borrado defensivo.
  - Integración: clic vs arrastre desacoplado en `KanbanCard.tsx` y montaje en `BoardPage.tsx`.
- [ ] Spec 003 pendiente: Controles, filtros por texto/prioridad/tags y acciones en columna.

## Decisiones Clave de Arquitectura
- **2026-11-04:** Adopción estricta de SDD (*Spec-Driven Development*).
- **2026-11-05:** Colocalización de tests unitarios del core en `src/kanban/core/__tests__/` (constitution.md §1).
- **2026-11-05:** `UniqueId` como string formateado (`'task-{id}'` vs `Status`) para evitar colisiones entre tarjetas y columnas.
- **2026-11-05:** Desacoplar estado de `onDragOver`: commit atómico en `onDragEnd` para erradicar loops ("Maximum update depth exceeded").
- **2026-11-09:** `partialize` en `persist` de Zustand: persiste únicamente `tasks` en `localStorage['kanban-storage']`, evitando que `selectedTaskId` o `addingTo` dejen modales abiertos al recargar.
- **2026-11-10:** Primitivas de diálogo con `@base-ui/react` (alineadas con `button.tsx`), foco inicial seguro en cancelar en `alertdialog`, y desacoplamiento de clic en tarjeta mediante `isDragging` y `stopPropagation()`.

## Errores a Evitar
- Prohibido llamar a `setState` o `store.reorderTasks` en `handleDragOver`: provoca oscilación y loop infinito de render.
- No persistir estados transitorios de UI (`selectedTaskId`, `addingTo`) en `localStorage`.
- No omitir `onDragCancel` en `<DndContext>`.
- Prohibido dejar que `reorderInColumn` o `transferTask` puedan retornar arrays con elementos `undefined`.
- En acciones destructivas, enfocar siempre el botón seguro/cancelar por defecto.
