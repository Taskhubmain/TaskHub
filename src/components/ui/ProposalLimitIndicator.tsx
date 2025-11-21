import { AlertCircle, CheckCircle, ShoppingBag } from 'lucide-react';

interface ProposalLimitIndicatorProps {
  used: number;
  max: number;
  purchased: number;
  type?: 'orders' | 'tasks';
  onBuyMore?: () => void;
}

export function ProposalLimitIndicator({ used, max, purchased, type = 'orders', onBuyMore }: ProposalLimitIndicatorProps) {
  const monthlyRemaining = Math.max(0, max - used);
  const monthlyPercentage = (monthlyRemaining / max) * 100;
  const isMonthlyNearLimit = monthlyRemaining <= 18;
  const isMonthlyAtLimit = monthlyRemaining <= 0;

  const totalAvailable = monthlyRemaining + purchased;
  const hasAvailable = totalAvailable > 0;

  return (
    <div className="bg-gradient-to-r from-[#EFFFF8] to-[#E0F7EE] rounded-lg border border-[#3F7F6E]/20 p-3 sm:p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {!hasAvailable ? (
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
          ) : isMonthlyNearLimit && purchased === 0 ? (
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
          ) : (
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#3F7F6E] flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-xs sm:text-sm text-[#3F7F6E]">
              {type === 'orders' ? 'Откликов на заказы' : 'Откликов на задачи'}
            </h3>
            {type === 'tasks' && (
              <p className="text-[10px] sm:text-xs text-[#3F7F6E]/70">Неограниченно</p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3">
          {type === 'orders' && (
            <div className="text-left sm:text-right">
              <p className="text-xl sm:text-2xl font-bold text-[#3F7F6E]">
                {totalAvailable}
              </p>
              <p className="text-[10px] sm:text-xs text-[#3F7F6E]/70">всего доступно</p>
            </div>
          )}
          {type === 'orders' && onBuyMore && (
            <button
              onClick={onBuyMore}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#3F7F6E] text-white rounded-lg hover:bg-[#2F6F5E] transition-colors text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"
            >
              <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Купить еще</span>
              <span className="xs:hidden">Купить</span>
            </button>
          )}
        </div>
      </div>

      {type === 'orders' && (
        <div className="space-y-3 sm:space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-medium text-[#3F7F6E]">Ежемесячные откликов</span>
              <span className="text-[10px] sm:text-xs text-[#3F7F6E]/70">
                {monthlyRemaining} / {max}
              </span>
            </div>
            <div className="w-full bg-gray-200/60 rounded-full h-2 sm:h-2.5">
              <div
                className={`h-2 sm:h-2.5 rounded-full transition-all ${
                  isMonthlyAtLimit ? 'bg-red-500' : isMonthlyNearLimit ? 'bg-orange-500' : 'bg-[#3F7F6E]'
                }`}
                style={{ width: `${Math.min(Math.max(monthlyPercentage, 0), 100)}%` }}
              />
            </div>
          </div>

          {purchased > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-medium text-[#6FE7C8]">Купленные</span>
                <span className="text-[10px] sm:text-xs text-[#3F7F6E]/70">
                  {purchased} шт
                </span>
              </div>
              <div className="w-full bg-gray-200/60 rounded-full h-2 sm:h-2.5">
                <div
                  className="h-2 sm:h-2.5 rounded-full transition-all bg-[#6FE7C8]"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}

          {!hasAvailable && (
            <div className="text-[10px] sm:text-xs text-red-600 font-medium">
              Все откликов исчерпаны. Купите дополнительные откликов.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
