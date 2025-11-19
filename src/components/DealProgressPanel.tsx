import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Send, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSupabase } from '../lib/supabaseClient';
import { ReviewInChat } from './ReviewInChat';

interface DealProgressPanelProps {
  dealId: string;
  userId: string;
  isFreelancer: boolean;
  chatId?: string;
  freelancerId?: string;
}

interface ProgressReport {
  id: string;
  progress_percentage: number;
  comment: string;
  created_at: string;
}

interface TaskItem {
  id: string;
  task_name: string;
  is_completed: boolean;
  order_index: number;
}

interface TimeExtension {
  id: string;
  reason: string;
  additional_days: number;
  status: string;
  created_at: string;
}

interface Deal {
  current_progress: number;
  last_progress_update: string | null;
  status: string;
  submitted_at: string | null;
  chat_id: string | null;
}

export default function DealProgressPanel({ dealId, userId, isFreelancer, chatId, freelancerId }: DealProgressPanelProps) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [progressReports, setProgressReports] = useState<ProgressReport[]>([]);
  const [taskItems, setTaskItems] = useState<TaskItem[]>([]);
  const [reportsExpanded, setReportsExpanded] = useState(false);
  const [tasksExpanded, setTasksExpanded] = useState(false);
  const [newProgress, setNewProgress] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [extensionReason, setExtensionReason] = useState('');
  const [extensionDays, setExtensionDays] = useState(1);
  const [showExtensionForm, setShowExtensionForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    loadData();
  }, [dealId]);

  const loadData = async () => {
    const supabase = getSupabase();

    const { data: dealData } = await supabase
      .from('deals')
      .select('current_progress, last_progress_update, status, submitted_at, chat_id')
      .eq('id', dealId)
      .maybeSingle();

    if (dealData) {
      setDeal(dealData);
      setNewProgress(dealData.current_progress || 0);
    }

    const { data: reports } = await supabase
      .from('deal_progress_reports')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false });

    if (reports) setProgressReports(reports);

    const { data: tasks } = await supabase
      .from('deal_task_items')
      .select('*')
      .eq('deal_id', dealId)
      .order('order_index', { ascending: true });

    if (tasks) setTaskItems(tasks);
  };

  const handleSubmitProgress = async () => {
    if (!newComment.trim()) {
      alert('Пожалуйста, добавьте комментарий');
      return;
    }

    setLoading(true);
    const supabase = getSupabase();

    const { error: reportError } = await supabase
      .from('deal_progress_reports')
      .insert({
        deal_id: dealId,
        progress_percentage: newProgress,
        comment: newComment,
        created_by: userId
      });

    if (reportError) {
      alert('Ошибка при сохранении отчета');
      setLoading(false);
      return;
    }

    const { error: dealError } = await supabase
      .from('deals')
      .update({
        current_progress: newProgress,
        last_progress_update: new Date().toISOString(),
        progress_reminder_sent: false
      })
      .eq('id', dealId);

    if (dealError) {
      alert('Ошибка при обновлении прогресса');
      setLoading(false);
      return;
    }

    setNewComment('');
    await loadData();
    setLoading(false);
    alert('Отчет успешно сохранен');
  };

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    const supabase = getSupabase();

    const { error } = await supabase
      .from('deal_task_items')
      .update({ is_completed: !currentStatus })
      .eq('id', taskId);

    if (!error) {
      await loadData();
    }
  };

  const handleRequestExtension = async () => {
    if (!extensionReason.trim()) {
      alert('Пожалуйста, укажите причину');
      return;
    }

    setLoading(true);
    const supabase = getSupabase();

    const { error } = await supabase
      .from('deal_time_extensions')
      .insert({
        deal_id: dealId,
        requested_by: userId,
        reason: extensionReason,
        additional_days: extensionDays
      });

    if (error) {
      alert('Ошибка при запросе продления');
      setLoading(false);
      return;
    }

    setExtensionReason('');
    setExtensionDays(1);
    setShowExtensionForm(false);
    setLoading(false);
    alert('Запрос на продление отправлен');
  };

  const handleSubmitForReview = async () => {
    if (newProgress !== 100) {
      alert('Перед отправкой на проверку установите прогресс 100%');
      return;
    }

    setLoading(true);
    const supabase = getSupabase();

    const targetChatId = chatId || deal?.chat_id;
    if (!targetChatId) {
      alert('Не найден чат для отправки уведомления');
      setLoading(false);
      return;
    }

    const { error: dealError } = await supabase
      .from('deals')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', dealId);

    if (dealError) {
      alert('Ошибка при отправке на проверку');
      setLoading(false);
      return;
    }

    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        chat_id: targetChatId,
        sender_id: userId,
        text: 'Заказ сдан на проверку, если работа выполнена - подтвердите завершение заказа.',
        is_system: true,
        system_type: 'deal_submitted'
      });

    if (messageError) {
      console.error('Ошибка при создании системного сообщения:', messageError);
    }

    await loadData();
    setLoading(false);
  };

  const handleAcceptWork = async () => {
    setLoading(true);
    const supabase = getSupabase();

    const targetChatId = chatId || deal?.chat_id;
    if (!targetChatId) {
      alert('Не найден чат для отправки уведомления');
      setLoading(false);
      return;
    }

    const { error: dealError } = await supabase
      .from('deals')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', dealId);

    if (dealError) {
      alert('Ошибка при подтверждении работы');
      setLoading(false);
      return;
    }

    // Освобождаем эскроу и переводим средства исполнителю
    const { data: escrowResult, error: escrowError } = await supabase
      .rpc('release_escrow_to_freelancer', {
        p_deal_id: dealId
      });

    if (escrowError) {
      console.error('Escrow release error:', escrowError);
      alert('Работа принята, но возникла ошибка при переводе средств. Обратитесь в поддержку.');
    } else if (escrowResult && !escrowResult.success) {
      console.error('Escrow release failed:', escrowResult.error);
      alert(`Работа принята, но перевод средств не выполнен: ${escrowResult.error}`);
    }

    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        chat_id: targetChatId,
        sender_id: userId,
        text: 'Работа подтверждена',
        is_system: true,
        system_type: 'work_accepted'
      });

    if (messageError) {
      console.error('Ошибка при создании системного сообщения:', messageError);
    }

    setShowAcceptDialog(false);
    setShowReviewForm(true);
    setLoading(false);
  };

  const handleRequestRevision = async () => {
    setLoading(true);
    const supabase = getSupabase();

    const targetChatId = chatId || deal?.chat_id;
    if (!targetChatId) {
      alert('Не найден чат для отправки уведомления');
      setLoading(false);
      return;
    }

    const { error: dealError } = await supabase
      .from('deals')
      .update({
        status: 'in_progress',
        review_requested_at: new Date().toISOString()
      })
      .eq('id', dealId);

    if (dealError) {
      alert('Ошибка при запросе доработки');
      setLoading(false);
      return;
    }

    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        chat_id: targetChatId,
        sender_id: userId,
        text: 'Запрошена доработка заказа',
        is_system: true,
        system_type: 'revision_requested'
      });

    if (messageError) {
      console.error('Ошибка при создании системного сообщения:', messageError);
    }

    await loadData();
    setLoading(false);
    alert('Запрос на доработку отправлен');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const hasNoTasks = taskItems.length === 0;
  const progressSteps = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-full bg-white border-l border-gray-200 h-full overflow-y-auto flex flex-col"
    >
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Текущий прогресс</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Progress Bar - В РАМКЕ */}
          <div className="border-2 border-[#6FE7C8] rounded-lg p-4 bg-gradient-to-br from-white to-[#EFFFF8]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-700">Готовность проекта</span>
              <span className="text-2xl font-bold text-[#3F7F6E]">{deal?.current_progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <motion.div
                className="bg-gradient-to-r from-[#6FE7C8] to-[#3F7F6E] h-4 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${deal?.current_progress || 0}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            {deal?.last_progress_update && (
              <p className="text-xs text-gray-500 text-center">
                Обновлено: {formatDate(deal.last_progress_update)}
              </p>
            )}
          </div>

          {isFreelancer && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              {/* Плиточный выбор прогресса */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Установить прогресс
                </label>
                <div className="grid grid-cols-11 gap-1">
                  {progressSteps.map((step) => (
                    <button
                      key={step}
                      onClick={() => setNewProgress(step)}
                      className={`
                        aspect-square rounded-md text-xs font-semibold transition-all duration-200
                        ${newProgress >= step
                          ? 'bg-[#6FE7C8] text-white shadow-md scale-105'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }
                      `}
                    >
                      {step}
                    </button>
                  ))}
                </div>
                <div className="text-center mt-2">
                  <span className="text-lg font-bold text-[#3F7F6E]">{newProgress}%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Комментарий
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:border-[#6FE7C8] focus:ring-2 focus:ring-[#6FE7C8] focus:ring-opacity-20 transition-all"
                  rows={3}
                  placeholder="Опишите проделанную работу..."
                />
              </div>
              <button
                onClick={handleSubmitProgress}
                disabled={loading || !newComment.trim()}
                className="w-full bg-[#3F7F6E] text-white py-2.5 rounded-lg hover:bg-[#2d5f52] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200 hover:shadow-lg"
              >
                Сохранить прогресс
              </button>
            </motion.div>
          )}

          {/* Progress Reports Accordion */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setReportsExpanded(!reportsExpanded)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-800">Промежуточные отчеты</span>
              <motion.div
                animate={{ rotate: reportsExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-5 h-5" />
              </motion.div>
            </button>
            <AnimatePresence>
              {reportsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="border-t border-gray-200 overflow-hidden"
                >
                  <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
                    {progressReports.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">Отчетов пока нет</p>
                    ) : (
                      progressReports.map((report, index) => (
                        <motion.div
                          key={report.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-3 border border-gray-100"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-[#3F7F6E] text-lg">{report.progress_percentage}%</span>
                            <span className="text-xs text-gray-500">{formatDate(report.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-700">{report.comment}</p>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tasks Accordion */}
          <div className={`border border-gray-200 rounded-lg overflow-hidden ${hasNoTasks ? 'opacity-50' : ''}`}>
            <button
              onClick={() => !hasNoTasks && setTasksExpanded(!tasksExpanded)}
              disabled={hasNoTasks}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="font-medium text-gray-800">Задачи</span>
              {!hasNoTasks && (
                <motion.div
                  animate={{ rotate: tasksExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-5 h-5" />
                </motion.div>
              )}
            </button>
            <AnimatePresence>
              {tasksExpanded && !hasNoTasks && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="border-t border-gray-200 overflow-hidden"
                >
                  <div className="p-3 space-y-2">
                    {taskItems.map((task, index) => (
                      <motion.label
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={task.is_completed}
                          onChange={() => isFreelancer && handleToggleTask(task.id, task.is_completed)}
                          disabled={!isFreelancer}
                          className="w-5 h-5 text-[#6FE7C8] rounded focus:ring-[#6FE7C8] transition-all"
                        />
                        <span className={`text-sm flex-1 transition-all ${task.is_completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                          {task.task_name}
                        </span>
                      </motion.label>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isFreelancer && deal?.status === 'in_progress' && (
        <div className="p-4 border-t border-gray-200 space-y-2 bg-white">
          <button
            onClick={handleSubmitForReview}
            disabled={loading || newProgress !== 100}
            className="w-full bg-[#6FE7C8] text-white py-3 rounded-lg hover:bg-[#5dd4b5] disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg"
          >
            <Send className="w-4 h-4" />
            Отправить на проверку
          </button>
          <AnimatePresence>
            {showExtensionForm ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-2 p-3 bg-gray-50 rounded-lg overflow-hidden"
              >
                <textarea
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  placeholder="Причина запроса продления..."
                  className="w-full border border-gray-300 rounded p-2 text-sm resize-none focus:border-[#6FE7C8] focus:ring-2 focus:ring-[#6FE7C8] focus:ring-opacity-20 transition-all"
                  rows={2}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={extensionDays}
                    onChange={(e) => setExtensionDays(parseInt(e.target.value))}
                    className="w-20 border border-gray-300 rounded p-2 text-sm focus:border-[#6FE7C8] focus:ring-2 focus:ring-[#6FE7C8] focus:ring-opacity-20 transition-all"
                  />
                  <span className="text-sm text-gray-600">дней</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleRequestExtension}
                    disabled={loading || !extensionReason.trim()}
                    className="flex-1 bg-[#3F7F6E] text-white py-2 rounded hover:bg-[#2d5f52] disabled:opacity-50 text-sm transition-all"
                  >
                    Отправить
                  </button>
                  <button
                    onClick={() => setShowExtensionForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 text-sm transition-all"
                  >
                    Отмена
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowExtensionForm(true)}
                disabled={loading}
                className="w-full bg-white border-2 border-[#3F7F6E] text-[#3F7F6E] py-3 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-all duration-200"
              >
                <Clock className="w-4 h-4" />
                Запросить дополнительное время
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Status Message for Freelancer when submitted */}
      {isFreelancer && deal?.status === 'submitted' && (
        <div className="p-4 border-t border-gray-200 bg-amber-50">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-800" />
            </div>
            <p className="text-sm text-amber-800 text-center font-medium">
              Заказ в режиме проверки
            </p>
            <p className="text-xs text-amber-700 text-center">
              Ожидайте решения заказчика
            </p>
          </div>
        </div>
      )}

      {/* Status Message for Freelancer when completed */}
      {isFreelancer && deal?.status === 'completed' && (
        <div className="p-4 border-t border-gray-200 bg-green-50">
          <p className="text-sm text-green-800 text-center font-medium">
            Работа принята заказчиком. Сделка завершена.
          </p>
        </div>
      )}

      {/* Client Actions when work is submitted */}
      {!isFreelancer && deal?.status === 'submitted' && !showReviewForm && (
        <div className="p-4 border-t border-gray-200 space-y-2 bg-white">
          <div className="bg-amber-50 p-3 rounded-lg mb-3">
            <p className="text-sm text-amber-800 text-center font-medium">
              Работа сдана на проверку. Проверьте результат и примите решение.
            </p>
          </div>
          <button
            onClick={() => setShowAcceptDialog(true)}
            disabled={loading}
            className="w-full bg-[#6FE7C8] text-white py-3 rounded-lg hover:bg-[#5dd4b5] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 hover:shadow-lg"
          >
            Принять работу
          </button>
          <button
            onClick={handleRequestRevision}
            disabled={loading}
            className="w-full bg-white border-2 border-[#3F7F6E] text-[#3F7F6E] py-3 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200"
          >
            Внести правки
          </button>

          {/* Confirmation Dialog for Accepting Work */}
          {showAcceptDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
              >
                <h3 className="text-lg font-semibold mb-3">Подтверждение приемки</h3>
                <p className="text-gray-700 mb-6">
                  Подтвердите что вы проверили работу полностью. После этого откроется форма для отзыва.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAcceptDialog(false);
                      handleAcceptWork();
                    }}
                    disabled={loading}
                    className="flex-1 bg-[#6FE7C8] text-white py-2.5 rounded-lg hover:bg-[#5dd4b5] disabled:opacity-50 font-medium transition-all"
                  >
                    Подтвердить
                  </button>
                  <button
                    onClick={() => setShowAcceptDialog(false)}
                    disabled={loading}
                    className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 font-medium transition-all"
                  >
                    Отмена
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Review Form after accepting work */}
          {showReviewForm && freelancerId && (
            <div className="p-4">
              <ReviewInChat
                dealId={dealId}
                revieweeId={freelancerId}
                reviewerId={userId}
                onSubmitted={() => {
                  setShowReviewForm(false);
                  alert('Спасибо за отзыв!');
                  loadData();
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Status Message for Client when completed */}
      {!isFreelancer && deal?.status === 'completed' && (
        <div className="p-4 border-t border-gray-200 bg-green-50">
          <p className="text-sm text-green-800 text-center font-medium">
            Работа принята. Сделка завершена.
          </p>
        </div>
      )}
    </motion.div>
  );
}
