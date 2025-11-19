import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface AnalysisRequest {
  chat_id: string;
  message_id: string;
  message_text: string;
  sender_id: string;
}

interface Task {
  title: string;
  status: string;
  description?: string;
  price?: number;
  deadline?: string;
  delivery_date?: string;
}

interface CRMContext {
  client_id?: string;
  executor_id?: string;
  order_title?: string;
  total_price?: number;
  currency?: string;
  deadline?: string;
  priority?: string;
  tasks?: Task[];
  notes?: string;
}

interface FieldUpdate {
  value: any;
  confidence: number;
  message: string;
}

interface AIAnalysis {
  order_title?: FieldUpdate;
  price_change?: {
    type: string;
    amount: number;
    currency?: string;
    confidence: number;
  };
  deadline?: FieldUpdate;
  priority?: FieldUpdate;
  tasks?: {
    items: Task[];
    confidence: number;
  };
}

async function analyzeWithAI(messageText: string, existingContext: any): Promise<AIAnalysis> {
  try {
    const today = new Date();
    const todayStr = today.toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const prompt = `Ты система анализа деловых сообщений для CRM. Сегодня: ${todayStr}.

Текущий контекст:
- Название заказа: ${existingContext?.order_title || 'не указано'}
- Цена: ${existingContext?.total_price || 0} ${existingContext?.currency || 'USD'}
- Дедлайн: ${existingContext?.deadline ? new Date(existingContext.deadline).toLocaleDateString('ru-RU') : 'не указан'}
- Приоритет: ${existingContext?.priority || 'medium'}

Новое сообщение: "${messageText}"

ВАЖНО:
1. Прошлые даты запрещены! Только будущие даты.
2. Добавь уровень уверенности (confidence) для каждого извлеченного параметра от 0.0 до 1.0:
   - 1.0 = абсолютно уверен (точная цифра, явная дата)
   - 0.7-0.9 = уверен (понятный контекст)
   - 0.4-0.6 = средняя уверенность (неоднозначность)
   - 0.0-0.3 = низкая уверенность (догадка)

Проанализируй сообщение и извлеки в JSON формате:
{
  "order_title": {
    "value": "название проекта",
    "confidence": 0.8
  },
  "price_change": {
    "type": "set|add|subtract",
    "amount": число,
    "currency": "USD|EUR|RUB|KZT|PLN",
    "confidence": 0.9
  },
  "deadline": {
    "value": "YYYY-MM-DD",
    "confidence": 0.7
  },
  "priority": {
    "value": "low|medium|high",
    "confidence": 0.6
  },
  "tasks": {
    "items": [{"title": "название", "description": "описание"}],
    "confidence": 0.8
  }
}

Примеры:
- "Цена 500 долларов" → confidence: 1.0 (точная цифра)
- "Дорого будет" → confidence: 0.3 (неопределенно)
- "К пятнице сделаем" → confidence: 0.9 (явная дата)
- "Скоро нужно" → confidence: 0.4 (неясный срок)

Ответ только JSON, без комментариев:`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'Ты эксперт по анализу деловой переписки. Отвечай только валидным JSON без markdown форматирования.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 700,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || '{}';

    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : aiResponse;
    const analysis = JSON.parse(jsonStr);

    return analysis;

  } catch (error) {
    console.error('AI Analysis error:', error);
    return {};
  }
}

async function createPendingConfirmation(
  supabase: any,
  chatId: string,
  fieldName: string,
  fieldValue: any,
  confidence: number,
  message: string
) {
  await supabase
    .from('crm_pending_confirmations')
    .insert({
      chat_id: chatId,
      field_name: fieldName,
      field_value: fieldValue,
      confidence,
      message,
      status: 'pending',
    });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { chat_id, message_text, sender_id }: AnalysisRequest = await req.json();

    const { data: chat } = await supabase
      .from('chats')
      .select('participant1_id, participant2_id')
      .eq('id', chat_id)
      .single();

    if (!chat) {
      return new Response(
        JSON.stringify({ error: 'Chat not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let { data: crmContext } = await supabase
      .from('chat_crm_context')
      .select('*')
      .eq('chat_id', chat_id)
      .maybeSingle();

    if (!crmContext) {
      const { data: newContext } = await supabase
        .from('chat_crm_context')
        .insert({
          chat_id,
          client_id: chat.participant1_id,
          executor_id: chat.participant2_id,
          tasks: [],
          notes: '',
        })
        .select()
        .single();
      crmContext = newContext;
    }

    // Mechanical test trigger
    if (message_text.toLowerCase().includes('тест подтверждения')) {
      await createPendingConfirmation(
        supabase,
        chat_id,
        'test',
        { value: 'Механический тест' },
        0.5,
        'Это тестовое подтверждение. Всё работает?'
      );

      return new Response(
        JSON.stringify({
          success: true,
          updates: 0,
          confirmations_pending: 1,
          extracted: {},
          test: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analysis = await analyzeWithAI(message_text, crmContext);

    console.log('AI Analysis:', JSON.stringify(analysis, null, 2));

    const updates: Partial<CRMContext> = {};
    const confirmationsNeeded: string[] = [];
    const CONFIDENCE_THRESHOLD = 1.0;

    if (analysis.order_title && analysis.order_title.value) {
      const newTitle = analysis.order_title.value.slice(0, 100);
      const isDifferent = !crmContext?.order_title || crmContext.order_title !== newTitle;

      if (isDifferent) {
        if (analysis.order_title.confidence >= CONFIDENCE_THRESHOLD) {
          updates.order_title = newTitle;
        } else {
          const message = `Название проекта: "${newTitle}". Верно?`;
          await createPendingConfirmation(
            supabase,
            chat_id,
            'order_title',
            { value: newTitle },
            analysis.order_title.confidence,
            message
          );
          confirmationsNeeded.push('order_title');
        }
      }
    }

    if (analysis.price_change && analysis.price_change.amount > 0) {
      const currentPrice = crmContext?.total_price || 0;
      let newPrice = currentPrice;

      switch (analysis.price_change.type) {
        case 'set':
          newPrice = analysis.price_change.amount;
          break;
        case 'add':
          newPrice = currentPrice + analysis.price_change.amount;
          break;
        case 'subtract':
          newPrice = Math.max(0, currentPrice - analysis.price_change.amount);
          break;
      }

      const isDifferent = newPrice !== currentPrice;

      if (isDifferent) {
        if (analysis.price_change.confidence >= CONFIDENCE_THRESHOLD) {
          updates.total_price = newPrice;
          if (analysis.price_change.currency) {
            updates.currency = analysis.price_change.currency;
          }
        } else {
          const priceMessage = `Цена: ${newPrice} ${analysis.price_change.currency || crmContext?.currency || 'USD'}. Верно?`;
          await createPendingConfirmation(
            supabase,
            chat_id,
            'total_price',
            {
              value: newPrice,
              currency: analysis.price_change.currency || crmContext?.currency || 'USD'
            },
            analysis.price_change.confidence,
            priceMessage
          );
          confirmationsNeeded.push('total_price');
        }
      }
    }

    if (analysis.deadline && analysis.deadline.value) {
      const deadlineDate = new Date(analysis.deadline.value);
      if (!isNaN(deadlineDate.getTime()) && deadlineDate > new Date()) {
        const newDeadline = deadlineDate.toISOString();
        const currentDeadline = crmContext?.deadline;
        const isDifferent = !currentDeadline || new Date(currentDeadline).toDateString() !== deadlineDate.toDateString();

        if (isDifferent) {
          if (analysis.deadline.confidence >= CONFIDENCE_THRESHOLD) {
            updates.deadline = newDeadline;
          } else {
            const formattedDate = deadlineDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const message = `Дедлайн: ${formattedDate}. Верно?`;
            await createPendingConfirmation(
              supabase,
              chat_id,
              'deadline',
              { value: newDeadline },
              analysis.deadline.confidence,
              message
            );
            confirmationsNeeded.push('deadline');
          }
        }
      }
    }

    if (analysis.priority && analysis.priority.value && ['low', 'medium', 'high'].includes(analysis.priority.value)) {
      const isDifferent = !crmContext?.priority || crmContext.priority !== analysis.priority.value;

      if (isDifferent) {
        if (analysis.priority.confidence >= CONFIDENCE_THRESHOLD) {
          updates.priority = analysis.priority.value;
        } else {
          const priorityLabels = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };
          const priorityLabel = priorityLabels[analysis.priority.value as keyof typeof priorityLabels] || analysis.priority.value;
          const message = `Приоритет: ${priorityLabel}. Верно?`;
          await createPendingConfirmation(
            supabase,
            chat_id,
            'priority',
            { value: analysis.priority.value },
            analysis.priority.confidence,
            message
          );
          confirmationsNeeded.push('priority');
        }
      }
    }

    if (analysis.tasks && analysis.tasks.items && analysis.tasks.items.length > 0) {
      const currentTasks = (crmContext?.tasks as Task[]) || [];
      const newTasks = analysis.tasks.items
        .filter((t: any) => t.title && t.title.length > 3)
        .map((t: any) => ({
          title: t.title.slice(0, 200),
          status: 'pending',
          description: t.description || '',
        }));

      const uniqueNewTasks = newTasks.filter((newTask: Task) =>
        !currentTasks.some((existingTask: Task) =>
          existingTask.title.toLowerCase() === newTask.title.toLowerCase()
        )
      );

      if (uniqueNewTasks.length > 0) {
        if (analysis.tasks.confidence >= CONFIDENCE_THRESHOLD) {
          updates.tasks = [...currentTasks, ...uniqueNewTasks];
        } else {
          const tasksMessage = `Добавить задачи: ${uniqueNewTasks.map(t => t.title).join(', ')}. Верно?`;
          await createPendingConfirmation(
            supabase,
            chat_id,
            'tasks',
            { items: uniqueNewTasks },
            analysis.tasks.confidence,
            tasksMessage
          );
          confirmationsNeeded.push('tasks');
        }
      }
    }

    const existingNotes = crmContext?.notes || '';
    const timestamp = new Date().toLocaleString('ru-RU');
    const senderLabel = sender_id === crmContext?.client_id ? 'Клиент' : 'Исполнитель';

    if (Object.keys(updates).length > 0) {
      const noteUpdates = [];
      if (updates.total_price !== undefined) noteUpdates.push(`цена ${updates.total_price} ${updates.currency || crmContext?.currency || 'USD'}`);
      if (updates.deadline) noteUpdates.push(`срок до ${new Date(updates.deadline).toLocaleDateString('ru-RU')}`);
      if (updates.priority) noteUpdates.push(`приоритет ${updates.priority}`);
      if (updates.order_title) noteUpdates.push(`проект: ${updates.order_title}`);

      if (noteUpdates.length > 0) {
        const newNote = `[${timestamp}] ${senderLabel}: ${noteUpdates.join(', ')}`;
        updates.notes = existingNotes ? `${existingNotes}\n${newNote}` : newNote;
      }
    }

    if (Object.keys(updates).length > 0) {
      await supabase
        .from('chat_crm_context')
        .update(updates)
        .eq('chat_id', chat_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        updates: Object.keys(updates).length,
        confirmations_pending: confirmationsNeeded.length,
        extracted: updates
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing message:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});