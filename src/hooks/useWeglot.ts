import { useState, useEffect } from 'react';
import { translations, TranslationKey } from '@/locales/translations';

export function useWeglot() {
  const [currentLang, setCurrentLang] = useState<string>('ru');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkWeglot = setInterval(() => {
      if (window.Weglot) {
        setIsReady(true);
        setCurrentLang(window.Weglot.getCurrentLang());
        clearInterval(checkWeglot);

        window.Weglot.on('languageChanged', () => {
          setCurrentLang(window.Weglot!.getCurrentLang());
        });
      }
    }, 100);

    return () => clearInterval(checkWeglot);
  }, []);

  const switchLanguage = (lang: string) => {
    if (window.Weglot) {
      window.Weglot.switchTo(lang);
    }
  };

  const getCurrentLanguage = () => {
    return window.Weglot?.getCurrentLang() || 'ru';
  };

  const t = (key: TranslationKey): string => {
    const lang = currentLang === 'en' ? 'en' : 'ru';
    return translations[lang][key] || key;
  };

  return {
    currentLang,
    isReady,
    switchLanguage,
    getCurrentLanguage,
    t,
  };
}
