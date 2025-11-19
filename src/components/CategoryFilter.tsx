import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { allCategories, type Subcategory, type Category } from '@/data/categories';

interface CategoryFilterProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  triggerLabel?: string;
}


interface SubcategoryCarouselProps {
  subcategories: Subcategory[];
  selectedCategories: string[];
  onToggle: (name: string) => void;
}

function SubcategoryCarousel({ subcategories, selectedCategories, onToggle }: SubcategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const updateArrowVisibility = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    updateArrowVisibility();
    const handleScroll = () => updateArrowVisibility();
    scrollRef.current?.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateArrowVisibility);
    return () => {
      scrollRef.current?.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateArrowVisibility);
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const gap = 12;
      const containerWidth = scrollRef.current.clientWidth;
      const isMobile = containerWidth < 768;
      const itemsPerView = isMobile ? 3 : 8;
      const itemWidth = Math.floor((containerWidth - gap * (itemsPerView - 1)) / itemsPerView);
      const scrollItems = isMobile ? 3 : 6;
      const scrollAmount = itemWidth * scrollItems + gap * scrollItems;

      const currentScroll = scrollRef.current.scrollLeft;
      let targetScroll: number;

      if (direction === 'right') {
        targetScroll = currentScroll + scrollAmount;
      } else {
        targetScroll = currentScroll - scrollAmount;
      }

      scrollRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group">
      {showLeftArrow && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 p-0 rounded-full bg-background/95 backdrop-blur-sm shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}

      <style>
        {`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {subcategories.map((sub) => {
          const isSelected = selectedCategories.includes(sub.name);
          return (
            <div
              key={sub.slug}
              onClick={() => onToggle(sub.name)}
              className="flex-shrink-0 snap-start cursor-pointer w-[calc((100%-24px)/3)] md:w-[calc((100%-84px)/8)]"
            >
              <div className={`rounded-xl overflow-hidden border-2 transition-all duration-300 h-full ${
                isSelected ? 'border-[#3F7F6E] shadow-lg' : 'border-gray-200 hover:border-[#3F7F6E] hover:shadow-md'
              }`}>
                <div className="aspect-[16/10] overflow-hidden bg-muted relative">
                  <img
                    src={`${sub.image}?auto=compress&cs=tinysrgb&w=400`}
                    alt={sub.name}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#3F7F6E] bg-opacity-20 flex items-center justify-center">
                      <div className="w-10 h-10 bg-[#3F7F6E] rounded-full flex items-center justify-center">
                        <Check className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <div className={`text-sm font-medium text-center ${isSelected ? 'text-[#3F7F6E]' : ''}`}>
                    {sub.name}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showRightArrow && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 p-0 rounded-full bg-background/95 backdrop-blur-sm shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}

export default function CategoryFilter({ selectedCategories, onCategoriesChange, triggerLabel = 'Категории' }: CategoryFilterProps) {
  const [open, setOpen] = useState(false);
  const [localSelected, setLocalSelected] = useState<string[]>(selectedCategories);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLocalSelected(selectedCategories);
  }, [selectedCategories]);

  const handleToggle = (categoryName: string) => {
    setLocalSelected(prev => {
      if (prev.includes(categoryName)) {
        return prev.filter(c => c !== categoryName);
      } else {
        return [...prev, categoryName];
      }
    });
  };

  const handleApply = () => {
    onCategoriesChange(localSelected);
    setOpen(false);
  };

  const handleReset = () => {
    setLocalSelected([]);
  };

  const selectedCount = localSelected.length;

  const filteredCategories = allCategories.map(category => ({
    ...category,
    subcategories: category.subcategories.filter(sub =>
      searchQuery === '' ||
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.subcategories.length > 0);

  return (
    <>
      <Button
        variant="outline"
        className="h-10 relative"
        onClick={() => setOpen(true)}
      >
        <Filter className="h-4 w-4 mr-2" />
        {triggerLabel}
        {selectedCount > 0 && (
          <span className="ml-2 bg-[#3F7F6E] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {selectedCount}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] w-[1400px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl">Выберите категории</DialogTitle>
          </DialogHeader>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по категориям и подкатегориям..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="space-y-6 py-4 overflow-y-auto flex-1">
            {filteredCategories.map((category) => (
              <div key={category.title}>
                <h3 className="text-lg font-semibold mb-3">{category.title}</h3>
                <SubcategoryCarousel
                  subcategories={category.subcategories}
                  selectedCategories={localSelected}
                  onToggle={handleToggle}
                />
              </div>
            ))}
            {filteredCategories.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Ничего не найдено по запросу "{searchQuery}"
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleReset}>
              Сбросить
            </Button>
            <Button onClick={handleApply} className="bg-[#3F7F6E] hover:bg-[#2F6F5E]">
              Применить {selectedCount > 0 && `(${selectedCount})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
