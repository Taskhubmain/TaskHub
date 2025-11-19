import { useState } from 'react';
import { Star } from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';

interface ReviewInChatProps {
  dealId: string;
  revieweeId: string;
  reviewerId: string;
  onSubmitted: () => void;
}

export function ReviewInChat({ dealId, revieweeId, reviewerId, onSubmitted }: ReviewInChatProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      alert('Пожалуйста, выберите оценку');
      return;
    }

    if (!comment.trim()) {
      alert('Пожалуйста, напишите отзыв');
      return;
    }

    setLoading(true);
    const supabase = getSupabase();

    const { error } = await supabase
      .from('reviews')
      .insert({
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        deal_id: dealId,
        rating,
        comment: comment.trim()
      });

    if (error) {
      console.error('Ошибка при создании отзыва:', error);
      alert('Ошибка при отправке отзыва');
      setLoading(false);
      return;
    }

    setLoading(false);
    onSubmitted();
  };

  return (
    <div className="bg-gradient-to-br from-[#EFFFF8] to-white p-4 rounded-lg border-2 border-[#6FE7C8] my-3">
      <h4 className="font-semibold text-gray-800 mb-3">Оставьте отзыв о работе</h4>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-600">Ваша оценка:</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
              disabled={loading}
            >
              <Star
                className={`w-6 h-6 ${
                  star <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                } transition-colors`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <span className="text-sm font-medium text-[#3F7F6E]">
            {rating} {rating === 1 ? 'звезда' : rating < 5 ? 'звезды' : 'звёзд'}
          </span>
        )}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Опишите ваш опыт работы..."
        className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:border-[#6FE7C8] focus:ring-2 focus:ring-[#6FE7C8] focus:ring-opacity-20 transition-all mb-3"
        rows={3}
        disabled={loading}
      />

      <button
        onClick={handleSubmitReview}
        disabled={loading || rating === 0 || !comment.trim()}
        className="w-full bg-[#3F7F6E] text-white py-2.5 rounded-lg hover:bg-[#2d5f52] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 hover:shadow-lg"
      >
        {loading ? 'Отправка...' : 'Оценить'}
      </button>
    </div>
  );
}
