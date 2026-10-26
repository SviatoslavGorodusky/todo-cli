import { ValidationError } from './errors.js';

export const PRIORITIES = ['low', 'medium', 'high'];
export const STATUS_FILTERS = ['todo', 'done', 'all'];
export const SORT_KEYS = ['id', 'due', 'priority'];
const MAX_TITLE_LENGTH = 200;

export function validateChoice(raw, allowed, label) {
  if (!allowed.includes(raw)) {
    throw new ValidationError(
      `Невідомий ${label} "${raw}". Допустимі: ${allowed.join(', ')}`,
    );
  }
  return raw;
}

export function validatePriority(raw) {
  return validateChoice(raw, PRIORITIES, 'пріоритет');
}

export function validateTitle(raw) {
  const title = String(raw ?? '').trim();
  if (title === '') {
    throw new ValidationError('Назва задачі не може бути порожньою');
  }
  const length = [...title].length; // рахуємо символи, а не "половинки" емодзі
  if (length > MAX_TITLE_LENGTH) {
    throw new ValidationError(
      `Назва задачі довша за ${MAX_TITLE_LENGTH} символів (зараз: ${length})`,
    );
  }
  return title;
}

// Формат YYYY-MM-DD + round-trip: розібрали -> зібрали назад -> порівняли з вводом.
// Так 2026-02-30 не проходить (JS перетворив би її на 2026-03-02).
export function validateDue(raw) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw ?? '');
  if (match) {
    const [year, month, day] = match.slice(1).map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.toISOString().slice(0, 10) === raw) {
      return raw;
    }
  }
  throw new ValidationError(`Некоректна дата "${raw}". Формат: YYYY-MM-DD`);
}

export function validateId(raw) {
  const isDigits = typeof raw === 'string' && /^\d+$/.test(raw);
  const id = isDigits ? Number(raw) : NaN;
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new ValidationError('ID має бути цілим додатним числом');
  }
  return id;
}

export function normalizeTag(raw) {
  const tag = String(raw).trim().replace(/^#+/, '').toLowerCase();
  if (tag === '') {
    throw new ValidationError('Тег не може бути порожнім');
  }
  return tag;
}

export function validateTags(rawTags) {
  return [...new Set(rawTags.map(normalizeTag))];
}
