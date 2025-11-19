import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, DollarSign, AlertCircle, CheckCircle, Clock, Plus, Trash2, ChevronDown, ChevronUp, RefreshCw, Settings, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSupabase } from '@/lib/supabaseClient';

interface Task {
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  description?: string;
  price?: number;
  deadline?: string;
  delivery_date?: string;
}

interface CRMContext {
  id: string;
  chat_id: string;
  client_id?: string;
  executor_id?: string;
  order_title: string;
  total_price?: number;
  currency: string;
  deadline?: string;
  priority: 'low' | 'medium' | 'high';
  tasks: Task[];
  notes: string;
  last_updated_at: string;
}

interface ChatCRMPanelProps {
  chatId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  triggerRef?: React.RefObject<HTMLButtonElement>;
  aiAgentEnabled: boolean;
  setAiAgentEnabled: (value: boolean) => void;
  confidenceThreshold: number;
  setConfidenceThreshold: (value: number) => void;
}

export function ChatCRMPanel({ chatId, isOpen, onClose, currentUserId, triggerRef, aiAgentEnabled, setAiAgentEnabled, confidenceThreshold, setConfidenceThreshold }: ChatCRMPanelProps) {
  const [crmData, setCrmData] = useState<CRMContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [showAISettings, setShowAISettings] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const settingsRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && chatId) {
      loadCRMData();

      const channel = getSupabase()
        .channel(`crm-${chatId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_crm_context',
            filter: `chat_id=eq.${chatId}`,
          },
          () => {
            loadCRMData();
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [isOpen, chatId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickOnPanel = panelRef.current && panelRef.current.contains(target);
      const isClickOnTrigger = triggerRef?.current && triggerRef.current.contains(target);
      const isClickOnSettings = settingsRef.current && settingsRef.current.contains(target);

      // Не закрываем ничего если открыто окно настроек AI (клик обрабатывается в самом модальном окне)
      if (showAISettings) {
        return;
      }

      // Закрываем панель CRM если клик вне панели
      if (isOpen && !isClickOnPanel && !isClickOnTrigger) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, showAISettings, onClose, triggerRef]);

  const loadCRMData = async () => {
    setLoading(true);
    try {
      const { data, error } = await getSupabase()
        .from('chat_crm_context')
        .select('*')
        .eq('chat_id', chatId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setCrmData(data as CRMContext);
      }
    } catch (error) {
      console.error('Error loading CRM data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCRMData = async (updates: Partial<CRMContext>) => {
    try {
      const { error } = await getSupabase()
        .from('chat_crm_context')
        .update(updates)
        .eq('chat_id', chatId);

      if (error) throw error;
      await loadCRMData();
    } catch (error) {
      console.error('Error updating CRM data:', error);
    }
  };

  const addTask = async () => {
    if (!crmData || !newTask.trim()) return;

    const updatedTasks: Task[] = [
      ...crmData.tasks,
      { title: newTask.trim(), status: 'pending' as const, description: '' },
    ];

    await updateCRMData({ tasks: updatedTasks });
    setNewTask('');
  };

  const updateTaskStatus = async (index: number, status: Task['status']) => {
    if (!crmData) return;

    const updatedTasks = [...crmData.tasks];
    updatedTasks[index] = { ...updatedTasks[index], status };

    await updateCRMData({ tasks: updatedTasks });
  };

  const updateTaskField = async (index: number, field: keyof Task, value: any) => {
    if (!crmData) return;

    const updatedTasks = [...crmData.tasks];
    updatedTasks[index] = { ...updatedTasks[index], [field]: value };

    await updateCRMData({ tasks: updatedTasks });
  };

  const deleteTask = async (index: number) => {
    if (!crmData) return;

    const updatedTasks = crmData.tasks.filter((_, i) => i !== index);
    await updateCRMData({ tasks: updatedTasks });
  };

  const clearCRMData = async () => {
    if (!crmData) return;

    const confirmed = window.confirm('Вы уверены, что хотите очистить все CRM данные? Это действие нельзя отменить.');

    if (!confirmed) return;

    await updateCRMData({
      order_title: '',
      total_price: 0,
      currency: 'USD',
      deadline: undefined,
      priority: 'medium',
      tasks: [],
      notes: '',
    });
  };

  const toggleTaskExpanded = (index: number) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const calculateTotalTasksPrice = () => {
    if (!crmData) return 0;
    return crmData.tasks.reduce((sum, task) => sum + (task.price || 0), 0);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b flex items-center justify-between bg-[#EFFFF8]">
              <h2 className="text-xl font-bold text-[#3F7F6E]">CRM Чата</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#6FE7C8] border-r-transparent mb-3"></div>
                  <p className="text-[#3F7F6E]">Загрузка...</p>
                </div>
              </div>
            ) : crmData ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <Card className="p-4">
                  <label className="text-sm font-medium text-[#3F7F6E] mb-2 block">
                    Название заказа
                  </label>
                  {editing ? (
                    <Input
                      value={crmData.order_title}
                      onChange={(e) => updateCRMData({ order_title: e.target.value })}
                      className="mb-2"
                    />
                  ) : (
                    <p className="text-lg font-semibold mb-2">
                      {crmData.order_title || 'Не указано'}
                    </p>
                  )}
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-5 w-5 text-[#3F7F6E]" />
                    <span className="font-semibold">Общая цена</span>
                  </div>
                  {editing ? (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={crmData.total_price || ''}
                        onChange={(e) => updateCRMData({ total_price: parseFloat(e.target.value) })}
                        className="flex-1"
                      />
                      <select
                        value={crmData.currency}
                        onChange={(e) => updateCRMData({ currency: e.target.value })}
                        className="px-3 py-2 border rounded-md"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="RUB">RUB</option>
                        <option value="KZT">KZT</option>
                        <option value="PLN">PLN</option>
                      </select>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-[#3F7F6E]">
                      {crmData.total_price ? `${crmData.total_price} ${crmData.currency}` : 'Не указано'}
                    </p>
                  )}
                  {crmData.tasks.length > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Сумма задач: {calculateTotalTasksPrice()} {crmData.currency}
                    </p>
                  )}
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-5 w-5 text-[#3F7F6E]" />
                    <span className="font-semibold">Срок сдачи</span>
                  </div>
                  {editing ? (
                    <Input
                      type="date"
                      value={crmData.deadline ? crmData.deadline.split('T')[0] : ''}
                      onChange={(e) => updateCRMData({ deadline: e.target.value })}
                    />
                  ) : (
                    <p>{formatDate(crmData.deadline) || 'Не указано'}</p>
                  )}
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-[#3F7F6E]" />
                    <span className="font-semibold">Приоритет</span>
                  </div>
                  {editing ? (
                    <select
                      value={crmData.priority}
                      onChange={(e) => updateCRMData({ priority: e.target.value as 'low' | 'medium' | 'high' })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                    </select>
                  ) : (
                    <Badge className={getPriorityColor(crmData.priority)}>
                      {crmData.priority === 'high' ? 'Высокий' : crmData.priority === 'medium' ? 'Средний' : 'Низкий'}
                    </Badge>
                  )}
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-[#3F7F6E]" />
                      <span className="font-semibold">Задачи ({crmData.tasks.length})</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {crmData.tasks.map((task, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden">
                        <div
                          className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
                          onClick={() => toggleTaskExpanded(index)}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <Badge className={getStatusColor(task.status)}>
                              {task.status === 'completed' ? '✓' : task.status === 'in_progress' ? '⋯' : '○'}
                            </Badge>
                            <span className="text-sm font-medium truncate">{task.title}</span>
                          </div>
                          <button className="p-1 hover:bg-gray-200 rounded">
                            {expandedTasks.has(index) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        <AnimatePresence>
                          {expandedTasks.has(index) && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-3 space-y-3 bg-white">
                                <div>
                                  <label className="text-xs text-gray-500">Статус</label>
                                  <select
                                    value={task.status}
                                    onChange={(e) => updateTaskStatus(index, e.target.value as Task['status'])}
                                    className="w-full px-2 py-1 border rounded text-sm mt-1"
                                  >
                                    <option value="pending">В ожидании</option>
                                    <option value="in_progress">В процессе</option>
                                    <option value="completed">Выполнено</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="text-xs text-gray-500">Цена</label>
                                  <Input
                                    type="number"
                                    value={task.price || ''}
                                    onChange={(e) => updateTaskField(index, 'price', parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                    className="mt-1 text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="text-xs text-gray-500">Срок выдачи</label>
                                  <Input
                                    type="date"
                                    value={task.delivery_date ? task.delivery_date.split('T')[0] : ''}
                                    onChange={(e) => updateTaskField(index, 'delivery_date', e.target.value)}
                                    className="mt-1 text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="text-xs text-gray-500">Дедлайн</label>
                                  <Input
                                    type="date"
                                    value={task.deadline ? task.deadline.split('T')[0] : ''}
                                    onChange={(e) => updateTaskField(index, 'deadline', e.target.value)}
                                    className="mt-1 text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="text-xs text-gray-500">Описание</label>
                                  <textarea
                                    value={task.description || ''}
                                    onChange={(e) => updateTaskField(index, 'description', e.target.value)}
                                    className="w-full px-2 py-1 border rounded text-sm mt-1"
                                    rows={2}
                                    placeholder="Описание задачи"
                                  />
                                </div>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteTask(index)}
                                  className="w-full text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Удалить задачу
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Input
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTask()}
                      placeholder="Новая задача..."
                      className="flex-1"
                    />
                    <Button onClick={addTask} size="sm" className="bg-[#6FE7C8] hover:bg-[#5cd4b5]">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-[#3F7F6E]" />
                    <span className="font-semibold">Заметки</span>
                  </div>
                  <textarea
                    value={crmData.notes}
                    onChange={(e) => updateCRMData({ notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    rows={4}
                    placeholder="Добавьте заметки..."
                  />
                </Card>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500">CRM данные не найдены</p>
              </div>
            )}

            <div className="p-4 border-t bg-gray-50 space-y-2">
              <Button
                onClick={() => setEditing(!editing)}
                className="w-full bg-[#3F7F6E] hover:bg-[#2d5f52]"
              >
                {editing ? 'Завершить редактирование' : 'Редактировать'}
              </Button>
              <Button
                onClick={() => setShowAISettings(true)}
                variant="outline"
                className="w-full border-[#3F7F6E] text-[#3F7F6E] hover:bg-[#EFFFF8]"
              >
                <Settings className="h-4 w-4 mr-2" />
                Настройки CRM AI
              </Button>
              <Button
                onClick={clearCRMData}
                variant="outline"
                className="w-full text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Очистить CRM
              </Button>
            </div>
          </motion.div>
        </>
      )}

      {/* AI Settings Modal */}
      <AnimatePresence>
        {showAISettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
            onClick={() => setShowAISettings(false)}
          >
            <motion.div
              ref={settingsRef}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
            <h3 className="text-lg font-bold text-[#3F7F6E] mb-4">Настройки CRM AI агента</h3>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">AI агент</label>
                    <div className="relative">
                      <button
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>
                      {showTooltip && (
                        <div className="absolute left-6 top-0 bg-gray-800 text-white text-xs rounded px-3 py-2 w-64 z-10">
                          AI агент анализирует сообщения и автоматически предлагает обновления для CRM на основе обнаруженной информации
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setAiAgentEnabled(!aiAgentEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      aiAgentEnabled ? 'bg-[#6FE7C8]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        aiAgentEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {aiAgentEnabled && (
                <div>
                  <label className="text-sm font-medium block mb-2">Порог уверенности</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={confidenceThreshold}
                      onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #6FE7C8 0%, #6FE7C8 ${confidenceThreshold * 100}%, #e5e7eb ${confidenceThreshold * 100}%, #e5e7eb 100%)`
                      }}
                    />
                    <span className="text-sm font-medium text-[#3F7F6E] w-12 text-right">
                      {Math.round(confidenceThreshold * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Минимальная уверенность AI для показа предложений
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={() => setShowAISettings(false)}
              className="w-full mt-6 bg-[#3F7F6E] hover:bg-[#2d5f52]"
            >
              Сохранить
            </Button>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
