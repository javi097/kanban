import type {
  Priority,
  Status,
  UpdateTaskPayload,
  ValidationResult,
  TaskPayloadValidationResult,
} from '@/interfaces/kanban.interface';

const MAX_TITLE_LENGTH = 120;
const MAX_TAG_LENGTH = 25;
const VALID_PRIORITIES: readonly Priority[] = ['High', 'Medium', 'Low'] as const;
const VALID_STATUSES: readonly Status[] = ['To Do', 'In Progress', 'Done'] as const;

/**
 * Valida el título de una tarea.
 * Pura: no lee ni modifica ningún estado externo.
 *
 * @param title - Valor a validar como título.
 * @returns ValidationResult con el estado de validez, error opcional y string sanitizado.
 */
export function validateTaskTitle(title: unknown): ValidationResult<string> {
  if (typeof title !== 'string') {
    return {
      isValid: false,
      error: 'El título debe ser un texto válido',
      sanitized: '',
    };
  }

  const sanitized = title.trim();

  if (sanitized.length === 0) {
    return {
      isValid: false,
      error: 'El título no puede estar vacío',
      sanitized: '',
    };
  }

  if (sanitized.length > MAX_TITLE_LENGTH) {
    return {
      isValid: false,
      error: `El título no puede superar ${MAX_TITLE_LENGTH} caracteres`,
      sanitized,
    };
  }

  return {
    isValid: true,
    sanitized,
  };
}

/**
 * Valida una etiqueta individual comprobando formato y unicidad en la tarea.
 * Pura: comparación insensible a mayúsculas/minúsculas contra existingTags.
 *
 * @param tag - Valor a validar como nueva etiqueta.
 * @param existingTags - Etiquetas existentes para comprobar duplicados.
 * @returns ValidationResult con el estado de validez, error opcional y tag sanitizado.
 */
export function validateTag(
  tag: unknown,
  existingTags: readonly string[] = [],
): ValidationResult<string> {
  if (typeof tag !== 'string') {
    return {
      isValid: false,
      error: 'La etiqueta debe ser un texto válido',
      sanitized: '',
    };
  }

  const sanitized = tag.trim();

  if (sanitized.length === 0) {
    return {
      isValid: false,
      error: 'La etiqueta no puede estar vacía',
      sanitized: '',
    };
  }

  if (sanitized.length > MAX_TAG_LENGTH) {
    return {
      isValid: false,
      error: `La etiqueta no puede superar ${MAX_TAG_LENGTH} caracteres`,
      sanitized,
    };
  }

  const isDuplicate = existingTags.some(
    (existing) =>
      typeof existing === 'string' &&
      existing.trim().toLowerCase() === sanitized.toLowerCase(),
  );

  if (isDuplicate) {
    return {
      isValid: false,
      error: 'La etiqueta ya existe',
      sanitized,
    };
  }

  return {
    isValid: true,
    sanitized,
  };
}

/**
 * Sanitiza una colección de etiquetas descartando vacíos, nulos y duplicados.
 * Pura: preserva la primera aparición y mantiene inmutabilidad.
 *
 * @param tags - Lista de etiquetas a sanitizar.
 * @returns Array nuevo de strings válidos y únicos.
 */
export function sanitizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];

  const seen = new Set<string>();
  const sanitizedList: string[] = [];

  for (const item of tags) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (trimmed.length === 0) continue;

    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      sanitizedList.push(trimmed);
    }
  }

  return sanitizedList;
}

/**
 * Valida un payload parcial de actualización para una tarea.
 * Pura: verifica título, descripción, prioridad, columna y etiquetas.
 *
 * @param payload - Objeto con las modificaciones propuestas.
 * @returns TaskPayloadValidationResult con estado, mapa de errores y payload limpio.
 */
export function validateTaskPayload(
  payload: unknown,
): TaskPayloadValidationResult {
  const errors: Partial<Record<keyof UpdateTaskPayload, string>> = {};
  const sanitizedPayload: UpdateTaskPayload = {};

  if (!payload || typeof payload !== 'object') {
    return {
      isValid: false,
      errors: { title: 'Payload inválido' },
      sanitizedPayload: {},
    };
  }

  const candidate = payload as Partial<UpdateTaskPayload>;

  // Validación de título
  if (candidate.title !== undefined) {
    const titleVal = validateTaskTitle(candidate.title);
    if (!titleVal.isValid) {
      errors.title = titleVal.error;
    } else {
      sanitizedPayload.title = titleVal.sanitized;
    }
  }

  // Validación de descripción
  if (candidate.description !== undefined) {
    if (typeof candidate.description === 'string') {
      sanitizedPayload.description = candidate.description.trim();
    } else {
      errors.description = 'La descripción debe ser un texto válido';
    }
  }

  // Validación de prioridad
  if (candidate.priority !== undefined) {
    if (VALID_PRIORITIES.includes(candidate.priority as Priority)) {
      sanitizedPayload.priority = candidate.priority;
    } else {
      errors.priority = 'Prioridad inválida';
    }
  }

  // Validación de columna/status
  if (candidate.status !== undefined) {
    if (VALID_STATUSES.includes(candidate.status as Status)) {
      sanitizedPayload.status = candidate.status;
    } else {
      errors.status = 'Columna o estado inválido';
    }
  }

  // Validación de etiquetas
  if (candidate.tags !== undefined) {
    if (Array.isArray(candidate.tags)) {
      sanitizedPayload.tags = sanitizeTags(candidate.tags);
    } else {
      errors.tags = 'Las etiquetas deben ser una lista';
    }
  }

  // Validación de fecha límite (due)
  if (candidate.due !== undefined) {
    if (typeof candidate.due === 'string') {
      sanitizedPayload.due = candidate.due.trim();
    } else {
      errors.due = 'Fecha límite inválida';
    }
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    sanitizedPayload,
  };
}
