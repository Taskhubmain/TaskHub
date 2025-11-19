import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Code, Brush, Megaphone, FileText, Video, Briefcase, Share2, Server, GraduationCap, Heart, ShoppingCart, Coins, Building, Cog, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Subcategory {
  name: string;
  slug: string;
  image: string;
}

interface Category {
  icon: JSX.Element;
  title: string;
  color: string;
  description: string;
  subcategories: Subcategory[];
}

type FilterType = 'all' | 'business' | 'startup' | 'top' | 'new';

interface FilterConfig {
  id: FilterType;
  label: string;
  categories: {
    [key: string]: string[];
  };
}

const categories: Category[] = [
  {
    icon: <Code className="h-6 w-6" />,
    title: 'Разработка',
    color: 'bg-blue-50',
    description: 'Создание сайтов, приложений, игр и программного обеспечения любой сложности',
    subcategories: [
      { name: 'Веб-разработка', slug: 'web-dev', image: 'https://images.pexels.com/photos/276452/pexels-photo-276452.jpeg' },
      { name: 'Мобильная разработка', slug: 'mobile-dev', image: 'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg' },
      { name: 'GameDev', slug: 'gamedev', image: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg' },
      { name: 'Backend', slug: 'backend', image: 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg' },
      { name: 'Full-stack', slug: 'fullstack', image: 'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg' },
      { name: 'AI/ML', slug: 'ai-ml', image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg' },
      { name: 'ChatGPT/AI-боты', slug: 'ai-bots', image: 'https://images.pexels.com/photos/8438922/pexels-photo-8438922.jpeg' },
      { name: 'Десктоп-ПО', slug: 'desktop', image: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg' },
      { name: 'DevOps', slug: 'devops', image: 'https://images.pexels.com/photos/1181354/pexels-photo-1181354.jpeg' },
      { name: 'Скрипты/автоматизации', slug: 'automation', image: 'https://images.pexels.com/photos/270404/pexels-photo-270404.jpeg' }
    ]
  },
  {
    icon: <Brush className="h-6 w-6" />,
    title: 'Дизайн',
    color: 'bg-pink-50',
    description: 'Графический дизайн, брендинг, создание логотипов и визуального контента',
    subcategories: [
      { name: 'Лого', slug: 'logo', image: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg' },
      { name: 'UX/UI', slug: 'ux-ui', image: 'https://images.pexels.com/photos/326514/pexels-photo-326514.jpeg' },
      { name: 'Баннеры', slug: 'banners', image: 'https://images.pexels.com/photos/3727464/pexels-photo-3727464.jpeg' },
      { name: 'Веб-дизайн', slug: 'web-design', image: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg' },
      { name: '3D', slug: '3d', image: 'https://images.pexels.com/photos/4065876/pexels-photo-4065876.jpeg' },
      { name: 'Иллюстрации', slug: 'illustrations', image: 'https://images.pexels.com/photos/1616403/pexels-photo-1616403.jpeg' },
      { name: 'Motion (анимация)', slug: 'motion', image: 'https://images.pexels.com/photos/6774436/pexels-photo-6774436.jpeg' },
      { name: 'Презентации', slug: 'presentations', image: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg' },
      { name: 'Фирменный стиль', slug: 'branding', image: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg' }
    ]
  },
  {
    icon: <Megaphone className="h-6 w-6" />,
    title: 'Маркетинг',
    color: 'bg-green-50',
    description: 'Продвижение бизнеса, настройка рекламы и аналитика эффективности',
    subcategories: [
      { name: 'Таргет', slug: 'targeting', image: 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg' },
      { name: 'SEO', slug: 'seo', image: 'https://images.pexels.com/photos/270637/pexels-photo-270637.jpeg' },
      { name: 'Контекстная реклама', slug: 'context-ads', image: 'https://images.pexels.com/photos/6476587/pexels-photo-6476587.jpeg' },
      { name: 'Email маркетинг', slug: 'email-marketing', image: 'https://images.pexels.com/photos/5797903/pexels-photo-5797903.jpeg' },
      { name: 'Продвижение соцсетей', slug: 'smm', image: 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg' },
      { name: 'Аналитика/веб-аналитика', slug: 'analytics', image: 'https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg' }
    ]
  },
  {
    icon: <FileText className="h-6 w-6" />,
    title: 'Тексты и переводы',
    color: 'bg-yellow-50',
    description: 'Создание качественных текстов, переводы и редактирование контента',
    subcategories: [
      { name: 'Копирайт', slug: 'copywriting', image: 'https://images.pexels.com/photos/261763/pexels-photo-261763.jpeg' },
      { name: 'Рерайт', slug: 'rewriting', image: 'https://images.pexels.com/photos/301703/pexels-photo-301703.jpeg' },
      { name: 'Переводы', slug: 'translation', image: 'https://images.pexels.com/photos/256417/pexels-photo-256417.jpeg' },
      { name: 'Редактура', slug: 'editing', image: 'https://images.pexels.com/photos/159510/pen-writing-notes-studying-159510.jpeg' },
      { name: 'Технические тексты', slug: 'technical-writing', image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg' },
      { name: 'Сценарии', slug: 'scripts', image: 'https://images.pexels.com/photos/7235865/pexels-photo-7235865.jpeg' },
      { name: 'Описания товаров', slug: 'product-descriptions', image: 'https://images.pexels.com/photos/4067755/pexels-photo-4067755.jpeg' }
    ]
  },
  {
    icon: <Video className="h-6 w-6" />,
    title: 'Видео и Аудио',
    color: 'bg-purple-50',
    description: 'Монтаж видео, создание музыки, озвучка и звуковой дизайн',
    subcategories: [
      { name: 'Монтаж', slug: 'video-editing', image: 'https://images.pexels.com/photos/5081918/pexels-photo-5081918.jpeg' },
      { name: 'Озвучка', slug: 'voiceover', image: 'https://images.pexels.com/photos/7087833/pexels-photo-7087833.jpeg' },
      { name: 'Музыка', slug: 'music', image: 'https://images.pexels.com/photos/164821/pexels-photo-164821.jpeg' },
      { name: 'VFX', slug: 'vfx', image: 'https://images.pexels.com/photos/3945313/pexels-photo-3945313.jpeg' },
      { name: 'Саунд-дизайн', slug: 'sound-design', image: 'https://images.pexels.com/photos/2114016/pexels-photo-2114016.jpeg' },
      { name: 'Colour grading', slug: 'colour-grading', image: 'https://images.pexels.com/photos/6739932/pexels-photo-6739932.jpeg' }
    ]
  },
  {
    icon: <Briefcase className="h-6 w-6" />,
    title: 'Бизнес',
    color: 'bg-indigo-50',
    description: 'Консультации, финансовый анализ и бизнес-планирование',
    subcategories: [
      { name: 'Создание презентаций', slug: 'business-presentations', image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg' },
      { name: 'Консультации', slug: 'consulting', image: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg' },
      { name: 'Финансовая аналитика', slug: 'financial-analytics', image: 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg' },
      { name: 'Бизнес-планы', slug: 'business-plans', image: 'https://images.pexels.com/photos/7413915/pexels-photo-7413915.jpeg' },
      { name: 'Маркетплейсы', slug: 'marketplaces', image: 'https://images.pexels.com/photos/3907507/pexels-photo-3907507.jpeg' },
      { name: 'CRM сопровождение', slug: 'crm-support', image: 'https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg' }
    ]
  },
  {
    icon: <Share2 className="h-6 w-6" />,
    title: 'Соцсети',
    color: 'bg-red-50',
    description: 'Ведение аккаунтов, создание контента и стратегии продвижения',
    subcategories: [
      { name: 'Ведение Instagram/TikTok', slug: 'social-management', image: 'https://images.pexels.com/photos/4065891/pexels-photo-4065891.jpeg' },
      { name: 'Монтаж Reels', slug: 'reels-editing', image: 'https://images.pexels.com/photos/5082579/pexels-photo-5082579.jpeg' },
      { name: 'Стратегии контента', slug: 'content-strategy', image: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg' },
      { name: 'Создание постов', slug: 'post-creation', image: 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg' },
      { name: 'Оформление профиля', slug: 'profile-design', image: 'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg' }
    ]
  },
  {
    icon: <Server className="h-6 w-6" />,
    title: 'IT-поддержка',
    color: 'bg-cyan-50',
    description: 'Настройка серверов, хостинг и техническая поддержка',
    subcategories: [
      { name: 'Настройка серверов', slug: 'server-setup', image: 'https://images.pexels.com/photos/1148820/pexels-photo-1148820.jpeg' },
      { name: 'Хостинг', slug: 'hosting', image: 'https://images.pexels.com/photos/2881229/pexels-photo-2881229.jpeg' },
      { name: 'Поддержка сайтов', slug: 'website-support', image: 'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg' },
      { name: 'Настройка сетей', slug: 'network-setup', image: 'https://images.pexels.com/photos/2881232/pexels-photo-2881232.jpeg' },
      { name: 'Установка CMS', slug: 'cms-installation', image: 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg' },
      { name: 'Решение техпроблем', slug: 'tech-support', image: 'https://images.pexels.com/photos/5483077/pexels-photo-5483077.jpeg' }
    ]
  },
  {
    icon: <GraduationCap className="h-6 w-6" />,
    title: 'Образование и репетиторство',
    color: 'bg-orange-50',
    description: 'Онлайн обучение, репетиторство и помощь с учебными задачами',
    subcategories: [
      { name: 'Репетиторы', slug: 'tutors', image: 'https://images.pexels.com/photos/8500285/pexels-photo-8500285.jpeg' },
      { name: 'Курсы', slug: 'courses', image: 'https://images.pexels.com/photos/6146929/pexels-photo-6146929.jpeg' },
      { name: 'Домашние задания', slug: 'homework-help', image: 'https://images.pexels.com/photos/4145190/pexels-photo-4145190.jpeg' },
      { name: 'Подготовка к экзаменам', slug: 'exam-prep', image: 'https://images.pexels.com/photos/6238050/pexels-photo-6238050.jpeg' }
    ]
  },
  {
    icon: <Heart className="h-6 w-6" />,
    title: 'Жизненные задачи (Lifestyle)',
    color: 'bg-rose-50',
    description: 'Персональные консультации и помощь в повседневных задачах',
    subcategories: [
      { name: 'Личные советы', slug: 'personal-advice', image: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg' },
      { name: 'Фото-обработка', slug: 'photo-editing', image: 'https://images.pexels.com/photos/265722/pexels-photo-265722.jpeg' },
      { name: 'Помощь с документами', slug: 'document-help', image: 'https://images.pexels.com/photos/6802042/pexels-photo-6802042.jpeg' },
      { name: 'Тестирование продуктов', slug: 'product-testing', image: 'https://images.pexels.com/photos/3184405/pexels-photo-3184405.jpeg' },
      { name: 'Психология/консультирование', slug: 'psychology', image: 'https://images.pexels.com/photos/3807733/pexels-photo-3807733.jpeg' },
      { name: 'Виртуальные ассистенты', slug: 'virtual-assistants', image: 'https://images.pexels.com/photos/4226140/pexels-photo-4226140.jpeg' }
    ]
  },
  {
    icon: <ShoppingCart className="h-6 w-6" />,
    title: 'eCommerce',
    color: 'bg-teal-50',
    description: 'Создание и продвижение интернет-магазинов',
    subcategories: [
      { name: 'Shopify', slug: 'shopify', image: 'https://images.pexels.com/photos/3769747/pexels-photo-3769747.jpeg' },
      { name: 'WooCommerce', slug: 'woocommerce', image: 'https://images.pexels.com/photos/3944405/pexels-photo-3944405.jpeg' },
      { name: 'Продвижение товаров', slug: 'product-promotion', image: 'https://images.pexels.com/photos/3962285/pexels-photo-3962285.jpeg' },
      { name: 'Маркетплейс-лендинги', slug: 'marketplace-landings', image: 'https://images.pexels.com/photos/3867761/pexels-photo-3867761.jpeg' }
    ]
  },
  {
    icon: <Coins className="h-6 w-6" />,
    title: 'NFT / Web3',
    color: 'bg-violet-50',
    description: 'Блокчейн технологии, NFT и криптовалюты',
    subcategories: [
      { name: 'NFT-арт', slug: 'nft-art', image: 'https://images.pexels.com/photos/8369526/pexels-photo-8369526.jpeg' },
      { name: 'Смарт-контракты', slug: 'smart-contracts', image: 'https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg' },
      { name: 'Токен-экономика', slug: 'tokenomics', image: 'https://images.pexels.com/photos/7567528/pexels-photo-7567528.jpeg' }
    ]
  },
  {
    icon: <Building className="h-6 w-6" />,
    title: 'Архитектура',
    color: 'bg-slate-50',
    description: 'Проектирование зданий и 3D визуализация объектов',
    subcategories: [
      { name: 'Чертежи', slug: 'blueprints', image: 'https://images.pexels.com/photos/834892/pexels-photo-834892.jpeg' },
      { name: '3D-макеты', slug: '3d-models', image: 'https://images.pexels.com/photos/4065876/pexels-photo-4065876.jpeg' },
      { name: 'Архвизуализация', slug: 'archviz', image: 'https://images.pexels.com/photos/323705/pexels-photo-323705.jpeg' }
    ]
  },
  {
    icon: <Cog className="h-6 w-6" />,
    title: 'Инженерия',
    color: 'bg-zinc-50',
    description: 'Прототипирование, электроника и IoT решения',
    subcategories: [
      { name: 'Прототипирование', slug: 'prototyping', image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg' },
      { name: 'Электроника', slug: 'electronics', image: 'https://images.pexels.com/photos/163100/circuit-circuit-board-resistor-computer-163100.jpeg' },
      { name: 'Arduino/IoT', slug: 'arduino-iot', image: 'https://images.pexels.com/photos/2599244/pexels-photo-2599244.jpeg' }
    ]
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'HR и управление',
    color: 'bg-amber-50',
    description: 'Подбор персонала, карьерные консультации и HR услуги',
    subcategories: [
      { name: 'Найм персонала', slug: 'recruitment', image: 'https://images.pexels.com/photos/3184296/pexels-photo-3184296.jpeg' },
      { name: 'Создание резюме', slug: 'resume-writing', image: 'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg' },
      { name: 'Карьерные консультации', slug: 'career-consulting', image: 'https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg' }
    ]
  }
];

function SubcategoryCarousel({ subcategories }: { subcategories: Subcategory[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkScroll();
    }, 100);

    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        clearTimeout(timer);
        ref.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }

    return () => clearTimeout(timer);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const gap = 12;
      const containerWidth = scrollRef.current.clientWidth;
      const itemWidth = Math.floor((containerWidth - gap * 3) / 4);
      const scrollAmount = itemWidth * 3 + gap * 3;

      const currentScroll = scrollRef.current.scrollLeft;
      let targetScroll: number;

      if (direction === 'right') {
        targetScroll = currentScroll + scrollAmount;
      } else {
        targetScroll = currentScroll - scrollAmount;
      }

      scrollRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group">
      {showLeftArrow && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 p-0 rounded-full bg-background/95 backdrop-blur-sm shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}

      <style>
        {`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {subcategories.map((sub) => (
          <a
            key={sub.slug}
            href={`#/market?category=${encodeURIComponent(sub.name)}`}
            className="flex-shrink-0 group/item snap-start"
            style={{ width: 'calc((100% - 36px) / 4)' }}
          >
            <div className="rounded-xl overflow-hidden border bg-background hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
              <div className="aspect-[16/10] overflow-hidden bg-muted">
                <img
                  src={`${sub.image}?auto=compress&cs=tinysrgb&w=400`}
                  alt={sub.name}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-2.5">
                <div className="text-sm font-medium text-center">{sub.name}</div>
              </div>
            </div>
          </a>
        ))}
      </div>

      {showRightArrow && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 p-0 rounded-full bg-background/95 backdrop-blur-sm shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}

function CategorySidebar() {
  return (
    <aside className="hidden lg:block lg:sticky lg:top-4 lg:h-fit">
      <Card className="w-64">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Категории</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-4">
          <nav className="space-y-1">
            {categories.map((category) => (
              <div key={category.title}>
                <a
                  href={`#${category.title.toLowerCase().replace(/\s+/g, '-')}`}
                  className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <div className={`p-1.5 rounded-lg ${category.color}`}>
                    {category.icon}
                  </div>
                  <span className="font-medium">{category.title}</span>
                </a>
                <div className="ml-11 space-y-0.5 mt-1 mb-2">
                  {category.subcategories.map((sub) => (
                    <a
                      key={sub.slug}
                      href={`#/market?category=${encodeURIComponent(sub.name)}`}
                      className="block px-4 py-1 text-xs text-[#3F7F6E] hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      {sub.name}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </CardContent>
      </Card>
    </aside>
  );
}

const filterConfigs: FilterConfig[] = [
  {
    id: 'all',
    label: 'Все категории',
    categories: {}
  },
  {
    id: 'business',
    label: 'Для бизнеса',
    categories: {
      'Разработка': ['Веб-разработка', 'Мобильная разработка', 'Backend', 'Full-stack', 'Десктоп-ПО', 'DevOps', 'Скрипты/автоматизации'],
      'Дизайн': ['Лого', 'UX/UI', 'Веб-дизайн', 'Фирменный стиль', 'Презентации', '3D'],
      'Маркетинг': ['Таргет', 'SEO', 'Контекстная реклама', 'Аналитика', 'Email маркетинг', 'Продвижение соцсетей'],
      'Бизнес': ['Создание презентаций', 'Финансовая аналитика', 'Бизнес-планы', 'CRM сопровождение'],
      'eCommerce': ['Shopify', 'WooCommerce', 'Маркетплейс-лендинги'],
      'IT-поддержка': ['Настройка серверов', 'Поддержка сайтов', 'Установка CMS', 'Решение техпроблем']
    }
  },
  {
    id: 'startup',
    label: 'Для старта',
    categories: {
      'Дизайн': ['Лого', 'Баннеры', 'UX/UI', 'Иллюстрации'],
      'Тексты и переводы': ['Копирайт', 'Рерайт', 'Переводы', 'Описания товаров'],
      'Видео и Аудио': ['Монтаж', 'Озвучка'],
      'Соцсети': ['Создание постов', 'Оформление профиля', 'Ведение Instagram/TikTok', 'Монтаж Reels'],
      'Жизненные задачи (Lifestyle)': ['Фото-обработка', 'Тестирование продуктов', 'Виртуальные ассистенты', 'Личные советы'],
      'Образование и репетиторство': ['Домашние задания', 'Репетиторство', 'Подготовка к экзаменам']
    }
  },
  {
    id: 'top',
    label: 'Топ направления',
    categories: {
      'Разработка': ['AI/ML', 'ChatGPT/AI-боты', 'Full-stack', 'GameDev', 'DevOps'],
      'Дизайн': ['UX/UI', 'Презентации', 'Иллюстрации', '3D'],
      'Маркетинг': ['SEO', 'Таргет'],
      'Соцсети': ['Продвижение соцсетей'],
      'Видео и Аудио': ['Видеомонтаж', 'Озвучка'],
      'NFT / Web3': ['NFT-арт', 'Смарт-контракты'],
      'Архитектура': ['Архвизуализация']
    }
  },
  {
    id: 'new',
    label: 'Новые',
    categories: {
      'Разработка': ['ChatGPT/AI-боты', 'AI/ML'],
      'NFT / Web3': ['NFT-арт', 'Смарт-контракты', 'Токен-экономика'],
      'eCommerce': ['Shopify', 'WooCommerce', 'Прокатники товаров'],
      'Инженерия': ['Arduino/IoT', 'Прототипирование', 'Электроника'],
      'Архитектура': ['Архвизуализация', '3D-макеты']
    }
  }
];

export default function CategoriesPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const getFilteredCategories = () => {
    if (activeFilter === 'all') {
      return categories;
    }

    const activeConfig = filterConfigs.find(f => f.id === activeFilter);
    if (!activeConfig) return categories;

    return categories
      .map(category => {
        const allowedSubcategories = activeConfig.categories[category.title];
        if (!allowedSubcategories) return null;

        const filteredSubs = category.subcategories.filter(sub =>
          allowedSubcategories.includes(sub.name)
        );

        if (filteredSubs.length === 0) return null;

        return {
          ...category,
          subcategories: filteredSubs
        };
      })
      .filter((cat): cat is Category => cat !== null);
  };

  const filteredCategories = getFilteredCategories();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-1">Все категории</h1>
          <p className="text-base text-[#3F7F6E] mb-6">Найдите специалистов в любой области</p>

          <div className="flex gap-8 items-start">
            <div className="hidden lg:block">
              <CategorySidebar />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-6">
                {filterConfigs.map((filter) => (
                  <Button
                    key={filter.id}
                    variant={activeFilter === filter.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveFilter(filter.id)}
                    className={`rounded-full transition-all ${
                      activeFilter === filter.id
                        ? 'bg-[#3F7F6E] hover:bg-[#3F7F6E]/90 px-5 py-2'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>

              <Card className="mb-6 border-[#3F7F6E] bg-gradient-to-r from-[#3F7F6E]/5 to-transparent">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Не знаете, что выбрать?</h3>
                      <p className="text-sm text-muted-foreground">
                        Почитайте: «Как выбрать исполнителя» / «С чего начать новичку»
                      </p>
                    </div>
                    <Button
                      variant="default"
                      className="bg-[#3F7F6E] hover:bg-[#3F7F6E]/90 flex-shrink-0"
                      onClick={() => window.location.hash = '#/learning'}
                    >
                      Перейти в раздел "Обучение"
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-5">
                {filteredCategories.map((category) => (
                  <div
                    key={category.title}
                    id={category.title.toLowerCase().replace(/\s+/g, '-')}
                  >
                    <Card>
                      <CardHeader className="pb-2 pt-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${category.color} flex-shrink-0`}>
                            {category.icon}
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-lg">{category.title}</CardTitle>
                            <p className="text-xs text-[#3F7F6E] mt-0.5">{category.description}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-5 px-6">
                        <SubcategoryCarousel subcategories={category.subcategories} />
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
