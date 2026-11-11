# Kanban Board — Notas de ingeniería y arquitectura

Un tablero Kanban interactivo construido desde cero con **React**, **TypeScript** y **@dnd-kit**, con diseño y flujo de trabajo inspirados en herramientas como Linear y Jira.

---

## 1. Por qué construí este proyecto

Quería construir una aplicación interactiva compleja que fuera más allá del típico ejercicio de componentes estáticos. Mi objetivo fue enfrentarme a los retos reales de sincronización de estado, concurrencia de eventos en el DOM y rendimiento gráfico que surgen al crear una experiencia de **Drag & Drop** ágil a 60 FPS.

Aproveché el proyecto para poner en práctica tres decisiones de diseño que considero fundamentales en el frontend moderno:
1. **Arquitectura desacoplada y orientada a dominios (*feature-driven*):** aislar todo el dominio de negocio del tablero para que no contamine la estructura general de la aplicación.
2. **Lógica matemática 100% pura en el core:** separar los cálculos de reordenación, validación y filtrado de los hooks y componentes de React.
3. **Tipado estricto sin atajos:** TypeScript en modo estricto de principio a fin, sin recurrir a `any` ni aserciones de tipo inseguras.

---

## 2. Qué puede hacer el usuario

- **Arrastrar y soltar con total fluidez:** Mover tarjetas dentro de la misma columna para cambiar su orden relativo, o transferirlas libremente entre columnas (*To Do*, *In Progress*, *Done*). Soporta ratón, trackpad y navegación asistida por teclado.
- **Gestión completa de tareas (CRUD):** Crear tarjetas al instante desde cada columna, inspeccionarlas en un modal de detalle accesible, editar sus campos en tiempo real (título, descripción, prioridad, etiquetas y fecha límite) o eliminarlas mediante confirmación previa.
- **Búsqueda y filtros reactivos:** Localizar tarjetas al vuelo escribiendo en el buscador (insensible a mayúsculas y acentos) y filtrar de forma combinada por una o varias prioridades y etiquetas desde un menú flotante (*Popover*).
- **Vistas intercambiables (Tablero vs. Lista):** Alternar entre la vista clásica de columnas Kanban y una vista en lista vertical compacta, conservando los filtros aplicados al cambiar de una a otra.
- **Persistencia local automática:** Todo el trabajo se guarda de forma transparente en `localStorage` para continuar justo donde lo dejaste al volver al navegador.

---

## 3. Decisiones de arquitectura (¿Por qué lo hice así?)

### Feature-Driven en `src/kanban/`
En vez de agrupar los archivos por tipo en carpetas gigantes (`components/`, `hooks/`, `utils/`), decidí aislar todo el dominio del tablero dentro de `src/kanban/`. 

Esta carpeta contiene sus propios componentes (`components/`), hooks (`hooks/`), estado (`store/`) y algoritmos (`core/`). Fuera de ella solo viven las primitivas de diseño reutilizables (`src/components/ui/` y `custom/`) y los contratos globales de datos (`src/interfaces/`). Si el día de mañana la aplicación necesitara añadir nuevas secciones (por ejemplo, una vista de analíticas o configuración de equipo), el tablero ya funciona como un módulo independiente que no genera dependencias cruzadas indeseadas.

### Lógica pura en el core (`src/kanban/core/`)
Separé toda la lógica que transforma los datos en módulos de funciones puras:
- **`reorder.ts`**: Calcula los nuevos índices intra e inter-columna mediante `arrayMove` sobre copias inmutables, garantizando que el array de tareas nunca contenga elementos `undefined`.
- **`validator.ts`**: Valida y sanitiza títulos (1–120 caracteres), descripciones y etiquetas únicas, devolviendo mapas de errores tipados.
- **`filter.ts`**: Aplica la combinatoria lógica de búsqueda y filtros (AND entre dimensiones, OR dentro de prioridades y etiquetas) y extrae dinámicamente las etiquetas presentes en las tarjetas vivas.

Al ser funciones puras (datos de entrada $\rightarrow$ datos de salida), no tocan el estado de React, el DOM ni el store de Zustand. Esto hace que probarlas sea rapidísimo y que no haya efectos secundarios inesperados.

### Persistencia limpia con `partialize`
Zustand incluye el middleware `persist`, que por defecto guarda todo el estado en `localStorage`. Si lo usas a ciegas, se guardan también variables efímeras de la sesión de UI como `selectedTaskId`, `addingTo`, `filters` o `viewMode`. 

Esto causa problemas típicos de experiencia de usuario: si un usuario cierra la pestaña con un modal abierto o una búsqueda aplicada, al entrar al día siguiente se encontraría el modal bloqueado sobre una tarea antigua o un tablero vacío por un filtro olvidado. Con `partialize` configuré el store para persistir **únicamente el array de tareas**:

```typescript
persist(
  (set) => ({ /* ... */ }),
  {
    name: 'kanban-storage',
    partialize: (state) => ({ tasks: state.tasks }), // Los filtros y modales permanecen en memoria
  }
)
```

---

## 4. Problemas reales que me encontré y cómo los solucioné

### 1. El bucle de renders en `dragOver` (*Maximum update depth exceeded*)
Al implementar el arrastre entre columnas distintas con `@dnd-kit`, mi primer instinto fue actualizar el array de tareas del store dentro de `handleDragOver`. 

El problema fue inmediato: cuando el usuario pasa una tarjeta sobre el borde entre dos columnas, mutar el estado en pleno vuelo altera el layout de la columna origen. Esto desplazaba las coordenadas que `@dnd-kit` acababa de calcular, haciendo que el sensor creyera que la tarjeta había vuelto a la columna anterior. El resultado fue un parpadeo constante (*ping-pong flapping*) y una cascada de re-renders que colapsaba React con el error `Maximum update depth exceeded`.

**Cómo lo solucioné:**
Dejé `handleDragOver` completamente libre de mutaciones de estado. Para la respuesta visual mientras el cursor se mueve, utilicé `<DragOverlay>`, que renderiza un clon flotante de la tarjeta en un portal fuera del árbol de columnas sin alterar las listas en reposo. La actualización real en el store la aplico de forma **atómica y determinista exclusivamente en `handleDragEnd`**, cuando el usuario suelta la tarjeta.

### 2. El clic accidental vs. arrastre
Quería que hacer clic en una tarjeta abriera su modal de edición, pero que arrastrarla no disparara el modal al soltar el ratón. Un evento `onClick` básico en el contenedor de la tarjeta se dispara en cuanto se levanta el botón del ratón, independientemente de si te moviste o no.

**Cómo lo solucioné:**
Combiné dos salvaguardas:
1. En el sensor de `@dnd-kit`, añadí una restricción de distancia mínima:
   ```typescript
   useSensor(PointerSensor, {
     activationConstraint: { distance: 5 }, // Requiere desplazarse 5px para iniciar el arrastre
   })
   ```
2. En el componente de la tarjeta, leí la propiedad `isDragging` que proporciona el hook `useSortable`. Si la tarjeta está o estuvo en modo arrastre, el clic se descarta:
   ```typescript
   const handleClick = () => {
     if (isDragging) return;
     setSelectedTaskId(task.id);
   };
   ```

### 3. Búsqueda con acentos usando normalización canónica NFD
Un buscador básico con `.toLowerCase().includes()` da una experiencia bastante pobre en español: buscar "diseño" no encontraba tarjetas con "Diseño", y buscar "diseno" (sin tilde) ignoraba por completo "Diseño de landing page".

**Cómo lo solucioné:**
Implementé la función `normalizeSearchText` utilizando la descomposición canónica Unicode (NFD) junto con una expresión regular que elimina las marcas diacríticas:

```typescript
export function normalizeSearchText(text: unknown): string {
  if (typeof text !== 'string') return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
```

Al aplicarlo tanto al término de búsqueda como al título y la descripción de cada tarjeta, "diseño", "Diseño", "DISENO" y "diseno" coinciden siempre de manera predecible.

---

## 5. Testing y Calidad

Para tener la seguridad de que mover tareas, borrar etiquetas o aplicar filtros combinados no rompiera arrays ni dejara datos corruptos, escribí **46 tests unitarios con Vitest** organizados en `src/kanban/core/__tests__/`:

- **`reorder.test.ts` (17 tests):** Reordenación dentro de la misma columna, transferencia entre columnas distintas, soltado sobre columnas vacías, arrastre sobre la misma posición y garantía de inmutabilidad (no mutar el array original).
- **`validator.test.ts` (15 tests):** Validación de títulos no vacíos y longitud máxima (120 caracteres), sanitización de payloads y validación de etiquetas sin duplicados.
- **`filter.test.ts` (14 tests):** Normalización NFD, insensibilidad a mayúsculas y acentos, combinación lógica AND entre dimensiones, evaluación OR dentro de prioridades y tags, y cálculo dinámico de etiquetas disponibles.

```bash
 ✓ src/kanban/core/__tests__/validator.test.ts (15 tests)
 ✓ src/kanban/core/__tests__/filter.test.ts (14 tests)
 ✓ src/kanban/core/__tests__/reorder.test.ts (17 tests)

 Test Files  3 passed (3)
      Tests  46 passed (46)
   Duration  ~220ms
```

---

## 6. Stack técnico y puesta en marcha

- **React 18** (compatible con React 19)
- **TypeScript 5.7** (modo estricto, 0 `any`)
- **Tailwind CSS v4** (estilos utilitarios rápidos y variables CSS nativas)
- **@dnd-kit** (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`)
- **Zustand 5** (estado global inmutable con middleware `persist`)
- **@base-ui/react** (primitivas headless accesibles para Dialog, AlertDialog y Popover)
- **Lucide React** (iconografía)
- **Vitest** (suite de pruebas unitarias ultrarrápida)

### Comandos disponibles

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo con HMR
npm run dev

# Ejecutar la suite completa de tests unitarios
npm test

# Comprobar tipos en estricto con el compilador de TypeScript
npx tsc --noEmit

# Ejecutar el linter para asegurar estilo y buenas prácticas
npm run lint

# Generar el bundle de producción
npm run build
```

---

## Licencia
Código abierto bajo licencia MIT. Desarrollado con dedicación técnica para explorar buenas prácticas de arquitectura frontend.
