import { Bitcoin, CircleDollarSign, Coins } from 'lucide-react';

interface CryptoIconProps {
  type: 'CRYPTO_TON' | 'CRYPTO_USDT' | 'CRYPTO_BTC' | 'CARD';
  className?: string;
}

export function CryptoIcon({ type, className = 'h-5 w-5' }: CryptoIconProps) {
  switch (type) {
    case 'CRYPTO_BTC':
      return <Bitcoin className={className} />;
    case 'CRYPTO_USDT':
      return <CircleDollarSign className={className} />;
    case 'CRYPTO_TON':
      return <Coins className={className} />;
    case 'CARD':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
        </svg>
      );
    default:
      return null;
  }
}

export function getCryptoLabel(type: string): string {
  switch (type) {
    case 'CRYPTO_TON':
      return 'TON';
    case 'CRYPTO_USDT':
      return 'USDT';
    case 'CRYPTO_BTC':
      return 'Bitcoin';
    case 'CARD':
      return 'Банковская карта';
    default:
      return type;
  }
}
