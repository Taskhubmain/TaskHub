import { Zap, TrendingUp } from 'lucide-react';
import { Badge } from './badge';

interface BoostBadgeProps {
  isBoosted?: boolean;
  showDiscount?: boolean;
  showNewbie?: boolean;
  className?: string;
}

export function BoostBadge({ isBoosted, showDiscount = true, showNewbie = true, className = '' }: BoostBadgeProps) {
  if (!isBoosted) return null;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {showDiscount && (
        <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 flex items-center gap-1">
          <Zap className="h-3 w-3" />
          20% скидка!
        </Badge>
      )}
      {showNewbie && (
        <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          Исполнитель недавно
        </Badge>
      )}
    </div>
  );
}
