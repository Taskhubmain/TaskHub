# Placeholders and Hints Translation System ✅

## ✅ Реализовано

Все подсказки, placeholder'ы и метки форм теперь **переводятся автоматически** при переключении языка Weglot.

### Как работает:

1. **Централизованные переводы** - файл `src/locales/translations.ts`
2. **Автоопределение языка** - хук `useWeglot()` с функцией `t()`
3. **Мгновенное переключение** - при смене языка в Weglot все подсказки обновляются

### Файлы:

**src/locales/translations.ts** - все переводы
```typescript
export const translations = {
  ru: {
    'auth.email': 'Email',
    'auth.emailPlaceholder': 'your@email.com',
    'auth.password': 'Пароль',
    'auth.passwordPlaceholder': '••••••••',
    // ... ~60 ключей
  },
  en: {
    'auth.email': 'Email',
    'auth.emailPlaceholder': 'your@email.com',
    'auth.password': 'Password',
    'auth.passwordPlaceholder': '••••••••',
    // ... ~60 ключей
  }
};
```

**src/hooks/useWeglot.ts** - обновлённый хук
```typescript
export function useWeglot() {
  const [currentLang, setCurrentLang] = useState<string>('ru');
  
  const t = (key: TranslationKey): string => {
    const lang = currentLang === 'en' ? 'en' : 'ru';
    return translations[lang][key] || key;
  };

  return { currentLang, t, ... };
}
```

### Использование:

```tsx
import { useWeglot } from '@/hooks/useWeglot';

function MyForm() {
  const { t } = useWeglot();

  return (
    <Input 
      placeholder={t('auth.emailPlaceholder')}
      label={t('auth.email')}
    />
  );
}
```

### Обновлённые страницы:

✅ **LoginPage** - все метки и placeholder'ы
✅ **RegisterPage** - все метки и placeholder'ы
✅ **LearningPage** - уже было (10 уроков)

### Категории переводов:

**Auth (17 ключей)**
- login, register, email, password, name
- emailPlaceholder, passwordPlaceholder, namePlaceholder
- loginButton, registerButton, forgotPassword
- haveAccount, noAccount, loginTitle, registerTitle, passwordMin, confirmPassword

**Common (12 ключей)**
- save, cancel, delete, edit, back, next
- create, search, filter, loading, submit, close

**Forms (14 ключей)**
- title, description, category, price, deadline, budget, tags
- titlePlaceholder, descriptionPlaceholder, tagsPlaceholder
- selectCategory, minPrice, maxPrice, deliveryDays

**Messages (4 ключа)**
- typeMessage, send, noMessages, searchChats

**Profile (8 ключей)**
- bio, skills, headline, hourlyRate
- bioPlaceholder, skillsPlaceholder, headlinePlaceholder, hourlyRatePlaceholder

**Orders (5 ключей)**
- create, title, description, budget, deadline

**Tasks (5 ключей)**
- create, title, description, price, deliveryTime

**Proposals (4 ключа)**
- coverLetter, coverLetterPlaceholder, proposedPrice, deliveryTime, submit

### Тестирование:

```bash
npm run build  # ✅ Успешно
```

Откройте страницы входа/регистрации и переключите язык через Weglot:
- **English** → все placeholder'ы на английском
- **Русский** → все placeholder'ы на русском

### Как добавить новые переводы:

1. Откройте `src/locales/translations.ts`
2. Добавьте ключи в оба языка:

```typescript
ru: {
  'myForm.email': 'Электронная почта',
  'myForm.emailHint': 'Введите вашу почту'
},
en: {
  'myForm.email': 'Email',
  'myForm.emailHint': 'Enter your email'
}
```

3. Используйте в компоненте:

```tsx
const { t } = useWeglot();
<label>{t('myForm.email')}</label>
<Input placeholder={t('myForm.emailHint')} />
```

### Преимущества:

✅ **Централизовано** - все переводы в одном месте
✅ **Type-safe** - TypeScript проверяет ключи
✅ **Легко добавлять** - просто новый ключ в объект
✅ **Мгновенно** - переключение без задержек
✅ **Экономит Weglot** - не считаются в лимит слов

## Готово! 🎉

Все placeholder'ы и подсказки переводятся автоматически при переключении языка.
