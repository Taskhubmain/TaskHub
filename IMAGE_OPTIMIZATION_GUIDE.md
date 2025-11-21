# Image Optimization Guide ✅

## ✅ Реализовано

Система оптимизации изображений для быстрой загрузки и рендеринга.

### Функции оптимизации:

**src/lib/image-optimization.ts** - утилиты:

1. **optimizeImage(url, width, quality)** - автоматическая оптимизация URL
   - Добавляет параметры width, quality, format=webp
   - Работает с Supabase Storage
   - По умолчанию quality=80

2. **compressImage(file, maxWidth, quality)** - сжатие при загрузке
   - Сжимает изображения перед отправкой на сервер
   - Конвертирует в WebP
   - Ресайз до maxWidth (по умолчанию 1920px)
   - Качество 0.8 (80%)

3. **lazyLoadImage(img)** - ленивая загрузка
   - Автоматическая lazy loading
   - Fallback для старых браузеров

4. **preloadCriticalImages(urls)** - предзагрузка важных изображений

### Компонент OptimizedImage:

**src/components/OptimizedImage.tsx** - готовый компонент:

```tsx
import { OptimizedImage } from '@/components/OptimizedImage';

<OptimizedImage 
  src="https://example.com/image.jpg"
  alt="Description"
  width={800}      // Ширина для оптимизации
  quality={80}     // Качество (1-100)
  lazy={true}      // Ленивая загрузка
  className="..."
/>
```

### Использование при загрузке файлов:

```typescript
import { compressImage } from '@/lib/image-optimization';

// В обработчике загрузки файла:
const handleFileUpload = async (file: File) => {
  // Сжать перед отправкой
  const compressedBlob = await compressImage(file, 1920, 0.8);
  
  // Создать File из Blob
  const compressedFile = new File(
    [compressedBlob], 
    file.name.replace(/\.(jpg|jpeg|png)$/i, '.webp'),
    { type: 'image/webp' }
  );
  
  // Загрузить на сервер
  await uploadToSupabase(compressedFile);
};
```

### Автоматическая оптимизация для Supabase:

Все изображения из Supabase Storage автоматически оптимизируются:

```typescript
import { optimizeImage } from '@/lib/image-optimization';

// Было:
<img src={profile.avatar} />

// Стало:
<img src={optimizeImage(profile.avatar, 200)} />
// Результат: image.jpg?width=200&quality=80&format=webp
```

### Размеры для разных случаев:

- **Аватары**: 100-200px
- **Миниатюры**: 300-400px
- **Карточки товаров**: 600-800px
- **Полноразмерные**: 1200-1920px
- **Hero изображения**: 1920px

### CSS оптимизация:

Добавлено в `src/index.css`:

```css
img {
  /* Оптимизация рендеринга */
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  
  /* Предотвращение layout shift */
  height: auto;
  max-width: 100%;
}

/* Ленивая загрузка */
img[loading="lazy"] {
  opacity: 0;
  transition: opacity 0.3s;
}

img[loading="lazy"].loaded {
  opacity: 1;
}
```

### Где применяется:

✅ **ProfilePage** - аватары и портфолио
✅ **MarketPage** - карточки заказов/задач
✅ **MessagesPage** - аватары в чатах
✅ **Public uploads** - загрузка пользователями

### Преимущества:

✅ **Меньше размер** - WebP на 25-35% меньше JPEG
✅ **Быстрее загрузка** - параметры width/quality уменьшают размер
✅ **Ленивая загрузка** - изображения загружаются по мере прокрутки
✅ **Адаптивность** - разные размеры для разных экранов
✅ **SEO** - быстрая загрузка улучшает позиции

### Производительность:

**Без оптимизации:**
- Аватар 2MB JPEG → 2MB загрузка
- 10 аватаров = 20MB

**С оптимизацией:**
- Аватар 2MB JPEG → 50KB WebP (width=200, quality=80)
- 10 аватаров = 500KB
- **Экономия: 95%**

### Пример интеграции в форму загрузки:

```typescript
const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    // Сжать изображение
    const compressed = await compressImage(file, 800, 0.85);
    
    // Создать превью
    const previewUrl = URL.createObjectURL(compressed);
    setPreview(previewUrl);
    
    // Загрузить на сервер
    const formData = new FormData();
    formData.append('file', compressed, 'avatar.webp');
    
    await uploadAvatar(formData);
  } catch (error) {
    console.error('Compression failed:', error);
  }
};
```

## Готово! 🎉

Все изображения оптимизируются автоматически при загрузке и отображении.
