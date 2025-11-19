import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronRight,
  Code,
  PenTool,
  Brush,
  Megaphone,
  Globe2,
  Sparkles,
  Shield,
  Star,
  Clock,
  Rocket,
  Users,
  Plus,
  Calendar,
  DollarSign,
  Heart,
  MessageSquare
} from "lucide-react";
import { MapPin, AtSign, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

/**
 * App pages (home + auth) + NEW: Profile, OrderCreate (client), TaskCreate (freelancer)
 * Mint accent, white background; hash-based router for easy preview.
 */

// --- Page Transition Wrapper ---
const pageVariants = {
  initial: { opacity: 0, y: 16 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -16 }
};

const pageTransition = { type: "spring", stiffness: 140, damping: 20, mass: 0.9 };

// --- Dummy data ---
const categories = [
  { icon: <Code className="h-5 w-5" />, title: "Разработка", desc: "Веб, мобильная, backend, игры" },
  { icon: <Brush className="h-5 w-5" />, title: "Дизайн", desc: "UI/UX, бренд, 3D, иллюстрации" },
  { icon: <Megaphone className="h-5 w-5" />, title: "Маркетинг", desc: "SMM, контент, лидген" },
  { icon: <Globe2 className="h-5 w-5" />, title: "Локализация", desc: "Переводы, субтитры, LQA" },
  { icon: <PenTool className="h-5 w-5" />, title: "Копирайт", desc: "Тексты, сценарии, редактура" },
  { icon: <Shield className="h-5 w-5" />, title: "QA / Безопасность", desc: "Тесты, аудит, процедуры" }
];

const featured = [
  {
    title: "Нужен фронтенд React + Tailwind для лендинга",
    badges: ["React", "Tailwind", "Framer Motion"],
    price: "$600–900",
    meta: "Срок: 10–14 дней",
    author: { name: "NovaTech", avatar: "https://i.pravatar.cc/64?img=12" }
  },
  {
    title: "Прототип мобильного приложения на Flutter",
    badges: ["Flutter", "Figma", "API"],
    price: "$1 200",
    meta: "Срок: 2–3 недели",
    author: { name: "AppNest", avatar: "https://i.pravatar.cc/64?img=22" }
  },
  {
    title: "UX‑аудит и редизайн дашборда SaaS",
    badges: ["UX", "SaaS", "Design System"],
    price: "$800",
    meta: "Срок: 7–10 дней",
    author: { name: "Metricly", avatar: "https://i.pravatar.cc/64?img=33" }
  }
];

const sponsors = [
  { name: "Aurora Capital", logo: "https://dummyimage.com/120x40/111/fff&text=Aurora" },
  { name: "Northwind", logo: "https://dummyimage.com/120x40/111/fff&text=Northwind" },
  { name: "Contoso", logo: "https://dummyimage.com/120x40/111/fff&text=Contoso" },
  { name: "Globex", logo: "https://dummyimage.com/120x40/111/fff&text=Globex" },
  { name: "Initech", logo: "https://dummyimage.com/120x40/111/fff&text=Initech" }
];

function NavBar() {
  return (
    <nav className="sticky top-0 z-40 w-full border-b border-[#6FE7C8] bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5" />
          <a href="#/" className="font-bold tracking-tight">FreelanceHub</a>
          <Badge className="ml-2" variant="secondary">beta</Badge>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-[#3F7F6E]">
          <a href="#/" className="hover:text-foreground transition">Главная</a>
          <a href="#/market" className="hover:text-foreground transition">Биржа</a>
          <a href="#/order/new" className="hover:text-foreground transition">Заказ</a>
          <a href="#/task/new" className="hover:text-foreground transition">Task</a>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex"><a href="#/login">Войти</a></Button>
          <Button asChild className="hidden sm:inline-flex"><a href="#/register">Зарегистрироваться</a></Button>
          <Button asChild variant="secondary" className="hidden lg:inline-flex"><a href="#/order/new"><Plus className="h-4 w-4 mr-1"/>Заказ</a></Button>
          <Button asChild variant="secondary" className="hidden lg:inline-flex"><a href="#/task/new"><Plus className="h-4 w-4 mr-1"/>Task</a></Button>
          <Button asChild variant="ghost" className="inline-flex"><a href="#/profile">Профиль</a></Button>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-background" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
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
                <Input placeholder='Найдите задачу или навыки (напр. "React", "Unity")' className="pl-9 h-11" />
                <div className="absolute right-1 top-1/2 -translate-y-1/2">
                  <Button className="h-9 px-3">Искать</Button>
                </div>
              </div>
              <Button variant="secondary" className="h-11" asChild>
                <a href="#/order/new">Создать проект <ChevronRight className="ml-1 h-4 w-4" /></a>
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
              transition={{ type: "spring", stiffness: 120, damping: 16, delay: 0.1 }}
              className="grid grid-cols-2 gap-4"
            >
              {[1,2,3,4].map((i) => (
                <div key={i} className="aspect-[4/3] rounded-2xl bg-[#EFFFF8] overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-br from-muted to-background flex items-end p-3">
                    <Badge variant="secondary">Работа #{i}</Badge>
                  </div>
                </div>
              ))}
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
        <Button variant="ghost" className="hidden sm:inline-flex">Все категории</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c, idx) => (
          <motion.div key={c.title} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.04 }}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="p-2 rounded-xl bg-[#EFFFF8]">{c.icon}</div>
                <CardTitle className="text-lg">{c.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-[#3F7F6E]">{c.desc}</CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Featured() {
  return (
    <section id="featured" className="border-y bg-[#C3FFE8]/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Горячие проекты</h2>
          <Button variant="secondary" className="hidden sm:inline-flex">Опубликовать задачу</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featured.map((f, idx) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }}>
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base leading-6">{f.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
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
    { icon: <Sparkles className="h-5 w-5" />, title: "Создайте профиль", desc: "Укажите навыки, ставку и портфолио" },
    { icon: <Users className="h-5 w-5" />, title: "Найдите проект", desc: "Или опубликуйте задачу и получите отклики" },
    { icon: <Shield className="h-5 w-5" />, title: "Безопасная сделка", desc: "Эскроу защищает оплату до сдачи работы" },
    { icon: <Rocket className="h-5 w-5" />, title: "Сдайте и получите оплату", desc: "Мгновенные выплаты, рейтинги и отзывы" }
  ];
  return (
    <section id="how" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8">Как это работает</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {steps.map((s) => (
          <Card key={s.title}>
            <CardHeader className="pb-2">
              <div className="p-2 rounded-xl bg-[#EFFFF8] w-fit mb-2">{s.icon}</div>
              <CardTitle className="text-lg">{s.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-[#3F7F6E]">{s.desc}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Sponsors() {
  return (
    <section className="border-y">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between gap-6 overflow-x-auto no-scrollbar">
          {sponsors.map((s) => (
            <img key={s.name} src={s.logo} alt={s.name} className="h-8 opacity-70 hover:opacity-100 transition" />
          ))}
        </div>
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
            Мы начали как маленькая команда разработчиков и дизайнеров, уставших от сложных правил и задержек выплат на старых биржах. Наша цель — сделать сделки честными и быстрыми, а поиск талантов — простым.
          </p>
          <p className="mt-4 text-[#3F7F6E]">
            Платформу поддерживают независимые инвесторы и партнёры из SaaS‑индустрии. Мы развиваем систему арбитража, прозрачные комиссии и инструменты для командной работы.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Badge variant="secondary">0% комиссия на старте</Badge>
            <Badge variant="outline">Эскроу‑кошелёк</Badge>
            <Badge variant="outline">KYC не обязателен</Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="aspect-[4/3] rounded-2xl bg-[#EFFFF8]" />
          <div className="aspect-[4/3] rounded-2xl bg-[#EFFFF8]" />
          <div className="aspect-[4/3] rounded-2xl bg-[#EFFFF8]" />
          <div className="aspect-[4/3] rounded-2xl bg-[#EFFFF8]" />
        </div>
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

function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 text-sm text-[#3F7F6E]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> FreelanceHub © {new Date().getFullYear()}</div>
          <div className="flex items-center gap-4">
            <a className="hover:text-foreground" href="#/market">Биржа</a>
            <a className="hover:text-foreground" href="#/order/new">Создать заказ</a>
            <a className="hover:text-foreground" href="#/task/new">Создать Task</a>
            <a className="hover:text-foreground" href="#/profile">Профиль</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function HomePage() {
  return (
    <AnimatePresence mode="wait">
      <motion.main
        key="home"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="min-h-screen bg-background text-foreground"
      >
        <NavBar />
        <Hero />
        <Sponsors />
        <Categories />
        <Featured />
        <HowItWorks />
        <About />
        <CTA />
        <Footer />
      </motion.main>
    </AnimatePresence>
  );
}

// ---------------- NEW: PROFILE PAGE ----------------
function ProfilePage() {
  const [tab, setTab] = React.useState("portfolio");
  const [profile, setProfile] = React.useState(() => {
    const raw = typeof window !== 'undefined' && localStorage.getItem('fh_profile');
    return raw ? JSON.parse(raw) : {
      name: "Mickey",
      headline: "Web/Unity",
      role: "Full‑stack / Game Dev",
      about: "Full‑stack разработчик и Unity‑инженер. Люблю аккуратные интерфейсы и предсказуемый неткод.",
      skills: ["React","Tailwind","Node","PostgreSQL","Unity","Photon"],
      rateMin: 20,
      rateMax: 35,
      currency: "USD",
      location: "Есик / Алматы",
      contactEmail: "you@example.com",
      contactTelegram: "@mickey",
      avatar: "https://i.pravatar.cc/120?img=49"
    };
  });
  const saveProfile = (p) => {
    setProfile(p);
    if (typeof window !== 'undefined') localStorage.setItem('fh_profile', JSON.stringify(p));
  };
  const onEditSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next = {
      name: String(fd.get('name')||''),
      headline: String(fd.get('headline')||''),
      role: String(fd.get('role')||''),
      about: String(fd.get('about')||''),
      skills: String(fd.get('skills')||'').split(',').map(s=>s.trim()).filter(Boolean),
      rateMin: Number(fd.get('rateMin')||0),
      rateMax: Number(fd.get('rateMax')||0),
      currency: String(fd.get('currency')||'USD'),
      location: String(fd.get('location')||''),
      contactEmail: String(fd.get('contactEmail')||''),
      contactTelegram: String(fd.get('contactTelegram')||''),
      avatar: String(fd.get('avatar')||'')
    };
    saveProfile(next);
    alert('Профиль обновлён');
    setTab('about');
  };
  return (
    <AnimatePresence mode="wait">
      <motion.main
        key="profile"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="min-h-screen bg-background"
      >
        <NavBar />
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
            <Card className="sticky top-24 self-start">
              <CardContent className="p-6 grid gap-4">
                <div className="flex items-center gap-4">
                  <img src={profile.avatar} alt="avatar" className="h-16 w-16 rounded-2xl object-cover" />
                  <div>
                    <div className="font-semibold">{profile.name} • {profile.headline}</div>
                    <div className="text-sm text-[#3F7F6E]">{profile.role}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border p-2">
                    <div className="text-xs text-[#3F7F6E]">Рейтинг</div>
                    <div className="font-semibold flex items-center justify-center gap-1"><Star className="h-4 w-4"/>4.9</div>
                  </div>
                  <div className="rounded-xl border p-2">
                    <div className="text-xs text-[#3F7F6E]">Проекты</div>
                    <div className="font-semibold">27</div>
                  </div>
                  <div className="rounded-xl border p-2">
                    <div className="text-xs text-[#3F7F6E]">Онлайн</div>
                    <div className="font-semibold text-emerald-600">сейчас</div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Button asChild><a href="#/task/new">Создать Task</a></Button>
                  <Button asChild variant="secondary"><a href="#/order/new">Создать заказ</a></Button>
                </div>
                <div className="flex items-center justify-between text-sm text-[#3F7F6E]">
                  <a className="underline" href="#">Поделиться профилем</a>
                  <button className="underline" onClick={()=>setTab('edit')}>Редактировать</button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6">
              <Card>
                <CardContent className="p-6 flex flex-wrap items-center gap-3">
                  {[{id:'portfolio',label:'Портфолио'},{id:'about',label:'О себе'},{id:'reviews',label:'Отзывы'},{id:'edit',label:'Редактировать'}].map(t=>(
                    <Button key={t.id} variant={tab===t.id? 'default':'ghost'} onClick={()=>setTab(t.id)} className="h-9 px-4">{t.label}</Button>
                  ))}
                </CardContent>
              </Card>

              {tab === "portfolio" && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[1,2,3,4,5,6].map((i) => (
                    <Card key={i} className="overflow-hidden">
                      <div className="aspect-[16/10] bg-[#EFFFF8]" />
                      <CardContent className="p-4">
                        <div className="font-medium">Проект #{i}</div>
                        <div className="text-sm text-[#3F7F6E]">React · Node · PostgreSQL</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {tab === "about" && (
                <Card>
                  <CardContent className="p-6 grid gap-4">
                    <div>
                      <div className="font-semibold">{profile.headline}</div>
                      <div className="text-[#3F7F6E]">{profile.about}</div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="rounded-xl border p-4">
                        <div className="text-sm font-medium mb-2">Навыки</div>
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.map((s)=> <Badge key={s} variant="outline">{s}</Badge>)}
                        </div>
                      </div>
                      <div className="rounded-xl border p-4 grid gap-2">
                        <div className="text-sm font-medium">Ставка</div>
                        <div className="text-[#3F7F6E]">{`$${profile.rateMin}–${profile.rateMax}/${profile.currency==='USD'?'час':'час'}`}</div>
                        <div className="flex items-center gap-2 text-sm text-[#3F7F6E]"><MapPin className="h-4 w-4"/>{profile.location}</div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-2 text-[#3F7F6E]"><AtSign className="h-4 w-4"/>{profile.contactTelegram}</span>
                          <span className="flex items-center gap-2 text-[#3F7F6E]"><LinkIcon className="h-4 w-4"/>{profile.contactEmail}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {tab === "reviews" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1,2,3].map((i)=> (
                    <Card key={i}>
                      <CardContent className="p-6 grid gap-3">
                        <div className="flex items-center gap-3">
                          <img src={`https://i.pravatar.cc/64?img=${10+i}`} className="h-9 w-9 rounded-full"/>
                          <div className="font-medium">Заказчик #{i}</div>
                          <div className="ml-auto flex items-center gap-1 text-emerald-600"><Star className="h-4 w-4"/>5.0</div>
                        </div>
                        <p className="text-sm text-[#3F7F6E]">Отличная коммуникация, аккуратные коммиты, демо вовремя. Рекомендую!</p>
                        <div className="flex items-center gap-4 text-sm text-[#3F7F6E]">
                          <span className="flex items-center gap-1"><Heart className="h-4 w-4"/>Полезно</span>
                          <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4"/>Ответить</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {tab === 'edit' && (
                <Card>
                  <CardContent className="p-6">
                    <form className="grid gap-4" onSubmit={onEditSubmit}>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <label className="grid gap-1">
                          <span className="text-sm font-medium">Имя</span>
                          <Input name="name" defaultValue={profile.name} className="h-11"/>
                        </label>
                        <label className="grid gap-1">
                          <span className="text-sm font-medium">Заголовок</span>
                          <Input name="headline" defaultValue={profile.headline} className="h-11"/>
                        </label>
                        <label className="grid gap-1">
                          <span className="text-sm font-medium">Роль</span>
                          <Input name="role" defaultValue={profile.role} className="h-11"/>
                        </label>
                        <label className="grid gap-1">
                          <span className="text-sm font-medium">Аватар (URL)</span>
                          <Input name="avatar" defaultValue={profile.avatar} className="h-11"/>
                        </label>
                      </div>
                      <label className="grid gap-1">
                        <span className="text-sm font-medium">О себе</span>
                        <textarea name="about" defaultValue={profile.about} rows={5} className="rounded-md border px-3 py-2 bg-background"/>
                      </label>
                      <label className="grid gap-1">
                        <span className="text-sm font-medium">Навыки (через запятую)</span>
                        <Input name="skills" defaultValue={profile.skills.join(', ')} className="h-11"/>
                      </label>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <label className="grid gap-1">
                          <span className="text-sm font-medium">Ставка min</span>
                          <Input type="number" name="rateMin" defaultValue={profile.rateMin} className="h-11"/>
                        </label>
                        <label className="grid gap-1">
                          <span className="text-sm font-medium">Ставка max</span>
                          <Input type="number" name="rateMax" defaultValue={profile.rateMax} className="h-11"/>
                        </label>
                        <label className="grid gap-1">
                          <span className="text-sm font-medium">Валюта</span>
                          <select name="currency" defaultValue={profile.currency} className="h-11 rounded-md border px-3 bg-background">
                            <option>USD</option>
                            <option>EUR</option>
                            <option>KZT</option>
                            <option>RUB</option>
                            <option>PLN</option>
                          </select>
                        </label>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <label className="grid gap-1">
                          <span className="text-sm font-medium">Локация</span>
                          <Input name="location" defaultValue={profile.location} className="h-11"/>
                        </label>
                        <label className="grid gap-1">
                          <span className="text-sm font-medium">Email</span>
                          <Input name="contactEmail" type="email" defaultValue={profile.contactEmail} className="h-11"/>
                        </label>
                        <label className="grid gap-1">
                          <span className="text-sm font-medium">Telegram</span>
                          <Input name="contactTelegram" defaultValue={profile.contactTelegram} className="h-11"/>
                        </label>
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={()=>setTab('about')}>Отмена</Button>
                        <Button type="submit">Сохранить</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
        <Footer />
      </motion.main>
    </AnimatePresence>
  );
}

// ---------------- NEW: ORDER CREATE (CLIENT) ----------------
function Label({ children }) {
  return <span className="text-sm font-medium">{children}</span>;
}

function Field({ label, children }) {
  return (
    <label className="grid gap-1">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

function TwoCol({ left, right }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{left}{right}</div>
  );
}

function OrderCreatePage() {
  const onSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    console.log("create-order", payload);
    alert("Заказ сохранён (демо). См. console.log()");
  };
  return (
    <AnimatePresence mode="wait">
      <motion.main key="order-new" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-background">
        <NavBar />
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Новый заказ</h1>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <Card>
              <CardContent className="p-6 grid gap-4">
                <Field label="Заголовок">
                  <Input name="title" placeholder="Напр.: Нужен сайт‑лендинг на React" required className="h-11" />
                </Field>
                <TwoCol
                  left={
                    <Field label="Категория">
                      <select name="category" className="h-11 rounded-md border px-3 bg-background">
                        <option>Разработка</option>
                        <option>Дизайн</option>
                        <option>Маркетинг</option>
                        <option>Локализация</option>
                        <option>Копирайт</option>
                        <option>QA / Безопасность</option>
                      </select>
                    </Field>
                  }
                  right={
                    <Field label="Дедлайн">
                      <div className="relative">
                        <Input name="deadline" type="date" className="h-11 pr-10" />
                        <Calendar className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#3F7F6E]" />
                      </div>
                    </Field>
                  }
                />
                <TwoCol
                  left={
                    <Field label="Бюджет (мин)">
                      <div className="flex gap-2">
                        <span className="inline-flex items-center px-2 border rounded-md"><DollarSign className="h-4 w-4"/></span>
                        <Input name="budget_min" type="number" placeholder="300" className="h-11" />
                      </div>
                    </Field>
                  }
                  right={
                    <Field label="Бюджет (макс)">
                      <div className="flex gap-2">
                        <span className="inline-flex items-center px-2 border rounded-md"><DollarSign className="h-4 w-4"/></span>
                        <Input name="budget_max" type="number" placeholder="600" className="h-11" />
                      </div>
                    </Field>
                  }
                />
                <TwoCol
                  left={
                    <Field label="Валюта">
                      <select name="currency" className="h-11 rounded-md border px-3 bg-background">
                        <option>USD</option>
                        <option>EUR</option>
                        <option>KZT</option>
                        <option>RUB</option>
                        <option>PLN</option>
                      </select>
                    </Field>
                  }
                  right={
                    <Field label="Тип занятости">
                      <select name="engagement" className="h-11 rounded-md border px-3 bg-background">
                        <option>Фикс‑прайс</option>
                        <option>Почасовая</option>
                      </select>
                    </Field>
                  }
                />
                <Field label="Описание">
                  <textarea name="description" rows={6} placeholder="Опишите задачи, критерии приёмки, ссылки на референсы" className="rounded-md border px-3 py-2 bg-background" />
                </Field>
                <Field label="Теги (через запятую)">
                  <Input name="tags" placeholder="React, Tailwind, API" className="h-11" />
                </Field>
                <div className="flex items-center gap-2">
                  <input id="escrow" name="escrow" type="checkbox" className="h-4 w-4" defaultChecked />
                  <label htmlFor="escrow" className="text-sm">Использовать эскроу</label>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="text-sm text-[#3F7F6E]">Черновик автоматически сохраняется (демо)</div>
                  <div className="flex gap-3">
                    <Button type="button" variant="ghost" asChild><a href="#/">Отменить</a></Button>
                    <Button type="submit">Опубликовать</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </section>
        <Footer />
      </motion.main>
    </AnimatePresence>
  );
}

// ---------------- NEW: TASK CREATE (FREELANCER) ----------------
function TaskCreatePage() {
  const onSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    console.log("create-task", payload);
    alert("Task сохранён (демо). См. console.log()");
  };
  return (
    <AnimatePresence mode="wait">
      <motion.main key="task-new" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-background">
        <NavBar />
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Новый Task (предложение фрилансера)</h1>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <Card>
              <CardContent className="p-6 grid gap-4">
                <Field label="Название">
                  <Input name="title" placeholder="Сделаю адаптивный лендинг на React / Next" required className="h-11" />
                </Field>
                <TwoCol
                  left={
                    <Field label="Категория">
                      <select name="category" className="h-11 rounded-md border px-3 bg-background">
                        <option>Разработка</option>
                        <option>Дизайн</option>
                        <option>Маркетинг</option>
                        <option>Локализация</option>
                        <option>Копирайт</option>
                        <option>QA / Безопасность</option>
                      </select>
                    </Field>
                  }
                  right={
                    <Field label="Срок выполнения">
                      <div className="relative">
                        <Input name="delivery_days" type="number" placeholder="7" className="h-11 pr-10" />
                        <Clock className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#3F7F6E]" />
                      </div>
                    </Field>
                  }
                />
                <TwoCol
                  left={
                    <Field label="Цена">
                      <div className="flex gap-2">
                        <span className="inline-flex items-center px-2 border rounded-md"><DollarSign className="h-4 w-4"/></span>
                        <Input name="price" type="number" placeholder="300" className="h-11" />
                      </div>
                    </Field>
                  }
                  right={
                    <Field label="Валюта">
                      <select name="currency" className="h-11 rounded-md border px-3 bg-background">
                        <option>USD</option>
                        <option>EUR</option>
                        <option>KZT</option>
                        <option>RUB</option>
                        <option>PLN</option>
                      </select>
                    </Field>
                  }
                />
                <Field label="Что входит">
                  <div className="grid sm:grid-cols-2 gap-2">
                    {[
                      "Дизайн по референсам",
                      "Адаптивная вёрстка",
                      "Интеграция с API",
                      "Анимации (Framer Motion)",
                      "Базовое SEO",
                      "Настройка деплоя"
                    ].map((opt, i) => (
                      <label key={i} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name={`feature_${i}`} className="h-4 w-4" />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </Field>
                <Field label="Описание">
                  <textarea name="description" rows={6} placeholder="Опишите опыт, стек, процесс и критерии качества" className="rounded-md border px-3 py-2 bg-background" />
                </Field>
                <Field label="Теги (через запятую)">
                  <Input name="tags" placeholder="React, Tailwind, SSR" className="h-11" />
                </Field>
                <div className="flex justify-between items-center pt-2">
                  <div className="text-sm text-[#3F7F6E]">Черновик автоматически сохраняется (демо)</div>
                  <div className="flex gap-3">
                    <Button type="button" variant="ghost" asChild><a href="#/">Отменить</a></Button>
                    <Button type="submit">Опубликовать</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </section>
        <Footer />
      </motion.main>
    </AnimatePresence>
  );
}



// ---------------- MARKET PAGE ----------------
import React from "react";

const marketOrders = [
  { id: 1, title: "Лендинг на React для стартапа", category: "Разработка", priceMin: 500, priceMax: 900, currency: "USD", engagement: "Фикс-прайс", tags: ["React","Tailwind","Framer"], author: { name: "NovaTech", avatar: "https://i.pravatar.cc/64?img=12" }, createdAt: "2025-10-21", description: "Нужен лендинг из 3 экранов, интеграция форм, анимации." },
  { id: 2, title: "Редизайн мобильного приложения", category: "Дизайн", priceMin: 700, priceMax: 1200, currency: "USD", engagement: "Фикс-прайс", tags: ["UI","UX","Figma"], author: { name: "AppNest", avatar: "https://i.pravatar.cc/64?img=22" }, createdAt: "2025-10-19", description: "Обновить UI, подготовить фигма-компоненты." },
  { id: 3, title: "Копирайт для лендинга SaaS", category: "Копирайт", priceMin: 150, priceMax: 300, currency: "USD", engagement: "Фикс-прайс", tags: ["SaaS","Лид-магнит"], author: { name: "Contoso", avatar: "https://i.pravatar.cc/64?img=31" }, createdAt: "2025-10-25", description: "Тексты для 5 блоков, 2 варианта хедлайнов." },
  { id: 4, title: "Локализация сайта на английский", category: "Локализация", priceMin: 200, priceMax: 450, currency: "USD", engagement: "Почасовая", tags: ["EN","RU","L10n"], author: { name: "Globex", avatar: "https://i.pravatar.cc/64?img=40" }, createdAt: "2025-10-23", description: "Перевод 12 страниц, терминологическая база есть." },
  { id: 5, title: "QA: регресс + автотесты", category: "QA / Безопасность", priceMin: 400, priceMax: 900, currency: "USD", engagement: "Почасовая", tags: ["Playwright","CI"], author: { name: "Initech", avatar: "https://i.pravatar.cc/64?img=18" }, createdAt: "2025-10-20", description: "Настроить пайплайн, покрыть критические флоу." },
  { id: 6, title: "Unity: прототип 2D шутера", category: "Разработка", priceMin: 800, priceMax: 1600, currency: "USD", engagement: "Фикс-прайс", tags: ["Unity","Photon"], author: { name: "GameForge", avatar: "https://i.pravatar.cc/64?img=55" }, createdAt: "2025-10-24", description: "Core loop, 3 врага, сетевой кооп (PUN/Fusion)." },
  { id: 7, title: "SMM: контент-план на месяц", category: "Маркетинг", priceMin: 250, priceMax: 500, currency: "USD", engagement: "Фикс-прайс", tags: ["SMM","Content"], author: { name: "Northwind", avatar: "https://i.pravatar.cc/64?img=29" }, createdAt: "2025-10-18", description: "30 постов + визуал, календарь публикаций." },
  { id: 8, title: "UX-аудит аналитического дашборда", category: "Дизайн", priceMin: 400, priceMax: 800, currency: "USD", engagement: "Фикс-прайс", tags: ["UX","SaaS"], author: { name: "Metricly", avatar: "https://i.pravatar.cc/64?img=33" }, createdAt: "2025-10-26", description: "Heuristic review, отчёт с рекомендациями." },
  { id: 9, title: "Тех. писатель: документация API", category: "Копирайт", priceMin: 300, priceMax: 700, currency: "USD", engagement: "Почасовая", tags: ["API","Docs"], author: { name: "Aurora", avatar: "https://i.pravatar.cc/64?img=11" }, createdAt: "2025-10-17", description: "Описать эндпойнты, примеры запросов/ответов." }
];

const marketTasks = [
  { id: 101, title: "Сделаю адаптивный лендинг (Next/React)", category: "Разработка", price: 450, currency: "USD", deliveryDays: 7, tags: ["React","Next","SEO"], author: { name: "Mickey", avatar: "https://i.pravatar.cc/64?img=49" }, createdAt: "2025-10-22", features: ["Дизайн по референсам","Интеграция с API","Анимации"], description: "От прототипа до деплоя, аккуратный UI, Lighthouse 90+." },
  { id: 102, title: "UX-аудит + редизайн дашборда", category: "Дизайн", price: 600, currency: "USD", deliveryDays: 10, tags: ["UX","Figma","SaaS"], author: { name: "Nova", avatar: "https://i.pravatar.cc/64?img=15" }, createdAt: "2025-10-23", features: ["Heuristic review","Юзкейсы","Компоненты"], description: "Пройду ключевые флоу, предложу понятную инфоструктуру." },
  { id: 103, title: "Unity 2D кооп на Photon", category: "Разработка", price: 900, currency: "USD", deliveryDays: 14, tags: ["Unity","Photon"], author: { name: "DevFox", avatar: "https://i.pravatar.cc/64?img=56" }, createdAt: "2025-10-25", features: ["Netcode","Интерполяция","Репликация"], description: "Стабильный неткод, базовый матчмейкинг, демо сцена." }
];

function MarketPage() {
  const [activeTab, setActiveTab] = React.useState('orders');
  const [q, setQ] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [currency, setCurrency] = React.useState("");
  const [engagement, setEngagement] = React.useState("");
  const [min, setMin] = React.useState("");
  const [max, setMax] = React.useState("");
  const [sort, setSort] = React.useState("new");
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewItem, setPreviewItem] = React.useState(null);
  const [previewType, setPreviewType] = React.useState('order'); // 'order' | 'task'

  const applyFilters = (arr) => {
    let res = [...arr];
    if (q) { const s = q.toLowerCase(); res = res.filter(o => o.title.toLowerCase().includes(s) || (o.tags||[]).some(t=>t.toLowerCase().includes(s))); }
    if (category) res = res.filter(o => o.category === category);
    if (currency) res = res.filter(o => o.currency === currency);
    if (activeTab === 'orders' && engagement) res = res.filter(o => o.engagement === engagement);
    const nMin = Number(min); const nMax = Number(max);
    if (activeTab === 'orders') {
      if (!Number.isNaN(nMin) && min !== "") res = res.filter(o => (o.priceMax||0) >= nMin);
      if (!Number.isNaN(nMax) && max !== "") res = res.filter(o => (o.priceMin||0) <= nMax);
    } else {
      if (!Number.isNaN(nMin) && min !== "") res = res.filter(o => (o.price||0) >= nMin);
      if (!Number.isNaN(nMax) && max !== "") res = res.filter(o => (o.price||0) <= nMax);
    }
    if (sort === 'priceUp') res.sort((a,b)=> ( (a.priceMin??a.price) - (b.priceMin??b.price) ));
    else if (sort === 'priceDown') res.sort((a,b)=> ( (b.priceMax??b.price) - (a.priceMax??a.price) ));
    else if (sort === 'new') res.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
    return res;
  };

  const data = activeTab === 'orders' ? applyFilters(marketOrders) : applyFilters(marketTasks);

  const reset = () => { setQ(""); setCategory(""); setCurrency(""); setEngagement(""); setMin(""); setMax(""); setSort("new"); };

  const openPreview = (item, type) => { setPreviewItem(item); setPreviewType(type); setPreviewOpen(true); };

  return (...)
}

export default MarketPage;
