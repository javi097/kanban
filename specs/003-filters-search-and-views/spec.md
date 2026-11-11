# Spec 003 — Filtros, Búsqueda y Vistas Alternativas
Estado: implementada

## Contexto y objetivo
El tablero Kanban permite arrastrar tarjetas y gestionar su contenido mediante CRUD completo (Spec 001 y Spec 002), pero carece de herramientas de localización cuando el volumen de tareas crece. El objetivo de esta spec es dotar al espacio de trabajo de búsqueda reactiva por texto, filtrado acumulativo por prioridad y etiquetas, e incorporar una vista alternativa en lista ("List view") junto a la vista actual en columnas ("Board view"), manteniendo la accesibilidad WAI-ARIA, la pureza matemática en el filtrado y la integridad del drag & drop.

## Usuarios
- **Usuario del tablero:** necesita localizar rápidamente tareas urgentes o de un área concreta mediante filtros combinados y alternar a vista de lista para una lectura rápida o auditoría secuencial del flujo de trabajo.

## Historias de usuario
- **HU-1.** Como usuario, quiero buscar por texto en tiempo real para ver únicamente las tarjetas cuyo título o descripción contengan el término buscado.
- **HU-2.** Como usuario, quiero filtrar por una o varias prioridades ('High', 'Medium', 'Low') para focalizar las tareas según su criticidad.
- **HU-3.** Como usuario, quiero filtrar por una o varias etiquetas para centrarme en áreas de especialidad concretas (ej. 'Design', 'Engineering').
- **HU-4.** Como usuario, quiero ver un indicador visual con el número de filtros activos y poder restablecerlos con un solo clic.
- **HU-5.** Como usuario, quiero conmutar entre la vista "Board" (columnas Kanban) y la vista "List" (tabla/lista agrupada por estado) conservando los filtros activos.
- **HU-6.** Como usuario, quiero hacer clic en cualquier tarjeta tanto desde la vista "Board" como desde la vista "List" para abrir su modal de detalle e inspección (`CardDetailModal`).

## Definiciones
- **Filtro Combinatorio:**
  - **Entre categorías:** Operación lógica **AND** (la tarjeta debe coincidir con el texto de búsqueda Y con las prioridades seleccionadas Y con las etiquetas seleccionadas).
  - **Dentro de Prioridades (multiselección):** Operación lógica **OR** (si se seleccionan 'High' y 'Medium', la tarjeta es válida si su prioridad es 'High' O 'Medium').
  - **Dentro de Etiquetas (multiselección):** Operación lógica **OR inclusiva** (si se seleccionan 'Design' y 'Engineering', la tarjeta es válida si contiene al menos una de las etiquetas seleccionadas).
- **Vista Lista (`ListView`):** Representación vertical estructurada de las tareas agrupadas por estado ('To Do', 'In Progress', 'Done'), optimizada para lectura rápida, orden y auditoría sin drag & drop.
- **Estado de Filtrado Volátil:** Filtros aplicados en memoria en la sesión activa; no se persisten en `localStorage` para evitar que recargas posteriores muestren tableros vacíos por búsquedas olvidadas.
- **Modo de Vista (`ViewMode`):** Estado de visualización activo (`'board'` | `'list'`).

## Requisitos funcionales

### RF-1 — Búsqueda reactiva por texto
- **RF-1.1.** El botón de búsqueda de la cabecera deberá desplegar o enfocar un campo de entrada accesible (`SearchInput`) con botón para borrar el texto (`X`) y soporte para cerrar con la tecla `Escape`.
- **RF-1.2.** La búsqueda evaluará en tiempo real coincidencias sobre el título y la descripción de cada tarjeta.
- **RF-1.3.** La comparación será insensible a mayúsculas/minúsculas y diacríticos/acentos (ej. "diseño" coincidirá con "Diseno" o "DISEÑO").
- **RF-1.4.** Si una columna no contiene tarjetas que coincidan con la búsqueda activa, mostrará un estado vacío informativo ("Sin tarjetas coincidentes") sin deformar el ancho ni la altura mínima de la columna.

### RF-2 — Filtrado por Prioridad y Etiquetas
- **RF-2.1.** El botón "Filter board" desplegará un panel flotante accesible (`Popover` basado en `@base-ui/react/popover`) con dos secciones:
  - **Prioridad:** checkboxes o selectores para 'High', 'Medium', 'Low' acompañados de sus badges visuales (`CardPriorityBadge`).
  - **Etiquetas:** listado dinámico de las etiquetas existentes en el tablero extraídas de las tarjetas actuales.
- **RF-2.2.** El botón de filtro mostrará un badge numérico con la cantidad total de criterios activos cuando haya filtros aplicados (ej. `2` si hay 1 prioridad y 1 tag seleccionados).
- **RF-2.3.** El panel de filtros incluirá un botón "Limpiar filtros" visible cuando haya criterios activos, restableciendo instantáneamente la búsqueda, prioridades y etiquetas.
- **RF-2.4.** El sub-encabezado del tablero actualizará el contador general reflejando las tarjetas visibles frente al total (ej. `3 de 7 tarjetas` si hay filtros activos, o `7 tarjetas` en estado neutro).

### RF-3 — Vista Alternativa (Board vs. List)
- **RF-3.1.** El conmutador "Board / List" del sub-encabezado permitirá alternar instantáneamente entre la cuadrícula de columnas (`KanbanBoard`) y la tabla/lista vertical (`ListView`).
- **RF-3.2.** El botón correspondiente a la vista activa se resaltará con estilo visual seleccionado (`bg-[#f1f1ed] text-[#30323a] font-medium`).
- **RF-3.3.** En la vista "List", las tareas se renderizarán agrupadas por columna/estado, mostrando para cada una: título, extracto de descripción, badge de prioridad, badges de etiquetas y fecha límite si existe.
- **RF-3.4.** Hacer clic en cualquier fila de la vista "List" disparará la apertura del `CardDetailModal` con los datos íntegros de la tarea, permitiendo su edición y borrado de forma idéntica a la vista "Board".
- **RF-3.5.** Al conmutar entre "Board" y "List", los filtros aplicados y el término de búsqueda se conservarán intactos.

### RF-4 — Integridad con Drag & Drop
- **RF-4.1.** En la vista "Board", el drag & drop continuará plenamente operativo entre las tarjetas visibles filtradas, preservando el orden relativo de las tarjetas que hayan quedado temporalmente ocultas por los filtros.
- **RF-4.2.** En la vista "List", el drag & drop se deshabilitará por diseño para priorizar la navegación rápida, la densidad de información y la accesibilidad tabular.

## Requisitos no funcionales
- **RNF-1 — Lógica pura desacoplada:** Toda la lógica de filtrado residirá en funciones matemáticas puras en `src/kanban/core/filter.ts` (`filterTasks`, `matchesSearch`, `getAvailableTags`, `countActiveFilters`), con suite de tests unitarios deterministas en `src/kanban/core/__tests__/filter.test.ts`.
- **RNF-2 — Rendimiento reactivo:** El algoritmo de filtrado sobre colecciones de hasta 200 tarjetas deberá resolverse en menos de 10 ms sin provocar re-renderizados innecesarios en componentes no afectados.
- **RNF-3 — Tipado estricto:** Cero `any` y contratos tipados en `src/interfaces/kanban.interface.ts` (`KanbanFilters`, `KanbanViewMode`).
- **RNF-4 — Accesibilidad WAI-ARIA:** El popover de filtros implementará captura de foco, cierre con `Escape`, roles semánticos y etiquetas `aria-label` / `aria-expanded`.

## Casos límite
- **CL-1 — Búsqueda sin coincidencias en todo el tablero:** Si ningún elemento coincide, las 3 columnas mantendrán su layout fijo y mostrarán el estado vacío correspondiente ("Sin tarjetas coincidentes").
- **CL-2 — Etiquetas dinámicas tras borrado:** Si se elimina o edita la última tarjeta que contenía una etiqueta específica, dicha etiqueta desaparecerá automáticamente del listado de filtros disponibles en el Popover.
- **CL-3 — Espacios en blanco:** Criterios de búsqueda formados exclusivamente por espacios en blanco (`"   "`) se sanitizarán con `.trim()` tratándose como búsqueda inactiva (mostrar todas las tarjetas).
- **CL-4 — Caracteres especiales y tildes:** Búsquedas con caracteres diacríticos (ej. "página", "pagina", "PÁGINA") encontrarán los mismos resultados mediante normalización NFD canónica.
- **CL-5 — Añadir tarjeta con filtros activos:** Si el usuario pulsa "Add card" en una columna mientras hay filtros activos, la tarjeta se creará en el store de forma inmutable; si sus propiedades por defecto no coinciden con los filtros vigentes, permanecerá en el store y se visibilizará al limpiar los filtros.
- **CL-6 — Apertura de modal desde fila en ListView:** La fila completa de la lista tabular actuará como disparador interactivo con `cursor-pointer`, aislando botones secundarios de opciones.

## Criterios de finalización
- [x] La búsqueda por texto filtra reactivamente por título y descripción con insensibilidad a mayúsculas y acentos.
- [x] El panel Popover permite seleccionar múltiples prioridades (OR) y múltiples etiquetas (OR inclusivo), combinadas entre sí con AND.
- [x] El botón de filtros muestra el contador de criterios activos y permite limpiarlos con un solo clic.
- [x] El sub-header refleja el número de tarjetas visibles (`X de Y tarjetas`).
- [x] La vista "List" presenta las tareas agrupadas por estado con sus metadatos y permite abrir `CardDetailModal`.
- [x] La conmutación entre "Board" y "List" preserva los filtros activos.
- [x] Las columnas sin resultados muestran un placeholder amigable de estado vacío.
- [x] La suite de pruebas de `filter.ts` pasa al 100% en `npx vitest run`.
- [x] `npx tsc --noEmit` y `npm run lint` pasan con 0 errores y 0 warnings.
- [x] `npm run build` genera el bundle de producción limpiamente.

## Dudas abiertas
*(Ninguna. El alcance técnico está formalizado y consensuado).*
