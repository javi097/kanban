import { describe, it, expect } from 'vitest';
import {
  validateTaskTitle,
  validateTag,
  sanitizeTags,
  validateTaskPayload,
} from '@/kanban/core/validator';
import type { UpdateTaskPayload } from '@/interfaces/kanban.interface';

// ---------------------------------------------------------------------------
// validateTaskTitle
// ---------------------------------------------------------------------------
describe('validateTaskTitle', () => {
  it('TC-VAL-1: acepta títulos válidos y recorta espacios en los extremos', () => {
    const result = validateTaskTitle('   Redesign landing page   ');
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe('Redesign landing page');
    expect(result.error).toBeUndefined();
  });

  it('TC-VAL-2: rechaza string vacío "" con error correspondiente', () => {
    const result = validateTaskTitle('');
    expect(result.isValid).toBe(false);
    expect(result.sanitized).toBe('');
    expect(result.error).toBe('El título no puede estar vacío');
  });

  it('TC-VAL-3: rechaza strings formados exclusivamente por espacios en blanco', () => {
    const result = validateTaskTitle('     ');
    expect(result.isValid).toBe(false);
    expect(result.sanitized).toBe('');
    expect(result.error).toBe('El título no puede estar vacío');
  });

  it('TC-VAL-4: rechaza tipos no string (null, undefined, números, objetos)', () => {
    expect(validateTaskTitle(null).isValid).toBe(false);
    expect(validateTaskTitle(undefined).isValid).toBe(false);
    expect(validateTaskTitle(12345).isValid).toBe(false);
    expect(validateTaskTitle({}).isValid).toBe(false);
  });

  it('TC-VAL-5: valida longitud máxima de 120 caracteres según CL-2', () => {
    const exactly120 = 'a'.repeat(120);
    const validResult = validateTaskTitle(exactly120);
    expect(validResult.isValid).toBe(true);
    expect(validResult.sanitized).toBe(exactly120);

    const tooLong121 = 'a'.repeat(121);
    const invalidResult = validateTaskTitle(tooLong121);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.error).toContain('120');
  });
});

// ---------------------------------------------------------------------------
// validateTag
// ---------------------------------------------------------------------------
describe('validateTag', () => {
  const existingTags = ['Design', 'Engineering', 'Website'];

  it('TC-VAL-6: acepta una etiqueta nueva no existente', () => {
    const result = validateTag('Research', existingTags);
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe('Research');
    expect(result.error).toBeUndefined();
  });

  it('TC-VAL-7: rechaza etiquetas duplicadas con coincidencia exacta', () => {
    const result = validateTag('Design', existingTags);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('La etiqueta ya existe');
  });

  it('TC-VAL-8: rechaza etiquetas duplicadas con diferente caja (case-insensitive)', () => {
    const resultLower = validateTag('design', existingTags);
    expect(resultLower.isValid).toBe(false);
    expect(resultLower.error).toBe('La etiqueta ya existe');

    const resultUpper = validateTag('ENGINEERING', existingTags);
    expect(resultUpper.isValid).toBe(false);
    expect(resultUpper.error).toBe('La etiqueta ya existe');

    const resultSpaces = validateTag('  website  ', existingTags);
    expect(resultSpaces.isValid).toBe(false);
    expect(resultSpaces.error).toBe('La etiqueta ya existe');
  });

  it('TC-VAL-9: rechaza etiquetas vacías o con solo espacios o tipos inválidos', () => {
    expect(validateTag('', existingTags).isValid).toBe(false);
    expect(validateTag('    ', existingTags).isValid).toBe(false);
    expect(validateTag(null, existingTags).isValid).toBe(false);
    expect(validateTag(undefined, existingTags).isValid).toBe(false);
  });

  it('TC-VAL-10: rechaza etiquetas que superen 25 caracteres', () => {
    const exactly25 = 'a'.repeat(25);
    expect(validateTag(exactly25, existingTags).isValid).toBe(true);

    const tooLong26 = 'a'.repeat(26);
    const invalid = validateTag(tooLong26, existingTags);
    expect(invalid.isValid).toBe(false);
    expect(invalid.error).toContain('25');
  });
});

// ---------------------------------------------------------------------------
// sanitizeTags
// ---------------------------------------------------------------------------
describe('sanitizeTags', () => {
  it('TC-VAL-11: limpia arrays eliminando duplicados, vacíos y elementos no válidos', () => {
    const raw = [
      'Design',
      '  design  ',
      '',
      '   ',
      'ENGINEERING',
      null,
      undefined,
      42,
      'Design System',
      'design system',
    ];
    const sanitized = sanitizeTags(raw);

    // Debe preservar el primero de cada duplicado y descartar inválidos
    expect(sanitized).toEqual(['Design', 'ENGINEERING', 'Design System']);
  });

  it('TC-VAL-11-EXTRA: maneja entradas no array retornando array vacío', () => {
    expect(sanitizeTags(null)).toEqual([]);
    expect(sanitizeTags(undefined)).toEqual([]);
    expect(sanitizeTags('tag')).toEqual([]);
    expect(sanitizeTags({})).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// validateTaskPayload
// ---------------------------------------------------------------------------
describe('validateTaskPayload', () => {
  it('TC-VAL-12: valida un payload completo de actualización retornando datos sanitizados', () => {
    const payload: UpdateTaskPayload = {
      title: '  Updated Title  ',
      description: '  Updated Description  ',
      priority: 'High',
      status: 'In Progress',
      tags: ['Frontend', '  frontend  ', 'UI'],
      due: '  Tomorrow  ',
    };

    const result = validateTaskPayload(payload);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
    expect(result.sanitizedPayload).toEqual({
      title: 'Updated Title',
      description: 'Updated Description',
      priority: 'High',
      status: 'In Progress',
      tags: ['Frontend', 'UI'],
      due: 'Tomorrow',
    });
  });

  it('TC-VAL-12-INVALID: reporta errores en campos con valores inválidos', () => {
    const invalidPayload = {
      title: '    ',
      priority: 'UltraHigh' as unknown as UpdateTaskPayload['priority'],
      status: 'Archived' as unknown as UpdateTaskPayload['status'],
      tags: 'not-an-array' as unknown as UpdateTaskPayload['tags'],
    };

    const result = validateTaskPayload(invalidPayload);
    expect(result.isValid).toBe(false);
    expect(result.errors.title).toBeDefined();
    expect(result.errors.priority).toBeDefined();
    expect(result.errors.status).toBeDefined();
    expect(result.errors.tags).toBeDefined();
  });

  it('TC-VAL-12-EMPTY: maneja payload nulo o no objeto', () => {
    expect(validateTaskPayload(null).isValid).toBe(false);
    expect(validateTaskPayload(undefined).isValid).toBe(false);
    expect(validateTaskPayload('invalid').isValid).toBe(false);
  });
});
