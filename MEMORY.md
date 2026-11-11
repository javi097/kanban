# MEMORY.md — Kanban Board

## Estado Actual
- [x] Repositorio Git inicializado y vinculado.
- [x] Configuración Vite + React 18 + TypeScript con tipado estricto (cero `any`).
- [x] Tailwind CSS v4 con variables y directivas de diseño v0.
- [x] Manifiesto `AGENTS.md` y `docs/constitution.md` aprobados.
- [x] Spec 001 blindada al 100% y validada (`specs/001-dnd-core/`).
- [x] Spec 002 implementada al 100% y validada (`specs/002-task-crud-and-modal/`).
- [x] Spec 003 implementada al 100% y validada (`specs/003-filters-search-and-views/`):
  - Lógica pura: `src/kanban/core/filter.ts` (normalización NFD, insensibilidad a tildes/caja, combinatoria AND/OR, etiquetas dinámicas).
  - Tests unitarios: 46/46 tests en verde (14 filter + 15 validator + 17 reorder).
  - Store: `viewMode` y `filters` en Zustand aislados de `localStorage` con `partialize`.
  - UI y Controles: `popover.tsx` (@base-ui/react), `SearchInput.tsx`, `BoardFilterPopover.tsx`.
  - Vistas: Conmutador reactivo Board/List en `BoardPage.tsx` con contador contextual `X de Y tarjetas`, estado vacío amigable en columnas y `ListView.tsx` con DnD desactivado.

## Decisiones Clave de Arquitectura
- **2026-11-04:** Adopción estricta de SDD (*Spec-Driven Development*).
- **2026-11-05:** Colocalización de tests unitarios del core en `src/kanban/core/__tests__/` (constitution.md §1).
- **2026-11-05:** `UniqueId` como string formateado (`'task-{id}'` vs `Status`) para evitar colisiones entre tarjetas y columnas.
- **2026-11-05:** Desacoplar estado de `onDragOver`: commit atómico en `onDragEnd` para erradicar loops ("Maximum update depth exceeded").
- **2026-11-09:** `partialize` en `persist` de Zustand: persiste únicamente `tasks` en `localStorage['kanban-storage']`, evitando que `selectedTaskId`, `filters` o `viewMode` bloqueen la interfaz al recargar.
- **2026-11-10:** Primitivas de diálogo y popover con `@base-ui/react` (alineadas con `button.tsx`), foco inicial seguro en cancelar en `alertdialog`, y desacoplamiento de clic en tarjeta mediante `isDragging` y `stopPropagation()`.
- **2026-11-11:** Normalización NFD con regex en `filter.ts` para búsquedas canónicas insensibles a acentos. DnD desactivado por diseño en `ListView` para optimizar lectura secuencial.

## Errores a Evitar
- Prohibido llamar a `setState` o `store.reorderTasks` en `handleDragOver`: provoca oscilación y loop infinito de render.
- No persistir estados transitorios de UI (`selectedTaskId`, `addingTo`, `filters`, `viewMode`) en `localStorage`.
- No omitir `onDragCancel` en `<DndContext>`.
- Prohibido dejar que `reorderInColumn` o `transferTask` puedan retornar arrays con elementos `undefined`.
- En acciones destructivas, enfocar siempre el botón seguro/cancelar por defecto.
- No mutar el array de tareas en funciones del core: retornar siempre una nueva referencia inmutable.
