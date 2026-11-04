# MEMORY.md — Kanban Board

## Estado Actual
- [x] Repositorio Git inicializado y vinculado.
- [x] Configuración base de Vite + React 19 + TypeScript.
- [x] Tailwind CSS v4. `src/index.css` actualizado con variables de globals.css de v0 (incluye bloque `@media prefers-color-scheme: dark`). `src/App.css` eliminado.
- [x] Skills SDD y directrices copiadas en `.agents/skills/`.
- [x] `AGENTS.md` y `docs/constitution.md` confirmados.
- [x] `tsconfig.app.json` corregido: `baseUrl` + `paths` para alias `@/*`; `erasableSyntaxOnly` eliminado (TS ~5.7.3 no lo soporta). `npx tsc --noEmit` pasa limpio.
- [x] Dependencias del tablero instaladas (`@dnd-kit`, `zustand`, `lucide-react`, `shadcn`, `class-variance-authority`, etc.).
- [x] Maqueta v0 refactorizada e integrada:
  - `src/interfaces/kanban.interface.ts` → `Task`, `Column`, `Status`, `Priority`.
  - `src/kanban/store/kanban.store.ts` → Zustand con persistencia `'kanban-storage'`.
  - `src/kanban/components/Card/KanbanCard.tsx`
  - `src/kanban/components/Column/KanbanColumn.tsx`
  - `src/kanban/components/Board/BoardHeader.tsx`
  - `src/kanban/pages/BoardPage.tsx`
  - `src/App.tsx` → monta `<BoardPage />`.
- [ ] Implementar DnD completo (`useKanbanDnd`, `DragOverlay`) — Spec 001 pendiente.
- [ ] Añadir SearchInput, PriorityFilter, TagFilter (Controls).

## Decisiones Clave de Arquitectura
- **2026-11-04:** Adopción estricta de la metodología SDD (*Spec-Driven Development*).
- **2026-11-04:** Arquitectura modular por dominios centrada en `src/kanban/` (`interfaces` -> `core` -> `store` -> `components`).
- **2026-11-04:** Modelo de datos normalizado; las tareas usan `status: Status` como referencia a columna. Migración a `columnId` prevista al implementar DnD completo.
- **2026-11-04:** `@dnd-kit` con `<DragOverlay>` para el arrastre — pendiente de implementar.

## Errores a Evitar
- No importar `@/kanban/*` sin que `tsconfig.app.json` tenga `baseUrl` y `paths` (el raíz no se hereda al pasar `--project`).
- No acoplar DnD directamente en `KanbanCard`; mantener en hooks dedicados.
- Nunca mutar arrays en el store; siempre desestructuración inmutable.
- Prohibido `any` y usar índices de array como claves React o IDs de sensores DnD.
