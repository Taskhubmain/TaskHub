import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Plus, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';

const pageVariants = { initial: { opacity: 0, y: 16 }, in: { opacity: 1, y: 0 }, out: { opacity: 0, y: -16 } };
const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', description: '' });
  const [editCategory, setEditCategory] = useState({ name: '', slug: '', description: '' });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    
    if (data) {
      setCategories(data);
    }
    setLoading(false);
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name || !newCategory.slug) {
      alert('Название и slug обязательны');
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('categories')
      .insert([newCategory]);

    if (error) {
      alert('Ошибка: ' + error.message);
    } else {
      setNewCategory({ name: '', slug: '', description: '' });
      await loadCategories();
    }
    setLoading(false);
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editCategory.name || !editCategory.slug) {
      alert('Название и slug обязательны');
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('categories')
      .update(editCategory)
      .eq('id', id);

    if (error) {
      alert('Ошибка: ' + error.message);
    } else {
      setEditMode(null);
      await loadCategories();
    }
    setLoading(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту категорию?')) return;

    setLoading(true);
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Ошибка: ' + error.message);
    } else {
      await loadCategories();
    }
    setLoading(false);
  };

  const startEdit = (category: Category) => {
    setEditMode(category.id);
    setEditCategory({
      name: category.name,
      slug: category.slug,
      description: category.description || ''
    });
  };

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Управление категориями</h1>
          <p className="text-[#3F7F6E] mt-2">Создание и редактирование категорий для заказов и задач</p>
        </div>

        <Card className="border-[#6FE7C8]/20 shadow-md mb-6">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Создать категорию
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название
                </label>
                <Input
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="Например: Дизайн"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug (URL)
                </label>
                <Input
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="design"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <Input
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Краткое описание"
                />
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={handleCreateCategory} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить категорию
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#6FE7C8]/20 shadow-md">
          <CardHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Все категории ({categories.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading && categories.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Загрузка...
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Категории не найдены. Создайте первую категорию.
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map((category) => (
                  <div key={category.id} className="p-5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    {editMode === category.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Название
                            </label>
                            <Input
                              value={editCategory.name}
                              onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Slug
                            </label>
                            <Input
                              value={editCategory.slug}
                              onChange={(e) => setEditCategory({ ...editCategory, slug: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Описание
                            </label>
                            <Input
                              value={editCategory.description}
                              onChange={(e) => setEditCategory({ ...editCategory, description: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleUpdateCategory(category.id)} disabled={loading}>
                            Сохранить
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditMode(null)}>
                            Отмена
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {category.slug}
                            </Badge>
                          </div>
                          {category.description && (
                            <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            Создано: {new Date(category.created_at).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(category)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCategory(category.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
