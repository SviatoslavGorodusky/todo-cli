// Бізнес-логіка. Тут ТІЛЬКИ чисті функції: не читають файл, не пишуть у консоль.
// Отримують стан ({ version, nextId, todos }) і повертають НОВИЙ стан.
import { NotFoundError, ValidationError } from './errors.js';
import {
  SORT_KEYS,
  STATUS_FILTERS,
  normalizeTag,
  validateChoice,
  validateDue,
  validatePriority,
  validateTags,
  validateTitle,
} from './validators.js';

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

// Локальна дата YYYY-MM-DD (не toISOString — він дає UTC і вночі "зсуває" день).
export function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isOverdue(todo, today) {
  return todo.status === 'todo' && todo.due !== null && todo.due < today;
}

function findTodo(state, id) {
  const todo = state.todos.find((t) => t.id === id);
  if (!todo) {
    throw new NotFoundError(`Задачу #${id} не знайдено`);
  }
  return todo;
}

function updateTodo(state, id, update) {
  const updated = update(findTodo(state, id));
  const todos = state.todos.map((t) => (t.id === id ? updated : t));
  return { state: { ...state, todos }, todo: updated };
}

export function addTodo(state, input, now = new Date()) {
  const todo = {
    id: state.nextId,
    title: validateTitle(input.title),
    status: 'todo',
    priority: input.priority === undefined ? 'medium' : validatePriority(input.priority),
    due: input.due === undefined ? null : validateDue(input.due),
    tags: validateTags(input.tags ?? []),
    createdAt: now.toISOString(),
    doneAt: null,
  };
  const next = { ...state, nextId: state.nextId + 1, todos: [...state.todos, todo] };
  return { state: next, todo };
}

export function markDone(state, id, now = new Date()) {
  const current = findTodo(state, id);
  if (current.status === 'done') {
    return { state, todo: current, changed: false };
  }
  const result = updateTodo(state, id, (t) => ({
    ...t,
    status: 'done',
    doneAt: now.toISOString(),
  }));
  return { ...result, changed: true };
}

export function markUndone(state, id) {
  const current = findTodo(state, id);
  if (current.status === 'todo') {
    return { state, todo: current, changed: false };
  }
  const result = updateTodo(state, id, (t) => ({ ...t, status: 'todo', doneAt: null }));
  return { ...result, changed: true };
}

export function editTodo(state, id, changes) {
  const { title, priority, due } = changes;
  if (title === undefined && priority === undefined && due === undefined) {
    throw new ValidationError('Нічого змінювати: передайте --title, --priority або --due');
  }
  const patch = {};
  if (title !== undefined) patch.title = validateTitle(title);
  if (priority !== undefined) patch.priority = validatePriority(priority);
  if (due !== undefined) patch.due = due === 'none' ? null : validateDue(due);
  return updateTodo(state, id, (t) => ({ ...t, ...patch }));
}

export function removeTodo(state, id) {
  const todo = findTodo(state, id);
  const todos = state.todos.filter((t) => t.id !== id);
  return { state: { ...state, todos }, todo };
}

export function clearDone(state) {
  const todos = state.todos.filter((t) => t.status !== 'done');
  return { state: { ...state, todos }, removed: state.todos.length - todos.length };
}

const COMPARATORS = {
  id: (a, b) => a.id - b.id,
  priority: (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.id - b.id,
  due: (a, b) => {
    if (a.due === b.due) return a.id - b.id;
    if (a.due === null) return 1; // без дедлайну — в кінець
    if (b.due === null) return -1;
    return a.due < b.due ? -1 : 1;
  },
};

export function selectTodos(state, filters = {}) {
  const status = validateChoice(filters.status ?? 'todo', STATUS_FILTERS, 'статус');
  const sort = validateChoice(filters.sort ?? 'id', SORT_KEYS, 'ключ сортування');
  const priority = filters.priority === undefined ? undefined : validatePriority(filters.priority);
  const tag = filters.tag === undefined ? undefined : normalizeTag(filters.tag);

  return state.todos
    .filter((t) => status === 'all' || t.status === status)
    .filter((t) => priority === undefined || t.priority === priority)
    .filter((t) => tag === undefined || t.tags.includes(tag))
    .sort(COMPARATORS[sort]);
}

export function computeStats(state, today) {
  const total = state.todos.length;
  const done = state.todos.filter((t) => t.status === 'done').length;
  const byPriority = state.todos.reduce(
    (acc, t) => ({ ...acc, [t.priority]: (acc[t.priority] ?? 0) + 1 }),
    { high: 0, medium: 0, low: 0 },
  );
  return {
    total,
    open: total - done,
    done,
    overdue: state.todos.filter((t) => isOverdue(t, today)).length,
    byPriority,
  };
}
