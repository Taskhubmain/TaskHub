import { useRegion } from '@/contexts/RegionContext';
import en from '@/locales/en.json';
import ru from '@/locales/ru.json';

const translations: Record<string, any> = {
  en,
  ru,
};

export function useTranslation() {
  const { language } = useRegion();

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[language] || translations.en;

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }

    if (typeof value !== 'string') {
      // Fallback to English if translation not found
      value = translations.en;
      for (const k of keys) {
        if (value && typeof value === 'object') {
          value = value[k];
        } else {
          value = key; // Return key if not found
          break;
        }
      }
    }

    if (typeof value === 'string' && params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
        return String(params[paramKey] ?? `{{${paramKey}}}`);
      });
    }

    return value || key;
  };

  return { t, language };
}
