import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Trash2, Image as ImageIcon, File, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -16 }
};

const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  category: 'avatar' | 'preview' | 'cover' | 'other';
  size: number;
  mimeType: string;
  createdAt: string;
}

export default function MediaLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([
    {
      id: '1',
      filename: 'profile-photo.jpg',
      url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=300',
      category: 'avatar',
      size: 245600,
      mimeType: 'image/jpeg',
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      filename: 'portfolio-work-1.jpg',
      url: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?w=300',
      category: 'preview',
      size: 512000,
      mimeType: 'image/jpeg',
      createdAt: '2024-01-20',
    },
    {
      id: '3',
      filename: 'cover-banner.jpg',
      url: 'https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?w=600',
      category: 'cover',
      size: 1024000,
      mimeType: 'image/jpeg',
      createdAt: '2024-02-01',
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  const categories = [
    { value: 'all', label: 'Все файлы' },
    { value: 'avatar', label: 'Аватары' },
    { value: 'preview', label: 'Превью' },
    { value: 'cover', label: 'Обложки' },
    { value: 'other', label: 'Другое' },
  ];

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.filename.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getCategoryLabel = (category: string) => {
    return categories.find(c => c.value === category)?.label || category;
  };

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <motion.div
      key="media-library"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen bg-background"
    >
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Библиотека медиа</h1>
            <p className="text-muted-foreground">
              Храните и переиспользуйте изображения для профиля и портфолио
            </p>
          </div>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Загрузить файл
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени файла..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.value)}
                className="whitespace-nowrap"
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Нет файлов</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Ничего не найдено' : 'Загрузите первое изображение в библиотеку'}
              </p>
              {!searchQuery && (
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Загрузить файл
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredItems.map(item => (
                <Card key={item.id} className="overflow-hidden group relative">
                  <div
                    className="aspect-square bg-gray-100 cursor-pointer"
                    onClick={() => setPreviewItem(item)}
                  >
                    <img
                      src={item.url}
                      alt={item.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium truncate flex-1">{item.filename}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {getCategoryLabel(item.category)}
                      </Badge>
                      <span>{formatFileSize(item.size)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Совет:</strong> Загруженные изображения можно использовать в портфолио,
                профиле и объявлениях без повторной загрузки.
              </p>
            </div>
          </>
        )}
      </div>

      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewItem?.filename}</DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="space-y-4">
              <img
                src={previewItem.url}
                alt={previewItem.filename}
                className="w-full rounded-lg"
              />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Категория</p>
                  <p className="font-medium">{getCategoryLabel(previewItem.category)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Размер</p>
                  <p className="font-medium">{formatFileSize(previewItem.size)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Тип</p>
                  <p className="font-medium">{previewItem.mimeType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Загружено</p>
                  <p className="font-medium">{new Date(previewItem.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1">Копировать ссылку</Button>
                <Button variant="destructive" onClick={() => {
                  handleDelete(previewItem.id);
                  setPreviewItem(null);
                }}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
