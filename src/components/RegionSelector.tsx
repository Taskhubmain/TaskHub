import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useRegion, SUPPORTED_LANGUAGES } from '../contexts/RegionContext';

export default function RegionSelector() {
  const { currency, currencies, setCurrency } = useRegion();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentCurrency = currencies.find((c) => c.code === currency);

  const handleCurrencyChange = async (curr: string) => {
    await setCurrency(curr);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Currency settings"
      >
        <Globe className="h-5 w-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {currentCurrency?.symbol || currency}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Валюта</h3>
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {currencies.map((curr) => (
              <button
                key={curr.code}
                onClick={() => {
                  handleCurrencyChange(curr.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                  currency === curr.code
                    ? 'bg-[#E6F7F2] text-[#2D9F7C]'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{curr.symbol}</span>
                  <div>
                    <div className="text-sm font-medium">{curr.code}</div>
                    <div className="text-xs text-gray-500">{curr.name}</div>
                  </div>
                </div>
                {currency === curr.code && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <p className="text-xs text-gray-600 text-center">
              Цены будут конвертированы в выбранную валюту по текущему курсу
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
