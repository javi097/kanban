# Spec 002 — Gestión CRUD y Detalle de Tarea
Estado: aprobado

## Contexto y objetivo
El tablero permite arrastrar y soltar tarjetas, pero los usuarios no pueden inspeccionar en profundidad su contenido, editar detalles existentes ni eliminar tareas de forma controlada. El objetivo de esta spec es dotar al tablero de capacidades completas de gestión CRUD (crear, leer, actualizar y borrar), integrando un modal de detalle accesible y edición inline, asegurando la persistencia y la inmutabilidad de los datos.

## Usuarios
- **Usuario del tablero:** gestiona sus tareas diarias, consulta detalles ampliados, corrige descripciones y depura elementos completados.

## Historias de usuario
- **HU-1.** Como usuario, quiero hacer clic en una tarjeta para abrir un modal con todos sus detalles (título, descripción completa, prioridad, columna, etiquetas y fecha límite).
- **HU-2.** Como usuario, quiero editar el título y la descripción de una tarjeta dentro del modal para mantener la información actualizada.
- **HU-3.** Como usuario, quiero cambiar la prioridad y las etiquetas de una tarea para clasificar adecuadamente el trabajo.
- **HU-4.** Como usuario, quiero eliminar una tarjeta existente con confirmación previa para no perder datos por accidente.
- **HU-5.** Como usuario, quiero que cualquier modificación o borrado se sincronice de inmediato en `localStorage`.

## Definiciones
- **Modal de Detalle (`CardDetailModal`):** Diálogo superpuesto accesible que muestra y permite editar los campos de la tarea seleccionada.
- **Etiquetas (`tags`):** Colección de palabras clave asignadas a una tarea para categorizar su ámbito (ej. 'Design', 'Engineering').
- **Estado de Edición:** Modalidad dentro del diálogo que permite alternar entre vista de lectura y campos de formulario editables.

## Requisitos funcionales

### RF-1 — Apertura y visualización del detalle
- **RF-1.1.** Cuando el usuario haga clic sobre una tarjeta (sin desplazarla en drag & drop), el sistema deberá abrir el modal de detalle con los datos de dicha tarea.
- **RF-1.2.** El modal deberá mostrar claramente: título, descripción completa, columna actual (`status`), selector de prioridad con su estilo visual correspondiente, lista de etiquetas y fecha límite (`due`).
- **RF-1.3.** El diálogo deberá ser accesible, capturar el foco al abrirse y cerrarse tanto con el botón de cierre, clic en el backdrop o pulsando la tecla `Escape`.

### RF-2 — Edición y actualización de tarea
- **RF-2.1.** El sistema deberá permitir editar el título y la descripción directamente dentro del modal.
- **RF-2.2.** Si el usuario intenta guardar un título vacío o compuesto solo por espacios, el sistema deberá impedirlo y mostrar una advertencia visual.
- **RF-2.3.** El sistema deberá permitir cambiar la prioridad entre 'High', 'Medium' y 'Low'.
- **RF-2.4.** El sistema deberá permitir cambiar el `status` de la tarjeta desde un desplegable dentro del modal, trasladándola a la columna correspondiente.
- **RF-2.5.** Cuando el usuario confirme los cambios, el sistema deberá actualizar la tarea en el store de Zustand y reflejar la nueva información en la columna sin alterar el orden relativo.

### RF-3 — Gestión de etiquetas (Tags)
- **RF-3.1.** El usuario deberá poder añadir nuevas etiquetas introduciendo texto y pulsando `Enter`.
- **RF-3.2.** El usuario deberá poder eliminar etiquetas individuales mediante un botón de eliminación en cada badge.
- **RF-3.3.** El sistema deberá evitar etiquetas duplicadas dentro de una misma tarjeta.

### RF-4 — Eliminación defensiva de tarea
- **RF-4.1.** El modal de detalle y el menú de opciones de la tarjeta deberán incluir una acción de "Eliminar tarjeta".
- **RF-4.2.** Al solicitar la eliminación, el sistema deberá solicitar confirmación al usuario antes de proceder.
- **RF-4.3.** Al confirmar el borrado, la tarjeta deberá desaparecer del tablero y de la persistencia de forma irreversible.

### RF-5 — Persistencia
- **RF-5.1.** Cualquier edición o borrado deberá sincronizarse automáticamente en `localStorage` bajo la clave `kanban-storage`.

## Requisitos no funcionales
- **RNF-1 — Accesibilidad:** El diálogo debe implementar los atributos WAI-ARIA correspondientes mediante primitivas de Radix UI (`@radix-ui/react-dialog` o `@base-ui/react`).
- **RNF-2 — Inmutabilidad:** Las mutaciones de actualización y borrado en `kanban.store.ts` deben retornar nuevos arrays/objetos sin mutar el estado anterior.
- **RNF-3 — Tipado Estricto:** Cero `any` en los payloads de edición y eventos de formulario.

## Casos límite
- **CL-1 — Clic vs Arrastre:** El inicio del arrastre (umbral > 5 px) no debe disparar la apertura accidental del modal de detalle.
- **CL-2 — Título con longitud excesiva:** Títulos largos deben ajustarse con salto de línea sin desbordar el contenedor del modal.
- **CL-3 — Borrado de tarjeta con modal abierto:** El modal debe cerrarse limpiamente tras confirmar la eliminación.

## Fuera de alcance
- Asignación de avatares/usuarios miembros a las tarjetas (se abordará si se amplía el proyecto).
- Historial de cambios o comentarios por tarea.

## Criterios de finalización
- [ ] Al hacer clic en una tarjeta se abre el modal con sus datos íntegros.
- [ ] Se puede modificar título, descripción, prioridad y status desde el modal.
- [ ] Se pueden añadir y retirar tags sin duplicados.
- [ ] Se puede eliminar la tarea tras confirmación.
- [ ] Los cambios persisten tras recargar la página (`F5`).
- [ ] `npx tsc --noEmit` y `npm run lint` pasan limpios sin advertencias ni uso de `any`.

## Dudas abiertas
*(Ninguna. Requisitos alineados con la interfaz de v0.)*