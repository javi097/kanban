# AGENTS.md — Kanban
Aplicación web interactiva para la gestión visual ágil de proyectos y flujos de trabajo mediante tableros Kanban interactivos. Proyecto construido desde cero en React + TypeScript: modularidad por dominios (*feature-driven*), tipado estricto sin `any`, reordenación reactiva mediante `@dnd-kit`, diseño accesible con Tailwind CSS y primitivas de Shadcn UI, y gestión de estado predecible, desacoplada e inmutable con Zustand y persistencia local.

## Stack y estructura
- React (Vite, TypeScript en modo estricto) y Tailwind CSS.
- UI, iconografía y primitivas: Shadcn UI (Radix UI) y Lucide React.
- Drag & Drop: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
- Gestión de estado: Zustand con persistencia en `localStorage` (clave `kanban-storage`).
- Notificaciones: Sonner.
- Arquitectura modular con alias `@/*` apuntando a `./src/*`:
  
```text
src/
├── assets/                 # Recursos gráficos, iconos y SVG
├── components/             # Componentes transversales compartidos
│   ├── custom/             # Componentes propios (Header, ConfirmDialog, EmptyState...)
│   └── ui/                 # Primitivas base de Shadcn (button, card, dialog, input, badge, dropdown-menu...)
├── interfaces/             # Contratos de datos globales (*.interface.ts)
├── lib/                    # Utilidades puras (utils.ts con cn)
├── kanban/                 # Dominio / Feature principal de la aplicación
│   ├── actions/            # Helpers de exportación/importación (JSON/CSV) y serialización
│   ├── components/         # Componentes de la UI del tablero:
│   │   ├── Board/          # KanbanBoard, BoardHeader, DragOverlayCard
│   │   ├── Column/         # KanbanColumn, ColumnHeader, AddTaskInline, ColumnActions
│   │   ├── Card/           # KanbanCard, CardPriorityBadge, CardTag, CardDetailModal
│   │   └── Controls/       # SearchInput, PriorityFilter, TagFilter
│   ├── core/               # Lógica pura desacoplada de React:
│   │   ├── reorder.ts      # Funciones puras de ordenación intra-columna e inter-columna (arrayMove)
│   │   ├── filter.ts       # Filtrado determinista de tarjetas por búsqueda, prioridad o tags
│   │   └── validator.ts    # Validación de títulos, descripciones y límites de tarjetas
│   ├── hooks/              # Custom hooks (useKanbanDnd, useBoardFilters, useKeyboardShortcuts)
│   ├── layouts/            # KanbanLayout.tsx
│   ├── pages/              # BoardPage.tsx
│   └── store/              # kanban.store.ts (Zustand con persistencia)
├── index.css               # Estilos globales, directivas de Tailwind v4 y variables CSS
├── App.tsx                 # Contenedor raíz con proveedores globales (Toaster, DnD Contexts)
└── main.tsx                # Punto de entrada de Vite
```
## Convenciones
- Nombres de archivos, interfaces, tipos, variables y componentes en inglés.
- Textos de interfaz y guías técnicas en español o inglés consistente (según el componente de guía).
- Tipado estricto innegociable: cero `any`, contratos explícitos con sufijo `.interface.ts` en `src/interfaces/`, y props de componentes tipadas con `interface Props`.
- Funciones matemáticas y de reordenación (`src/kanban/core/`) completamente puras: no dependen de estados de React, elementos DOM ni del store de Zustand. Deben recibir datos y devolver resultados predecibles e inmutables.
- Estilos exclusivamente con utilidades de Tailwind CSS combinadas mediante `cn()` de `@/lib/utils`. Diseño responsivo con soporte para panel lateral plegable.

## Dominio y reglas de negocio (fácil equivocarse)
- **Identificadores estables:** Columnas y tareas tienen IDs únicos e inmutables (`columnId`, `taskId`). Queda terminantemente prohibido usar el índice del array como clave en React o como identificador en los sensores de `@dnd-kit`.
- **Estructura relacional de tareas:** Las tareas contienen la referencia a su columna contenedora mediante `columnId` y una posición u orden relativo. Se evita anidar arrays mutables dentro de las columnas para prevenir renderizados en cascada innecesarios.
- **Movimiento intra-columna vs inter-columna:**
  - *Misma columna:* Se reordenan los elementos usando `arrayMove` sin alterar el `columnId`.
  - *Distinta columna:* Se traslada la tarjeta actualizando su `columnId` al de la columna destino e insertándola en la posición exacta del cursor.
- **Uso estricto de DragOverlay:** El elemento en movimiento debe renderizarse en un `<DragOverlay>` desacoplado para evitar parpadeos visuales o deformaciones de layout en la lista de origen.
- **Estado de Zustand inmutable:** Cualquier actualización del tablero, columnas o tarjetas debe retornar un nuevo objeto o matriz mediante desestructuración (`...state`), sin mutar arrays ni colecciones bidimensionales directamente.

## Forma de trabajar
- Haz solo lo que se pide: no instales librerías innecesarias ni agregues funcionalidades no contempladas.
- Desarrollo guiado por especificaciones (SDD): lee la spec activa antes de tocar código.
- Refactorización incremental: migra la lógica del archivo monolítico por capas (`interfaces` -> `core` -> `store` -> `components`).
- Al terminar, resume qué has cambiado, qué archivos se han creado y las decisiones tomadas.

## Skills y Metodología (.agents/skills/)
El agente tiene a su disposición las siguientes skills locales:
- **`sdd`**: Flujo de desarrollo guiado por especificaciones (`sdd-spec`, `sdd-plan`, `sdd-tasks`, `sdd-implement`).
- **`frontend-design` & `web-design-guidelines`**: Directrices de espaciado, contraste, accesibilidad en drag & drop con teclado y feedback visual en dropzones.
- **`systematic-debugging`**: Protocolo sistemático de diagnóstico de errores (aislamiento de fallos, trazas y reproducción) antes de alterar código funcional.

## Memoria
- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas).
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md`.
- No guardes nunca datos sensibles (claves de API o tokens).

## Comandos
- Servidor local: `npm run dev`
- Comprobación de tipos: `npx tsc --noEmit`
- Linter: `npm run lint`
- Compilación: `npm run build`

## Reglas y Límites
- ✅ Siempre: mantener la modularidad por carpetas (`src/kanban/`, `src/interfaces/`, `src/components/ui/`) y los alias `@/*`.
- ✅ Siempre: actualizar `MEMORY.md` al terminar cada tarea.
- ⚠️ Pregunta antes: agregar dependencias pesadas no acordadas (por ejemplo, librerías alternativas de DnD distintas a `@dnd-kit`).
- 🚫 Nunca: usar `any` en TypeScript, meter estilos CSS en línea o dejar la compilación en rojo (`npx tsc --noEmit`).

## Verificación
- **Estática:** Comprueba tipos con `npx tsc --noEmit` y linter con `npm run lint`.
- **UI y Ejecución (Chrome DevTools MCP):** Abre `http://localhost:5173/`, verifica que las tarjetas se arrastren suavemente entre columnas, que el drop funcione al soltar y que el estado persista en recarga.
- **Consulta de Documentación (Context7 MCP):** Ante dudas sobre `@dnd-kit`, Zustand, Tailwind o Radix UI, usa Context7 para consultar la documentación oficial.
- Para empezar de cero en pruebas: DevTools → Application → Local Storage → borrar la clave `kanban-storage`.