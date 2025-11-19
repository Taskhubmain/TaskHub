import { Info } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRegion } from '../contexts/RegionContext';

interface PriceDisplayProps {
  amount: number;
  fromCurrency?: string;
  currency?: string;
  className?: string;
  showRange?: boolean;
  maxAmount?: number;
  discount?: number;
}

function PriceTooltip({ original, className = '' }: { original: string; className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        buttonRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="inline-flex items-center justify-center"
      >
        <Info className="h-4 w-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
      </button>
      {isOpen && (
        <div
          ref={tooltipRef}
          className="fixed px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-[9999] whitespace-nowrap max-w-[90vw]"
          style={{
            left: buttonRef.current
              ? `${buttonRef.current.getBoundingClientRect().left}px`
              : '50%',
            top: buttonRef.current
              ? `${buttonRef.current.getBoundingClientRect().top - 10}px`
              : '50%',
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="text-center">
            <div className="text-gray-300 mb-1 text-[10px] md:text-xs">Приблизительная цена</div>
            <div className="font-medium text-[10px] md:text-xs break-words">Точное значение: {original}</div>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PriceDisplay({ amount, fromCurrency, currency, className = '', showRange = false, maxAmount, discount }: PriceDisplayProps) {
  const { formatPriceWithOriginal } = useRegion();
  const actualCurrency = fromCurrency || currency || 'USD';

  if (showRange && maxAmount !== undefined) {
    const minPrice = formatPriceWithOriginal(amount, actualCurrency);
    const maxPrice = formatPriceWithOriginal(maxAmount, actualCurrency);

    if (discount && discount > 0) {
      const discountedMin = amount * (1 - discount / 100);
      const discountedMax = maxAmount * (1 - discount / 100);
      const discountedMinPrice = formatPriceWithOriginal(discountedMin, actualCurrency);
      const discountedMaxPrice = formatPriceWithOriginal(discountedMax, actualCurrency);

      return (
        <div className={`flex flex-wrap items-center gap-1 md:gap-2 ${className}`}>
          <span className="line-through text-red-500 text-sm whitespace-nowrap">
            {minPrice.formatted}–{maxPrice.formatted}
          </span>
          <span className="font-semibold whitespace-nowrap">
            {discountedMinPrice.formatted}–{discountedMaxPrice.formatted}
          </span>
          {minPrice.isConverted && (
            <PriceTooltip original={`${discountedMinPrice.original}–${discountedMaxPrice.original}`} />
          )}
        </div>
      );
    }

    return (
      <div className={`flex flex-wrap items-center gap-1 md:gap-1.5 ${className}`}>
        <span className="font-semibold whitespace-nowrap">
          {minPrice.formatted}–{maxPrice.formatted}
        </span>
        {minPrice.isConverted && (
          <PriceTooltip original={`${minPrice.original}–${maxPrice.original}`} />
        )}
      </div>
    );
  }

  const priceData = formatPriceWithOriginal(amount, actualCurrency);

  if (discount && discount > 0) {
    const discountedAmount = amount * (1 - discount / 100);
    const discountedPrice = formatPriceWithOriginal(discountedAmount, actualCurrency);

    return (
      <div className={`flex flex-wrap items-center gap-1 md:gap-2 ${className}`}>
        <span className="line-through text-red-500 text-sm whitespace-nowrap">{priceData.formatted}</span>
        <span className="font-semibold whitespace-nowrap">{discountedPrice.formatted}</span>
        {priceData.isConverted && (
          <PriceTooltip original={discountedPrice.original} />
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-1 md:gap-1.5 ${className}`}>
      <span className="font-semibold whitespace-nowrap">{priceData.formatted}</span>
      {priceData.isConverted && (
        <PriceTooltip original={priceData.original} />
      )}
    </div>
  );
}
