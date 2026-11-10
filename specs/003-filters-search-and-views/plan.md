# Plan Técnico — Spec 003: Filtros, Búsqueda y Vistas Alternativas
Estado: borrador

## 1. Resumen de Arquitectura y Enfoque

El objetivo de la Spec 003 es incorporar capacidades de búsqueda reactiva en tiempo real, filtrado combinatorio por prioridad y etiquetas dinámicas, y una vista alternativa en lista ("List view") junto a la vista de cuadrícula ("Board view").

Para preservar los principios innegociables de la [Constitución](file:///c:/Users/javig/Documents/React/Kanban/kanban/docs/constitution.md) y [`AGENTS.md`](file:///c:/Users/javig/Documents/React/Kanban/kanban/AGENTS.md):
- **Pureza en el core:** Toda la lógica de normalización de cadenas, coincidencia de criterios y evaluación combinatoria se implementa como funciones 100% puras en `src/kanban/core/filter.ts`, acompañadas de su suite de tests unitarios en `src/kanban/core/__tests__/filter.test.ts`.
- **UI accesible sin dependencias pesadas:** El panel de filtros se apoya en `@base-ui/react/popover` (ya disponible en el proyecto), encapsulado en `src/components/ui/popover.tsx` con estilos Tailwind y atributos WAI-ARIA nativos.
- **Estado predecible y volátil:** El estado de los filtros (`searchQuery`, `priorities`, `tags`) y el modo de vista (`viewMode: 'board' | 'list'`) se incorporan en `src/kanban/store/kanban.store.ts`. Gracias a la configuración existente de `partialize: (state) => ({ tasks: state.tasks })`, este estado de sesión no se persiste en `localStorage['kanban-storage']`, evitando que el usuario vuelva en futuras sesiones a un tablero bloqueado por una búsqueda olvidada.
- **Integridad con Drag & Drop:** En la vista "Board", el drag & drop opera entre las tarjetas visibles filtradas sin corromper el orden ni los datos de las tarjetas ocultas. En la vista "List", el drag & drop permanece desactivado por diseño para ofrecer una experiencia tabular optimizada de consulta rápida.

---

## 2. Árbol de Archivos y Responsabilidades

```text
src/
├── components/
│   └── ui/
│       ├── button.tsx                     # [Existente] Primitiva Button (@base-ui/react/button)
│       ├── dialog.tsx                     # [Existente] Primitiva Dialog (@base-ui/react/dialog)
│       ├── alert-dialog.tsx               # [Existente] Primitiva AlertDialog (@base-ui/react/alert-dialog)
│       └── popover.tsx                    # [Nuevo] Primitiva Popover accesible (@base-ui/react/popover)
├── interfaces/
│   └── kanban.interface.ts                # [Modificado] Contratos KanbanFilters y KanbanViewMode
└── kanban/
    ├── components/
    │   ├── Board/
    │   │   ├── BoardHeader.tsx            # [Modificado] Integra SearchInput y BoardFilterPopover
    │   │   ├── DragOverlayCard.tsx        # [Existente] Visualización overlay durante drag
    │   │   └── KanbanBoard.tsx            # [Opcional/Modificado] Cuadrícula de columnas DnD
    │   ├── Column/
    │   │   └── KanbanColumn.tsx           # [Modificado] Renderizado de tareas filtradas y estado vacío
    │   ├── Card/
    │   │   ├── KanbanCard.tsx             # [Existente] Tarjeta arrastrable con click desacoplado
    │   │   ├── CardPriorityBadge.tsx      # [Existente] Badge visual de prioridad
    │   │   ├── CardTag.tsx                # [Existente] Chip de etiqueta
    │   │   └── CardDetailModal.tsx        # [Existente] Modal de detalle e inspección
    │   ├── Controls/
    │   │   ├── SearchInput.tsx            # [Nuevo] Campo de búsqueda reactiva con botón limpiar (X)
    │   │   └── BoardFilterPopover.tsx     # [Nuevo] Panel flotante con selector de prioridad, tags y botón limpiar
    │   └── List/
    │       └── ListView.tsx               # [Nuevo] Vista tabular organizada por columnas/estado
    ├── core/
    │   ├── reorder.ts                     # [Existente] Lógica pura de reordenación intra/inter-columna
    │   ├── validator.ts                   # [Existente] Validaciones de CRUD
    │   ├── filter.ts                      # [Nuevo] Funciones puras de filtrado y normalización
    │   └── __tests__/
    │       ├── reorder.test.ts            # [Existente] Tests de reordenación (17 tests)
    │       ├── validator.test.ts          # [Existente] Tests de validación (15 tests)
    │       └── filter.test.ts             # [Nuevo] Tests unitarios de filtrado (TC-FILT-1 a TC-FILT-12)
    ├── pages/
    │   └── BoardPage.tsx                  # [Modificado] Conmutador de vista, contador contextual y renderizado condicional
    └── store/
        └── kanban.store.ts                # [Modificado] Acciones y estado de filtros y modo de vista
```

---

## 3. Contratos de Datos e Interfaces (`src/interfaces/kanban.interface.ts`)

Se incorporan contratos explícitos para el modo de visualización y el estado de filtrado:

```typescript
export type KanbanViewMode = 'board' | 'list';

export interface KanbanFilters {
  searchQuery: string;
  priorities: Priority[];
  tags: string[];
}
```

---

## 4. Funciones Puras de Lógica (`src/kanban/core/filter.ts`)

En estricto cumplimiento del Principio 4 de la Constitución, estas funciones son 100% deterministas y desacopladas de React y Zustand:

### 4.1. `normalizeSearchText`
- **Firma:** `(text: unknown) => string`
- **Comportamiento:**
  - Si no es string, retorna `""`.
  - Recorta espacios extremos (`trim()`), pasa a minúsculas (`toLowerCase()`).
  - Aplica normalización NFD canónica eliminando marcas diacríticas y tildes (`normalize('NFD').replace(/[\u0300-\u036f]/g, '')`).

### 4.2. `matchesSearch`
- **Firma:** `(task: Task, normalizedQuery: string) => boolean`
- **Comportamiento:**
  - Si `normalizedQuery` está vacía, retorna `true`.
  - Evalúa si el título normalizado o la descripción normalizada de la tarea incluyen `normalizedQuery`.

### 4.3. `matchesPriorities`
- **Firma:** `(task: Task, selectedPriorities: readonly Priority[]) => boolean`
- **Comportamiento:**
  - Si `selectedPriorities.length === 0`, retorna `true` (sin filtro).
  - Evalúa coincidencia mediante operador lógico **OR** (`selectedPriorities.includes(task.priority)`).

### 4.4. `matchesTags`
- **Firma:** `(task: Task, selectedTags: readonly string[]) => boolean`
- **Comportamiento:**
  - Si `selectedTags.length === 0`, retorna `true` (sin filtro).
  - Evalúa coincidencia mediante operador lógico **OR inclusivo**: retorna `true` si al menos una de las etiquetas de la tarea coincide (insensible a mayúsculas) con alguna de las seleccionadas en `selectedTags`.

### 4.5. `filterTasks`
- **Firma:** `(tasks: Task[], filters: KanbanFilters) => Task[]`
- **Comportamiento:**
  - Sanitiza parámetros de entrada.
  - Retorna un nuevo array con las tareas que satisfacen simultáneamente la combinación lógica **AND** (`matchesSearch && matchesPriorities && matchesTags`).
  - No muta el array original de tareas.

### 4.6. `getAvailableTags`
- **Firma:** `(tasks: Task[]) => string[]`
- **Comportamiento:**
  - Extrae todas las etiquetas de las tareas vivas (`tasks`), elimina duplicados (case-insensitive) y las retorna ordenadas alfabéticamente (CL-2).

### 4.7. `countActiveFilters`
- **Firma:** `(filters: KanbanFilters) => number`
- **Comportamiento:**
  - Retorna la suma de criterios activos: `(filters.searchQuery.trim().length > 0 ? 1 : 0) + filters.priorities.length + filters.tags.length`.

### 4.8. `hasActiveFilters`
- **Firma:** `(filters: KanbanFilters) => boolean`
- **Comportamiento:**
  - Retorna `countActiveFilters(filters) > 0`.

---

## 5. Diseño e Integración de Interfaz

### 5.1. Primitiva `Popover` (`src/components/ui/popover.tsx`)
- Envoltorio accesible sobre `@base-ui/react/popover`:
  - `PopoverRoot`, `PopoverTrigger`, `PopoverContent` (con `Portal`, `Positioner` y `Popup`), `PopoverTitle`, `PopoverDescription`, `PopoverClose`.
  - Animaciones suaves de entrada y salida con `data-[starting-style]` y `data-[ending-style]`.
  - Captura y restitución de foco WAI-ARIA nativa con cierre al pulsar `Escape` o hacer clic fuera.

### 5.2. Componentes de Control (`src/kanban/components/Controls/`)
- **`SearchInput.tsx`:**
  - Renderiza un botón de búsqueda que expande un campo de texto interactivo en la cabecera (o un input inline estilizado).
  - Muestra un botón con icono `X` para vaciar el texto con un solo clic.
  - Soporta pulsar `Escape` para limpiar y colapsar el campo.
- **`BoardFilterPopover.tsx`:**
  - Botón disparador con icono `SlidersHorizontal` y badge numérico contextual indicando `countActiveFilters(filters)`.
  - Panel desplegable con dos bloques:
    1. *Prioridad:* Botones interactivos con `CardPriorityBadge` para alternar ('High', 'Medium', 'Low').
    2. *Etiquetas:* Listado dinámico obtenido con `getAvailableTags(tasks)` con chips interactivos.
  - Botón accesible "Limpiar filtros" en la parte inferior, visible cuando `hasActiveFilters(filters)` sea `true`.

### 5.3. Adaptación de `KanbanColumn.tsx`
- En lugar de filtrar directamente de `useKanbanStore.getState().tasks`, la columna recibe o computa las tareas que pertenecen a su columna y superan `filterTasks`.
- **Estado vacío amigable (`RF-1.4`, `CL-1`):**
  - Si la columna tiene tareas en total (`totalColumnTasks > 0`) pero ninguna coincide con los filtros activos (`filteredColumnTasks.length === 0`), renderiza un contenedor informativo con texto tenue: *"Sin tarjetas coincidentes"* y opción de *"Limpiar filtros"*.
  - La columna mantiene su altura mínima (`min-h-[520px]`) para que el dropzone continúe operativo.

### 5.4. Componente `ListView.tsx` (`src/kanban/components/List/ListView.tsx`)
- Representación estructurada agrupada por columnas/estado ('To Do', 'In Progress', 'Done').
- Cada grupo muestra el encabezado con el icono y color de la columna, y una lista de tarjetas horizontales.
- Cada fila muestra:
  - Título y extracto de descripción.
  - Badge de prioridad (`CardPriorityBadge`).
  - Chips de etiquetas (`CardTag`).
  - Indicador de fecha límite (`CalendarDays`).
- Clic en cualquier fila ejecuta `setSelectedTaskId(task.id)` para abrir `CardDetailModal` de forma idéntica a la vista en cuadrícula (`CL-6`).
- Drag & Drop desactivado por diseño en esta vista (`RF-4.2`).

### 5.5. Conmutador y Contador en `BoardPage.tsx`
- Botones "Board" y "List" conectados con `viewMode` y `setViewMode`.
- Contador del sub-encabezado:
  - Si hay filtros activos: `<span>{filteredTasks.length} de {tasks.length} tarjetas</span>`.
  - Si no hay filtros: `<span>{tasks.length} tarjetas</span>`.
- Renderizado condicional del cuerpo principal según `viewMode === 'board'` o `'list'`.

---

## 6. Ampliación del Store (`src/kanban/store/kanban.store.ts`)

### 6.1. Definición del Estado
```typescript
interface KanbanState {
  // Datos existentes
  tasks: Task[];
  addingTo: Status | null;
  selectedTaskId: number | null;

  // Nuevo estado volátil (Spec 003)
  viewMode: KanbanViewMode;
  filters: KanbanFilters;

  // Acciones existentes
  setAddingTo: (status: Status | null) => void;
  setSelectedTaskId: (id: number | null) => void;
  addTask: (title: string, status: Status) => void;
  updateTask: (id: number, payload: UpdateTaskPayload) => void;
  deleteTask: (id: number) => void;
  reorderTasks: (newTasks: Task[]) => void;

  // Nuevas acciones (Spec 003)
  setViewMode: (mode: KanbanViewMode) => void;
  setSearchQuery: (query: string) => void;
  togglePriorityFilter: (priority: Priority) => void;
  toggleTagFilter: (tag: string) => void;
  clearFilters: () => void;
}
```

### 6.2. Inmutabilidad y Persistencia
- `togglePriorityFilter`: si la prioridad ya está en `filters.priorities`, la elimina con `.filter()`; si no, la añade con `[...prev, p]`.
- `toggleTagFilter`: si el tag ya está en `filters.tags`, lo elimina; si no, lo añade.
- `clearFilters`: resetea `filters` a `{ searchQuery: '', priorities: [], tags: [] }`.
- **Aislamiento en `partialize`:** `partialize: (state) => ({ tasks: state.tasks })` permanece intacto, garantizando que el estado volátil de filtros y vista no ensucie `localStorage`.

---

## 7. Decisiones Técnicas Justificadas

| Decisión Técnica | Justificación | Alternativa Descartada y Motivo |
| :--- | :--- | :--- |
| **Primitiva `Popover` con `@base-ui/react/popover`** | Mantiene coherencia con el stack existente (`dialog.tsx`, `alert-dialog.tsx`, `button.tsx`) sin añadir nuevas dependencias a `package.json`, asegurando soporte WAI-ARIA nativo y focus trapping. | Desplegable manual con `useState` y CSS absoluto: Descartada por carecer de accesibilidad WAI-ARIA, portaling sobre z-index y gestión de eventos fuera del contenedor. |
| **Filtros en el Store Zustand sin persistencia (`partialize`)** | Facilita que `BoardHeader`, `BoardPage`, `KanbanColumn` y `ListView` compartan los filtros sin prop drilling complejo. Se excluye de `localStorage` para evitar que el usuario regrese a un tablero bloqueado por filtros antiguos. | Filtros en estado local con React Context o URL params: Descartada para evitar re-renderizados de context anidados o acoplar la aplicación a un enrutador cuando no hay router instalado. |
| **Normalización NFD con regex en `core/filter.ts`** | Permite que búsquedas como "diseño", "diseno" o "DISEÑO" encuentren los mismos resultados de forma determinista y pura. | Búsqueda simple con `.includes()`: Descartada porque fallaría con acentos o diferencias de caja en textos en español o inglés. |
| **Desactivación de DnD en `ListView`** | La vista de lista está concebida para lectura densa, auditoría y revisión rápida; mezclar drag & drop vertical en tabla añade complejidad innecesaria y colisiones de scroll. | Soportar reordenación en ListView: Descartada por sobrediseño innecesario fuera del alcance de la spec (`RF-4.2`). |

---

## 8. Estrategia de Pruebas Unitarias (`src/kanban/core/__tests__/filter.test.ts`)

La suite se ejecutará con `npx vitest run` cubriendo:

- **`normalizeSearchText`**:
  - `TC-FILT-1`: Elimina espacios en blanco y convierte a minúsculas.
  - `TC-FILT-2`: Normaliza tildes y caracteres diacríticos (ej. "áéíóúñ" -> "aeioun").
  - `TC-FILT-3`: Maneja valores no string (`null`, `undefined`, números) retornando string vacío.
- **`matchesSearch`**:
  - `TC-FILT-4`: Coincide por título y por descripción indistintamente.
  - `TC-FILT-5`: Retorna `true` ante búsquedas vacías o compuestas solo por espacios (`CL-3`).
- **`matchesPriorities`**:
  - `TC-FILT-6`: Retorna `true` si no hay prioridades seleccionadas.
  - `TC-FILT-7`: Evalúa con lógica OR para múltiples prioridades seleccionadas (ej. 'High' o 'Medium').
- **`matchesTags`**:
  - `TC-FILT-8`: Retorna `true` si no hay etiquetas seleccionadas.
  - `TC-FILT-9`: Evalúa con lógica OR inclusivo para múltiples etiquetas (coincide si la tarea tiene al menos una).
- **`filterTasks`**:
  - `TC-FILT-10`: Combina AND entre texto, prioridad y etiquetas, retornando el subconjunto correcto.
  - `TC-FILT-11`: Retorna array vacío si no hay coincidencias globales (`CL-1`).
  - `TC-FILT-12`: No muta el array original de tareas (RNF-1).
- **`getAvailableTags`**:
  - `TC-FILT-13`: Extrae etiquetas únicas y ordenadas de las tareas vivas (`CL-2`).
- **`countActiveFilters` / `hasActiveFilters`**:
  - `TC-FILT-14`: Calcula la suma correcta de criterios activos.

---

## 9. Matriz de Trazabilidad

| Requisito / Caso Límite | Componente / Archivo | Función / Acción | Prueba Asociada |
| :--- | :--- | :--- | :--- |
| **RF-1.1** (Search input con clear y Esc) | `SearchInput.tsx`, `BoardHeader.tsx` | `setSearchQuery` y botón X | Verificación interactiva en navegador |
| **RF-1.2** (Búsqueda título/descripción) | `filter.ts` | `matchesSearch` | `filter.test.ts` (`TC-FILT-4`) |
| **RF-1.3** (Insensible a mayúsculas/acentos) | `filter.ts` | `normalizeSearchText` | `filter.test.ts` (`TC-FILT-1`, `TC-FILT-2`) |
| **RF-1.4** (Estado vacío en columna) | `KanbanColumn.tsx` | Placeholder "Sin tarjetas coincidentes" | Verificación visual y `CL-1` |
| **RF-2.1** (Popover filtros con prioridad y tags) | `popover.tsx`, `BoardFilterPopover.tsx` | `BoardFilterPopover` | Verificación accesible WAI-ARIA |
| **RF-2.2** (Badge con contador de filtros) | `BoardFilterPopover.tsx`, `filter.ts` | `countActiveFilters` | `filter.test.ts` (`TC-FILT-14`) |
| **RF-2.3** (Botón limpiar filtros) | `BoardFilterPopover.tsx`, `kanban.store.ts` | `clearFilters` | Verificación en popover |
| **RF-2.4** (Contador contextual sub-encabezado) | `BoardPage.tsx` | `X de Y tarjetas` | Verificación visual |
| **RF-3.1** (Conmutador Board / List) | `BoardPage.tsx`, `kanban.store.ts` | `setViewMode` | Conmutación interactiva |
| **RF-3.2** (Estilo visual seleccionado en toggle) | `BoardPage.tsx` | Clases Tailwind condicionales | Verificación visual |
| **RF-3.3** (Estructura de ListView) | `ListView.tsx` | Renderizado tabular por estado | Verificación visual en List |
| **RF-3.4** (Clic en fila abre CardDetailModal) | `ListView.tsx`, `BoardPage.tsx` | `setSelectedTaskId` | Inspección de tarea desde ListView |
| **RF-3.5** (Filtros persistentes al cambiar vista) | `kanban.store.ts`, `BoardPage.tsx` | Filtros en store global | Verificación entre vistas |
| **RF-4.1** (DnD íntegro con filtros activos) | `KanbanColumn.tsx`, `reorder.ts` | Reordenación con tareas ocultas | Suite de `reorder.test.ts` |
| **RF-4.2** (DnD deshabilitado en List) | `ListView.tsx` | Renderizado plano sin sensores | Verificación de interacción |
| **CL-1** (Búsqueda sin coincidencias) | `filter.ts`, `KanbanColumn.tsx` | Retorno de `[]` y placeholders | `TC-FILT-11` y verificación UI |
| **CL-2** (Etiquetas dinámicas tras borrado) | `filter.ts`, `BoardFilterPopover.tsx` | `getAvailableTags` | `TC-FILT-13` |
| **CL-3** (Espacios en blanco en búsqueda) | `filter.ts` | Sanitización `.trim()` | `TC-FILT-5` |
| **CL-4** (Tildes y caracteres diacríticos) | `filter.ts` | Normalización NFD | `TC-FILT-2` |
| **CL-5** (Añadir tarjeta con filtros activos) | `kanban.store.ts`, `KanbanColumn.tsx` | `addTask` inmutable | Creación y actualización de contador |
| **CL-6** (Apertura de modal desde fila ListView) | `ListView.tsx` | `setSelectedTaskId` | Verificación interactiva |
