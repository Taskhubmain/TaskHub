import React, { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getSupabase } from '@/lib/supabaseClient';

interface ReportUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId: string;
  reportedUserName: string;
  reporterId: string;
  chatId?: string;
  onSuccess?: () => void;
}

export default function ReportUserDialog({
  open,
  onOpenChange,
  reportedUserId,
  reportedUserName,
  reporterId,
  chatId,
  onSuccess
}: ReportUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const supabase = getSupabase();

  const reasons = [
    'Спам или мошенничество',
    'Неуместное поведение',
    'Домогательство',
    'Нарушение условий использования',
    'Другое'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason || !description.trim()) {
      alert('Заполните все поля');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('complaints')
        .insert({
          reported_user_id: reportedUserId,
          reporter_id: reporterId,
          chat_id: chatId || null,
          reason,
          description: description.trim(),
          status: 'pending'
        });

      if (error) throw error;

      alert('Жалоба успешно отправлена');
      onOpenChange(false);
      setReason('');
      setDescription('');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error submitting complaint:', error);
      alert('Ошибка при отправке жалобы');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Пожаловаться на пользователя
          </DialogTitle>
          <DialogDescription>
            Вы подаете жалобу на пользователя <strong>{reportedUserName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Причина жалобы
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6FE7C8]"
              required
            >
              <option value="">Выберите причину</option>
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Описание проблемы
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#6FE7C8]"
              placeholder="Опишите подробности..."
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Отправка...
                </>
              ) : (
                'Отправить жалобу'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
