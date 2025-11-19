import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronRight, Code, Brush, Megaphone, Globe as Globe2, PenTool, Shield, Star, Clock, Rocket, Users, Sparkles, Zap, Filter, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const categories = [
  { icon: <Code className="h-5 w-5" />, title: 'Разработка', desc: 'Веб, мобильная, backend, игры' },
  { icon: <Brush className="h-5 w-5" />, title: 'Дизайн', desc: 'UI/UX, бренд, 3D, иллюстрации' },
  { icon: <Megaphone className="h-5 w-5" />, title: 'Маркетинг', desc: 'SMM, контент, лидген' },
  { icon: <Globe2 className="h-5 w-5" />, title: 'Локализация', desc: 'Переводы, субтитры, LQA' },
  { icon: <PenTool className="h-5 w-5" />, title: 'Копирайт', desc: 'Тексты, сценарии, редактура' },
  { icon: <Shield className="h-5 w-5" />, title: 'QA / Безопасность', desc: 'Тесты, аудит, процедуры' }
];

const featured = [
  {
    title: 'Нужен фронтенд React + Tailwind для лендинга',
    badges: ['React', 'Tailwind', 'Framer Motion'],
    price: '$600–900',
    meta: 'Срок: 10–14 дней',
    category: 'Разработка',
    author: { name: 'NovaTech', avatar: 'https://i.pravatar.cc/64?img=12' }
  },
  {
    title: 'Прототип мобильного приложения на Flutter',
    badges: ['Flutter', 'Figma', 'API'],
    price: '$1 200',
    meta: 'Срок: 2–3 недели',
    category: 'Разработка',
    author: { name: 'AppNest', avatar: 'https://i.pravatar.cc/64?img=22' }
  },
  {
    title: 'UX‑аудит и редизайн дашборда SaaS',
    badges: ['UX', 'SaaS', 'Design System'],
    price: '$800',
    meta: 'Срок: 7–10 дней',
    category: 'Дизайн',
    author: { name: 'Metricly', avatar: 'https://i.pravatar.cc/64?img=33' }
  },
  {
    title: 'SMM стратегия для B2B продукта',
    badges: ['LinkedIn', 'Content', 'Analytics'],
    price: '$450',
    meta: 'Срок: 5–7 дней',
    category: 'Маркетинг',
    author: { name: 'GrowthLab', avatar: 'https://i.pravatar.cc/64?img=45' }
  },
  {
    title: 'Локализация игры на 5 языков',
    badges: ['EN→RU', 'Игры', 'LQA'],
    price: '$950',
    meta: 'Срок: 14 дней',
    category: 'Локализация',
    author: { name: 'LocalizePro', avatar: 'https://i.pravatar.cc/64?img=56' }
  },
  {
    title: 'Тексты для лендинга SaaS продукта',
    badges: ['Копирайт', 'SEO', 'Landing'],
    price: '$350',
    meta: 'Срок: 3–5 дней',
    category: 'Копирайтинг',
    author: { name: 'WordCraft', avatar: 'https://i.pravatar.cc/64?img=67' }
  }
];

const sponsors = [
  { name: 'Aurora Capital', logo: 'https://dummyimage.com/120x40/111/fff&text=Aurora' },
  { name: 'Northwind', logo: 'https://dummyimage.com/120x40/111/fff&text=Northwind' },
  { name: 'Contoso', logo: 'https://dummyimage.com/120x40/111/fff&text=Contoso' },
  { name: 'Globex', logo: 'https://dummyimage.com/120x40/111/fff&text=Globex' },
  { name: 'Initech', logo: 'https://dummyimage.com/120x40/111/fff&text=Initech' }
];

const testimonials = [
  {
    name: 'Александр Петров',
    role: 'Fullstack Developer',
    avatar: 'https://i.pravatar.cc/80?img=14',
    text: 'Нашел 3 проекта за первую неделю. Быстрые выплаты, никаких скрытых комиссий.'
  },
  {
    name: 'Мария Сидорова',
    role: 'UI/UX Designer',
    avatar: 'https://i.pravatar.cc/80?img=27',
    text: 'Escrow защита дает уверенность, что работа не пропадет. Рекомендую всем дизайнерам.'
  },
  {
    name: 'Дмитрий Козлов',
    role: 'Product Owner',
    avatar: 'https://i.pravatar.cc/80?img=51',
    text: 'Нанял топового разработчика за 2 дня. Прозрачный процесс, четкие этапы сделки.'
  }
];

function Hero() {
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthenticated } = useAuth();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.hash = `/market?search=${encodeURIComponent(searchQuery.trim())}`;
    } else {
      window.location.hash = '/market';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className="relative overflow-hidden border-b">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-background" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              className="text-4xl sm:text-5xl font-extrabold tracking-tight"
            >
              Биржа, где фрилансеры и бизнес находят друг друга быстрее
            </motion.h1>
            <p className="mt-4 text-lg text-[#3F7F6E]">
              Публикуйте задачи за минуты, берите заказы без лишней бюрократии. Безопасные сделки, прозрачные рейтинги, мгновенные выплаты.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3F7F6E]" />
                <Input
                  placeholder='Найдите задачу или навыки'
                  className="pl-9 h-11"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2">
                  <Button className="h-9 px-3" onClick={handleSearch}>Искать</Button>
                </div>
              </div>
              <Button variant="secondary" className="h-11" onClick={() => window.location.hash = isAuthenticated ? '/orders/create' : '/login'}>
                Опубликовать проект <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-[#3F7F6E]">
              <div className="flex items-center gap-2"><Shield className="h-4 w-4" /> Эскроу‑сделки</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> Быстрый старт</div>
              <div className="flex items-center gap-2"><Star className="h-4 w-4" /> Честные рейтинги</div>
            </div>
          </div>

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.1 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                <img src="https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg" alt="" className="h-full w-full object-cover" />
              </div>
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                <img src="https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg" alt="" className="h-full w-full object-cover" />
              </div>
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                <img src="https://images.pexels.com/photos/3182773/pexels-photo-3182773.jpeg" alt="" className="h-full w-full object-cover" />
              </div>
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                <img src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg" alt="" className="h-full w-full object-cover" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Categories() {
  return (
    <section id="categories" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
      <div className="flex items-end justify-between mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Популярные категории</h2>
        <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => window.location.hash = '/categories'}>Все категории</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c, idx) => (
          <motion.div key={c.title} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.4, delay: idx * 0.08, ease: "easeOut" }}>
            <a href={`#/market?category=${encodeURIComponent(c.title)}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div className="p-2 rounded-xl bg-[#EFFFF8]">{c.icon}</div>
                  <CardTitle className="text-lg">{c.title}</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 text-[#3F7F6E]">{c.desc}</CardContent>
              </Card>
            </a>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Featured() {
  const { isAuthenticated } = useAuth();

  return (
    <section id="featured" className="border-y bg-[#C3FFE8]/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Горячие проекты</h2>
          <Button variant="secondary" className="hidden sm:inline-flex" asChild>
            <a href={isAuthenticated ? "#/task/new" : "#/login"}>Опубликовать задачу</a>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featured.map((f, idx) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.4, delay: idx * 0.08, ease: "easeOut" }}>
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base leading-6">{f.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 px-6">
                  <div className="flex flex-wrap gap-2">
                    {f.badges.map((b) => (
                      <Badge key={b} variant="outline">{b}</Badge>
                    ))}
                  </div>
                  <div className="mt-4 text-sm text-[#3F7F6E]">{f.meta}</div>
                </CardContent>
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="flex items-center gap-3">
                    <img src={f.author.avatar} alt={f.author.name} className="h-8 w-8 rounded-full object-cover" />
                    <span className="text-sm">{f.author.name}</span>
                  </div>
                  <div className="font-semibold">{f.price}</div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: <Sparkles className="h-5 w-5" />, title: 'Создайте профиль', desc: 'Укажите навыки, ставку и портфолио' },
    { icon: <Users className="h-5 w-5" />, title: 'Найдите проект', desc: 'Или опубликуйте задачу и получите отклики' },
    { icon: <Shield className="h-5 w-5" />, title: 'Безопасная сделка', desc: 'Эскроу защищает оплату до сдачи работы' },
    { icon: <Rocket className="h-5 w-5" />, title: 'Сдайте и получите оплату', desc: 'Мгновенные выплаты, рейтинги и отзывы' }
  ];
  return (
    <section id="how" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8">Как это работает</h2>
      <div className="grid grid-cols-1 xs-414:grid-cols-2 md:grid-cols-4 gap-4">
        {steps.map((s) => (
          <Card key={s.title}>
            <CardHeader className="pb-2">
              <div className="p-2 rounded-xl bg-[#EFFFF8] w-fit mb-2">{s.icon}</div>
              <CardTitle className="text-lg">{s.title}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 text-[#3F7F6E]">{s.desc}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Sponsors() {
  return (
    <section className="border-y bg-[#EFFFF8]/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-center">
          <p className="text-2xl font-bold tracking-tight text-center">Здесь платят за результат, а не за обещания!</p>
        </div>
      </div>
    </section>
  );
}

function WhyTaskHub() {
  const features = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Escrow защита сделок',
      desc: 'Деньги заморожены до сдачи работы — безопасность для обеих сторон'
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'AI-модерация и фильтрация токсичности',
      desc: 'Автоматическая проверка контента и предотвращение конфликтов'
    },
    {
      icon: <Filter className="h-6 w-6" />,
      title: 'Умные рекомендации исполнителей',
      desc: 'Алгоритмы подбирают лучших специалистов под ваши требования'
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: 'Честные рейтинги и прозрачные комиссии',
      desc: 'Реальные отзывы, понятные условия, без скрытых платежей'
    }
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8 text-center">Почему TaskHub?</h2>
      <div className="grid grid-cols-1 xs-414:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((f, idx) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: idx * 0.08, ease: "easeOut" }}
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="p-3 rounded-xl bg-[#EFFFF8] w-fit mb-3">{f.icon}</div>
                <CardTitle className="text-base leading-6">{f.title}</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 text-sm text-[#3F7F6E]">{f.desc}</CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Наша история и спонсоры</h2>
          <p className="mt-4 text-[#3F7F6E]">
            TaskHub вырос как независимый стартап, созданный разработчиками и дизайнерами, которые хотели избавиться от бюрократии и хаоса на других биржах. Мы построили платформу, где важнее всего честная работа, безопасные сделки и прозрачные правила.
          </p>
          <p className="mt-4 text-[#3F7F6E]">
            TaskHub не привязан к крупным корпорациям — мы финансируемся собственными средствами, что позволяет развивать продукт так, как нужно пользователям. Наша цель — создать универсальную площадку для фрилансеров и бизнеса, где ценится результат.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Badge variant="secondary">0% комиссия на старте</Badge>
            <Badge variant="outline">Эскроу‑кошелёк</Badge>
            <Badge variant="outline">KYC не обязателен</Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
            <img src="https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg" alt="" className="h-full w-full object-cover" />
          </div>
          <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
            <img src="https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg" alt="" className="h-full w-full object-cover" />
          </div>
          <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
            <img src="https://images.pexels.com/photos/3184639/pexels-photo-3184639.jpeg" alt="" className="h-full w-full object-cover" />
          </div>
          <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
            <img src="https://images.pexels.com/photos/3184296/pexels-photo-3184296.jpeg" alt="" className="h-full w-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8 text-center">Отзывы пользователей</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t, idx) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: idx * 0.1, ease: "easeOut" }}
          >
            <Card>
              <CardContent className="pt-6 px-6 pb-6">
                <div className="flex items-center gap-3 mb-4">
                  <img src={t.avatar} alt={t.name} className="h-12 w-12 rounded-full object-cover" />
                  <div>
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-xs text-[#3F7F6E]">{t.role}</div>
                  </div>
                </div>
                <p className="text-sm text-[#3F7F6E] leading-relaxed">{t.text}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="rounded-3xl border p-8 sm:p-12 bg-gradient-to-br from-background to-muted/50">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10 justify-between">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">Готовы начать?</h3>
              <p className="mt-2 text-[#3F7F6E]">Создайте профиль — первые отклики уже через несколько минут.</p>
            </div>
            <div className="flex gap-3">
              <Button asChild size="lg"><a href="#/register">Я фрилансер</a></Button>
              <Button asChild variant="secondary" size="lg"><a href="#/register">Я заказчик</a></Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Hero />
      <Sponsors />
      <WhyTaskHub />
      <Categories />
      <Featured />
      <HowItWorks />
      <About />
      <Testimonials />
      {!isAuthenticated && <CTA />}
    </main>
  );
}
