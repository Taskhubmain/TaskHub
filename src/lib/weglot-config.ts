export const weglotConfig = {
  apiKey: import.meta.env.VITE_WEGLOT_API_KEY || '',
  originalLanguage: 'ru',
  destinationLanguages: ['en', 'es', 'fr', 'de', 'zh', 'ar'],

  excludedUrls: [
    '/learning',
    '/learning/*',
    '/admin',
    '/admin/*',
  ],

  excludedPaths: [
    '/messages',
    '/chat',
  ],

  excludedSelectors: [
    '.wg-notranslate',
    '[data-no-translate]',
    '.user-content',
    '.chat-message',
    '.proposal-content',
    '.order-description',
    '.task-description',
    '.review-text',
  ],

  dynamicContentSelectors: [
    '[data-user-content="true"]',
    '.ugc',
    '.user-generated',
  ],
};

export function initWeglot() {
  if (typeof window === 'undefined' || !weglotConfig.apiKey) return;

  window.Weglot = window.Weglot || {};
  window.Weglot.initialize({
    api_key: weglotConfig.apiKey,
    excluded_blocks: weglotConfig.excludedSelectors,
  });
}

export function isUrlExcluded(pathname: string): boolean {
  return weglotConfig.excludedUrls.some(pattern => {
    if (pattern.endsWith('/*')) {
      return pathname.startsWith(pattern.slice(0, -2));
    }
    return pathname === pattern;
  });
}

declare global {
  interface Window {
    Weglot?: {
      initialize: (config: any) => void;
      switchTo: (lang: string) => void;
      getCurrentLang: () => string;
      on: (event: string, callback: () => void) => void;
    };
  }
}
