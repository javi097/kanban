# Tareas — Spec 002: Gestión CRUD y Detalle de Tarea
Estado: pendiente

## Lista de Tareas Atómicas

- [x] **T1. Contratos de TypeScript para actualización y validación en `src/interfaces/kanban.interface.ts`.** RF-2.1, RF-2.5, RNF-3
  - Hecho cuando: `npx tsc --noEmit` compila limpiamente exportando `UpdateTaskPayload`, `ValidationResult<T>` y `TaskPayloadValidationResult` sin tipos implícitos ni `any`.

- [x] **T2. Funciones puras de validación y sanitización en `src/kanban/core/validator.ts`.** RF-2.2, RF-3.1, RF-3.3, CL-2
  - Hecho cuando: `validateTaskTitle`, `validateTag`, `sanitizeTags` y `validateTaskPayload` están implementadas como funciones matemáticas puras sin dependencias de React ni Zustand.

- [x] **T3. Suite de tests unitarios para validadores en `src/kanban/core/__tests__/validator.test.ts`.** RF-2.2, RF-3.3, CL-2
  - Hecho cuando: `npx vitest run src/kanban/core/__tests__/validator.test.ts` pasa al 100% cubriendo `TC-VAL-1` a `TC-VAL-12` (títulos vacíos, espacios, unicidad insensible a mayúsculas/minúsculas y longitud máxima).

- [x] **T4. Ampliación inmutable del store Zustand con `updateTask`, `deleteTask` y `selectedTaskId` en `src/kanban/store/kanban.store.ts`.** RF-2.4, RF-2.5, RF-4.3, RF-5.1, RNF-2, CL-3
  - Hecho cuando: El store gestiona `selectedTaskId`, actualiza tareas inmutablemente con `.map()`, borra con `.filter()`, resetea la selección si la tarea activa se elimina, y aísla la persistencia con `partialize` bajo `kanban-storage`.

- [x] **T5. Primitivas UI accesibles `dialog.tsx` y `alert-dialog.tsx` en `src/components/ui/`.** RF-1.3, RF-4.2, RNF-1
  - Hecho cuando: Se exportan los componentes basados en `@base-ui/react/dialog` y `@base-ui/react/alert-dialog` con estilos de Tailwind, soporte de animaciones y atributos WAI-ARIA acordes a `button.tsx`.

- [x] **T6. Diálogo de confirmación defensivo `ConfirmDialog.tsx` en `src/components/custom/ConfirmDialog.tsx`.** RF-4.2, RNF-1
  - Hecho cuando: El componente accesible renderiza un `alertdialog` con variantes destructiva/por defecto, botón de confirmación tipado y foco inicial seguro en cancelar.

- [x] **T7. Componentes atómicos `CardPriorityBadge.tsx` y `CardTag.tsx` en `src/kanban/components/Card/`.** RF-1.2, RF-2.3, RF-3.2
  - Hecho cuando: `CardPriorityBadge` muestra el estilo específico de cada prioridad y `CardTag` renderiza etiquetas con soporte opcional de botón de eliminación `X` (`onRemove`).

- [x] **T8. Modal de detalle e inspección de tarea `CardDetailModal.tsx` en `src/kanban/components/Card/CardDetailModal.tsx`.** RF-1.2, RF-1.3, RF-2.1, RF-2.2, RF-2.3, RF-2.4, RF-3.1, RF-3.2, RF-3.3, RF-4.1, CL-2, CL-3
  - Hecho cuando: El modal visualiza todos los campos de la tarea, permite edición inline con validación en tiempo real de títulos y tags, selector de status/prioridad, y dispara la confirmación de borrado.

- [ ] **T9. Desacoplamiento de clic vs arrastre y menú de opciones en `KanbanCard.tsx`.** RF-1.1, RF-4.1, CL-1
  - Hecho cuando: Hacer clic en una tarjeta abre el modal (`setSelectedTaskId`) sin dispararse durante arrastres (`isDragging` o desplazamiento > 5px), y el botón de opciones no propaga el evento de clic.

- [ ] **T10. Integración en `BoardPage.tsx` y verificación end-to-end con tests, linter, build y navegador.** RF-1.1 a RF-5.1, CL-1 a CL-3
  - Hecho cuando: `CardDetailModal` se monta en `BoardPage`, `npx vitest run`, `npx tsc --noEmit`, `npm run lint` y `npm run build` pasan limpios, y se verifica en el navegador la persistencia completa tras recargar.
