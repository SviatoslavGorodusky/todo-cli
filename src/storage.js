import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { StorageError } from './errors.js';

export function getFilePath() {
  if (process.env.TODO_FILE) {
    return path.resolve(process.env.TODO_FILE);
  }
  // Від кореня проєкту, а не від папки, з якої запущено термінал.
  return path.join(import.meta.dirname, '..', 'data', 'todos.json');
}

export function emptyState() {
  return { version: 1, nextId: 1, todos: [] };
}

function isValidState(data) {
  return (
    data !== null &&
    typeof data === 'object' &&
    Number.isInteger(data.nextId) &&
    data.nextId >= 1 &&
    Array.isArray(data.todos) &&
    data.todos.every((t) => t !== null && typeof t === 'object' && Number.isInteger(t.id))
  );
}

function corrupted(file) {
  return new StorageError(`Файл даних пошкоджено: ${file}. Виправте або видаліть його`);
}

export async function load() {
  const file = getFilePath();
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch (err) {
    // Порожній стан — ТІЛЬКИ коли файлу просто немає. Усе інше — помилка,
    // інакше наступний save() затре файл, який ми не змогли прочитати.
    if (err.code === 'ENOENT') {
      return emptyState();
    }
    throw new StorageError(
      `Не вдалося прочитати файл даних: ${file} (${err.code ?? err.message})`,
    );
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw corrupted(file);
  }
  if (!isValidState(data)) {
    throw corrupted(file);
  }
  return data;
}

// Атомарний запис: спочатку у тимчасовий файл, потім rename.
// Якщо процес обірветься посеред запису — справжній файл лишається цілим.
export async function save(state) {
  const file = getFilePath();
  const tmp = `${file}.tmp`;
  try {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(tmp, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
    await rename(tmp, file);
  } catch (err) {
    throw new StorageError(
      `Не вдалося записати файл даних: ${file} (${err.code ?? err.message})`,
    );
  }
}
