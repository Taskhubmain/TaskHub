const categories = ['Разработка', 'Дизайн', 'Маркетинг', 'Локализация', 'Копирайт', 'QA / Безопасность'];
const engagements = ['Фикс-прайс', 'Почасовая'];
const currencies = ['USD', 'EUR', 'KZT', 'RUB'];

const shouldBoost = () => Math.random() < 0.15;

const orderTitles = [
  'Лендинг на React для стартапа',
  'Редизайн мобильного приложения',
  'Копирайт для лендинга SaaS',
  'Локализация сайта на английский',
  'QA: регресс + автотесты',
  'Unity: прототип 2D шутера',
  'SMM: контент-план на месяц',
  'UX-аудит аналитического дашборда',
  'Тех. писатель: документация API',
  'Разработка чат-бота на Python',
  'Настройка CI/CD пайплайна',
  'Дизайн мобильного приложения',
  'Backend на Node.js + PostgreSQL',
  'Интеграция платёжной системы',
  'Оптимизация производительности сайта',
  'Разработка Chrome расширения',
  'Настройка инфраструктуры AWS',
  'Создание дизайн-системы',
  'Разработка REST API',
  'Автоматизация тестирования',
  'Адаптивная вёрстка по макету',
  'Интеграция с внешним API',
  'SEO-оптимизация сайта',
  'Разработка админ-панели',
  'Создание лого и фирменного стиля',
  'Написание технической документации',
  'Настройка мониторинга и логирования',
  'Разработка Telegram бота',
  'Миграция на TypeScript',
  'Рефакторинг legacy кода'
];

const taskTitles = [
  'Сделаю адаптивный лендинг (Next/React)',
  'UX-аудит + редизайн дашборда',
  'Unity 2D кооп на Photon',
  'Разработка SPA на Vue.js',
  'Настройка Docker + Kubernetes',
  'Дизайн логотипа и брендбука',
  'Backend разработка на Django',
  'Мобильное приложение на React Native',
  'Создание 3D моделей для игры',
  'Настройка Elasticsearch',
  'Разработка лендинга на Webflow',
  'Интеграция платежей Stripe',
  'Анимация для сайта (Lottie)',
  'Разработка микросервисов',
  'Настройка Redis кэширования',
  'UI-дизайн для мобильного приложения',
  'Разработка GraphQL API',
  'Иллюстрации для сайта',
  'Настройка Nginx + SSL',
  'Разработка PWA приложения',
  'Создание email-шаблонов',
  'Настройка Google Analytics',
  'Разработка Chrome расширения',
  'Motion-дизайн для промо',
  'Backend на Go + MongoDB',
  'Создание презентации/питча',
  'Настройка Webpack',
  'Разработка landing page',
  'UI-kit для React',
  'Настройка Cloudflare'
];

const allTags = [
  ['React', 'Tailwind', 'Framer'],
  ['UI', 'UX', 'Figma'],
  ['SaaS', 'Лид-магнит'],
  ['EN', 'RU', 'L10n'],
  ['Playwright', 'CI'],
  ['Unity', 'Photon'],
  ['SMM', 'Content'],
  ['Next', 'SEO'],
  ['Python', 'FastAPI'],
  ['Docker', 'K8s'],
  ['Vue', 'Vuex'],
  ['Django', 'PostgreSQL'],
  ['React Native', 'Expo'],
  ['Blender', '3D'],
  ['Node', 'Express'],
  ['Stripe', 'Payments'],
  ['TypeScript', 'GraphQL'],
  ['Illustrator', 'Design'],
  ['Go', 'MongoDB'],
  ['Angular', 'RxJS']
];

const authors = [
  { name: 'NovaTech', avatar: 'https://i.pravatar.cc/64?img=12' },
  { name: 'AppNest', avatar: 'https://i.pravatar.cc/64?img=22' },
  { name: 'Contoso', avatar: 'https://i.pravatar.cc/64?img=31' },
  { name: 'Globex', avatar: 'https://i.pravatar.cc/64?img=40' },
  { name: 'Initech', avatar: 'https://i.pravatar.cc/64?img=18' },
  { name: 'GameForge', avatar: 'https://i.pravatar.cc/64?img=55' },
  { name: 'Northwind', avatar: 'https://i.pravatar.cc/64?img=29' },
  { name: 'Metricly', avatar: 'https://i.pravatar.cc/64?img=33' },
  { name: 'Aurora', avatar: 'https://i.pravatar.cc/64?img=11' },
  { name: 'Mickey', avatar: 'https://i.pravatar.cc/64?img=49' },
  { name: 'Nova', avatar: 'https://i.pravatar.cc/64?img=15' },
  { name: 'DevFox', avatar: 'https://i.pravatar.cc/64?img=56' },
  { name: 'CodeCraft', avatar: 'https://i.pravatar.cc/64?img=8' },
  { name: 'PixelPro', avatar: 'https://i.pravatar.cc/64?img=25' },
  { name: 'TechWave', avatar: 'https://i.pravatar.cc/64?img=37' }
];

const descriptions = [
  'Нужен лендинг из 3 экранов, интеграция форм, анимации.',
  'Обновить UI, подготовить фигма-компоненты.',
  'Тексты для 5 блоков, 2 варианта хедлайнов.',
  'Перевод 12 страниц, терминологическая база есть.',
  'Настроить пайплайн, покрыть критические флоу.',
  'Core loop, 3 врага, сетевой кооп (PUN/Fusion).',
  '30 постов + визуал, календарь публикаций.',
  'Heuristic review, отчёт с рекомендациями.',
  'Описать эндпойнты, примеры запросов/ответов.',
  'От прототипа до деплоя, аккуратный UI, Lighthouse 90+.',
  'Пройду ключевые флоу, предложу понятную инфоструктуру.',
  'Стабильный неткод, базовый матчмейкинг, демо сцена.',
  'Современный стек, чистый код, документация.',
  'Под ключ: дизайн, разработка, тестирование.',
  'Быстро, качественно, с гарантией результата.'
];

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = () => {
  const days = getRandomNumber(1, 30);
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

export const marketOrders = Array.from({ length: 30 }, (_, i) => {
  const isBoosted = shouldBoost();
  return {
    id: i + 1,
    title: orderTitles[i],
    category: getRandomItem(categories),
    priceMin: getRandomNumber(100, 800),
    priceMax: getRandomNumber(900, 2000),
    currency: getRandomItem(currencies),
    engagement: getRandomItem(engagements),
    tags: getRandomItem(allTags),
    author: getRandomItem(authors),
    createdAt: getRandomDate(),
    description: getRandomItem(descriptions),
    isBoosted,
    boostCommissionRate: isBoosted ? 0.10 : 0
  };
}).sort((a, b) => (b.isBoosted ? 1 : 0) - (a.isBoosted ? 1 : 0));

export const marketTasks = Array.from({ length: 30 }, (_, i) => {
  const isBoosted = shouldBoost();
  return {
    id: i + 101,
    title: taskTitles[i],
    category: getRandomItem(categories),
    price: getRandomNumber(200, 1500),
    isBoosted,
    boostCommissionRate: isBoosted ? 0.10 : 0,
  currency: getRandomItem(currencies),
  deliveryDays: getRandomNumber(3, 21),
  tags: getRandomItem(allTags),
  author: getRandomItem(authors),
  createdAt: getRandomDate(),
  features: [
      getRandomItem(['Дизайн по референсам', 'Адаптивная вёрстка', 'Кроссбраузерность']),
      getRandomItem(['Интеграция с API', 'Backend разработка', 'База данных']),
      getRandomItem(['Анимации', 'Оптимизация', 'Документация'])
    ],
    description: getRandomItem(descriptions)
  };
}).sort((a, b) => (b.isBoosted ? 1 : 0) - (a.isBoosted ? 1 : 0));
