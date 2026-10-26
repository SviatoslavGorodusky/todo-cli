// Додає N випадкових задач: npm run seed -- 30
import { addTodo, localDateString, markDone } from '../src/commands.js';
import { load, save } from '../src/storage.js';

const TITLES = [
  'Написати тест-кейси', 'Перевірити форму логіну', 'Купити каву', 'Прочитати розділ про Git',
  'Завести баг-репорт', 'Підготувати тестові дані', 'Оновити README', 'Зустріч з ментором',
  'Перевірити граничні значення', 'Зробити рев’ю PR',
];
const PRIORITIES = ['low', 'medium', 'high'];
const TAGS = ['study', 'work', 'home', 'qa', 'urgent'];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

const raw = process.argv[2] ?? '10';
const count = Number(raw);
if (!Number.isInteger(count) || count < 1 || count > 1000) {
  console.error('✗ Кількість має бути цілим числом від 1 до 1000');
  process.exit(1);
}

let state;
try {
  state = await load();
} catch (err) {
  console.error(`✗ ${err.message}`);
  process.exit(2);
}
const now = new Date();

for (let i = 0; i < count; i++) {
  const due = new Date(now);
  due.setDate(due.getDate() + Math.floor(Math.random() * 40) - 10); // від -10 до +29 днів
  const added = addTodo(
    state,
    {
      title: `${pick(TITLES)} ${state.nextId}`,
      priority: pick(PRIORITIES),
      due: Math.random() < 0.3 ? undefined : localDateString(due),
      tags: Array.from({ length: Math.floor(Math.random() * 3) }, () => pick(TAGS)),
    },
    now,
  );
  state = added.state;
  if (Math.random() < 0.3) {
    state = markDone(state, added.todo.id, now).state;
  }
}

try {
  await save(state);
} catch (err) {
  console.error(`✗ ${err.message}`);
  process.exit(2);
}
console.log(`✓ Додано тестових задач: ${count}`);
