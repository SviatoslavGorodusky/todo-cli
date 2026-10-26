import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addTodo,
  clearDone,
  computeStats,
  editTodo,
  isOverdue,
  localDateString,
  markDone,
  markUndone,
  removeTodo,
  selectTodos,
} from '../src/commands.js';
import { NotFoundError, ValidationError } from '../src/errors.js';

const NOW = new Date('2026-10-27T10:00:00.000Z');
const empty = () => ({ version: 1, nextId: 1, todos: [] });

// Допоміжна: додає кілька задач підряд.
function withTodos(...inputs) {
  return inputs.reduce((state, input) => addTodo(state, input, NOW).state, empty());
}

test('addTodo: значення за замовчуванням', () => {
  const { state, todo } = addTodo(empty(), { title: 'Купити каву' }, NOW);
  assert.equal(todo.id, 1);
  assert.equal(todo.status, 'todo');
  assert.equal(todo.priority, 'medium');
  assert.equal(todo.due, null);
  assert.deepEqual(todo.tags, []);
  assert.equal(todo.createdAt, NOW.toISOString());
  assert.equal(todo.doneAt, null);
  assert.equal(state.nextId, 2);
});

test('addTodo: не змінює початковий стан (чиста функція)', () => {
  const before = empty();
  addTodo(before, { title: 'x' }, NOW);
  assert.deepEqual(before, empty());
});

test('addTodo: невалідна назва — ValidationError', () => {
  assert.throws(() => addTodo(empty(), { title: '  ' }, NOW), ValidationError);
});

test('removeTodo: id не перевикористовується', () => {
  let state = withTodos({ title: 'A' }, { title: 'B' });
  state = removeTodo(state, 2).state;
  const { todo } = addTodo(state, { title: 'C' }, NOW);
  assert.equal(todo.id, 3);
});

test('markDone: ставить doneAt, повторний виклик нічого не змінює', () => {
  const state = withTodos({ title: 'A' });
  const first = markDone(state, 1, NOW);
  assert.equal(first.changed, true);
  assert.equal(first.todo.status, 'done');
  assert.equal(first.todo.doneAt, NOW.toISOString());
  const second = markDone(first.state, 1, NOW);
  assert.equal(second.changed, false);
});

test('markUndone: повертає в todo і скидає doneAt', () => {
  const done = markDone(withTodos({ title: 'A' }), 1, NOW).state;
  const { todo, changed } = markUndone(done, 1);
  assert.equal(changed, true);
  assert.equal(todo.status, 'todo');
  assert.equal(todo.doneAt, null);
});

test('editTodo: змінює лише передані поля', () => {
  const state = withTodos({ title: 'A', priority: 'low', due: '2099-01-01' });
  const { todo } = editTodo(state, 1, { title: 'Нова' });
  assert.equal(todo.title, 'Нова');
  assert.equal(todo.priority, 'low');
  assert.equal(todo.due, '2099-01-01');
});

test('editTodo: --due none прибирає дедлайн', () => {
  const state = withTodos({ title: 'A', due: '2099-01-01' });
  assert.equal(editTodo(state, 1, { due: 'none' }).todo.due, null);
});

test('editTodo: без жодного поля — ValidationError', () => {
  assert.throws(() => editTodo(withTodos({ title: 'A' }), 1, {}), ValidationError);
});

test('markDone / removeTodo: неіснуючий id — NotFoundError', () => {
  const state = withTodos({ title: 'A' });
  assert.throws(() => markDone(state, 999, NOW), NotFoundError);
  assert.throws(() => removeTodo(state, 999), NotFoundError);
});

test('clearDone: видаляє лише виконані і повертає їх кількість', () => {
  let state = withTodos({ title: 'A' }, { title: 'B' }, { title: 'C' });
  state = markDone(state, 1, NOW).state;
  state = markDone(state, 3, NOW).state;
  const result = clearDone(state);
  assert.equal(result.removed, 2);
  assert.deepEqual(result.state.todos.map((t) => t.id), [2]);
});

test('selectTodos: за замовчуванням лише відкриті', () => {
  let state = withTodos({ title: 'A' }, { title: 'B' });
  state = markDone(state, 2, NOW).state;
  assert.deepEqual(selectTodos(state).map((t) => t.id), [1]);
  assert.deepEqual(selectTodos(state, { status: 'all' }).map((t) => t.id), [1, 2]);
});

test('selectTodos: сортування за пріоритетом high → medium → low', () => {
  const state = withTodos(
    { title: 'A', priority: 'low' },
    { title: 'B', priority: 'high' },
    { title: 'C', priority: 'medium' },
  );
  assert.deepEqual(selectTodos(state, { sort: 'priority' }).map((t) => t.id), [2, 3, 1]);
});

test('selectTodos: сортування за дедлайном, без дедлайну — в кінці', () => {
  const state = withTodos(
    { title: 'A' },
    { title: 'B', due: '2099-12-31' },
    { title: 'C', due: '2099-01-01' },
  );
  assert.deepEqual(selectTodos(state, { sort: 'due' }).map((t) => t.id), [3, 2, 1]);
});

test('selectTodos: фільтр за тегом', () => {
  const state = withTodos({ title: 'A', tags: ['qa'] }, { title: 'B', tags: ['home'] });
  assert.deepEqual(selectTodos(state, { tag: '#QA' }).map((t) => t.id), [1]);
});

test('selectTodos: невідомий статус — ValidationError', () => {
  assert.throws(() => selectTodos(empty(), { status: 'wat' }), ValidationError);
});

test('isOverdue: тільки відкриті задачі з минулим дедлайном', () => {
  const today = '2026-10-27';
  assert.equal(isOverdue({ status: 'todo', due: '2026-10-26' }, today), true);
  assert.equal(isOverdue({ status: 'todo', due: '2026-10-27' }, today), false);
  assert.equal(isOverdue({ status: 'todo', due: null }, today), false);
  assert.equal(isOverdue({ status: 'done', due: '2020-01-01' }, today), false);
});

test('computeStats: рахує всі лічильники', () => {
  let state = withTodos(
    { title: 'A', priority: 'high', due: '2020-01-01' },
    { title: 'B' },
    { title: 'C', priority: 'low' },
  );
  state = markDone(state, 3, NOW).state;
  assert.deepEqual(computeStats(state, '2026-10-27'), {
    total: 3,
    open: 2,
    done: 1,
    overdue: 1,
    byPriority: { high: 1, medium: 1, low: 1 },
  });
});

test('localDateString: локальна дата з нулями', () => {
  assert.equal(localDateString(new Date(2026, 0, 5)), '2026-01-05');
});
