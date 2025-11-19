import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from './button';

interface FavoriteButtonProps {
  itemId: string | number;
  itemType: 'order' | 'task' | 'deal';
  initialActive?: boolean;
  variant?: 'icon' | 'text';
}

export default function FavoriteButton({
  itemId,
  itemType,
  initialActive = false,
  variant = 'icon'
}: FavoriteButtonProps) {
  const [isActive, setIsActive] = useState(initialActive);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsActive(!isActive);

    console.log(`${isActive ? 'Removed from' : 'Added to'} favorites:`, {
      itemId,
      itemType
    });

    const action = isActive ? 'удалено из' : 'добавлено в';
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-[#6FE7C8] text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = `${itemType === 'order' ? 'Заказ' : itemType === 'task' ? 'Объявление' : 'Сделка'} ${action} избранное`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  if (variant === 'text') {
    return (
      <Button
        variant={isActive ? 'default' : 'outline'}
        size="sm"
        onClick={handleToggle}
        className={isActive ? 'bg-[#6FE7C8] hover:bg-[#5DD6B7]' : ''}
      >
        <Heart className={`h-4 w-4 mr-1 ${isActive ? 'fill-current' : ''}`} />
        {isActive ? 'В избранном' : 'В избранное'}
      </Button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-full hover:bg-[#EFFFF8] transition-colors"
      aria-label={isActive ? 'Удалить из избранного' : 'Добавить в избранное'}
    >
      <Heart
        className={`h-5 w-5 transition-all ${
          isActive
            ? 'fill-[#6FE7C8] text-[#6FE7C8]'
            : 'text-[#3F7F6E] hover:text-[#6FE7C8]'
        }`}
      />
    </button>
  );
}
