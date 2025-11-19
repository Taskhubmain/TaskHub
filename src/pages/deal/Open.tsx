import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const pageVariants = { initial: { opacity: 0, y: 16 }, in: { opacity: 1, y: 0 }, out: { opacity: 0, y: -16 } };
const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

export default function DealOpen() {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [milestones, setMilestones] = useState<Array<{ title: string; amount: string }>>([
    { title: '', amount: '' }
  ]);

  const params = new URLSearchParams(window.location.hash.split('?')[1]);
  const type = params.get('type') || 'order';
  const id = params.get('id') || '1';

  const handleAddMilestone = () => {
    setMilestones([...milestones, { title: '', amount: '' }]);
  };

  const handleConfirm = () => {
    console.log('Deal opened:', { type, id, amount, milestones });
    alert('Сделка открыта (демо)');
    window.location.hash = `/deal/${Date.now()}`;
  };

  return (
    <motion.div
      key="deal-open"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen bg-background"
    >
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold mb-6">Открыть сделку</h1>

        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${step >= s ? 'bg-[#6FE7C8] text-white' : 'bg-gray-200 text-[#3F7F6E]'}`}>
                {s}
              </div>
              {s < 4 && <div className={`w-16 h-1 ${step > s ? 'bg-[#6FE7C8]' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Проверка участников</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#EFFFF8]">
                <CheckCircle className="h-5 w-5 text-[#6FE7C8]" />
                <div>
                  <div className="font-semibold">Заказчик: NovaTech</div>
                  <div className="text-sm text-[#3F7F6E]">Рейтинг: 4.8</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#EFFFF8]">
                <CheckCircle className="h-5 w-5 text-[#6FE7C8]" />
                <div>
                  <div className="font-semibold">Исполнитель: Mickey</div>
                  <div className="text-sm text-[#3F7F6E]">Рейтинг: 4.9</div>
                </div>
              </div>
              <Button onClick={() => setStep(2)} className="w-full">
                Продолжить
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Сумма и этапы</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Общая сумма (USD)</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="650"
                  required
                  className="h-11"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Этапы (опционально)</label>
                {milestones.map((m, idx) => (
                  <div key={idx} className="grid sm:grid-cols-2 gap-2 mb-2">
                    <Input
                      placeholder="Название этапа"
                      value={m.title}
                      onChange={(e) => {
                        const updated = [...milestones];
                        updated[idx].title = e.target.value;
                        setMilestones(updated);
                      }}
                      className="h-10"
                    />
                    <Input
                      type="number"
                      placeholder="Сумма"
                      value={m.amount}
                      onChange={(e) => {
                        const updated = [...milestones];
                        updated[idx].amount = e.target.value;
                        setMilestones(updated);
                      }}
                      className="h-10"
                    />
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={handleAddMilestone}>
                  Добавить этап
                </Button>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(1)}>Назад</Button>
                <Button onClick={() => setStep(3)} className="flex-1">
                  Продолжить
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Способ оплаты</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3">
                <div className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-[#6FE7C8]">
                  <CreditCard className="h-5 w-5 text-[#6FE7C8]" />
                  <div>
                    <div className="font-semibold">Кошелёк TaskHub</div>
                    <div className="text-sm text-[#3F7F6E]">Баланс: $2,450</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-[#6FE7C8]">
                  <CreditCard className="h-5 w-5 text-[#6FE7C8]" />
                  <div className="font-semibold">Банковская карта</div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(2)}>Назад</Button>
                <Button onClick={() => setStep(4)} className="flex-1">
                  Продолжить
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Подтверждение</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="p-4 rounded-lg bg-[#EFFFF8]">
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#3F7F6E]">Тип:</span>
                    <Badge>{type === 'order' ? 'Заказ' : 'Объявление'}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#3F7F6E]">ID:</span>
                    <span className="font-semibold">#{id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#3F7F6E]">Сумма:</span>
                    <span className="font-semibold">${amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#3F7F6E]">Этапов:</span>
                    <span className="font-semibold">{milestones.filter(m => m.title).length}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-[#3F7F6E]">
                Средства будут заморожены на эскроу-счёте до завершения работы. Комиссия платформы: 5%.
              </p>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(3)}>Назад</Button>
                <Button onClick={handleConfirm} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Подтвердить и открыть сделку
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </motion.div>
  );
}
