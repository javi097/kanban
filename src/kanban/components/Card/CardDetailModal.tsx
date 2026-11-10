import { useState, useEffect } from 'react';
import { X, Trash2, Plus, AlertCircle, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/custom/ConfirmDialog';
import { CardPriorityBadge } from '@/kanban/components/Card/CardPriorityBadge';
import { CardTag } from '@/kanban/components/Card/CardTag';
import { useKanbanStore } from '@/kanban/store/kanban.store';
import { validateTaskTitle, validateTag } from '@/kanban/core/validator';
import type { Priority, Status } from '@/interfaces/kanban.interface';

const ALL_PRIORITIES: readonly Priority[] = ['Low', 'Medium', 'High'] as const;
const ALL_STATUSES: readonly Status[] = ['To Do', 'In Progress', 'Done'] as const;

interface Props {
  className?: string;
}

/**
 * Modal accesible de visualización e inspección integral de tarea (RF-1.1 - RF-4.3).
 * Provee edición inline de título, descripción, prioridad, columna y etiquetas,
 * así como eliminación defensiva mediante ConfirmDialog.
 */
export function CardDetailModal({ className }: Props) {
  const tasks = useKanbanStore((s) => s.tasks);
  const selectedTaskId = useKanbanStore((s) => s.selectedTaskId);
  const setSelectedTaskId = useKanbanStore((s) => s.setSelectedTaskId);
  const updateTask = useKanbanStore((s) => s.updateTask);
  const deleteTask = useKanbanStore((s) => s.deleteTask);

  const task = tasks.find((t) => t && t.id === selectedTaskId);

  // Estados de borrador para edición inline
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftPriority, setDraftPriority] = useState<Priority>('Medium');
  const [draftStatus, setDraftStatus] = useState<Status>('To Do');
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [tagError, setTagError] = useState<string | null>(null);

  // Control del diálogo de confirmación de borrado
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Sincronizar estado local al cambiar la tarea seleccionada
  useEffect(() => {
    if (task) {
      setDraftTitle(task.title);
      setDraftDescription(task.description);
      setDraftPriority(task.priority);
      setDraftStatus(task.status);
      setDraftTags([...task.tags]);
      setNewTagInput('');
      setTagError(null);
      setIsConfirmOpen(false);
    }
  }, [task]);

  // Si no hay tarea seleccionada o no existe en la lista, retorno defensivo (CL-3)
  if (!selectedTaskId || !task) {
    return null;
  }

  const titleValidation = validateTaskTitle(draftTitle);

  function handleClose() {
    setSelectedTaskId(null);
  }

  function handleAddTag() {
    const validation = validateTag(newTagInput, draftTags);
    if (!validation.isValid) {
      setTagError(validation.error ?? 'Etiqueta inválida');
      return;
    }

    setDraftTags((prev) => [...prev, validation.sanitized]);
    setNewTagInput('');
    setTagError(null);
  }

  function handleRemoveTag(tagToRemove: string) {
    setDraftTags((prev) => prev.filter((t) => t !== tagToRemove));
  }

  function handleSave() {
    if (!titleValidation.isValid) return;

    updateTask(task.id, {
      title: titleValidation.sanitized,
      description: draftDescription.trim(),
      priority: draftPriority,
      status: draftStatus,
      tags: draftTags,
    });

    handleClose();
  }

  function handleDeleteConfirm() {
    deleteTask(task.id);
    setIsConfirmOpen(false);
  }

  return (
    <>
      <DialogRoot open={Boolean(task)} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className={cn('p-6 sm:max-w-[580px]', className)}>
          {/* Encabezado accesible */}
          <DialogHeader className="p-0 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#85868a]">
                Detalle de tarjeta #{task.id}
              </span>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Cerrar modal"
                className="rounded-md p-1 text-[#85868a] hover:bg-[#f1f1ee] hover:text-[#35363b] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
            <DialogTitle className="sr-only">
              Detalle y edición de tarea: {task.title}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Edita el título, descripción, prioridad, columna y etiquetas de la tarjeta.
            </DialogDescription>
          </DialogHeader>

          {/* Cuerpo del formulario editable */}
          <div className="flex flex-col gap-5">
            {/* Título */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="task-title-input"
                className="text-xs font-semibold text-[#35363b]"
              >
                Título <span className="text-rose-500">*</span>
              </label>
              <input
                id="task-title-input"
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Título de la tarjeta"
                className={cn(
                  'w-full rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-[#292a2f] outline-none transition-colors',
                  titleValidation.isValid
                    ? 'border-[#e5e5e1] focus:border-[#252a45] focus:ring-1 focus:ring-[#252a45]'
                    : 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-1 focus:ring-rose-500',
                )}
              />
              {!titleValidation.isValid && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-rose-600">
                  <AlertCircle className="size-3" />
                  {titleValidation.error}
                </span>
              )}
            </div>

            {/* Metadatos: Columna y Prioridad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Columna / Status */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="task-status-select"
                  className="text-xs font-semibold text-[#35363b]"
                >
                  Columna / Estado
                </label>
                <select
                  id="task-status-select"
                  value={draftStatus}
                  onChange={(e) => setDraftStatus(e.target.value as Status)}
                  className="w-full rounded-lg border border-[#e5e5e1] bg-white px-3 py-2 text-xs font-medium text-[#30323a] outline-none transition-colors focus:border-[#252a45] focus:ring-1 focus:ring-[#252a45]"
                >
                  {ALL_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Prioridad */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[#35363b]">
                  Prioridad
                </span>
                <div className="flex items-center gap-1.5 pt-0.5">
                  {ALL_PRIORITIES.map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setDraftPriority(priority)}
                      aria-pressed={draftPriority === priority}
                      className={cn(
                        'rounded-lg p-0.5 transition-all cursor-pointer',
                        draftPriority === priority
                          ? 'ring-2 ring-[#252a45] ring-offset-1'
                          : 'opacity-50 hover:opacity-100',
                      )}
                    >
                      <CardPriorityBadge priority={priority} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="task-description-textarea"
                className="text-xs font-semibold text-[#35363b]"
              >
                Descripción
              </label>
              <textarea
                id="task-description-textarea"
                rows={3}
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                placeholder="Añade una descripción más detallada..."
                className="w-full rounded-lg border border-[#e5e5e1] bg-white px-3 py-2 text-xs leading-5 text-[#35363b] break-words outline-none transition-colors focus:border-[#252a45] focus:ring-1 focus:ring-[#252a45] resize-y placeholder:text-[#a0a1a5]"
              />
            </div>

            {/* Etiquetas (Tags) */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-[#35363b]">
                Etiquetas ({draftTags.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {draftTags.map((tag) => (
                  <CardTag
                    key={tag}
                    tag={tag}
                    onRemove={() => handleRemoveTag(tag)}
                  />
                ))}
                {draftTags.length === 0 && (
                  <span className="text-xs text-[#a0a1a5] italic">
                    Sin etiquetas asignadas
                  </span>
                )}
              </div>

              {/* Input inline para añadir etiqueta */}
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => {
                    setNewTagInput(e.target.value);
                    if (tagError) setTagError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Nueva etiqueta..."
                  className="rounded-md border border-[#e5e5e1] bg-white px-2.5 py-1 text-xs text-[#35363b] outline-none transition-colors focus:border-[#252a45] focus:ring-1 focus:ring-[#252a45] placeholder:text-[#a0a1a5]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleAddTag}
                  className="text-xs font-medium"
                >
                  <Plus className="size-3" data-icon="inline-start" />
                  Añadir
                </Button>
              </div>
              {tagError && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-rose-600">
                  <AlertCircle className="size-3" />
                  {tagError}
                </span>
              )}
            </div>

            {/* Fecha límite (si existe) */}
            {task.due && (
              <div className="flex items-center gap-2 text-xs text-[#77787d] border-t border-[#f0f0ed] pt-3">
                <CalendarDays className="size-3.5 text-[#999a9e]" />
                <span>Fecha límite prevista: <strong>{task.due}</strong></span>
              </div>
            )}
          </div>

          {/* Pie de acciones */}
          <DialogFooter className="p-0 mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[#f0f0ed] pt-4">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setIsConfirmOpen(true)}
              className="text-xs font-medium cursor-pointer"
            >
              <Trash2 className="size-3.5" data-icon="inline-start" />
              Eliminar tarjeta
            </Button>
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-xs cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!titleValidation.isValid}
                onClick={handleSave}
                className="bg-[#252a45] text-white hover:bg-[#333957] text-xs font-medium cursor-pointer disabled:opacity-50"
              >
                Guardar cambios
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Diálogo de confirmación defensivo para borrado (RF-4.2) */}
      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="¿Eliminar esta tarjeta?"
        description={`Esta acción eliminará de forma permanente "${task.title}". No podrás deshacer esta operación.`}
        confirmLabel="Eliminar tarjeta"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
