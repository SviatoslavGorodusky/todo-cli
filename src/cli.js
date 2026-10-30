#!/usr/bin/env node
// Точка входу: argv -> команда -> вивід -> exit code.
import {
  addTodo,
  clearDone,
  computeStats,
  editTodo,
  localDateString,
  markDone,
  markUndone,
  removeTodo,
  selectTodos,
} from './commands.js';
import { NotFoundError, StorageError, ValidationError } from './errors.js';
import { HELP_TEXT, formatList, formatStats } from './format.js';
import { load, save } from './storage.js';
import { validateId } from './validators.js';

// Які прапорці знає кожна команда: 'value' — один аргумент, 'multi' — можна
// повторювати, 'boolean' — без значення.
const FLAGS = {
  add: { priority: 'value', due: 'value', tag: 'multi' },
  list: { status: 'value', priority: 'value', tag: 'value', sort: 'value' },
  done: {},
  undo: {},
  edit: { title: 'value', priority: 'value', due: 'value' },
  remove: {},
  clear: { done: 'boolean' },
  stats: {},
};

function parseCommandLine(command, tokens) {
  const spec = FLAGS[command];
  const positionals = [];
  const options = {};

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }
    const name = token.slice(2);
    if (!Object.hasOwn(spec, name)) {
      throw new ValidationError(`Невідомий прапорець ${token}`);
    }
    if (spec[name] === 'boolean') {
      options[name] = true;
      continue;
    }
    const value = tokens[i + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new ValidationError(`Прапорець ${token} потребує значення`);
    }
    i++;
    if (spec[name] === 'multi') {
      (options[name] ??= []).push(value);
    } else {
      options[name] = value;
    }
  }
  return { positionals, options };
}

function expectNoPositionals(positionals) {
  if (positionals.length > 0) {
    throw new ValidationError(`Зайві аргументи: ${positionals.join(' ')}`);
  }
}

function getId(positionals) {
  if (positionals.length > 1) {
    throw new ValidationError(`Зайві аргументи: ${positionals.slice(1).join(' ')}`);
  }
  return validateId(positionals[0]);
}

// Кожен обробник повертає { state, message }. state === undefined — нічого зберігати.
const HANDLERS = {
  add({ positionals, options }, state, { now }) {
    const input = {
      title: positionals.join(' '),
      priority: options.priority,
      due: options.due,
      tags: options.tag,
    };
    const result = addTodo(state, input, now);
    return { state: result.state, message: `✓ Додано #${result.todo.id}: ${result.todo.title}` };
  },

  list({ positionals, options }, state, { today }) {
    expectNoPositionals(positionals);
    const todos = selectTodos(state, options);
    return { message: todos.length === 0 ? 'Список порожній' : formatList(todos, today) };
  },

  done({ positionals }, state, { now }) {
    const result = markDone(state, getId(positionals), now);
    if (!result.changed) {
      return { message: `#${result.todo.id} уже виконана` };
    }
    return { state: result.state, message: `✓ #${result.todo.id} виконано` };
  },

  undo({ positionals }, state) {
    const result = markUndone(state, getId(positionals));
    if (!result.changed) {
      return { message: `#${result.todo.id} уже в роботі` };
    }
    return { state: result.state, message: `✓ #${result.todo.id} повернуто в роботу` };
  },

  edit({ positionals, options }, state) {
    const result = editTodo(state, getId(positionals), options);
    return { state: result.state, message: `✓ #${result.todo.id} оновлено` };
  },

  remove({ positionals }, state) {
    const result = removeTodo(state, getId(positionals));
    return {
      state: result.state,
      message: `✓ Видалено #${result.todo.id}: ${result.todo.title}`,
    };
  },

  clear({ positionals, options }, state) {
    expectNoPositionals(positionals);
    if (!options.done) {
      throw new ValidationError('Для очищення вкажіть --done');
    }
    const result = clearDone(state);
    return { state: result.state, message: `✓ Видалено виконаних: ${result.removed}` };
  },

  stats({ positionals }, state, { today }) {
    expectNoPositionals(positionals);
    return { message: formatStats(computeStats(state, today)) };
  },
};

async function main() {
  const [command, ...tokens] = process.argv.slice(2);

  if (command === undefined || command === 'help') {
    console.log(HELP_TEXT);
    return;
  }
  if (!Object.hasOwn(HANDLERS, command)) {
    throw new ValidationError(`Невідома команда "${command}". Див. todo help`);
  }

  const args = parseCommandLine(command, tokens);
  const now = new Date();
  const context = { now, today: localDateString(now) };

  const state = await load();
  const result = HANDLERS[command](args, state, context);

  if (result.state) {
    await save(result.state); // дочекалися запису, і лише потім друкуємо
  }
  console.log(result.message);
}

try {
  await main();
} catch (err) {
  if (err instanceof StorageError) {
    console.error(`✗ ${err.message}`);
    process.exitCode = 2;
  } else if (err instanceof ValidationError || err instanceof NotFoundError) {
    console.error(`✗ ${err.message}`);
    process.exitCode = 1;
  } else {
    console.error(`✗ Внутрішня помилка: ${err.message}`);
    process.exitCode = 1;
  }
}
