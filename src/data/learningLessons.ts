export interface Lesson {
  id: number;
  title: {
    ru: string;
    en: string;
  };
  content: {
    ru: string;
    en: string;
  };
}

export const lessons: Lesson[] = [
  {
    id: 1,
    title: {
      ru: 'Старт для фрилансеров',
      en: 'Getting Started as a Freelancer'
    },
    content: {
      ru: `Фриланс — это набор навыков: общение, надёжность, умение не перегореть и зарабатывать.

1. Оформи профиль

Аватар: твоё лицо или аккуратный нейтральный образ.
Описание: кто ты и что делаешь в 2–4 предложениях.
Навыки: технологии, направления.
Примеры работ: даже 2–3 работы лучше пустого профиля.

2. Выбери 1–2 направления

Не разбрасывайся на всё подряд. Выбери то, что реально умеешь делать качественно.

3. Настрой цены

Цель на старте — набрать первые успешные проекты. Поставь цену немного ниже рынка, но не падай до абсурда.

Главная мысль:
Фриланс — это марафон. Сегодня ты создаёшь профиль, через пару месяцев у тебя уже отзывы и портфолио.`,
      en: `Freelancing is a set of skills: communication, reliability, avoiding burnout while earning.

1. Set up your profile

Avatar: your face or a neat neutral image.
Description: who you are and what you do in 2-4 sentences.
Skills: technologies, areas.
Work examples: even 2-3 pieces are better than an empty profile.

2. Choose 1-2 areas

Don't spread yourself thin. Choose what you can really do with quality.

3. Set prices

Goal at start — get first successful projects. Set price slightly below market, but don't go absurdly low.

Key takeaway:
Freelancing is a marathon. Today you create a profile, in a couple of months you'll have reviews and a portfolio.`
    }
  },
  {
    id: 2,
    title: {
      ru: 'Как получить первый заказ',
      en: 'How to Get Your First Order'
    },
    content: {
      ru: `Первый заказ кажется невозможным. Но есть схема, которая работает.

1. Временная скидка

Цена на 20–30% ниже рынка. Откровенно напиши: набираешь первые отзывы. После 3–5 сделок — поднимаешь прайс.

2. Живые отклики

Не шаблоны. Перескажи задачу своими словами, опиши план в 2–3 пунктах, дай пример работы.

3. Маленький бонус

«Сделаю одну правку бесплатно», «Запишу видео с объяснением», «Адаптация под мобильные как бонус».

4. Реагируй быстро

Отвечай на запросы в течение часа. Клиенту важно видеть живого исполнителя.

Главная мысль:
Первые заказы — самые сложные. Но как только появляется первый отзыв, дальше легче.`,
      en: `The first order seems impossible. But there's a strategy that works.

1. Temporary discount

Price 20-30% below market. Be honest: collecting first reviews. After 3-5 deals — raise prices.

2. Personalized proposals

Not templates. Rephrase the task, describe plan in 2-3 points, give work example.

3. Small bonus

"One free revision", "Video explanation", "Mobile adaptation as bonus".

4. Respond quickly

Reply to requests within an hour. Clients want to see a live contractor.

Key takeaway:
First orders are hardest. But once the first review appears, it gets easier.`
    }
  },
  {
    id: 3,
    title: {
      ru: 'Как общаться с клиентами',
      en: 'How to Communicate with Clients'
    },
    content: {
      ru: `Клиент запоминает не только результат, но и опыт работы с тобой.

1. Пиши коротко и структурно

Короткие абзацы, главный вопрос в начале, используй списки.

2. Уточняющие вопросы — это профессионально

«Какой приоритет: скорость или качество?», «Есть примеры, которые нравятся?»

3. Держи в курсе

Отправляй короткие обновления: «Сделал первую часть», «Остался дизайн — выложу завтра».

4. Не обещай то, что не уверен

Лучше согласовать реалистичный срок, чем облажаться в последний момент.

5. Контролируй эмоции

Оставайся спокойным, даже если клиент бесит. Профессионал держит себя в руках.

Главная мысль:
Клиент платит за комфорт в общении. Вовремя отвечаешь и не создаёшь нервотрёпку — будут возвращаться.`,
      en: `Clients remember not only the result but also working with you.

1. Write short and structured

Short paragraphs, main question first, use lists.

2. Clarifying questions are professional

"Priority: speed or quality?", "Any examples you like?"

3. Keep informed

Send short updates: "Finished first part", "Design remains — will post tomorrow".

4. Don't promise what you're not sure of

Better to agree on realistic deadline than fail at last moment.

5. Control emotions

Stay calm even if client is annoying. Professional keeps composure.

Key takeaway:
Client pays for comfortable communication. Respond on time and don't create stress — they'll return.`
    }
  },
  {
    id: 4,
    title: {
      ru: 'Как оформлять услугу',
      en: 'How to Present Your Service'
    },
    content: {
      ru: `Карточка услуги — это твой мини-магазин. Клиент решает за пару секунд: остаться или пролистать.

1. Название — максимально простое

«Сделаю лендинг на React», «Смонтирую видео для TikTok». Человек должен сразу понять, что ты предлагаешь.

2. Описание — 3–5 предложений

Что делаешь, для кого, какой результат. Без воды.

3. Преимущества

«Быстро отвечаю», «Делаю правки до результата», «Объясняю просто».

4. Пакеты: базовый, стандарт, премиум

Клиент выбирает по бюджету, а не просто «да/нет».

Главная мысль:
Человек должен понять твою услугу за 5 секунд: что делаешь, сколько стоит, чем отличаешься.`,
      en: `Service card is your mini-store. Client decides in seconds: stay or scroll.

1. Title — maximally simple

"Build React landing page", "Edit TikTok video". Person should immediately understand what you offer.

2. Description — 3-5 sentences

What you do, for whom, what result. No fluff.

3. Advantages

"Quick responses", "Revisions until done", "Explain simply".

4. Packages: basic, standard, premium

Client chooses by budget, not just "yes/no".

Key takeaway:
Person should understand your service in 5 seconds: what you do, how much, why you.`
    }
  },
  {
    id: 5,
    title: {
      ru: 'Как сделать крутое портфолио',
      en: 'How to Build Great Portfolio'
    },
    content: {
      ru: `Портфолио — это витрина, а не свалка работ.

1. Выбери 3–6 лучших работ

Убери всё слабое и старое. Оставь только то, что не стыдно показать.

2. Нормальные скриншоты

Без лишних вкладок, уведомлений. Одинаковый размер и формат.

3. Описывай не только что, но и зачем

Задача → Что сделал → Результат. Это мини-история.

4. Нет коммерческих работ — делай учебные

Придумай условного клиента, сделай работу как для реального заказа. Честно подпиши: «Учебная работа».

Главная мысль:
Лучше 3–4 сильных кейса, чем 15 «как попало». Портфолио — твой главный аргумент.`,
      en: `Portfolio is a showcase, not a dump of works.

1. Choose 3-6 best works

Remove all weak and old. Keep only what you're not ashamed to show.

2. Proper screenshots

No extra tabs, notifications. Same size and format.

3. Describe not only what, but why

Task → What you did → Result. It's a mini-story.

4. No commercial works — do practice ones

Invent a fictional client, do work as for real order. Honestly label: "Practice work".

Key takeaway:
Better 3-4 strong cases than 15 "any which way". Portfolio is your main argument.`
    }
  },
  {
    id: 6,
    title: {
      ru: 'Как устроить цены',
      en: 'How to Set Prices'
    },
    content: {
      ru: `Цена — это сигнал: кто ты и какой уровень даёшь.

1. Привяжи цену к опыту

Новичок → ниже рынка. Средний → рынок. Профи → выше рынка с аргументацией.

2. Раздели по размерам

~$10 — мини-задача.
$30–50 — средняя задача.
$100+ — крупный проект.

3. Доп.опции и апселлы

«Срочное выполнение», «Дополнительные правки», «Полный пакет» — за отдельную плату.

4. Не застревай в демпинге

Низкая цена — инструмент набрать отзывы. Как появятся заказы и оценки — поднимай прайс.

Главная мысль:
Цена должна быть понятной и честной. Уважай своё время — и клиенты будут уважать.`,
      en: `Price is a signal: who you are and what level you provide.

1. Tie price to experience

Beginner → below market. Average → market. Pro → above market with justification.

2. Divide by size

~$10 — mini-task.
$30–50 — medium task.
$100+ — large project.

3. Add-ons and upsells

"Rush delivery", "Extra revisions", "Full package" — separate fee.

4. Don't get stuck in dumping

Low price — tool to collect reviews. Once orders and ratings appear — raise prices.

Key takeaway:
Price should be clear and honest. Respect your time — and clients will respect it.`
    }
  },
  {
    id: 7,
    title: {
      ru: 'Как работать через TaskHub',
      en: 'How to Work via TaskHub'
    },
    content: {
      ru: `TaskHub — твоя рабочая площадка.

1. Настрой профиль и ищи задания

Заполни профиль, отфильтруй задания по направлениям, откликайся на те, что можешь выполнить качественно.

2. Безопасная сделка

Клиент вносит оплату → деньги резервируются → после сдачи работы и подтверждения клиента → средства на твой баланс.

3. Внутренняя валюта

Оплаты попадают на баланс TaskHub. Оттуда выводишь на платёжные системы.

4. Общение — только через платформу

Все договорённости и файлы фиксируй в чате. В случае спора модерация видит историю.

5. Проблемы и споры

Не паниковать. Спокойно объясни ситуацию в чате. Не помогает — открываешь спор с подробным описанием.

Главная мысль:
Работать через TaskHub — значит использовать защиту платформы. Не выводить коммуникацию и оплату «в сторону».`,
      en: `TaskHub is your work platform.

1. Set up profile and find tasks

Fill profile, filter tasks by area, respond to those you can quality complete.

2. Secure deal

Client deposits payment → funds reserved → after work delivery and client confirmation → funds to your balance.

3. Internal currency

Payments go to TaskHub balance. From there withdraw to payment systems.

4. Communication — only via platform

Fix all agreements and files in chat. In case of dispute, moderation sees history.

5. Problems and disputes

Don't panic. Calmly explain situation in chat. Doesn't help — open dispute with detailed description.

Key takeaway:
Working via TaskHub means using platform protection. Don't take communication and payment "outside".`
    }
  },
  {
    id: 8,
    title: {
      ru: 'Как не попадать на мошенников',
      en: 'How to Avoid Scammers'
    },
    content: {
      ru: `Твои нервы, время и деньги дороже любого «супервыгодного» предложения.

1. Не выходи из платформы

Общение — в чате TaskHub. Оплата — через безопасную сделку. Файлы — через платформу.

2. Не отправляй полноценную работу без оплаты

Покажи превью (с водяным знаком). Полный файл — после оплаты.

3. Осторожно со ссылками и файлами

Не переходи по странным ссылкам, не скачивай подозрительные архивы.

4. Не принимай оплату напрямую

«Чуть больше, но на карту» — такие схемы лишают защиты платформы.

5. Не отправляй личные данные

Настоящему клиенту не нужны фото паспорта, сканы карты, коды из SMS.

6. Узнавай токсичных клиентов

Постоянное давление, оскорбления, фразы вроде «это фигня работа» — лучше попрощаться.

Главная мысль:
Безопасность — это привычка. Пара простых правил снижает риски и оставляет время на нормальных клиентов.`,
      en: `Your nerves, time and money are worth more than any "super profitable" offer.

1. Don't leave the platform

Communication — in TaskHub chat. Payment — via secure deal. Files — via platform.

2. Don't send full work without payment

Show preview (with watermark). Full file — after payment.

3. Careful with links and files

Don't click strange links, don't download suspicious archives.

4. Don't accept direct payment

"Slightly more but to card" — such schemes remove platform protection.

5. Don't send personal data

Real client doesn't need passport photos, card scans, SMS codes.

6. Recognize toxic clients

Constant pressure, insults, phrases like "this is crap work" — better to say goodbye.

Key takeaway:
Security is a habit. A couple simple rules reduce risks and leave time for normal clients.`
    }
  },
  {
    id: 9,
    title: {
      ru: 'Как выполнять работу быстро и качественно',
      en: 'How to Deliver Work Fast and Quality'
    },
    content: {
      ru: `Скорость без качества не нужна. Качество без сроков — тоже. Нужен баланс.

1. Сначала черновик — потом детали

Покажи структуру, план. После одобрения — уходи в глубину.

2. Делай мини-отчёты

«Сегодня сделал это, завтра возьмусь за это». Снижает тревогу клиента.

3. Не стартуй без вводных

Собери все материалы: тексты, логотипы, доступы. Уточни спорное. Только потом начинай.

4. Работай блоками 40–60 минут

Таймер на 40–60 минут фокуса, затем перерыв 5–10 минут.

5. Держи чистоту

В коде — понятные имена, структура. В дизайне — порядок в слоях. В текстах — структура и читабельность.

Главная мысль:
Люди возвращаются за качеством. А качество — это внимание к мелочам, стабильный процесс и уважение к срокам.`,
      en: `Speed without quality is useless. Quality without deadlines too. Need balance.

1. Draft first — details later

Show structure, plan. After approval — go into depth.

2. Make mini-reports

"Today did this, tomorrow will do that". Reduces client anxiety.

3. Don't start without inputs

Collect all materials: texts, logos, access. Clarify unclear. Only then start.

4. Work in 40-60 minute blocks

Timer for 40-60 minutes focus, then 5-10 minute break.

5. Keep it clean

In code — clear names, structure. In design — layer order. In texts — structure and readability.

Key takeaway:
People return for quality. Quality is attention to details, stable process and respect for deadlines.`
    }
  },
  {
    id: 10,
    title: {
      ru: 'Как получить постоянных клиентов',
      en: 'How to Get Regular Clients'
    },
    content: {
      ru: `Самое ценное во фрилансе — люди, которые возвращаются снова и снова.

1. Всегда держи слово

Обещал срок — уложись. Не успеваешь — предупреди заранее. Клиенты ценят предсказуемость.

2. Делай чуть больше

Дополнительный вариант, мелкая доработка, короткое пояснительное видео. Создаёт ощущение заботы.

3. Общайся уважительно

Даже когда сложно. Фокусируйся на решении, а не на выяснении, кто правее.

4. Отмечай старых клиентов

Небольшая скидка, приоритет в задачах, абонемент. Лояльность должна иметь смысл.

5. Предлагай идеи

Не просто выполняй команды. Предлагай улучшения, помогай бизнесу клиента расти.

Главная мысль:
Постоянные клиенты — результат того, как ты работаешь, общаешься и держишь сроки. Выстраивай нормальные отношения.`,
      en: `Most valuable in freelancing — people who return again and again.

1. Always keep your word

Promised deadline — meet it. Can't make it — warn in advance. Clients value predictability.

2. Do a bit more

Extra variant, small improvement, short explanation video. Creates sense of care.

3. Communicate respectfully

Even when difficult. Focus on solution, not on who's more right.

4. Mark old clients

Small discount, priority in tasks, subscription. Loyalty should make sense.

5. Suggest ideas

Don't just execute commands. Suggest improvements, help client's business grow.

Key takeaway:
Regular clients — result of how you work, communicate and meet deadlines. Build normal relationships.`
    }
  }
];
