import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  locale: string;
}

interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
}

interface RegionContextType {
  language: string;
  currency: string;
  currencySymbol: string;
  currencies: Currency[];
  setLanguage: (lang: string) => Promise<void>;
  setCurrency: (currency: string) => Promise<void>;
  convertPrice: (amount: number, fromCurrency: string) => number;
  formatPrice: (amount: number, fromCurrency?: string) => string;
  formatPriceWithOriginal: (amount: number, fromCurrency: string) => { formatted: string; original: string; isConverted: boolean };
  isLoading: boolean;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

const SUPPORTED_LANGUAGES = {
  en: 'English',
  ru: 'Русский',
};

const LANGUAGE_TO_CURRENCY: Record<string, string> = {
  en: 'USD',
  ru: 'RUB',
};

export function RegionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<string>('ru');
  const [currency, setCurrencyState] = useState<string>('RUB');
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<Map<string, ExchangeRate>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Detect user's region on mount
  useEffect(() => {
    detectRegion();
  }, []);

  // Load user preferences when authenticated
  useEffect(() => {
    if (user) {
      loadUserPreferences();
    }
  }, [user]);

  // Load available currencies
  useEffect(() => {
    loadCurrencies();
  }, []);

  // Auto-refresh exchange rates every hour
  useEffect(() => {
    if (!currency) return;

    // Initial fetch
    fetchExchangeRates(currency);

    // Set up hourly refresh
    const intervalId = setInterval(() => {
      console.log('Auto-refreshing exchange rates...');
      fetchExchangeRates(currency);
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(intervalId);
  }, [currency]);

  async function detectRegion() {
    try {
      // Try to detect language from browser
      const browserLang = navigator.language.split('-')[0];
      const detectedLang = SUPPORTED_LANGUAGES[browserLang as keyof typeof SUPPORTED_LANGUAGES]
        ? browserLang
        : 'ru';

      // Try to detect currency from timezone/locale
      const detectedCurrency = LANGUAGE_TO_CURRENCY[detectedLang] || 'RUB';

      // If user is not logged in, use detected values
      if (!user) {
        setLanguageState(detectedLang);
        setCurrencyState(detectedCurrency);
        await fetchExchangeRates(detectedCurrency);
      }
    } catch (error) {
      console.error('Error detecting region:', error);
      setLanguageState('ru');
      setCurrencyState('RUB');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUserPreferences() {
    try {
      const { data, error } = await getSupabase()
        .from('user_preferences')
        .select('language, currency')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setLanguageState(data.language);
        setCurrencyState(data.currency);
        await fetchExchangeRates(data.currency);
      } else {
        // Create default preferences
        const browserLang = navigator.language.split('-')[0];
        const detectedLang = SUPPORTED_LANGUAGES[browserLang as keyof typeof SUPPORTED_LANGUAGES]
          ? browserLang
          : 'ru';
        const detectedCurrency = LANGUAGE_TO_CURRENCY[detectedLang] || 'RUB';

        await getSupabase().from('user_preferences').insert({
          user_id: user!.id,
          language: detectedLang,
          currency: detectedCurrency,
        });

        setLanguageState(detectedLang);
        setCurrencyState(detectedCurrency);
        await fetchExchangeRates(detectedCurrency);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
      setLanguageState('ru');
      setCurrencyState('RUB');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCurrencies() {
    try {
      const { data, error } = await getSupabase()
        .from('currencies')
        .select('code, name, symbol, locale')
        .eq('is_active', true)
        .order('code');

      if (error) throw error;
      setCurrencies(data || []);
    } catch (error) {
      console.error('Error loading currencies:', error);
    }
  }

  async function fetchExchangeRates(baseCurrency: string) {
    try {
      // Check if we have recent rates in database (less than 1 hour old)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      // Try to get rates from any recent base currency (USD preferred for most conversions)
      const { data: recentRates, error: dbError } = await getSupabase()
        .from('exchange_rates')
        .select('from_currency, to_currency, rate, fetched_at')
        .gte('fetched_at', oneHourAgo)
        .order('fetched_at', { ascending: false });

      if (!dbError && recentRates && recentRates.length > 10) {
        // We have fresh rates, use them
        const ratesMap = new Map<string, ExchangeRate>();
        recentRates.forEach((rate) => {
          const key = `${rate.from_currency}-${rate.to_currency}`;
          if (!ratesMap.has(key)) {
            ratesMap.set(key, {
              from: rate.from_currency,
              to: rate.to_currency,
              rate: parseFloat(rate.rate),
              timestamp: new Date(rate.fetched_at).getTime(),
            });
          }
        });
        setExchangeRates(ratesMap);
        return;
      }

      // Fetch fresh rates from API using USD as base (most complete)
      console.log('Fetching fresh exchange rates from API...');
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-exchange-rates?base=USD`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch exchange rates:', response.status, response.statusText);
        throw new Error('Failed to fetch exchange rates');
      }

      const result = await response.json();

      if (result.success && result.rates) {
        console.log(`Loaded ${Object.keys(result.rates).length} exchange rates`);
        const ratesMap = new Map<string, ExchangeRate>();
        Object.entries(result.rates).forEach(([toCurrency, rate]) => {
          const key = `USD-${toCurrency}`;
          ratesMap.set(key, {
            from: 'USD',
            to: toCurrency,
            rate: rate as number,
            timestamp: result.timestamp,
          });
        });
        setExchangeRates(ratesMap);
      } else {
        console.error('Invalid response from exchange rate API:', result);
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    }
  }

  async function setLanguage(lang: string) {
    setLanguageState(lang);

    if (user) {
      try {
        const { error } = await getSupabase()
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            language: lang,
            currency,
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      } catch (error) {
        console.error('Error saving language preference:', error);
      }
    }
  }

  async function setCurrency(newCurrency: string) {
    setCurrencyState(newCurrency);
    await fetchExchangeRates(newCurrency);

    if (user) {
      try {
        const { error } = await getSupabase()
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            language,
            currency: newCurrency,
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      } catch (error) {
        console.error('Error saving currency preference:', error);
      }
    }
  }

  function convertPrice(amount: number, fromCurrency: string): number {
    if (fromCurrency === currency) return amount;

    // Try direct conversion
    const directKey = `${fromCurrency}-${currency}`;
    const directRate = exchangeRates.get(directKey);

    if (directRate) {
      return amount * directRate.rate;
    }

    // Try inverse conversion
    const inverseKey = `${currency}-${fromCurrency}`;
    const inverseRate = exchangeRates.get(inverseKey);

    if (inverseRate) {
      return amount / inverseRate.rate;
    }

    // Try conversion through USD as intermediate currency
    // Convert from source to USD, then USD to target
    const fromUsdKey = `USD-${fromCurrency}`;
    const toUsdKey = `USD-${currency}`;
    const fromUsdRate = exchangeRates.get(fromUsdKey);
    const toUsdRate = exchangeRates.get(toUsdKey);

    if (fromUsdRate && toUsdRate) {
      // Convert to USD first, then to target currency
      const amountInUsd = amount / fromUsdRate.rate;
      return amountInUsd * toUsdRate.rate;
    }

    // If no rate found, return original amount
    console.warn(`No exchange rate found for ${fromCurrency} -> ${currency}`);
    return amount;
  }

  function formatPrice(amount: number, fromCurrency?: string): string {
    const convertedAmount = fromCurrency ? convertPrice(amount, fromCurrency) : amount;
    const roundedAmount = Math.floor(convertedAmount);
    const currencyData = currencies.find((c) => c.code === currency);

    if (currencyData) {
      try {
        return new Intl.NumberFormat(currencyData.locale, {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(roundedAmount);
      } catch (error) {
        return `${currencyData.symbol}${roundedAmount}`;
      }
    }

    return `${roundedAmount} ${currency}`;
  }

  function formatPriceWithOriginal(amount: number, fromCurrency: string): { formatted: string; original: string; isConverted: boolean } {
    const isConverted = fromCurrency !== currency;
    const convertedAmount = convertPrice(amount, fromCurrency);
    const roundedAmount = Math.floor(convertedAmount);
    const currencyData = currencies.find((c) => c.code === currency);
    const originalCurrencyData = currencies.find((c) => c.code === fromCurrency);

    let formatted = '';
    if (currencyData) {
      try {
        formatted = new Intl.NumberFormat(currencyData.locale, {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(roundedAmount);
      } catch (error) {
        formatted = `${currencyData.symbol}${roundedAmount}`;
      }
    } else {
      formatted = `${roundedAmount} ${currency}`;
    }

    let original = '';
    if (originalCurrencyData) {
      try {
        original = new Intl.NumberFormat(originalCurrencyData.locale, {
          style: 'currency',
          currency: fromCurrency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount);
      } catch (error) {
        original = `${originalCurrencyData.symbol}${amount}`;
      }
    } else {
      original = `${amount} ${fromCurrency}`;
    }

    return { formatted, original, isConverted };
  }

  const currencySymbol = currencies.find((c) => c.code === currency)?.symbol || '$';

  return (
    <RegionContext.Provider
      value={{
        language,
        currency,
        currencySymbol,
        currencies,
        setLanguage,
        setCurrency,
        convertPrice,
        formatPrice,
        formatPriceWithOriginal,
        isLoading,
      }}
    >
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const context = useContext(RegionContext);
  if (context === undefined) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
}

export { SUPPORTED_LANGUAGES };
