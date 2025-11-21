# Weglot Integration Guide

## 1. Setup

Add Weglot script to `index.html`:

```html
<script src="https://cdn.weglot.com/weglot.min.js"></script>
```

Initialize in `main.tsx`:

```tsx
import { initWeglot } from './lib/weglot-config';

initWeglot();
```

## 2. Exclude entire pages

```tsx
import { isUrlExcluded } from './lib/weglot-config';
import { useLocation } from 'react-router-dom';

function App() {
  const location = useLocation();

  useEffect(() => {
    if (isUrlExcluded(location.pathname)) {
      document.body.classList.add('wg-notranslate');
    } else {
      document.body.classList.remove('wg-notranslate');
    }
  }, [location.pathname]);
}
```

## 3. Exclude specific components

```tsx
import { NoTranslate } from '@/components/NoTranslate';

<NoTranslate>
  <p>This text won't be translated</p>
</NoTranslate>
```

## 4. Exclude user-generated content

```tsx
<NoTranslate className="chat-message" data-user-content="true">
  {message.text}
</NoTranslate>
```

## 5. Use Weglot hooks

```tsx
import { useWeglot } from '@/hooks/useWeglot';

function LanguageSwitcher() {
  const { currentLang, switchLanguage, isReady } = useWeglot();

  return (
    <select value={currentLang} onChange={(e) => switchLanguage(e.target.value)}>
      <option value="ru">Русский</option>
      <option value="en">English</option>
      <option value="es">Español</option>
    </select>
  );
}
```

## 6. Manual translations for specific pages

```tsx
const translations = {
  ru: { title: 'Заголовок' },
  en: { title: 'Title' },
};

function Page() {
  const { currentLang } = useWeglot();
  const t = translations[currentLang] || translations.ru;

  return (
    <NoTranslate>
      <h1>{t.title}</h1>
    </NoTranslate>
  );
}
```

## 7. CSS class method

```tsx
<div className="wg-notranslate user-content">
  User generated text here
</div>
```

## 8. Attribute method

```tsx
<div data-no-translate="true">
  Don't translate this
</div>
```

## Best Practices

1. Always wrap UGC (user-generated content) in `<NoTranslate>`
2. Exclude admin panels and learning materials
3. Use manual translations for content-heavy pages
4. Don't translate: usernames, emails, technical terms, code snippets
5. Test language switching after implementation
