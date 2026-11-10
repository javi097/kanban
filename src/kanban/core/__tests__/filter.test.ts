import { describe, it, expect } from 'vitest';
import {
  normalizeSearchText,
  matchesSearch,
  matchesPriorities,
  matchesTags,
  filterTasks,
  getAvailableTags,
  countActiveFilters,
  hasActiveFilters,
} from '@/kanban/core/filter';
import type { KanbanFilters, Task } from '@/interfaces/kanban.interface';

const mockTasks: Task[] = [
  {
    id: 1,
    title: 'Diseño de la nueva Landing Page',
    description: 'Crear wireframes en Figma y maquetar componentes accesibles',
    priority: 'High',
    status: 'To Do',
    tags: ['Design', 'UI/UX'],
  },
  {
    id: 2,
    title: 'Configurar base de datos PostgreSQL',
    description: 'Definir esquemas relacionales y migraciones con Prisma',
    priority: 'High',
    status: 'In Progress',
    tags: ['Backend', 'Database'],
  },
  {
    id: 3,
    title: 'Escribir tests unitarios',
    description: 'Asegurar cobertura en funciones puras del core con Vitest',
    priority: 'Medium',
    status: 'In Progress',
    tags: ['Testing', 'QA'],
  },
  {
    id: 4,
    title: 'Optimizar imágenes de marketing',
    description: 'Convertir assets a formato WebP y comprimir',
    priority: 'Low',
    status: 'Done',
    tags: ['Design', 'Performance'],
  },
];

// ---------------------------------------------------------------------------
// normalizeSearchText
// ---------------------------------------------------------------------------
describe('normalizeSearchText', () => {
  it('TC-FILT-1: elimina espacios en blanco y convierte a minúsculas', () => {
    expect(normalizeSearchText('   Hola Mundo   ')).toBe('hola mundo');
    expect(normalizeSearchText('KANBAN BOARD')).toBe('kanban board');
  });

  it('TC-FILT-2: normaliza tildes y caracteres diacríticos (áéíóúñ -> aeioun)', () => {
    expect(normalizeSearchText('áéíóúñ')).toBe('aeioun');
    expect(normalizeSearchText('PÁGINA de DISEÑO')).toBe('pagina de diseno');
  });

  it('TC-FILT-3: maneja valores no string retornando string vacío', () => {
    expect(normalizeSearchText(null)).toBe('');
    expect(normalizeSearchText(undefined)).toBe('');
    expect(normalizeSearchText(12345)).toBe('');
    expect(normalizeSearchText({})).toBe('');
    expect(normalizeSearchText([])).toBe('');
  });
});

// ---------------------------------------------------------------------------
// matchesSearch
// ---------------------------------------------------------------------------
describe('matchesSearch', () => {
  it('TC-FILT-4: coincide por título y por descripción indistintamente, insensible a mayúsculas y acentos', () => {
    const task = mockTasks[0]; // Title: 'Diseño de la nueva Landing Page', Desc: 'Crear wireframes en Figma...'

    // Coincidencia en título con acento
    expect(matchesSearch(task, normalizeSearchText('diseño'))).toBe(true);
    // Coincidencia en título sin acento
    expect(matchesSearch(task, normalizeSearchText('diseno'))).toBe(true);
    // Coincidencia en título en mayúsculas
    expect(matchesSearch(task, normalizeSearchText('LANDING'))).toBe(true);

    // Coincidencia en descripción
    expect(matchesSearch(task, normalizeSearchText('figma'))).toBe(true);
    expect(matchesSearch(task, normalizeSearchText('wireframes'))).toBe(true);

    // No coincidente
    expect(matchesSearch(task, normalizeSearchText('postgresql'))).toBe(false);
  });

  it('TC-FILT-5: retorna true ante búsquedas vacías o compuestas solo por espacios (CL-3)', () => {
    const task = mockTasks[1];
    expect(matchesSearch(task, '')).toBe(true);
    expect(matchesSearch(task, normalizeSearchText('   '))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// matchesPriorities
// ---------------------------------------------------------------------------
describe('matchesPriorities', () => {
  it('TC-FILT-6: retorna true si no hay prioridades seleccionadas', () => {
    const task = mockTasks[0]; // High
    expect(matchesPriorities(task, [])).toBe(true);
  });

  it('TC-FILT-7: evalúa con lógica OR para múltiples prioridades seleccionadas', () => {
    const highTask = mockTasks[0]; // High
    const mediumTask = mockTasks[2]; // Medium
    const lowTask = mockTasks[3]; // Low

    expect(matchesPriorities(highTask, ['High'])).toBe(true);
    expect(matchesPriorities(highTask, ['Medium', 'Low'])).toBe(false);
    expect(matchesPriorities(mediumTask, ['High', 'Medium'])).toBe(true);
    expect(matchesPriorities(lowTask, ['Low'])).toBe(true);
    expect(matchesPriorities(lowTask, ['High'])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// matchesTags
// ---------------------------------------------------------------------------
describe('matchesTags', () => {
  it('TC-FILT-8: retorna true si no hay etiquetas seleccionadas', () => {
    const task = mockTasks[0];
    expect(matchesTags(task, [])).toBe(true);
  });

  it('TC-FILT-9: evalúa con lógica OR inclusivo para múltiples etiquetas (coincide si la tarea tiene al menos una)', () => {
    const task = mockTasks[0]; // tags: ['Design', 'UI/UX']

    // Coincide con una de las etiquetas (case-insensitive)
    expect(matchesTags(task, ['design'])).toBe(true);
    expect(matchesTags(task, ['DESIGN', 'Backend'])).toBe(true);
    expect(matchesTags(task, ['UI/UX'])).toBe(true);

    // No coincide con ninguna
    expect(matchesTags(task, ['Backend', 'Database'])).toBe(false);

    // Tarea sin tags
    const taskWithoutTags: Task = {
      ...task,
      tags: [],
    };
    expect(matchesTags(taskWithoutTags, ['Design'])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// filterTasks
// ---------------------------------------------------------------------------
describe('filterTasks', () => {
  it('TC-FILT-10: combina AND entre texto, prioridad y etiquetas, retornando el subconjunto correcto', () => {
    // Buscar 'landing' AND 'High' AND ['Design']
    const filters: KanbanFilters = {
      searchQuery: 'landing',
      priorities: ['High'],
      tags: ['Design'],
    };

    const results = filterTasks(mockTasks, filters);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(1);

    // Buscar 'landing' pero con prioridad 'Medium' -> 0 resultados
    const noMatchFilters: KanbanFilters = {
      searchQuery: 'landing',
      priorities: ['Medium'],
      tags: ['Design'],
    };
    expect(filterTasks(mockTasks, noMatchFilters)).toHaveLength(0);
  });

  it('TC-FILT-11: retorna array vacío si no hay coincidencias globales (CL-1)', () => {
    const filters: KanbanFilters = {
      searchQuery: 'criterio-totalmente-inexistente-xyz',
      priorities: [],
      tags: [],
    };

    const results = filterTasks(mockTasks, filters);
    expect(results).toEqual([]);
  });

  it('TC-FILT-12: no muta el array original de tareas y devuelve una nueva referencia (RNF-1)', () => {
    const tasksCopy = [...mockTasks];
    const filters: KanbanFilters = {
      searchQuery: '',
      priorities: [],
      tags: [],
    };

    const results = filterTasks(mockTasks, filters);
    expect(results).toEqual(mockTasks);
    expect(results).not.toBe(mockTasks); // Referencia distinta
    expect(mockTasks).toEqual(tasksCopy); // Array original inalterado
  });
});

// ---------------------------------------------------------------------------
// getAvailableTags
// ---------------------------------------------------------------------------
describe('getAvailableTags', () => {
  it('TC-FILT-13: extrae etiquetas únicas y ordenadas de las tareas vivas (CL-2)', () => {
    const tags = getAvailableTags(mockTasks);

    // Las etiquetas en mockTasks son:
    // Task 1: 'Design', 'UI/UX'
    // Task 2: 'Backend', 'Database'
    // Task 3: 'Testing', 'QA'
    // Task 4: 'Design', 'Performance'
    // Únicos: Backend, Database, Design, Performance, QA, Testing, UI/UX
    expect(tags).toEqual([
      'Backend',
      'Database',
      'Design',
      'Performance',
      'QA',
      'Testing',
      'UI/UX',
    ]);

    // Ignora duplicados con diferente caja
    const tasksWithDuplicates: Task[] = [
      { ...mockTasks[0], tags: ['frontend', 'Frontend', 'FRONTEND'] },
    ];
    expect(getAvailableTags(tasksWithDuplicates)).toEqual(['frontend']);

    // Tareas sin tags o array vacío
    expect(getAvailableTags([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// countActiveFilters y hasActiveFilters
// ---------------------------------------------------------------------------
describe('countActiveFilters y hasActiveFilters', () => {
  it('TC-FILT-14: calcula la suma correcta de criterios activos y evalúa hasActiveFilters', () => {
    const emptyFilters: KanbanFilters = {
      searchQuery: '',
      priorities: [],
      tags: [],
    };
    expect(countActiveFilters(emptyFilters)).toBe(0);
    expect(hasActiveFilters(emptyFilters)).toBe(false);

    // Solo espacios en blanco en búsqueda no cuenta como activo
    const whitespaceQueryFilters: KanbanFilters = {
      searchQuery: '     ',
      priorities: [],
      tags: [],
    };
    expect(countActiveFilters(whitespaceQueryFilters)).toBe(0);
    expect(hasActiveFilters(whitespaceQueryFilters)).toBe(false);

    // Búsqueda con texto activo (+1)
    const queryFilters: KanbanFilters = {
      searchQuery: 'landing',
      priorities: [],
      tags: [],
    };
    expect(countActiveFilters(queryFilters)).toBe(1);
    expect(hasActiveFilters(queryFilters)).toBe(true);

    // Búsqueda + 2 prioridades + 1 tag = 4 criterios activos
    const combinedFilters: KanbanFilters = {
      searchQuery: 'landing',
      priorities: ['High', 'Low'],
      tags: ['Design'],
    };
    expect(countActiveFilters(combinedFilters)).toBe(4);
    expect(hasActiveFilters(combinedFilters)).toBe(true);
  });
});
