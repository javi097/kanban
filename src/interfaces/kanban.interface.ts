export type Status = 'To Do' | 'In Progress' | 'Done';

/** Identificador único de sensor para @dnd-kit. Estrictamente string.
 *  Las tarjetas se identifican como 'task-{id}' y las columnas
 *  por su valor de Status ('To Do', 'In Progress', 'Done'),
 *  evitando colisiones entre ambos espacios de nombres.
 */
export type UniqueId = string;

export type Priority = 'High' | 'Medium' | 'Low';

export interface Task {
  id: number;
  title: string;
  description: string;
  tags: string[];
  priority: Priority;
  status: Status;
  due?: string;
}

export interface Column {
  name: Status;
  color: string;
}

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

