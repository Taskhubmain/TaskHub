import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getSupabase } from '@/lib/supabaseClient';

interface OpenDisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  orderId?: string;
  taskId?: string;
  userId: string;
  onSuccess?: () => void;
}

export default function OpenDisputeDialog({
  open,
  onOpenChange,
  dealId,
  orderId,
  taskId,
  userId,
  onSuccess
}: OpenDisputeDialogProps) {
  const [loading, setLoading] = useState(false);
  const supabase = getSupabase();

  const handleOpenDispute = async () => {
    try {
      setLoading(true);

      const { data: disputeData, error: disputeError } = await supabase
        .from('disputes')
        .insert({
          deal_id: dealId,
          order_id: orderId || null,
          task_id: taskId || null,
          opened_by: userId,
          status: 'open'
        })
        .select()
        .single();

      if (disputeError) throw disputeError;

      const { error: dealError } = await supabase
        .from('deals')
        .update({ status: 'disputed' })
        .eq('id', dealId);

      if (dealError) throw dealError;

      onOpenChange(false);
      if (onSuccess) onSuccess();

      window.location.hash = `/dispute/${disputeData.id}`;
    } catch (error) {
      console.error('Error opening dispute:', error);
      alert('Ошибка при открытии спора. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Открыть спор
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <p>Вы уверены, что хотите открыть спор по этой сделке?</p>
            <p className="text-sm">
              После открытия спора:
            </p>
            <ul className="text-sm list-disc list-inside space-y-1">
              <li>Сделка будет поставлена на паузу</li>
              <li>Администрация рассмотрит ситуацию</li>
              <li>Средства будут переданы одной из сторон после разбирательства</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            onClick={handleOpenDispute}
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Открытие...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Открыть спор
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
