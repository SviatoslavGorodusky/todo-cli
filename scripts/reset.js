// Видаляє файл даних: npm run reset
import { rm } from 'node:fs/promises';
import { getFilePath } from '../src/storage.js';

const file = getFilePath();
try {
  await rm(file, { force: true }); // force: немає файлу — не помилка
  console.log(`✓ Файл даних видалено: ${file}`);
} catch (err) {
  console.error(`✗ Не вдалося видалити ${file} (${err.code ?? err.message})`);
  process.exitCode = 2;
}
