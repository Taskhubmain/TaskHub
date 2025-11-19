import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Star, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CryptoIcon, getCryptoLabel } from '@/components/ui/CryptoIcon';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -16 }
};

const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

interface PaymentMethod {
  id: string;
  type: 'CARD' | 'CRYPTO_TON' | 'CRYPTO_USDT' | 'CRYPTO_BTC';
  label: string;
  details: any;
  isDefault: boolean;
}

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'CARD',
      label: 'Visa •••• 4242',
      details: { last4: '4242', brand: 'Visa' },
      isDefault: true,
    },
  ]);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<PaymentMethod['type']>('CARD');
  const [label, setLabel] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  const handleAddMethod = () => {
    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      type: selectedType,
      label: label || (selectedType === 'CARD' ? `Card ••${cardNumber.slice(-4)}` : `${getCryptoLabel(selectedType)} Wallet`),
      details: selectedType === 'CARD' ? { last4: cardNumber.slice(-4) } : { address: walletAddress },
      isDefault: methods.length === 0,
    };

    setMethods([...methods, newMethod]);
    setAddDialogOpen(false);
    setLabel('');
    setCardNumber('');
    setWalletAddress('');
  };

  const handleDelete = (id: string) => {
    setMethods(methods.filter(m => m.id !== id));
  };

  const handleSetDefault = (id: string) => {
    setMethods(methods.map(m => ({ ...m, isDefault: m.id === id })));
  };

  return (
    <motion.div
      key="payment-methods"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen bg-background"
    >
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Платёжные методы</h1>
            <p className="text-muted-foreground">Управляйте способами оплаты и вывода средств</p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить метод
          </Button>
        </div>

        <div className="grid gap-4">
          {methods.map(method => (
            <Card key={method.id} className="relative">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-[#EFFFF8]">
                      <CryptoIcon type={method.type} className="h-6 w-6 text-[#3F7F6E]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{method.label}</h3>
                        {method.isDefault && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            По умолчанию
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getCryptoLabel(method.type)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!method.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                      >
                        <Star className="h-4 w-4 mr-1" />
                        По умолчанию
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(method.id)}
                      disabled={methods.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {methods.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Нет платёжных методов</h3>
                <p className="text-muted-foreground mb-4">
                  Добавьте карту или криптокошелёк для вывода средств
                </p>
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить первый метод
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2 text-blue-900">Поддерживаемые методы</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Банковские карты (Visa, Mastercard, МИР)</li>
              <li>• TON - криптовалюта The Open Network</li>
              <li>• USDT (TRC-20, ERC-20) - стейблкоин</li>
              <li>• Bitcoin - основная криптовалюта</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить платёжный метод</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Тип</label>
              <div className="grid grid-cols-2 gap-2">
                {(['CARD', 'CRYPTO_TON', 'CRYPTO_USDT', 'CRYPTO_BTC'] as const).map(type => (
                  <Button
                    key={type}
                    variant={selectedType === type ? 'default' : 'outline'}
                    onClick={() => setSelectedType(type)}
                    className="justify-start"
                  >
                    <CryptoIcon type={type} className="h-4 w-4 mr-2" />
                    {getCryptoLabel(type)}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Название (опционально)</label>
              <Input
                placeholder="Например: Основная карта"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            {selectedType === 'CARD' ? (
              <div>
                <label className="text-sm font-medium mb-2 block">Номер карты</label>
                <Input
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, ''))}
                  maxLength={16}
                />
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium mb-2 block">Адрес кошелька</label>
                <Input
                  placeholder={`Введите ${getCryptoLabel(selectedType)} адрес`}
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleAddMethod}
              disabled={selectedType === 'CARD' ? !cardNumber : !walletAddress}
            >
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
