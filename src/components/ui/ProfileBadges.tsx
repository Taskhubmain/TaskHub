import { Star, Award, Crown, GraduationCap } from 'lucide-react';
import { Badge } from './badge';

interface ProfileBadgesProps {
  avgRating?: number;
  reviewsCount?: number;
  fiveStarCount?: number;
  createdAt?: string;
  learningCompleted?: boolean;
  showStars?: boolean;
  compact?: boolean;
}

export default function ProfileBadges({
  avgRating = 0,
  reviewsCount = 0,
  fiveStarCount = 0,
  createdAt,
  learningCompleted = false,
  showStars = true,
  compact = false
}: ProfileBadgesProps) {
  // Check if user is new (first week after registration)
  const isNew = createdAt ? (Date.now() - new Date(createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000 : false;

  // Determine badge tier
  const isMaster = fiveStarCount >= 50;
  const isVerified = fiveStarCount >= 5 && !isMaster;

  const renderStars = () => {
    if (!showStars || reviewsCount === 0) return null;

    const fullStars = Math.floor(avgRating);
    const hasHalfStar = avgRating % 1 >= 0.5;

    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 ${
                i < fullStars
                  ? 'fill-yellow-400 text-yellow-400'
                  : i === fullStars && hasHalfStar
                  ? 'fill-yellow-400/50 text-yellow-400'
                  : 'fill-gray-200 text-gray-200'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-[#3F7F6E] ml-1">
          {avgRating.toFixed(1)} ({reviewsCount})
        </span>
      </div>
    );
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {renderStars()}
        {isMaster && (
          <Badge variant="default" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 text-xs">
            <Crown className="h-3 w-3 mr-1" />
            Мастер
          </Badge>
        )}
        {isVerified && (
          <Badge variant="default" className="bg-[#6FE7C8] text-[#3F7F6E] border-0 text-xs">
            <Award className="h-3 w-3 mr-1" />
            Проверенный
          </Badge>
        )}
        {learningCompleted && (
          <Badge variant="default" className="bg-blue-500 text-white border-0 text-xs">
            <GraduationCap className="h-3 w-3 mr-1" />
            Прошел обучение
          </Badge>
        )}
        {isNew && (
          <Badge variant="outline" className="text-xs border-[#6FE7C8] text-[#3F7F6E]">
            Недавно на бирже
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {renderStars()}
      <div className="flex items-center gap-2 flex-wrap">
        {isMaster && (
          <Badge variant="default" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
            <Crown className="h-4 w-4 mr-1" />
            Мастер своего дела
          </Badge>
        )}
        {isVerified && (
          <Badge variant="default" className="bg-[#6FE7C8] text-[#3F7F6E] border-0">
            <Award className="h-4 w-4 mr-1" />
            Проверенный специалист
          </Badge>
        )}
        {learningCompleted && (
          <Badge variant="default" className="bg-blue-500 text-white border-0">
            <GraduationCap className="h-4 w-4 mr-1" />
            Прошел обучение
          </Badge>
        )}
        {isNew && (
          <Badge variant="outline" className="border-[#6FE7C8] text-[#3F7F6E]">
            Недавно на бирже
          </Badge>
        )}
      </div>
    </div>
  );
}
