# Plan 001 — Drag & Drop Core con @dnd-kit
Estado: aprobado  
Spec: `specs/001-dnd-core/spec.md` (aprobada)

---

## 1. Árbol de archivos a crear y modificar

```
src/
├── interfaces/
│   └── kanban.interface.ts          ← MODIFICAR: añadir UniqueId (string)
├── kanban/
│   ├── core/
│   │   ├── reorder.ts               ← CREAR: funciones puras de reordenación
│   │   └── __tests__/
│   │       └── reorder.test.ts      ← CREAR: suite Vitest (colocada junto al core)
│   ├── hooks/
│   │   └── useKanbanDnd.ts          ← CREAR: hook de orquestación DnD
│   ├── components/
│   │   ├── Board/
│   │   │   ├── BoardHeader.tsx      ← sin cambios
│   │   │   └── DragOverlayCard.tsx  ← CREAR: clon flotante durante el arrastre
│   │   ├── Card/
│   │   │   └── KanbanCard.tsx       ← MODIFICAR: envolver con useSortable
│   │   └── Column/
│   │       └── KanbanColumn.tsx     ← MODIFICAR: envolver con useDroppable
│   ├── pages/
│   │   └── BoardPage.tsx            ← MODIFICAR: añadir DndContext + DragOverlay
│   └── store/
│       └── kanban.store.ts          ← MODIFICAR: añadir reorderTasks, eliminar moveTask
```

> [!NOTE] Los tests se colocan en `src/kanban/core/__tests__/reorder.test.ts`, junto al módulo que prueban, siguiendo la colocalización por dominios de `constitution.md §1`. No existe ninguna carpeta `src/__tests__/` global.

---

## 2. Funciones puras — `src/kanban/core/reorder.ts`

### 2.1 Contrato de tipos auxiliares

```typescript
// Añadir a src/interfaces/kanban.interface.ts:

/** Identificador único de sensor para @dnd-kit. Estrictamente string.
 *  Los IDs de tarea se formatean como 'task-{id}' en el store/hook
 *  para evitar colisiones con los IDs de columna ('To Do', 'In Progress', 'Done').
 */
export type UniqueId = string;

// Task, Status, Priority, Column — ya existentes, sin cambios.
```

### 2.2 Firmas de funciones

#### `reorderInColumn`
```typescript
/**
 * Reordena tareas dentro de la misma columna usando arrayMove.
 * Pura: no lee ni escribe ningún estado externo.
 *
 * @param tasks   - Lista completa de tareas del tablero (inmutable).
 * @param status  - Nombre de la columna que contiene ambas tarjetas.
 * @param activeId  - ID de la tarjeta arrastrada.
 * @param overId    - ID de la tarjeta sobre la que se suelta (o la columna).
 * @returns Nueva lista de tareas con el orden actualizado dentro de la columna.
 */
function reorderInColumn(
  tasks: Task[],
  status: Status,
  activeId: UniqueId,
  overId: UniqueId,
): Task[]
```

**Algoritmo:**
1. Filtrar las tareas de la columna `status` → `columnTasks`.
2. Encontrar `oldIndex = columnTasks.findIndex(t => 'task-' + t.id === activeId)`.
3. Encontrar `newIndex = columnTasks.findIndex(t => 'task-' + t.id === overId)`.
4. Si `oldIndex === -1 || newIndex === -1 || oldIndex === newIndex` → devolver `tasks` sin cambios (RF-2.3).
5. Aplicar `arrayMove(columnTasks, oldIndex, newIndex)` → `reordered`.
6. Reconstruir la lista completa: conservar las tareas de otras columnas en su posición relativa y sustituir el bloque de la columna `status` por `reordered`.
7. Devolver la nueva lista.

> [!IMPORTANT] El paso 6 preserva el orden relativo de las demás columnas. La estrategia es: iterar `tasks` completas, e ir tomando el siguiente elemento de `reordered` cuando el `status` coincide.

---

#### `transferTask`
```typescript
/**
 * Transfiere una tarjeta de una columna a otra, insertándola en la posición
 * exacta indicada por overId (ID de tarjeta destino o ID de columna vacía).
 *
 * @param tasks      - Lista completa de tareas del tablero (inmutable).
 * @param activeId   - ID de la tarjeta arrastrada.
 * @param newStatus  - Status de la columna destino.
 * @param overId     - ID de la tarjeta sobre la que se inserta, o ID de la
 *                     columna destino si está vacía (caso límite CL-1).
 * @returns Nueva lista de tareas con la tarjeta transferida.
 */
function transferTask(
  tasks: Task[],
  activeId: UniqueId,
  newStatus: Status,
  overId: UniqueId,
): Task[]
```

**Algoritmo:**
1. Localizar `activeTask = tasks.find(t => t.id === activeId)`. Si no existe, devolver `tasks`.
2. Crear `updated = { ...activeTask, status: newStatus }`.
3. Eliminar la tarea original de la lista → `withoutActive`.
4. Calcular `insertIndex`:
   - Si `overId` corresponde a un `Status` (columna vacía, CL-1): insertar al final de las tareas con ese `newStatus` → `insertIndex = withoutActive.filter(t => t.status === newStatus).length` relativo al subarray.
   - Si `overId` corresponde a un `task.id`: buscar el índice de esa tarea en `withoutActive` e insertar antes de él.
5. Insertar `updated` en `insertIndex` del bloque de tareas de `newStatus` reconstruyendo la lista global.
6. Devolver la nueva lista.

---

#### `getColumnTasks` *(helper puro)*
```typescript
/**
 * Extrae y ordena las tareas de una columna concreta.
 * Usado por el hook para calcular índices sin duplicar lógica.
 */
function getColumnTasks(tasks: Task[], status: Status): Task[]
```

---

### 2.3 Restricciones que garantizan pureza
- Cero importaciones de React, Zustand ni APIs del DOM.
- Solo depende de `@dnd-kit/sortable` (`arrayMove`) y de los tipos de `@/interfaces/kanban.interface`.
- Todas las funciones son exportadas nombradas, sin estado interno.

---

## 3. Hook `useKanbanDnd` — `src/kanban/hooks/useKanbanDnd.ts`

### 3.1 Responsabilidades
Orquesta los tres momentos del ciclo de vida DnD y delega **toda** la lógica de datos a las funciones puras de `reorder.ts` y a las acciones del store.

### 3.2 Firma
```typescript
interface UseKanbanDndReturn {
  sensors: ReturnType<typeof useSensors>;
  activeTask: Task | null;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver:  (event: DragOverEvent)  => void;
  handleDragEnd:   (event: DragEndEvent)   => void;
}

function useKanbanDnd(): UseKanbanDndReturn
```

### 3.3 Configuración de sensores
```typescript
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },   // RF-1.1 / RF-1.2
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  }),
);
```
- `PointerSensor` con umbral de 5 px evita arrastres accidentales (RF-1.2).
- `KeyboardSensor` cumple el requisito de accesibilidad de `constitution.md §7`.

### 3.4 Estrategia de colisión
Se usa `closestCorners` (re-exportado de `@dnd-kit/core`).

**Justificación:** `closestCenter` puede errar al acercarse a columnas vacías. `closestCorners` evalúa las cuatro esquinas del elemento arrastrado contra todas las zonas droppable y es la estrategia recomendada por la documentación de `@dnd-kit` para tableros Kanban multi-columna. Cubre CL-1 y CL-3 sin lógica adicional.

### 3.5 Gestión de eventos

#### `handleDragStart(event: DragStartEvent)`
```
activeTask ← tasks.find(t => t.id === event.active.id)
```
- Captura la tarea activa para renderizarla en `DragOverlay` (RF-1.3).
- El `id` del sensor es el `task.id` numérico (nunca el índice).

#### `handleDragOver(event: DragOverEvent)`
```
si over === null → return
si active.id === over.id → return

overStatus ← determinar si over.id es un Status o un task.id
  - si over.id es un Status conocido → overStatus = over.id
  - si no → overStatus = tasks.find(t => t.id === over.id)?.status

activeStatus ← tasks.find(t => t.id === active.id)?.status

si overStatus !== activeStatus:
  newTasks ← transferTask(tasks, active.id, overStatus, over.id)
  reorderTasks(newTasks)   // acción del store (actualización optimista)
```
- Permite el movimiento visual **optimista** mientras el cursor no ha soltado (RF-3.1).
- No escribe en localStorage hasta `handleDragEnd` (evita spam de escrituras).

#### `handleDragEnd(event: DragEndEvent)`
```
activeTask ← null   // limpiar overlay

si !over → return   // RF-4.2: soltar fuera de zona válida

active.id === over.id → return   // RF-2.3

activeStatus ← tasks.find(t => t.id === active.id)?.status
overStatus   ← resolverStatus(over.id)

si activeStatus === overStatus:
  newTasks ← reorderInColumn(tasks, activeStatus, active.id, over.id)
  reorderTasks(newTasks)
// inter-columna ya fue aplicado optimistamente en handleDragOver,
// solo se persiste (Zustand persist middleware lo hace automáticamente)
```
- `Escape` es manejado por `KeyboardSensor` nativamente: cancela sin disparar `handleDragEnd` (RF-4.1).

### 3.6 Función auxiliar privada (dentro del hook)
```typescript
function resolveStatus(id: UniqueId, tasks: Task[]): Status | undefined
// Devuelve Status si id coincide con un Status literal,
// o el status de la tarea con ese id.
```

---

## 4. Componente `DragOverlayCard` — `src/kanban/components/Board/DragOverlayCard.tsx`

### 4.1 Responsabilidad
Renderiza la **copia visual flotante** de la tarjeta durante el arrastre, desacoplada del DOM de la lista de origen.

### 4.2 Props
```typescript
interface Props {
  task: Task;
}
```

### 4.3 Diseño
- Reutiliza el marcado visual de `KanbanCard` **sin** `useSortable` (es un renderizado estático).
- Añade `rotate-1 shadow-xl opacity-95 scale-[1.02]` para señalar visualmente que está en vuelo.
- Se monta exclusivamente dentro del `<DragOverlay>` de `BoardPage`.
- No tiene estado propio ni efectos secundarios.

### 4.4 Integración en `BoardPage`
```tsx
<DragOverlay>
  {activeTask ? <DragOverlayCard task={activeTask} /> : null}
</DragOverlay>
```

---

## 5. Cambios en `src/kanban/store/kanban.store.ts`

### 5.1 Interfaz ampliada
```typescript
interface KanbanState {
  tasks: Task[];
  addingTo: Status | null;

  // — existentes —
  setAddingTo: (status: Status | null) => void;
  addTask:     (title: string, status: Status) => void;

  // — nuevas acciones DnD —
  reorderTasks: (tasks: Task[]) => void;
}
```

### 5.2 Acción `reorderTasks`
```typescript
reorderTasks: (newTasks) =>
  set({ tasks: newTasks }),
```
- Recibe la lista ya transformada por las funciones puras de `reorder.ts`.
- El middleware `persist` serializa automáticamente en `localStorage` (RF-5.1).
- **Se elimina** la acción `moveTask` existente (ya no se necesita con la nueva arquitectura DnD; la transferencia inter-columna se hace a través de `transferTask` + `reorderTasks`).

> [!WARNING] La acción `moveTask` actual cambia solo el `status` sin controlar la posición. Con DnD activo, `reorderTasks` la reemplaza completamente. Si en algún componente se llama a `moveTask`, deberá actualizarse a `reorderTasks`.

---

## 6. Modificaciones en componentes existentes

### 6.1 `KanbanCard.tsx` — añadir `useSortable`
```typescript
const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
  useSortable({ id: task.id });

const style: React.CSSProperties = {
  transform: CSS.Transform.toString(transform),
  transition,
};
```
- El `<article>` recibe `ref={setNodeRef}`, `style`, `{...attributes}` y `{...listeners}`.
- Cuando `isDragging === true`: aplicar `opacity-40` para mostrar el marcador de posición (RF-1.4).
- **No** se pasa `data-icon` ni nada de lógica de negocio; solo conexión con el sensor.

### 6.2 `KanbanColumn.tsx` — añadir `useDroppable` + `SortableContext`
```typescript
// Droppable para columnas vacías (CL-1, RF-3.2)
const { setNodeRef } = useDroppable({ id: name });  // id = Status string

// SortableContext para ordenar las tarjetas internas
<SortableContext
  items={columnTasks.map(t => t.id)}
  strategy={verticalListSortingStrategy}
>
  {columnTasks.map(task => <KanbanCard key={task.id} task={task} />)}
</SortableContext>
```
- El `<div>` exterior de la columna recibe `ref={setNodeRef}` para que `closestCorners` lo detecte incluso cuando está vacía.

### 6.3 `BoardPage.tsx` — añadir `DndContext` y `DragOverlay`
```tsx
const { sensors, activeTask, handleDragStart, handleDragOver, handleDragEnd } =
  useKanbanDnd();

<DndContext
  sensors={sensors}
  collisionDetection={closestCorners}
  onDragStart={handleDragStart}
  onDragOver={handleDragOver}
  onDragEnd={handleDragEnd}
>
  <section className="grid gap-5 lg:grid-cols-3">
    {COLUMNS.map(...)}
  </section>
  <DragOverlay>
    {activeTask ? <DragOverlayCard task={activeTask} /> : null}
  </DragOverlay>
</DndContext>
```

---

## 7. Estrategia de pruebas unitarias — `src/kanban/core/__tests__/reorder.test.ts`

### 7.1 Casos para `reorderInColumn`

| ID | Descripción | Entrada | Salida esperada |
|---|---|---|---|
| TC-1 | Mover tarjeta hacia abajo dentro de la columna | tasks con 3 en 'To Do', activeId='task-1', overId='task-3' | Tarjeta 1 pasa a índice 2 en 'To Do' |
| TC-2 | Mover tarjeta hacia arriba dentro de la columna | tasks con 3 en 'To Do', activeId='task-3', overId='task-1' | Tarjeta 3 pasa a índice 0 en 'To Do' |
| TC-3 | Soltar en la misma posición (RF-2.3) | activeId='task-1', overId='task-1' | Lista sin cambios (referencia igual) |
| TC-4 | Tarjeta activa no existe en la columna | activeId='task-99' | Lista sin cambios |
| TC-5 | La función no muta el array original | tasks original | `tasks` original idéntico antes y después |
| TC-6 | Las tareas de otras columnas no se mueven | 7 tareas en 3 columnas | Solo cambia el orden interno de 'To Do' |

### 7.2 Casos para `transferTask`

| ID | Descripción | Entrada | Salida esperada |
|---|---|---|---|
| TC-7 | Mover tarjeta a columna con tareas | activeId='task-1', newStatus='In Progress', overId='task-4' | Tarjeta 1 aparece antes de tarjeta 4 en 'In Progress' |
| TC-8 | Mover tarjeta a columna vacía (CL-1) | activeId='task-1', newStatus='Done', overId='Done' | Tarjeta 1 es la única en 'Done' |
| TC-9 | Tarjeta activa no existe | activeId='task-99' | Lista sin cambios |
| TC-10 | El status de la tarjeta cambia correctamente | activeId='task-1' (status 'To Do') → newStatus='Done' | task.status === 'Done' |
| TC-11 | La función no muta el array original | tasks original | `tasks` original idéntico antes y después |
| TC-12 | Mover al final de una columna no vacía | overId es el Status string | Tarjeta insertada al final de ese bloque |

### 7.3 Configuración del test
```typescript
// src/kanban/core/__tests__/reorder.test.ts
import { describe, it, expect } from 'vitest';
import { reorderInColumn, transferTask } from '@/kanban/core/reorder';
// Fixture: array de 7 tareas hardcodeado (sin imports de store ni React)
// UniqueId formateados como 'task-{n}' y Status como 'To Do' | 'In Progress' | 'Done'
```

> [!TIP] Los tests no importan nada de React, Zustand ni @dnd-kit. Solo las funciones puras y los tipos. Esto hace que corran en entorno `node` (ya configurado en `vite.config.ts`).

---

## 8. Matriz de trazabilidad RF → Archivo / Función / Test

| Requisito | Archivo / Función | Test(s) |
|---|---|---|
| RF-1.1 Inicio con umbral 5 px | `useKanbanDnd.ts` → `PointerSensor { distance: 5 }` | — (comportamiento nativo del sensor) |
| RF-1.2 Clic sin arrastre | `useKanbanDnd.ts` → `PointerSensor { distance: 5 }` | — |
| RF-1.3 DragOverlay al iniciar | `useKanbanDnd.ts → handleDragStart` · `DragOverlayCard.tsx` | — |
| RF-1.4 Opacidad en origen | `KanbanCard.tsx` → `isDragging → opacity-40` | — |
| RF-2.1 Índice en tiempo real | `useKanbanDnd.ts → handleDragOver` | — |
| RF-2.2 Reordenar intra-columna | `reorder.ts → reorderInColumn` · `kanban.store.ts → reorderTasks` | TC-1, TC-2 |
| RF-2.3 Sin cambio si misma posición | `reorder.ts → reorderInColumn` | TC-3 |
| RF-3.1 Hueco visual inter-columna | `useKanbanDnd.ts → handleDragOver` (actualización optimista) | — |
| RF-3.2 Columna vacía como destino | `KanbanColumn.tsx → useDroppable` · `reorder.ts → transferTask` | TC-8, TC-12 |
| RF-3.3 Actualizar status al soltar | `reorder.ts → transferTask` · `kanban.store.ts → reorderTasks` | TC-7, TC-10 |
| RF-4.1 Escape cancela arrastre | `KeyboardSensor` nativo de @dnd-kit | — |
| RF-4.2 Soltar fuera cancela | `useKanbanDnd.ts → handleDragEnd` (guard `!over`) | — |
| RF-5.1 Persistencia en localStorage | `kanban.store.ts → persist middleware` | — |
| RNF-2 Inmutabilidad | `reorder.ts → reorderInColumn, transferTask` | TC-5, TC-11 |
| RNF-3 Cero Any | Todos los archivos nuevos/modificados | — (tsc gate) |
| CL-1 Columna vacía | `reorder.ts → transferTask` · `KanbanColumn.tsx → useDroppable` | TC-8 |
| CL-3 Soltar en encabezado | `KanbanColumn.tsx → useDroppable` (id = Status string) | TC-12 |

---

## 9. Decisiones técnicas justificadas

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| `closestCorners` como estrategia de colisión | `closestCenter` | `closestCenter` falla en columnas vacías (CL-1); `closestCorners` evalúa las 4 esquinas y detecta correctamente droppables sin ítems |
| `useDroppable({ id: name })` en la columna | Solo `SortableContext` | Sin `useDroppable`, una columna vacía no tiene zona de colisión registrada y no se puede soltar en ella (CL-1, RF-3.2) |
| Actualización optimista en `handleDragOver` | Solo en `handleDragEnd` | Mover solo en End produce un "salto" visual abrupto al soltar; la actualización en Over da la ilusión de fluidez a 60 FPS (RNF-1) |
| `reorderTasks(Task[])` en lugar de `moveTask` | Mantener `moveTask` y añadir `reorderTasks` | `moveTask` solo cambia el status, no la posición. Con DnD, el orden del array es la fuente de verdad del orden visual. Tener dos acciones solapadas crea inconsistencias |
| Funciones puras en `core/reorder.ts` | Lógica inline en el hook | Permite tests unitarios deterministas sin montar React, cumpliendo constitution.md §4 |
| `task.id: number` como identificador de sensor | Índice de array | constitution.md §7 y AGENTS.md prohíben índices como IDs de sensor |
