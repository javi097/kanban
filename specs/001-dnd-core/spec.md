# Spec 001 — Drag & Drop Core con @dnd-kit
Estado: aprobada

## Contexto y objetivo
El tablero Kanban cuenta con una interfaz visual maquetada y un estado básico en Zustand, pero las tarjetas permanecen estáticas. El objetivo de esta spec es dotar al tablero de interactividad táctil y de ratón completa mediante `@dnd-kit`, permitiendo reordenar tarjetas dentro de la misma columna y transferirlas fluidamente entre columnas distintas sin recargar la página ni mutar el estado de forma destructiva.

## Usuarios
- **Usuario del tablero:** gestiona el flujo de trabajo de sus proyectos moviendo tareas entre 'To Do', 'In Progress' y 'Done'.

## Historias de usuario
- **HU-1.** Como usuario, quiero arrastrar una tarjeta dentro de la misma columna para cambiar su orden de prioridad relativa.
- **HU-2.** Como usuario, quiero arrastrar una tarjeta a otra columna para actualizar su estado de progreso (ej. de 'To Do' a 'In Progress').
- **HU-3.** Como usuario, quiero ver una previsualización flotante nítida mientras arrastro una tarjeta para saber con precisión dónde va a soltarse.
- **HU-4.** Como usuario, quiero que la nueva posición y estado de mis tarjetas persistan al recargar la página.

## Definiciones
- **Contenedor Droppable:** zona receptora de tarjetas (la columna o su lista interna).
- **Elemento Draggable:** tarjeta individual (`KanbanCard`) que puede ser tomada y desplazada.
- **DragOverlay:** clon visual desacoplado que flota bajo el cursor durante el arrastre, evitando alterar el flujo del DOM de origen.
- **Reordenación Intra-columna:** cambio de posición ordinal de una tarjeta dentro de su columna actual.
- **Transferencia Inter-columna:** cambio de pertenencia de una tarjeta a una columna diferente (`columnId` destino).

## Requisitos funcionales

### RF-1 — Detección e inicio del arrastre
- **RF-1.1.** Cuando el usuario presione el botón principal del ratón y desplace el puntero más de 5 píxeles, el sistema deberá iniciar la operación de arrastre.
- **RF-1.2.** Mientras el desplazamiento sea inferior a 5 píxeles, el sistema deberá considerar la interacción como un clic simple, previniendo arrastres accidentales.
- **RF-1.3.** Al iniciar el arrastre, el sistema deberá capturar la tarjeta activa y renderizar una copia flotante mediante `DragOverlay`.
- **RF-1.4.** Mientras una tarjeta esté siendo arrastrada, el elemento original en la columna deberá mostrarse con opacidad reducida (marcador de posición).

### RF-2 — Reordenación dentro de la misma columna (Intra-columna)
- **RF-2.1.** Mientras una tarjeta se desplace sobre su misma columna, el sistema deberá calcular en tiempo real el nuevo índice de inserción.
- **RF-2.2.** Cuando el usuario suelte la tarjeta en una nueva posición de la misma columna, el sistema deberá actualizar el orden de las tarjetas manteniendo intacto el `status` / `columnId`.
- **RF-2.3.** Si la tarjeta se suelta en su misma posición original, el sistema deberá cancelar la operación sin disparar actualizaciones de estado.

### RF-3 — Transferencia entre columnas distintas (Inter-columna)
- **RF-3.1.** Mientras una tarjeta se desplace sobre una columna diferente a la de origen, el sistema deberá mostrar un hueco interactivo en la columna destino.
- **RF-3.2.** Cuando una tarjeta entre en una columna vacía (sin tareas), el sistema deberá permitir soltarla directamente en ella.
- **RF-3.3.** Cuando el usuario suelte la tarjeta sobre una columna destino, el sistema deberá actualizar el `status` de la tarjeta al nuevo valor de la columna e insertarla en el índice correspondiente.

### RF-4 — Cancelación y casos de abandono
- **RF-4.1.** Si el usuario presiona la tecla `Escape` durante el arrastre, el sistema deberá abortar la operación y devolver la tarjeta a su posición original.
- **RF-4.2.** Si el usuario suelta la tarjeta fuera de cualquier columna válida, el sistema deberá cancelar la acción y devolver la tarjeta a su posición inicial sin alterar el estado.

### RF-5 — Persistencia del nuevo orden
- **RF-5.1.** Cuando finalice exitosamente cualquier movimiento (intra o inter columna), el sistema deberá sincronizar el nuevo estado en `localStorage` bajo la clave `kanban-storage`.

## Requisitos no funcionales
- **RNF-1 — Rendimiento fluido:** La animación y seguimiento del cursor durante el arrastre deberá ejecutarse a 60 FPS estables.
- **RNF-2 — Inmutabilidad estricta:** Las funciones de reordenación no deberán mutar arrays existentes; deberán retornar siempre copias inmutables.
- **RNF-3 — Cero Any:** Todo evento de DnD (`DragStartEvent`, `DragOverEvent`, `DragEndEvent`) e identificador deberá estar tipado explícitamente.

## Casos límite
- **CL-1 — Mover a columna vacía:** La columna receptora no contiene tarjetas, por lo que el cálculo de índice debe ser `0` por defecto.
- **CL-2 — Arrastre ultrarrápido:** Movimientos bruscos del puntero fuera del viewport del navegador no deben provocar bloqueos ni desalineaciones de estado.
- **CL-3 — Soltar sobre el encabezado de la columna:** Si la tarjeta se suelta sobre el título de la columna en vez de una tarjeta, debe insertarse en la primera posición disponible.

## Fuera de alcance
- Reordenar las columnas entre sí (las columnas 'To Do', 'In Progress' y 'Done' tienen orden fijo en esta fase).
- Animaciones complejas de física con resortes pesados (se utilizará la transición estándar de `@dnd-kit/utilities`).
- Soporte para arrastre táctil multidedo.

## Criterios de finalización
- [x] La tarjeta se toma y muestra una réplica flotante con `DragOverlay`.
- [x] Las tarjetas pueden intercambiar su orden dentro de la misma columna.
- [x] Las tarjetas pueden moverse de una columna a otra, actualizando su contador de columna.
- [x] Al recargar la página (`F5`), las tarjetas conservan sus columnas y posiciones exactas.
- [x] Soltar fuera del tablero o pulsar `Escape` no corrompe el orden de la lista.
- [x] `npx tsc --noEmit` y `npm run lint` pasan con 0 errores y sin usar `any`.

## Dudas abiertas
*(Ninguna. El alcance está completamente acotado al núcleo de arrastre y soltado.)*
