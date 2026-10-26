// Перетворює дані в рядки для консолі. Нічого не друкує сам.
import { isOverdue } from './commands.js';

export const HELP_TEXT = `Використання: todo <команда> [параметри]

Команди:
  add <назва> [--priority low|medium|high] [--due YYYY-MM-DD] [--tag тег ...]
  list [--status todo|done|all] [--priority p] [--tag t] [--sort id|due|priority]
  done <id>          позначити виконаною
  undo <id>          повернути в роботу
  edit <id> [--title t] [--priority p] [--due YYYY-MM-DD | none]
  remove <id>        видалити задачу
  clear --done       видалити всі виконані
  stats              статистика
  help               ця довідка`;

export function formatList(todos, today) {
  const idWidth = Math.max(...todos.map((t) => `#${t.id}`.length));
  const dueCells = todos.map(
    (t) => `${t.due ?? '—'}${isOverdue(t, today) ? ' (прострочено)' : ''}`,
  );
  const dueWidth = Math.max(...dueCells.map((cell) => cell.length));

  return todos
    .map((t, i) => {
      const tags = t.tags.length > 0 ? `  ${t.tags.map((tag) => `#${tag}`).join(' ')}` : '';
      return [
        `#${t.id}`.padEnd(idWidth),
        t.status === 'done' ? '[x]' : '[ ]',
        t.priority.padEnd(6),
        dueCells[i].padEnd(dueWidth),
        `${t.title}${tags}`,
      ].join('  ');
    })
    .join('\n');
}

export function formatStats({ total, open, done, overdue, byPriority }) {
  const { high, medium, low } = byPriority;
  return [
    `Усього: ${total} · відкритих: ${open} · виконаних: ${done} · прострочених: ${overdue}`,
    `high: ${high} · medium: ${medium} · low: ${low}`,
  ].join('\n');
}
