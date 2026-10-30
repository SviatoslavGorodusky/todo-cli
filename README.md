# todo-cli

Консольний todo-менеджер на Node.js без залежностей. Задачі зберігаються у JSON-файлі.

## Встановлення з нуля

```bash
git clone <посилання-на-репозиторій>
cd todo-cli
nvm use 24       # Node 24 LTS (macOS/Linux: просто `nvm use`; перевірка: node -v)
npm ci           # залежностей немає, але команда створить чисте середовище
npm run seed -- 30   # (за бажанням) 30 тестових задач
npm run todo -- list
```

> **Важливо:** між назвою скрипта і прапорцями ставте `--`:
> `npm run todo -- add "Задача" --priority high`.
> Без нього npm забере прапорець собі і видасть помилку.
> Напряму працює і так: `node src/cli.js add "Задача" --priority high`.

Далі в прикладах `todo` = `node src/cli.js`.

## Команди

| Команда | Приклад | Що робить |
| --- | --- | --- |
| `add <title> [--priority p] [--due YYYY-MM-DD] [--tag t ...]` | `todo add "Купити каву" --priority low --tag home --tag shop` | створює задачу; `--tag` можна повторювати |
| `list [--status s] [--priority p] [--tag t] [--sort k]` | `todo list --status all --sort due` | показує задачі; `status`: `todo` (за замовчуванням), `done`, `all`; `sort`: `id`, `due`, `priority` |
| `done <id>` | `todo done 3` | позначає виконаною |
| `undo <id>` | `todo undo 3` | повертає в роботу |
| `edit <id> [--title t] [--priority p] [--due d]` | `todo edit 3 --due none` | змінює передані поля; `--due none` прибирає дедлайн |
| `remove <id>` | `todo remove 3` | видаляє задачу |
| `clear --done` | `todo clear --done` | видаляє всі виконані |
| `stats` | `todo stats` | статистика |
| `help` | `todo help` | довідка |

## Коди виходу

| Код | Значення |
| --- | --- |
| `0` | успіх (також `help` і повторний `done`) |
| `1` | помилка вводу або задачу не знайдено |
| `2` | файл даних не читається або пошкоджений |

Повідомлення про помилки йдуть у `stderr`. Файл даних при помилці не змінюється.

## Файл даних

За замовчуванням `data/todos.json` у корені проєкту (не залежить від папки, з якої запущено термінал).
Змінна оточення `TODO_FILE` задає інший шлях, наприклад для тестів:

```bash
# macOS / Linux
TODO_FILE=/tmp/test.json node src/cli.js list
# Windows PowerShell
$env:TODO_FILE="C:\temp\test.json"; node src/cli.js list
```

Тести: `npm test` (вбудований `node:test`, файли в `tests/`; справжні дані не чіпають — працюють із тимчасовим `TODO_FILE`).

Скрипти: `npm run seed -- N` додає N тестових задач, `npm run reset` видаляє файл даних.
