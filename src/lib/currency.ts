export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    RUB: '₽',
    KZT: '₸',
    PLN: 'zł'
  };
  return symbols[currency] || currency;
}

export function formatPrice(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount}`;
}
