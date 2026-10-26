# Тест-кейси todo-cli

**Середовище:** ОС: ________ · `node -v`: ________ · дата прогону: ________

## Як запускати

Щоб не чіпати справжні задачі, увесь прогін ведемо на окремому файлі. Один раз у терміналі в корені проєкту:

```powershell
# Windows PowerShell
$env:TODO_FILE = "$PWD\data\test.json"
```

```bash
# macOS / Linux
export TODO_FILE="$PWD/data/test.json"
```

Передумова «чистий файл даних» = `npm run reset` (видаляє лише файл із `TODO_FILE`). Кроки кожного кейсу виконуються по черзі, «Фактичний результат» — вивід **останнього** кроку (або вказаних кроків).

Кейси TC-41, TC-42, TC-43, TC-44, TC-45, TC-46, TC-48 потребують іншого значення `TODO_FILE` або стану файлу — див. колонку «Передумови».

## Таблиця кейсів

| ID | Назва | Передумови | Кроки | Очікуваний результат | Фактичний результат | Статус |
| --- | --- | --- | --- | --- | --- | --- |
| TC-01 | Додати задачу з назвою | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add "Купити каву"` | `✓ Додано #1: Купити каву`, exit 0, файл даних створено | exit 0 · stdout: ✓ Додано #1: Купити каву · файл створено | Pass |
| TC-02 | Додати задачу з усіма параметрами | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add "Написати тест-кейси" --priority high --due 2099-12-31 --tag study --tag qa`<br>2. `node src/cli.js list` | У списку: `#1  [ ]  high    2099-12-31  Написати тест-кейси  #study #qa` | exit 0 · stdout: #1  [ ]  high    2099-12-31  Написати тест-кейси  #study #qa | Pass |
| TC-03 | Теги нормалізуються (без #, нижній регістр, без дублів) | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add Тег --tag "#QA" --tag qa --tag Home`<br>2. `node src/cli.js list` | У рядку лише `#qa #home`, дубліката немає | exit 0 · stdout: #1  [ ]  medium  —  Тег  #qa #home | Pass |
| TC-04 | list за замовчуванням показує лише відкриті | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add Відкрита`<br>2. `node src/cli.js add Закрита`<br>3. `node src/cli.js done 2`<br>4. `node src/cli.js list` | Є лише `Відкрита`, `Закрита` відсутня | exit 0 · stdout: #1  [ ]  medium  —  Відкрита | Pass |
| TC-05 | list --status all показує і відкриті, і виконані | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add Відкрита`<br>2. `node src/cli.js add Закрита`<br>3. `node src/cli.js done 2`<br>4. `node src/cli.js list --status all` | Обидві задачі, виконана з `[x]` | exit 0 · stdout: #1  [ ]  medium  —  Відкрита<br>#2  [x]  medium  —  Закрита | Pass |
| TC-06 | Сортування --sort priority: high → medium → low | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add A --priority low`<br>2. `node src/cli.js add B --priority high`<br>3. `node src/cli.js add C --priority medium`<br>4. `node src/cli.js list --sort priority` | Порядок id: #2, #3, #1 | exit 0 · stdout: #2  [ ]  high    —  B<br>#3  [ ]  medium  —  C<br>#1  [ ]  low     —  A | Pass |
| TC-07 | Сортування --sort due: без дедлайну в кінці | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add "Без дати"`<br>2. `node src/cli.js add Пізно --due 2099-12-31`<br>3. `node src/cli.js add Рано --due 2099-01-01`<br>4. `node src/cli.js list --sort due` | Порядок id: #3, #2, #1 | exit 0 · stdout: #3  [ ]  medium  2099-01-01  Рано<br>#2  [ ]  medium  2099-12-31  Пізно<br>#1  [ ]  medium  —           Без дати | Pass |
| TC-08 | Прострочена задача: суфікс у list і лічильник у stats | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add Стара --due 2020-01-01`<br>2. `node src/cli.js list`<br>3. `node src/cli.js stats` | У list після дати `(прострочено)`; у stats `прострочених: 1` | (крок 2) exit 0 · stdout: #1  [ ]  medium  2020-01-01 (прострочено)  Стара<br>(крок 3) exit 0 · stdout: Усього: 1 · відкритих: 1 · виконаних: 0 · прострочених: 1<br>high: 0 · medium: 1 · low: 0 | Pass |
| TC-09 | list, коли всі задачі виконані | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add A`<br>2. `node src/cli.js done 1`<br>3. `node src/cli.js list` | `Список порожній`, exit 0 | exit 0 · stdout: Список порожній | Pass |
| TC-10 | done: позначити виконаною | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add A`<br>2. `node src/cli.js done 1`<br>3. `node src/cli.js list --status all` | `✓ #1 виконано`; у списку `[x]` | (крок 2) exit 0 · stdout: ✓ #1 виконано<br>(крок 3) exit 0 · stdout: #1  [x]  medium  —  A | Pass |
| TC-11 | done повторно для вже виконаної | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add A`<br>2. `node src/cli.js done 1`<br>3. `node src/cli.js done 1` | `#1 уже виконана`, exit 0 (не помилка) | exit 0 · stdout: #1 уже виконана | Pass |
| TC-12 | undo: повернути в роботу | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add A`<br>2. `node src/cli.js done 1`<br>3. `node src/cli.js undo 1` | `✓ #1 повернуто в роботу`; у файлі status=todo, doneAt=null | exit 0 · stdout: ✓ #1 повернуто в роботу · у файлі status=todo, doneAt=null | Pass |
| TC-13 | edit: змінити назву й пріоритет | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add "Стара назва"`<br>2. `node src/cli.js edit 1 --title "Нова назва" --priority high`<br>3. `node src/cli.js list` | `✓ #1 оновлено`; у списку `high` і `Нова назва` | (крок 2) exit 0 · stdout: ✓ #1 оновлено<br>(крок 3) exit 0 · stdout: #1  [ ]  high    —  Нова назва | Pass |
| TC-14 | edit --due none прибирає дедлайн | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add A --due 2099-12-31`<br>2. `node src/cli.js edit 1 --due none`<br>3. `node src/cli.js list` | У списку замість дати `—` | exit 0 · stdout: #1  [ ]  medium  —  A | Pass |
| TC-15 | remove: id не перевикористовується | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add A`<br>2. `node src/cli.js add B`<br>3. `node src/cli.js remove 2`<br>4. `node src/cli.js add C` | `✓ Видалено #2: B`, нова задача отримує `#3`, а не `#2` | (крок 3) exit 0 · stdout: ✓ Видалено #2: B<br>(крок 4) exit 0 · stdout: ✓ Додано #3: C | Pass |
| TC-16 | clear --done видаляє лише виконані | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add A`<br>2. `node src/cli.js add B`<br>3. `node src/cli.js done 1`<br>4. `node src/cli.js clear --done`<br>5. `node src/cli.js list --status all` | `✓ Видалено виконаних: 1`; лишається лише #2 | (крок 4) exit 0 · stdout: ✓ Видалено виконаних: 1<br>(крок 5) exit 0 · stdout: #2  [ ]  medium  —  B | Pass |
| TC-17 | stats: лічильники і розподіл за пріоритетами | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add A --priority high`<br>2. `node src/cli.js add B`<br>3. `node src/cli.js done 2`<br>4. `node src/cli.js stats` | `Усього: 2 · відкритих: 1 · виконаних: 1 · прострочених: 0` і `high: 1 · medium: 1 · low: 0` | exit 0 · stdout: Усього: 2 · відкритих: 1 · виконаних: 1 · прострочених: 0<br>high: 1 · medium: 1 · low: 0 | Pass |
| TC-18 | help і запуск без аргументів | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js`<br>2. `node src/cli.js help` | Обидва виклики друкують довідку, exit 0 | обидва виклики: exit 0, виведено довідку (перший рядок: «Використання: todo <команда> [параметри]») | Pass |
| TC-19 | add без назви | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add` | stderr: `✗ Назва задачі не може бути порожньою`, exit 1, файл не створено | exit 1 · stderr: ✗ Назва задачі не може бути порожньою · файл не створено | Pass |
| TC-20 | add з назвою з одних пробілів | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add "   "` | Те саме, що TC-19: exit 1 | exit 1 · stderr: ✗ Назва задачі не може бути порожньою | Pass |
| TC-21 | Межа: назва рівно 200 символів | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add ("x" * 200)   # PowerShell` | Додано, exit 0 | exit 0; stdout: ✓ Додано #1: xxx… (200 символів) | Pass |
| TC-22 | Межа: назва 201 символ | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add ("x" * 201)   # PowerShell` | stderr: `✗ Назва задачі довша за 200 символів (зараз: 201)`, exit 1 | exit 1 · stderr: ✗ Назва задачі довша за 200 символів (зараз: 201) | Pass |
| TC-23 | Межа: назва 1 символ | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add a` | `✓ Додано #1: a`, exit 0 | exit 0 · stdout: ✓ Додано #1: a | Pass |
| TC-24 | Невідомий пріоритет | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add x --priority urgent` | `✗ Невідомий пріоритет "urgent". Допустимі: low, medium, high`, exit 1 | exit 1 · stderr: ✗ Невідомий пріоритет "urgent". Допустимі: low, medium, high | Pass |
| TC-25 | Дата: місяць 13 | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add x --due 2026-13-01` | `✗ Некоректна дата "2026-13-01". Формат: YYYY-MM-DD`, exit 1 | exit 1 · stderr: ✗ Некоректна дата "2026-13-01". Формат: YYYY-MM-DD | Pass |
| TC-26 | Дата: 30 лютого | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add x --due 2026-02-30` | Помилка `Некоректна дата`, exit 1 (дата не «перетікає» в березень) | exit 1 · stderr: ✗ Некоректна дата "2026-02-30". Формат: YYYY-MM-DD | Pass |
| TC-27 | Межа: 29 лютого у НЕвисокосному році (2026) | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add x --due 2026-02-29` | Помилка `Некоректна дата`, exit 1 | exit 1 · stderr: ✗ Некоректна дата "2026-02-29". Формат: YYYY-MM-DD | Pass |
| TC-28 | Межа: 29 лютого у високосному році (2028) | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add x --due 2028-02-29` | `✓ Додано #1: x`, exit 0 | exit 0 · stdout: ✓ Додано #1: x | Pass |
| TC-29 | Дата в чужому форматі | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add x --due 01.11.2026` | Помилка `Некоректна дата "01.11.2026". Формат: YYYY-MM-DD`, exit 1 | exit 1 · stderr: ✗ Некоректна дата "01.11.2026". Формат: YYYY-MM-DD | Pass |
| TC-30 | ID — не число | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js done abc` | `✗ ID має бути цілим додатним числом`, exit 1 | exit 1 · stderr: ✗ ID має бути цілим додатним числом | Pass |
| TC-31 | ID — від’ємне число | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js done -1` | Те саме повідомлення про ID, exit 1 | exit 1 · stderr: ✗ ID має бути цілим додатним числом | Pass |
| TC-32 | ID — дробове число | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js done 1.5` | Те саме повідомлення про ID, exit 1 | exit 1 · stderr: ✗ ID має бути цілим додатним числом | Pass |
| TC-33 | Межа: ID = 0 | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js done 0` | Те саме повідомлення про ID, exit 1 | exit 1 · stderr: ✗ ID має бути цілим додатним числом | Pass |
| TC-34 | ID не існує | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add A`<br>2. `node src/cli.js done 999` | `✗ Задачу #999 не знайдено`, exit 1 | exit 1 · stderr: ✗ Задачу #999 не знайдено | Pass |
| TC-35 | Прапорець без значення | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add x --priority` | `✗ Прапорець --priority потребує значення`, exit 1 | exit 1 · stderr: ✗ Прапорець --priority потребує значення | Pass |
| TC-36 | Невідомий прапорець | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add x --colour red` | `✗ Невідомий прапорець --colour`, exit 1 | exit 1 · stderr: ✗ Невідомий прапорець --colour | Pass |
| TC-37 | Невідома команда (друкарська помилка) | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js ad x` | `✗ Невідома команда "ad". Див. todo help`, exit 1 | exit 1 · stderr: ✗ Невідома команда "ad". Див. todo help | Pass |
| TC-38 | edit без жодного прапорця | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add A`<br>2. `node src/cli.js edit 1` | `✗ Нічого змінювати: передайте --title, --priority або --due`, exit 1 | exit 1 · stderr: ✗ Нічого змінювати: передайте --title, --priority або --due | Pass |
| TC-39 | clear без --done нічого не видаляє | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add A`<br>2. `node src/cli.js done 1`<br>3. `node src/cli.js clear`<br>4. `node src/cli.js list --status all` | clear: помилка, exit 1; задача #1 лишається у списку | (крок 3) exit 1 · stderr: ✗ Для очищення вкажіть --done<br>(крок 4) exit 0 · stdout: #1  [x]  medium  —  A | Pass |
| TC-40 | list на відсутньому файлі не створює його | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js list` | `Список порожній`, exit 0, файл даних НЕ створено | exit 0 · stdout: Список порожній · файл не створено | Pass |
| TC-41 | Перший запис створює папку і файл | Папки `nested/dir` не існує (TODO_FILE вказує у неї) | 1. `node src/cli.js add A` | Папки й файл створено; у файлі `"version": 1`, `"nextId": 2` | exit 0 · stdout: ✓ Додано #1: A · файл створено, nextId=2 | Pass |
| TC-42 | Порожній файл даних | Файл даних існує, але порожній (0 байт) | 1. `node src/cli.js add x` | `✗ Файл даних пошкоджено: …`, exit 2, файл лишається порожнім | exit 2 · stderr: ✗ Файл даних пошкоджено: /tmp/tc-czISRz/c-0KOVOV/todos.json. Виправте або видаліть його · розмір файлу після команди: 0 байт | Pass |
| TC-43 | Файл з невалідним JSON не перезаписується | Файл даних містить текст `{broken` | 1. `node src/cli.js add x` | `✗ Файл даних пошкоджено: …`, exit 2, вміст файлу лишається `{broken` | exit 2 · stderr: ✗ Файл даних пошкоджено: /tmp/tc-czISRz/c-JyPtq6/todos.json. Виправте або видаліть його · вміст файлу після команди: {broken | Pass |
| TC-44 | JSON без масиву todos | Файл містить `{"version":1,"nextId":1}` | 1. `node src/cli.js list` | `✗ Файл даних пошкоджено: …`, exit 2, файл не змінено | exit 2 · stderr: ✗ Файл даних пошкоджено: /tmp/tc-czISRz/c-YQv2Wr/todos.json. Виправте або видаліть його | Pass |
| TC-45 | TODO_FILE перевизначає шлях, справжній файл не чіпається | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add A` | Файл створено за шляхом з TODO_FILE; `data/todos.json` у проєкті не створено | exit 0 · stdout: ✓ Додано #1: A · файл за TODO_FILE: є; data/todos.json: немає | Pass |
| TC-46 | Запуск з іншої папки використовує файл проєкту | TODO_FILE не задано; термінал відкрито в іншій папці (не в корені проєкту) | 1. `node <шлях-до-проєкту>/src/cli.js add A` | Файл створено в `data/todos.json` проєкту, а не в поточній папці | exit 0 · stdout: ✓ Додано #1: A · data/todos.json у корені проєкту: створено | Pass |
| TC-47 | Формат файлу: відступ 2 пробіли і перенос рядка в кінці | Чистий файл даних (`npm run reset`) | 1. `node src/cli.js add A` | Файл відформатований (`  "todos": [`), закінчується переносом рядка | exit 0 · stdout: ✓ Додано #1: A · відступи 2 пробіли, є \n в кінці | Pass |
| TC-48 | TODO_FILE вказує на папку | TODO_FILE вказує на існуючу папку | 1. `node src/cli.js list` | `✗ Не вдалося прочитати файл даних: … (EISDIR)`, exit 2 | exit 2 · stderr: ✗ Не вдалося прочитати файл даних: /tmp/tc-czISRz/c-rP9SM5 (EISDIR) | Pass |

## Підсумок

Усього кейсів: 48. Покриття: позитивні сценарії для кожної команди (TC-01…TC-18), негативні з таблиці валідації (TC-19…TC-39), граничні значення (назва 1 / 200 / 201 символ, id 0, 29.02 у високосному та невисокосному році), стани файлу даних (немає, порожній, битий JSON, без масиву `todos`, папка замість файлу) та шлях до файлу (TC-40…TC-48).
