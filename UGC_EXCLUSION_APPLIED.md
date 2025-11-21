# UGC Exclusion from Weglot - APPLIED ✅

## Обновлённые компоненты с исключениями от перевода:

### 1. MessagesPage.tsx ✅
**Применены исключения:**
- `data-wg-notranslate` на текст сообщений (строки 1631, 1689)
- Класс `chat-message` на контейнеры сообщений
- Имена файлов вложений (строка 1678)
- Имена пользователей в списке чатов (строка 1331)
- Текст последнего сообщения (строка 1368)

### 2. MarketPage.tsx ✅
**Применены исключения:**
- Класс `order-title` + `data-wg-notranslate` на заголовки (строка 519)
- Класс `order-description` + `data-wg-notranslate` на описания (строка 537)
- Имена пользователей (строка 561)
- Заголовки и описания в модальном окне (строки 674, 690)
- Список features для задач (строка 705)

### 3. ProposalsPage.tsx ✅
**Применены исключения:**
- Имена пользователей (строки 655, 658, 670)
- Названия заказов/задач (строки 655, 689)
- Сообщение отклика с классом `proposal-content` (строка 822)
- Названия и описания опций (строки 832, 839)
- Имя пользователя в детальном окне (строка 803)

### 4. ProfilePage.tsx ✅
**Применены исключения:**
- Заголовок профиля `profile.headline` (строка 1131)
- Текст "О себе" с классом `profile-bio` (строки 1132, 1136)
- Навыки пользователя (строка 1214)

### 5. OrderDetailPage.tsx ✅
**Применены исключения:**
- Класс `order-title` + `data-wg-notranslate` на заголовок (строка 156)
- Класс `order-description` + `data-wg-notranslate` на описание (строка 171)

### 6. TaskDetailPage.tsx ✅
**Применены исключения:**
- Класс `task-title` + `data-wg-notranslate` на заголовок (строка 166)
- Класс `task-description` + `data-wg-notranslate` на описание (строка 189)
- Список features (строка 199)

## CSS классы (активны глобально):

В `src/styles/weglot-ugc.css` и `src/index.css`:
- `.wg-notranslate` - универсальный класс исключения
- `[data-wg-notranslate]` - атрибут исключения
- `.chat-message` - сообщения чата
- `.order-title`, `.order-description` - заказы
- `.task-title`, `.task-description` - задачи
- `.proposal-content` - отклики
- `.profile-bio` - биография профиля
- `.user-content` - любой UGC

## Результат:

✅ Сообщения чата НЕ переводятся
✅ Заказы и задачи (title, description) НЕ переводятся
✅ Отклики (текст, опции) НЕ переводятся
✅ Профили (имена, bio, навыки) НЕ переводятся
✅ Статический UI (кнопки, метки) ПЕРЕВОДИТСЯ

## Что ещё нужно обновить (опционально):

Для полного покрытия примените `data-wg-notranslate` в:
- `src/pages/MyDealsPage.tsx` - информация о сделках
- `src/pages/WalletPage.tsx` - описания транзакций
- `src/components/ReviewInChat.tsx` - текст отзывов
- `src/pages/proposals/Create.tsx` - форма создания отклика
- `src/pages/users/PublicProfile.tsx` - публичный профиль
- `src/pages/OrderCreatePage.tsx` - форма создания заказа
- `src/pages/TaskCreatePage.tsx` - форма создания задачи

## Команды для поиска оставшегося UGC:

```bash
# Найти текст сообщений
rg "message\.text|msg\.content" src/pages/

# Найти описания
rg "\.description" src/pages/ | grep -v "DialogDescription"

# Найти имена пользователей
rg "user\.name|profile\.name" src/pages/

# Найти отзывы
rg "review\.text|review\.comment" src/pages/
```

## Тестирование:

1. Запустите dev сервер
2. Включите Weglot на другой язык
3. Проверьте:
   - ✅ Кнопки и метки переведены
   - ✅ Сообщения в чате НЕ переведены
   - ✅ Заказы/задачи НЕ переведены
   - ✅ Имена пользователей НЕ переведены
   - ✅ Отклики НЕ переведены

## Сборка:

```bash
npm run build
```

Проект собирается успешно ✅
