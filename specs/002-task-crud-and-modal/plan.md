# Plan Técnico — Spec 002: Gestión CRUD y Detalle de Tarea
Estado: borrador

## 1. Resumen de Arquitectura y Enfoque

El objetivo de la Spec 002 es completar las capacidades operativas del tablero Kanban añadiendo lectura detallada, edición completa de propiedades de tarjetas (título, descripción, prioridad, columna y etiquetas) y borrado defensivo con confirmación, garantizando persistencia inmutable en `localStorage` ('kanban-storage') y accesibilidad WAI-ARIA.

Para mantener la cohesión con la arquitectura establecida en la Spec 001 y los principios de la Constitución:
- Toda la validación de entrada (títulos, duplicidad de tags, payloads) se implementa mediante funciones estrictamente puras y desacopladas en `src/kanban/core/validator.ts` con tests unitarios exhaustivos en `src/kanban/core/__tests__/validator.test.ts`.
- Las primitivas de diálogo accesibles se integran en `src/components/ui/` utilizando `@base-ui/react` (ya instalado en el proyecto y alineado con `button.tsx`), evitando dependencias redundantes.
- El diálogo de confirmación reutilizable para acciones destructivas se encapsula en `src/components/custom/ConfirmDialog.tsx`.
- El modal de detalle e inspección de tarea se construye en `src/kanban/components/Card/CardDetailModal.tsx`.
- El store de Zustand (`src/kanban/store/kanban.store.ts`) se amplía con `selectedTaskId`, `setSelectedTaskId`, `updateTask` y `deleteTask`, usando `partialize` para aislar el estado UI volátil de la persistencia de tareas.
- Se resuelve el caso límite CL-1 (desacople entre clic y arrastre) mediante la restricción de activación de `@dnd-kit` (`distance: 5`) y guardas en el evento de clic de `KanbanCard.tsx`.

---

## 2. Árbol de Archivos y Responsabilidades

```text
src/
├── components/
│   ├── custom/
│   │   ├── ErrorBoundary.tsx          # [Existente] Captura de excepciones globales en UI
│   │   └── ConfirmDialog.tsx          # [Nuevo] Modal accesible de confirmación para acciones destructivas
│   └── ui/
│       ├── button.tsx                 # [Existente] Primitiva Button basada en @base-ui/react/button
│       ├── dialog.tsx                 # [Nuevo] Primitiva Dialog accesible basada en @base-ui/react/dialog
│       └── alert-dialog.tsx           # [Nuevo] Primitiva AlertDialog accesible basada en @base-ui/react/alert-dialog
├── interfaces/
│   └── kanban.interface.ts            # [Modificado] Añade UpdateTaskPayload y contratos de validación
└── kanban/
    ├── components/
    │   ├── Board/
    │   ├── Card/
    │   │   ├── KanbanCard.tsx         # [Modificado] Integración de trigger de clic, botón de opciones y parada de propagación
    │   │   ├── CardPriorityBadge.tsx  # [Nuevo] Badge visual reutilizable para prioridades ('High', 'Medium', 'Low')
    │   │   ├── CardTag.tsx            # [Nuevo] Badge de etiqueta con soporte opcional de botón de eliminación
    │   │   └── CardDetailModal.tsx    # [Nuevo] Modal integral de visualización, edición inline y borrado
    │   └── Column/
    ├── core/
    │   ├── reorder.ts                 # [Existente] Lógica pura de ordenación intra/inter-columna
    │   ├── validator.ts               # [Nuevo] Funciones puras de validación de títulos, etiquetas y payloads
    │   └── __tests__/
    │       ├── reorder.test.ts        # [Existente] 17 tests unitarios de reordenación
    │       └── validator.test.ts      # [Nuevo] Tests unitarios deterministas para validadores
    ├── hooks/
    │   └── useKanbanDnd.ts            # [Existente] Sensores y eventos DnD con commit atómico en dragEnd
    ├── pages/
    │   └── BoardPage.tsx              # [Modificado] Montaje del CardDetailModal conectado a selectedTaskId
    └── store/
        └── kanban.store.ts            # [Modificado] Acciones updateTask, deleteTask, selectedTaskId y partialize
```

---

## 3. Contratos de Datos e Interfaces (`src/interfaces/kanban.interface.ts`)

Se incorporan contratos explícitos para la edición parcial de tareas y el resultado de validaciones:

```typescript
export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: Status;
  tags?: string[];
  due?: string;
}

export interface ValidationResult<T = string> {
  isValid: boolean;
  error?: string;
  sanitized: T;
}

export interface TaskPayloadValidationResult {
  isValid: boolean;
  errors: Partial<Record<keyof UpdateTaskPayload, string>>;
  sanitizedPayload: UpdateTaskPayload;
}
```

---

## 4. Funciones Puras de Lógica (`src/kanban/core/validator.ts`)

En cumplimiento del Principio 4 de la Constitución, estas funciones son 100% puras: no leen hooks, DOM, ni el store de Zustand.

### 4.1. `validateTaskTitle`
- **Firma:** `(title: unknown) => ValidationResult<string>`
- **Comportamiento:**
  - Comprueba que el valor recibido sea string.
  - Elimina espacios en blanco iniciales y finales (`trim()`).
  - Si la longitud es 0: retorna `isValid: false`, `error: 'El título no puede estar vacío'`.
  - Si la longitud supera los 120 caracteres: trunca o reporta error según umbral (CL-2).
  - Si es válido: retorna `isValid: true`, `sanitized: string`.

### 4.2. `validateTag`
- **Firma:** `(tag: unknown, existingTags: readonly string[]) => ValidationResult<string>`
- **Comportamiento:**
  - Comprueba que sea string y aplica `trim()`.
  - Si está vacío: `isValid: false`, `error: 'La etiqueta no puede estar vacía'`.
  - Si ya existe en `existingTags` (comparación insensible a mayúsculas/minúsculas): `isValid: false`, `error: 'La etiqueta ya existe'`.
  - Si la longitud supera los 25 caracteres: `isValid: false`, `error: 'La etiqueta no puede superar 25 caracteres'`.
  - Si es válida: `isValid: true`, `sanitized: string`.

### 4.3. `sanitizeTags`
- **Firma:** `(tags: unknown) => string[]`
- **Comportamiento:**
  - Sanitiza arrays entrantes: descarta nulos/undefined, fuerza strings, recorta espacios y elimina duplicados preservando el primer encuentro.

### 4.4. `validateTaskPayload`
- **Firma:** `(payload: unknown, currentTask: Task) => TaskPayloadValidationResult`
- **Comportamiento:**
  - Valida de forma atómica cada campo editable presente en el payload.
  - Retorna mapa de errores por campo y el payload limpio listo para persistir.

---

## 5. Diseño de Componentes de Interfaz

### 5.1. Primitivas UI Accesibles (`src/components/ui/`)
- **`dialog.tsx`**: Envoltura sobre `@base-ui/react/dialog` (`Dialog.Root`, `Dialog.Portal`, `Dialog.Backdrop`, `Dialog.Popup`, `Dialog.Title`, `Dialog.Description`, `Dialog.Close`).
  - Animaciones de entrada/salida mediante clases Tailwind.
  - Captura y restitución de foco nativa WAI-ARIA.
- **`alert-dialog.tsx`**: Envoltura sobre `@base-ui/react/alert-dialog` (`AlertDialog.Root`, `AlertDialog.Portal`, `AlertDialog.Backdrop`, `AlertDialog.Popup`, `AlertDialog.Title`, `AlertDialog.Description`, `AlertDialog.Close`).
  - Rol semántico `alertdialog`. El foco inicial se dirige obligatoriamente al botón "Cancelar" para evitar pulsaciones accidentales de `Enter`.

### 5.2. `ConfirmDialog.tsx` (`src/components/custom/ConfirmDialog.tsx`)
- Props tipadas:
  ```typescript
  interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'destructive' | 'default';
    onConfirm: () => void;
  }
  ```
- Componente desacoplado, reutilizable para el borrado de tareas (RF-4.2) y futuras acciones destructivas.

### 5.3. `CardDetailModal.tsx` (`src/kanban/components/Card/CardDetailModal.tsx`)
- Props tipadas:
  ```typescript
  interface Props {
    taskId: number | null;
    open: boolean;
    onClose: () => void;
  }
  ```
- **Flujo interno:**
  1. Obtiene la tarea actual del store mediante `tasks.find(t => t.id === taskId)`.
  2. Si `taskId` es null o la tarea no existe (ej. tras borrado), retorna `null` y cierra defensivamente (CL-3).
  3. Mantiene un estado local de borrador (`draftTask`) para edición inline.
  4. Permite editar:
     - **Título:** Campo editable con advertencia visual inmediata si `!validateTaskTitle(draft.title).isValid` (RF-2.2).
     - **Descripción:** Textarea autoajustable con soporte para textos extensos.
     - **Prioridad:** Selector visual entre 'High', 'Medium' y 'Low' (RF-2.3).
     - **Columna (`status`):** Selector desplegable entre 'To Do', 'In Progress' y 'Done' (RF-2.4).
     - **Etiquetas:** Chips renderizados con `CardTag` que incluyen botón `X` de borrado individual. Input inline para añadir etiqueta al pulsar `Enter`, validando unicidad (RF-3.1, RF-3.2, RF-3.3).
     - **Fecha límite (`due`):** Visualización/edición de fecha.
  5. Botones de acción en pie:
     - "Eliminar tarjeta" (botón `destructive` con icono `Trash2` que activa `ConfirmDialog`).
     - "Cancelar" (cierra sin guardar cambios).
     - "Guardar cambios" (valida payload, llama a `updateTask(taskId, changes)` y cierra modal).

---

## 6. Ampliación del Store (`src/kanban/store/kanban.store.ts`)

### 6.1. Definición del Estado Ampliado
```typescript
interface KanbanState {
  tasks: Task[];
  addingTo: Status | null;
  selectedTaskId: number | null;

  setAddingTo: (status: Status | null) => void;
  setSelectedTaskId: (id: number | null) => void;
  addTask: (title: string, status: Status) => void;
  updateTask: (id: number, payload: UpdateTaskPayload) => void;
  deleteTask: (id: number) => void;
  reorderTasks: (newTasks: Task[]) => void;
}
```

### 6.2. Implementación Inmutable de Acciones
- **`updateTask(id, payload)`**:
  - Busca la tarea por `id`. Si no existe, no realiza operaciones.
  - Sanitiza el payload con `validateTaskPayload`.
  - Retorna un nuevo array de tareas mediante `.map()`:
    ```typescript
    tasks: state.tasks.map((task) =>
      task.id === id ? { ...task, ...sanitizedPayload } : task
    )
    ```
  - Preserva intactos `id` y el orden relativo en el tablero (RF-2.5).
- **`deleteTask(id)`**:
  - Retorna un nuevo array filtrado con `.filter(t => t.id !== id)` (RNF-2).
  - Si `selectedTaskId === id`, resetea `selectedTaskId: null` automáticamente (CL-3).
- **Aislamiento en persistencia con `partialize`**:
  - El middleware `persist` almacenará únicamente `{ tasks: state.tasks }` en `kanban-storage`. Ni `selectedTaskId` ni `addingTo` se persisten, garantizando que al recargar (`F5`) la página no queden modales colgados ni estados transitorios inconsistentes.

---

## 7. Desacoplamiento Clic vs Arrastre (Caso Límite CL-1)

En `@dnd-kit`, cuando un elemento es arrastrable (`useSortable`), cualquier pulsación del ratón puede interpretarse como clic o como arrastre. Para garantizar que el clic abra el modal pero el inicio del arrastre no lo dispare accidentalmente:

1. **Restricción de activación del sensor:**
   En `useKanbanDnd.ts`, `PointerSensor` ya cuenta con `activationConstraint: { distance: 5 }`. El arrastre solo comienza tras desplazar el cursor más de 5 píxeles.
2. **Guarda en el evento `onClick` de la tarjeta:**
   En `KanbanCard.tsx`:
   - Se captura el clic en el contenedor principal de la tarjeta.
   - Si `@dnd-kit` reporta `isDragging === true` o si la transformación activa es distinta de cero, el evento de clic se ignora.
   - En elementos interactivos internos (botón de opciones `MoreHorizontal`, enlaces o botones de acción), se aplica estrictamente `e.stopPropagation()` para evitar la apertura no deseada del modal al hacer clic en dichos controles.

---

## 8. Decisiones Técnicas Justificadas

| Decisión Técnica | Justificación | Alternativa Descartada y Motivo |
| :--- | :--- | :--- |
| **Uso de `@base-ui/react` para `Dialog` y `AlertDialog`** | Ya instalado en `package.json`, utilizado por `src/components/ui/button.tsx`. Soporta WAI-ARIA nativo, portales y focus trapping sin añadir peso extra al bundle. | Instalar `@radix-ui/react-dialog`: Descartada para evitar dependencias duplicadas de librerías de UI headless. |
| **`selectedTaskId: number \| null` en Store vs Estado local de React** | Permite disparar la apertura del modal desde múltiples lugares futuros (menú de opciones, atajos de teclado, búsqueda de la Spec 003) sin prop drilling masivo. | `useState` en `BoardPage`: Descartada porque obligaría a pasar callbacks de apertura por todas las capas de columnas y tarjetas. |
| **Validación desacoplada en `core/validator.ts`** | Cumple el Principio 4 de la Constitución. Facilita tests unitarios rápidos y deterministas sin montar componentes React ni simular el DOM. | Validar inline dentro del componente del modal: Descartada por acoplar reglas de negocio a eventos de React y dificultar el testing unitario. |
| **Filtrado defensivo con `partialize` en `persist`** | Impide que estados de UI transitorios (`selectedTaskId`, `addingTo`) queden guardados en `localStorage`. | Guardar todo el store: Descartada porque si el usuario recarga la página mientras un modal está abierto, podría causar parpadeos o estados desfasados. |

---

## 9. Estrategia de Pruebas Unitarias (`src/kanban/core/__tests__/validator.test.ts`)

La suite se ejecutará con `npm test` (`npx vitest run`) cubriendo:

- **`validateTaskTitle`**:
  - `TC-VAL-1`: Acepta títulos válidos y recorta espacios en los extremos.
  - `TC-VAL-2`: Rechaza string vacío `""` con error correspondiente.
  - `TC-VAL-3`: Rechaza strings formados exclusivamente por espacios en blanco `"   "`.
  - `TC-VAL-4`: Rechaza tipos no string (`null`, `undefined`, números).
  - `TC-VAL-5`: Valida longitud máxima de 120 caracteres según CL-2.
- **`validateTag`**:
  - `TC-VAL-6`: Acepta una etiqueta nueva no existente.
  - `TC-VAL-7`: Rechaza etiquetas duplicadas con coincidencia exacta (ej. `"Design"` cuando ya existe `"Design"`).
  - `TC-VAL-8`: Rechaza etiquetas duplicadas con diferente caja (ej. `"design"` o `"DESIGN"` cuando ya existe `"Design"`).
  - `TC-VAL-9`: Rechaza etiquetas vacías o con solo espacios.
  - `TC-VAL-10`: Rechaza etiquetas que superen 25 caracteres.
- **`sanitizeTags`**:
  - `TC-VAL-11`: Limpia arrays eliminando duplicados y elementos no válidos.
- **`validateTaskPayload`**:
  - `TC-VAL-12`: Valida un payload completo de actualización retornando datos sanitizados sin alterar IDs.

---

## 10. Matriz de Trazabilidad

| Requisito / Caso Límite | Componente / Archivo | Función / Acción | Prueba Asociada |
| :--- | :--- | :--- | :--- |
| **RF-1.1** (Apertura clic) | `KanbanCard.tsx`, `BoardPage.tsx` | `setSelectedTaskId(task.id)` | Verificación manual e interactiva en Chrome DevTools |
| **RF-1.2** (Visualización detalle) | `CardDetailModal.tsx` | Renderizado de campos y badges | Verificación visual en navegador |
| **RF-1.3** (Accesibilidad modal) | `dialog.tsx`, `CardDetailModal.tsx` | Primitivas WAI-ARIA `@base-ui/react` | Atributos `aria-*`, `Escape` y backdrop |
| **RF-2.1** (Edición título/descripción) | `CardDetailModal.tsx` | `draftTask` state y handlers | Verificación interactiva de inputs |
| **RF-2.2** (Validación título no vacío) | `validator.ts`, `CardDetailModal.tsx` | `validateTaskTitle` | `validator.test.ts` (`TC-VAL-1` a `TC-VAL-5`) |
| **RF-2.3** (Cambio prioridad) | `CardDetailModal.tsx`, `CardPriorityBadge.tsx` | `onPriorityChange` | Verificación visual y sincronización de estado |
| **RF-2.4** (Cambio status/columna) | `CardDetailModal.tsx`, `kanban.store.ts` | `updateTask(id, { status })` | Traslado visual a la columna correspondiente |
| **RF-2.5** (Confirmación y persistencia) | `kanban.store.ts` | `updateTask` inmutable | Comprobación de persistencia en `localStorage` |
| **RF-3.1** (Añadir etiqueta con Enter) | `CardDetailModal.tsx`, `validator.ts` | `handleAddTag` | `validator.test.ts` (`TC-VAL-6`) |
| **RF-3.2** (Eliminar etiqueta) | `CardTag.tsx`, `CardDetailModal.tsx` | `handleRemoveTag` | Verificación en modal |
| **RF-3.3** (Unicidad de etiquetas) | `validator.ts` | `validateTag` | `validator.test.ts` (`TC-VAL-7`, `TC-VAL-8`) |
| **RF-4.1** (Acción eliminar en modal/card) | `CardDetailModal.tsx`, `KanbanCard.tsx` | Trigger de eliminación | Menú de tarjeta y botón en pie de modal |
| **RF-4.2** (Confirmación previa) | `ConfirmDialog.tsx`, `alert-dialog.tsx` | `ConfirmDialog` | Foco en cancelar y confirmación explícita |
| **RF-4.3** (Borrado efectivo) | `kanban.store.ts` | `deleteTask(id)` | Eliminación en tablero y persistencia |
| **RF-5.1** (Sincronización `localStorage`) | `kanban.store.ts` | `persist` middleware | Inspección de `kanban-storage` tras recarga |
| **CL-1** (Desacople clic vs arrastre) | `KanbanCard.tsx`, `useKanbanDnd.ts` | Guarda `isDragging` y `activationConstraint` | Arrastre > 5px no abre modal |
| **CL-2** (Título excesivo) | `validator.ts`, `CardDetailModal.tsx` | `break-words` y longitud máxima | `TC-VAL-5` y verificación visual |
| **CL-3** (Cierre tras borrado) | `kanban.store.ts`, `CardDetailModal.tsx` | `deleteTask` resetea `selectedTaskId` | Cierre limpio sin excepciones |
