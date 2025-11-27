// System message templates for chat notifications
// Dynamic parts (names, titles) are passed as parameters and NOT translated

type MessageTemplate = {
  en: string;
  ru: string;
};

const templates: Record<string, MessageTemplate> = {
  // Deal accepted message
  dealAccepted: {
    ru: '{itemType} "{title}" был принят {date} за {price} {currency}, заказчик - {clientName}, исполнитель - {freelancerName}.\nУдачной сделки!',
    en: '{itemType} "{title}" was accepted on {date} for {price} {currency}, client - {clientName}, freelancer - {freelancerName}.\nGood luck with the deal!'
  },

  // Progress update messages
  progressUpdate: {
    ru: 'Прогресс обновлен до {progress}%',
    en: 'Progress updated to {progress}%'
  },

  progressUpdateWithSubmission: {
    ru: 'Прогресс обновлен до {progress}%. Сделка автоматически отправлена на проверку.',
    en: 'Progress updated to {progress}%. Deal automatically submitted for review.'
  },

  // Task completion messages
  taskCompleted: {
    ru: '✓ {taskName} - выполнено (прогресс: {progress}%)',
    en: '✓ {taskName} - completed (progress: {progress}%)'
  },

  taskUncompleted: {
    ru: '✗ {taskName} - снята отметка (прогресс: {progress}%)',
    en: '✗ {taskName} - unchecked (progress: {progress}%)'
  },

  // Work submission
  workSubmitted: {
    ru: 'Заказ сдан на проверку, если работа выполнена - подтвердите завершение заказа.',
    en: 'Order submitted for review, if the work is done - confirm the completion of the order.'
  },

  // Work confirmed
  workConfirmed: {
    ru: 'Работа подтверждена',
    en: 'Work confirmed'
  },

  // Work acceptance
  workAccepted: {
    ru: 'Работа принята заказчиком. Сделка завершена.',
    en: 'Work accepted by client. Deal completed.'
  },

  // Auto submission when all tasks completed
  allTasksCompleted: {
    ru: 'Все задачи выполнены! Сделка автоматически отправлена на проверку.',
    en: 'All tasks completed! Deal automatically submitted for review.'
  },

  // Item type translations
  orderType: {
    ru: 'Заказ',
    en: 'Order'
  },

  taskType: {
    ru: 'Объявление',
    en: 'Task'
  }
};

interface SystemMessageParams {
  [key: string]: string | number;
}

/**
 * Generate a system message in the specified language
 * @param templateKey - Key of the message template
 * @param params - Dynamic values to insert (NOT translated)
 * @param language - Language code ('en' or 'ru')
 */
export function getSystemMessage(
  templateKey: keyof typeof templates,
  params: SystemMessageParams,
  language: 'en' | 'ru' = 'ru'
): string {
  const template = templates[templateKey];
  if (!template) {
    console.error(`System message template not found: ${templateKey}`);
    return '';
  }

  let message = template[language];

  // Replace all placeholders with actual values
  Object.entries(params).forEach(([key, value]) => {
    message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  });

  return message;
}

/**
 * Get translated item type (Order/Task)
 */
export function getItemType(isOrder: boolean, language: 'en' | 'ru' = 'ru'): string {
  const templateKey = isOrder ? 'orderType' : 'taskType';
  return templates[templateKey][language];
}

/**
 * Format date for system messages
 */
export function formatSystemDate(date: Date, language: 'en' | 'ru' = 'ru'): string {
  if (language === 'ru') {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  } else {
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
