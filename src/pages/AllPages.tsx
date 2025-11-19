import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ArrowUpRight, ArrowDownLeft, CreditCard, Briefcase, FileText, Star, Bell, Heart, AlertTriangle, User, Lock, Settings as SettingsIcon, Wallet, Shield, Users, BarChart3, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const pageVariants = { initial: { opacity: 0, y: 16 }, in: { opacity: 1, y: 0 }, out: { opacity: 0, y: -16 } };
const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

export function DealPage() {
  const deal = {
    id: 1, title: 'Лендинг на React', price: 650, status: 'in_progress', progress: 60,
    client: 'NovaTech', freelancer: 'Mickey', deadline: '2025-11-15', milestones: [
      { id: 1, title: 'Верстка главной', status: 'completed', price: 200 },
      { id: 2, title: 'Интеграция API', status: 'in_progress', price: 250 },
      { id: 3, title: 'Тестирование', status: 'pending', price: 200 }
    ]
  };

  return (
    <motion.div key="deal" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-background">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold mb-6">Сделка #{deal.id}</h1>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader><CardTitle>{deal.title}</CardTitle></CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-[#EFFFF8]">
                  <span>Прогресс</span>
                  <Badge variant="secondary">{deal.progress}%</Badge>
                </div>
                <div className="space-y-3">
                  {deal.milestones.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className={`h-5 w-5 ${m.status === 'completed' ? 'text-green-500' : 'text-gray-300'}`} />
                        <div>
                          <div className="font-medium">{m.title}</div>
                          <div className="text-sm text-[#3F7F6E]">${m.price}</div>
                        </div>
                      </div>
                      <Badge variant={m.status === 'completed' ? 'default' : 'secondary'}>{m.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Информация</CardTitle></CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex justify-between"><span className="text-[#3F7F6E]">Клиент</span><span>{deal.client}</span></div>
              <div className="flex justify-between"><span className="text-[#3F7F6E]">Фрилансер</span><span>{deal.freelancer}</span></div>
              <div className="flex justify-between"><span className="text-[#3F7F6E]">Сумма</span><span className="font-semibold">${deal.price}</span></div>
              <div className="flex justify-between"><span className="text-[#3F7F6E]">Дедлайн</span><span>{deal.deadline}</span></div>
              <Button className="w-full mt-4">Открыть спор</Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </motion.div>
  );
}

export function WalletPage() {
  const balance = 2450;
  const transactions = [
    { id: 1, type: 'income', amount: 650, description: 'Лендинг на React', date: '2025-10-25' },
    { id: 2, type: 'outcome', amount: 50, description: 'Комиссия платформы', date: '2025-10-25' },
    { id: 3, type: 'income', amount: 950, description: 'Редизайн приложения', date: '2025-10-20' }
  ];

  return (
    <motion.div key="wallet" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-background">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold mb-6">Кошелёк</h1>
        <div className="grid gap-6">
          <Card className="bg-gradient-to-br from-[#6FE7C8] to-[#3F7F6E] text-white">
            <CardContent className="p-8">
              <div className="text-sm opacity-80 mb-2">Доступный баланс</div>
              <div className="text-4xl font-bold mb-6">${balance.toFixed(2)}</div>
              <div className="flex gap-3">
                <Button variant="secondary">Вывести</Button>
                <Button variant="outline" className="text-white border-white hover:bg-white/10">Пополнить</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>История транзакций</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {t.type === 'income' ? <ArrowDownLeft className="h-5 w-5 text-green-500" /> : <ArrowUpRight className="h-5 w-5 text-red-500" />}
                    <div>
                      <div className="font-medium">{t.description}</div>
                      <div className="text-sm text-[#3F7F6E]">{t.date}</div>
                    </div>
                  </div>
                  <div className={`font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'}${t.amount}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </motion.div>
  );
}

export function TalentsPage() {
  const talents = [
    { id: 1, name: 'Mickey', avatar: 'https://i.pravatar.cc/64?img=49', skills: ['React', 'Node', 'Unity'], rating: 4.9, rate: '$20-35/час' },
    { id: 2, name: 'Nova', avatar: 'https://i.pravatar.cc/64?img=15', skills: ['UX', 'Figma', 'Design'], rating: 4.8, rate: '$30-50/час' }
  ];

  return (
    <motion.div key="talents" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-background">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold mb-6">Каталог исполнителей</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {talents.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-6 grid gap-4 text-center">
                <img src={t.avatar} alt={t.name} className="h-20 w-20 rounded-full object-cover mx-auto" />
                <div>
                  <div className="font-semibold text-lg">{t.name}</div>
                  <div className="text-sm text-[#3F7F6E] flex items-center justify-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{t.rating}</div>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">{t.skills.map(s => <Badge key={s} variant="outline">{s}</Badge>)}</div>
                <div className="text-sm font-medium">{t.rate}</div>
                <Button>Посмотреть профиль</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

export function NotificationsPage() {
  const notifications = [
    { id: 1, text: 'NovaTech принял ваш отклик', time: '5 минут назад', unread: true },
    { id: 2, text: 'Новое сообщение от AppNest', time: '1 час назад', unread: true },
    { id: 3, text: 'Платёж получен: $650', time: 'Вчера', unread: false }
  ];

  return (
    <motion.div key="notifications" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-background">
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold mb-6">Уведомления</h1>
        <div className="grid gap-3">
          {notifications.map((n) => (
            <Card key={n.id} className={n.unread ? 'bg-[#EFFFF8]' : ''}>
              <CardContent className="p-4 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-[#6FE7C8] mt-1" />
                  <div>
                    <div className="font-medium">{n.text}</div>
                    <div className="text-sm text-[#3F7F6E]">{n.time}</div>
                  </div>
                </div>
                {n.unread && <div className="h-2 w-2 rounded-full bg-[#6FE7C8]" />}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

export function SavedPage() {
  const saved = [
    { id: 1, type: 'order', title: 'Лендинг на React для стартапа', price: '$500-900' },
    { id: 2, type: 'task', title: 'Unity 2D кооп на Photon', price: '$900' }
  ];

  return (
    <motion.div key="saved" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-background">
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold mb-6">Сохранённые</h1>
        <div className="grid gap-4">
          {saved.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <Badge variant="secondary" className="mb-2">{s.type === 'order' ? 'Заказ' : 'Task'}</Badge>
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-sm text-[#3F7F6E]">{s.price}</div>
                </div>
                <Button>Открыть</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

export function DisputesPage() {
  const disputes = [
    { id: 1, title: 'Сделка #123', status: 'open', date: '2025-10-26' }
  ];

  return (
    <motion.div key="disputes" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-background">
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold mb-6">Споры</h1>
        <div className="grid gap-4">
          {disputes.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{d.title}</div>
                  <div className="text-sm text-[#3F7F6E]">Открыт: {d.date}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="destructive">Открыт</Badge>
                  <Button size="sm">Подробнее</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

export function MyOrdersPage() {
  const orders = [
    { id: 1, title: 'Unity прототип', status: 'active', proposals: 5, date: '2025-10-20' },
    { id: 2, title: 'Лого для стартапа', status: 'completed', proposals: 12, date: '2025-10-10' }
  ];

  return (
    <motion.div key="my-orders" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-background">
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold mb-6">Мои заказы</h1>
        <div className="grid gap-4">
          {orders.map((o) => (
            <Card key={o.id}>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{o.title}</div>
                  <div className="text-sm text-[#3F7F6E]">{o.proposals} откликов • {o.date}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={o.status === 'active' ? 'secondary' : 'default'}>{o.status === 'active' ? 'Активен' : 'Завершён'}</Badge>
                  <Button size="sm">Открыть</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

export function MyDealsPage() {
  const deals = [
    { id: 1, title: 'Лендинг на React', status: 'in_progress', price: 650, client: 'NovaTech' },
    { id: 2, title: 'Редизайн приложения', status: 'completed', price: 950, client: 'AppNest' }
  ];

  return (
    <motion.div key="my-deals" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-background">
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold mb-6">Мои сделки</h1>
        <div className="grid gap-4">
          {deals.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{d.title}</div>
                  <div className="text-sm text-[#3F7F6E]">Клиент: {d.client} • ${d.price}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={d.status === 'in_progress' ? 'secondary' : 'default'}>{d.status === 'in_progress' ? 'В работе' : 'Завершена'}</Badge>
                  <Button size="sm">Открыть</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

export function SettingsProfilePage() {
  return (
    <motion.div key="settings-profile" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-background">
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold mb-6">Настройки профиля</h1>
        <Card>
          <CardContent className="p-6 grid gap-4">
            <div className="grid gap-2"><label className="text-sm font-medium">Имя</label><Input defaultValue="Mickey" /></div>
            <div className="grid gap-2"><label className="text-sm font-medium">Email</label><Input type="email" defaultValue="mickey@example.com" /></div>
            <div className="grid gap-2"><label className="text-sm font-medium">Телефон</label><Input defaultValue="+7 777 123 4567" /></div>
            <Button>Сохранить изменения</Button>
          </CardContent>
        </Card>
      </section>
    </motion.div>
  );
}

export function SettingsSecurityPage() {
  return (
    <motion.div key="settings-security" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-background">
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold mb-6">Безопасность</h1>
        <Card>
          <CardContent className="p-6 grid gap-4">
            <div className="grid gap-2"><label className="text-sm font-medium">Текущий пароль</label><Input type="password" /></div>
            <div className="grid gap-2"><label className="text-sm font-medium">Новый пароль</label><Input type="password" /></div>
            <div className="grid gap-2"><label className="text-sm font-medium">Подтвердите пароль</label><Input type="password" /></div>
            <Button>Изменить пароль</Button>
          </CardContent>
        </Card>
      </section>
    </motion.div>
  );
}

export function OnboardingPage() {
  return (
    <motion.div key="onboarding" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-2xl w-full px-4">
        <h1 className="text-3xl font-bold text-center mb-4">Добро пожаловать!</h1>
        <p className="text-center text-[#3F7F6E] mb-8">Выберите свою роль на платформе</p>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-8 text-center grid gap-4">
              <Briefcase className="h-12 w-12 mx-auto text-[#6FE7C8]" />
              <div className="font-bold text-xl">Я фрилансер</div>
              <p className="text-sm text-[#3F7F6E]">Ищу проекты и хочу предлагать свои услуги</p>
              <Button>Продолжить</Button>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-8 text-center grid gap-4">
              <Users className="h-12 w-12 mx-auto text-[#6FE7C8]" />
              <div className="font-bold text-xl">Я заказчик</div>
              <p className="text-sm text-[#3F7F6E]">Ищу исполнителей для своих проектов</p>
              <Button>Продолжить</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

export function AdminPage() {
  return (
    <motion.div key="admin" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-background">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold mb-6">Админ-панель</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card><CardContent className="p-6"><div className="text-sm text-[#3F7F6E] mb-1">Пользователей</div><div className="text-2xl font-bold">1,234</div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="text-sm text-[#3F7F6E] mb-1">Заказов</div><div className="text-2xl font-bold">456</div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="text-sm text-[#3F7F6E] mb-1">Сделок</div><div className="text-2xl font-bold">789</div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="text-sm text-[#3F7F6E] mb-1">Оборот</div><div className="text-2xl font-bold">$45K</div></CardContent></Card>
        </div>
      </section>
    </motion.div>
  );
}

export function TermsPage() {
  const [htmlContent, setHtmlContent] = React.useState('');

  React.useEffect(() => {
    fetch('/src/assets/legal/terms.html')
      .then(res => res.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const body = doc.body.innerHTML;
        setHtmlContent(body);
      })
      .catch(err => console.error('Error loading terms:', err));
  }, []);

  return (
    <motion.div key="terms" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-gradient-to-b from-[#EFFFF8]/30 to-background">
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <Card className="shadow-lg border-[#6FE7C8]/20">
          <CardContent className="p-8 md:p-12">
            <div
              className="legal-content prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </CardContent>
        </Card>
      </section>
    </motion.div>
  );
}

export function PrivacyPage() {
  const [htmlContent, setHtmlContent] = React.useState('');

  React.useEffect(() => {
    fetch('/src/assets/legal/privacy.html')
      .then(res => res.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const body = doc.body.innerHTML;
        setHtmlContent(body);
      })
      .catch(err => console.error('Error loading privacy:', err));
  }, []);

  return (
    <motion.div key="privacy" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-gradient-to-b from-[#EFFFF8]/30 to-background">
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <Card className="shadow-lg border-[#6FE7C8]/20">
          <CardContent className="p-8 md:p-12">
            <div
              className="legal-content prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </CardContent>
        </Card>
      </section>
    </motion.div>
  );
}

export function PaymentsPage() {
  const [htmlContent, setHtmlContent] = React.useState('');

  React.useEffect(() => {
    fetch('/src/assets/legal/payments.html')
      .then(res => res.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const body = doc.body.innerHTML;
        setHtmlContent(body);
      })
      .catch(err => console.error('Error loading payments:', err));
  }, []);

  return (
    <motion.div key="payments" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-gradient-to-b from-[#EFFFF8]/30 to-background">
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <Card className="shadow-lg border-[#6FE7C8]/20">
          <CardContent className="p-8 md:p-12">
            <div
              className="legal-content prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </CardContent>
        </Card>
      </section>
    </motion.div>
  );
}

export function FAQPage() {
  const faqs = [
    { q: 'Как начать работу на платформе?', a: 'Зарегистрируйтесь, заполните профиль и начните искать проекты или публикуйте свои услуги.' },
    { q: 'Какая комиссия платформы?', a: 'На старте платформа работает с 0% комиссией. В будущем комиссия составит 5-10%.' },
    { q: 'Как защищены платежи?', a: 'Все платежи проходят через эскроу-кошелёк, что гарантирует безопасность сделок.' }
  ];

  return (
    <motion.div key="faq" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-background">
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mb-6">Часто задаваемые вопросы</h1>
        <div className="grid gap-4">
          {faqs.map((faq, i) => (
            <Card key={i}>
              <CardHeader><CardTitle className="text-lg">{faq.q}</CardTitle></CardHeader>
              <CardContent><p className="text-[#3F7F6E]">{faq.a}</p></CardContent>
            </Card>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

export function ContactPage() {
  return (
    <motion.div key="contact" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-gradient-to-b from-[#EFFFF8]/30 to-background">
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Свяжитесь с нами</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Есть вопросы или предложения? Мы всегда рады помочь!
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow border-[#6FE7C8]/20">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-16 w-16 bg-[#E6F7F2] rounded-full flex items-center justify-center">
                  <svg className="h-8 w-8 text-[#3F7F6E]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Telegram</h3>
                  <p className="text-sm text-gray-600 mb-4">Быстрая поддержка в мессенджере</p>
                  <Button asChild className="w-full">
                    <a href="https://t.me/freelancehub_support" target="_blank" rel="noopener noreferrer">
                      Написать
                    </a>
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">@freelancehub_support</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-[#6FE7C8]/20">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-16 w-16 bg-[#E6F7F2] rounded-full flex items-center justify-center">
                  <svg className="h-8 w-8 text-[#3F7F6E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Email</h3>
                  <p className="text-sm text-gray-600 mb-4">Отправьте нам письмо</p>
                  <Button asChild className="w-full bg-[#6FE7C8] hover:bg-[#5DD6B7] text-gray-900">
                    <a href="mailto:support@freelancehub.com">
                      Написать
                    </a>
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">support@freelancehub.com</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#6FE7C8]/20">
          <CardHeader className="px-6 sm:px-8">
            <CardTitle className="text-2xl">Отправить сообщение</CardTitle>
            <p className="text-sm text-gray-600">Мы ответим в течение 24 часов</p>
          </CardHeader>
          <CardContent className="grid gap-6 px-6 sm:px-8 pb-8">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-900">Ваше имя</label>
              <Input placeholder="Как вас зовут?" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-900">Email для связи</label>
              <Input type="email" placeholder="your@email.com" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-900">Сообщение</label>
              <textarea
                rows={6}
                className="rounded-lg border border-gray-300 px-4 py-3 bg-white focus:border-[#6FE7C8] focus:ring-2 focus:ring-[#6FE7C8]/20 outline-none transition-colors resize-none"
                placeholder="Опишите ваш вопрос или предложение..."
              />
            </div>
            <Button className="w-full sm:w-auto">Отправить сообщение</Button>
          </CardContent>
        </Card>
      </section>
    </motion.div>
  );
}

export function NotFoundPage() {
  return (
    <motion.div key="404" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl text-[#3F7F6E] mb-6">Страница не найдена</p>
        <Button asChild><a href="#/">Вернуться на главную</a></Button>
      </div>
    </motion.div>
  );
}
