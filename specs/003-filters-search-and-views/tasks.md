# Tareas — Spec 003: Filtros, Búsqueda y Vistas Alternativas
Estado: pendiente

## Lista de Tareas Atómicas

- [x] **T1. Contratos de TypeScript para filtros y modo de vista en `src/interfaces/kanban.interface.ts`.** RF-1.2, RF-3.1, RNF-3
  - Hecho cuando: `npx tsc --noEmit` compila limpiamente exportando `KanbanViewMode` y `KanbanFilters` con tipado estricto sin `any`.

- [ ] **T2. Funciones puras de filtrado, normalización y cálculo de etiquetas en `src/kanban/core/filter.ts`.** RF-1.2, RF-1.3, RF-2.2, RNF-1, CL-3, CL-4
  - Hecho cuando: `normalizeSearchText`, `matchesSearch`, `matchesPriorities`, `matchesTags`, `filterTasks`, `getAvailableTags`, `countActiveFilters` y `hasActiveFilters` están implementadas como funciones matemáticas puras sin dependencias de React ni Zustand.

- [ ] **T3. Suite de tests unitarios para filtrado en `src/kanban/core/__tests__/filter.test.ts`.** RF-1.2, RF-1.3, RF-2.2, RNF-1, CL-1, CL-2, CL-3, CL-4
  - Hecho cuando: `npx vitest run src/kanban/core/__tests__/filter.test.ts` pasa al 100% cubriendo `TC-FILT-1` a `TC-FILT-14` (normalización NFD, insensibilidad a tildes/caja, búsquedas vacías, lógica combinatoria AND/OR, inmutabilidad y etiquetas dinámicas).

- [ ] **T4. Primitiva UI accesible `popover.tsx` en `src/components/ui/popover.tsx`.** RF-2.1, RNF-4
  - Hecho cuando: Se exportan `PopoverRoot`, `PopoverTrigger`, `PopoverContent` y `PopoverClose` basados en `@base-ui/react/popover` con estilos Tailwind, animaciones suaves, portales y soporte de foco WAI-ARIA.

- [ ] **T5. Ampliación del store Zustand con filtros y modo de vista en `src/kanban/store/kanban.store.ts`.** RF-1.1, RF-2.2, RF-2.3, RF-3.1, RF-3.5
  - Hecho cuando: El store gestiona `viewMode`, `filters` y las acciones `setViewMode`, `setSearchQuery`, `togglePriorityFilter`, `toggleTagFilter` y `clearFilters` de forma inmutable, aislados de `localStorage` mediante `partialize`.

- [ ] **T6. Componente de búsqueda reactiva `SearchInput.tsx` en `src/kanban/components/Controls/SearchInput.tsx`.** RF-1.1, RF-1.3, CL-3, CL-4
  - Hecho cuando: El componente renderiza un campo accesible con botón para limpiar texto (`X`), tecla `Escape` para cerrar/limpiar y conexión reactiva con `setSearchQuery`.

- [ ] **T7. Panel flotante de filtros `BoardFilterPopover.tsx` en `src/kanban/components/Controls/BoardFilterPopover.tsx`.** RF-2.1, RF-2.2, RF-2.3, CL-2
  - Hecho cuando: El popover incluye botón disparador con badge numérico de criterios activos, selectores de prioridad (`CardPriorityBadge`), etiquetas dinámicas (`getAvailableTags`) y botón "Limpiar filtros".

- [ ] **T8. Integración de controles en `BoardHeader.tsx` y estado vacío amigable en `KanbanColumn.tsx`.** RF-1.1, RF-1.4, RF-2.1, RF-4.1, CL-1
  - Hecho cuando: `BoardHeader` monta `SearchInput` y `BoardFilterPopover`, y `KanbanColumn` renderiza solo las tarjetas filtradas, manteniendo el dropzone operativo y mostrando el placeholder informativo si no hay coincidencias.

- [ ] **T9. Vista alternativa de lista `ListView.tsx` en `src/kanban/components/List/ListView.tsx`.** RF-3.2, RF-3.3, RF-3.4, RF-4.2, CL-6
  - Hecho cuando: `ListView` renderiza las tarjetas filtradas organizadas por columnas/estado con sus metadatos y hacer clic en cualquier fila ejecuta `setSelectedTaskId` abriendo `CardDetailModal`.

- [ ] **T10. Integración en `BoardPage.tsx` y verificación end-to-end completa.** RF-1.1 a RF-4.2, CL-1 a CL-6
  - Hecho cuando: El conmutador "Board / List" alterna reactivamente la visualización, el contador contextual refleja `X de Y tarjetas`, y `npx vitest run`, `npx tsc --noEmit`, `npm run lint` y `npm run build` pasan limpios con 0 errores.
