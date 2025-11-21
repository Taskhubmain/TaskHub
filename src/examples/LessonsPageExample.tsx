import { useState } from 'react';
import { NoTranslate } from '@/components/NoTranslate';
import { useWeglot } from '@/hooks/useWeglot';

const lessons = {
  ru: {
    title: 'Обучение',
    description: 'Изучите основы работы с платформой',
    lesson1: 'Как создать первый заказ',
    lesson2: 'Как найти исполнителя',
    lesson3: 'Как работать с откликами',
  },
  en: {
    title: 'Learning',
    description: 'Learn the basics of working with the platform',
    lesson1: 'How to create your first order',
    lesson2: 'How to find a contractor',
    lesson3: 'How to work with proposals',
  },
};

export default function LessonsPageExample() {
  const { currentLang } = useWeglot();
  const content = lessons[currentLang as keyof typeof lessons] || lessons.ru;

  return (
    <NoTranslate className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{content.title}</h1>
      <p className="text-gray-600 mb-8">{content.description}</p>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">{content.lesson1}</h3>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">{content.lesson2}</h3>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">{content.lesson3}</h3>
        </div>
      </div>
    </NoTranslate>
  );
}
