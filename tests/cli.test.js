// Інтеграційні тести: запускаємо справжній CLI з тимчасовим файлом через TODO_FILE,
// тож справжні задачі в data/todos.json не зачіпаються.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const CLI = path.join(import.meta.dirname, '..', 'src', 'cli.js');
const dir = await mkdtemp(path.join(os.tmpdir(), 'todo-cli-test-'));
let counter = 0;

after(() => rm(dir, { recursive: true, force: true }));

const newFile = () => path.join(dir, `todos-${counter++}.json`);

function run(file, ...args) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    encoding: 'utf8',
    env: { ...process.env, TODO_FILE: file },
  });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

test('add → list: задача зберігається і показується', () => {
  const file = newFile();
  const added = run(file, 'add', 'Купити каву', '--priority', 'high');
  assert.equal(added.code, 0);
  assert.match(added.stdout, /✓ Додано #1: Купити каву/);
  const listed = run(file, 'list');
  assert.equal(listed.code, 0);
  assert.match(listed.stdout, /#1\s+\[ \]\s+high\s+—\s+Купити каву/);
});

test('некоректний ввід: exit 1, повідомлення в stderr, файл не створюється', () => {
  const file = newFile();
  const result = run(file, 'add', 'x', '--priority', 'urgent');
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^✗ Невідомий пріоритет "urgent"/);
  assert.equal(result.stdout, '');
  assert.equal(existsSync(file), false);
});

test('помилка не показує стек-трейс', () => {
  const result = run(newFile(), 'done', 'abc');
  assert.equal(result.code, 1);
  assert.doesNotMatch(result.stderr, /\n\s+at /);
});

test('list на відсутньому файлі не створює його', () => {
  const file = newFile();
  const result = run(file, 'list');
  assert.equal(result.code, 0);
  assert.match(result.stdout, /Список порожній/);
  assert.equal(existsSync(file), false);
});

test('повторний done: exit 0', () => {
  const file = newFile();
  run(file, 'add', 'A');
  run(file, 'done', '1');
  const again = run(file, 'done', '1');
  assert.equal(again.code, 0);
  assert.match(again.stdout, /#1 уже виконана/);
});

test('неіснуючий id: exit 1', () => {
  const result = run(newFile(), 'remove', '7');
  assert.equal(result.code, 1);
  assert.match(result.stderr, /✗ Задачу #7 не знайдено/);
});

test('битий файл: exit 2 і файл НЕ перезаписується', async () => {
  const file = newFile();
  await writeFile(file, '{broken', 'utf8');
  const result = run(file, 'add', 'Нова задача');
  assert.equal(result.code, 2);
  assert.match(result.stderr, /Файл даних пошкоджено/);
  assert.equal(await readFile(file, 'utf8'), '{broken');
});

test('порожній файл: exit 2 і файл не змінюється', async () => {
  const file = newFile();
  await writeFile(file, '', 'utf8');
  const result = run(file, 'add', 'x');
  assert.equal(result.code, 2);
  assert.equal(await readFile(file, 'utf8'), '');
});

test('формат файлу: відступ 2 пробіли і перенос рядка в кінці', async () => {
  const file = newFile();
  run(file, 'add', 'A');
  const text = await readFile(file, 'utf8');
  assert.ok(text.endsWith('\n'));
  assert.match(text, /\n {2}"todos": \[/);
  assert.equal(JSON.parse(text).nextId, 2);
});
