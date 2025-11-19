import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, X, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const pageVariants = { initial: { opacity: 0, y: 16 }, in: { opacity: 1, y: 0 }, out: { opacity: 0, y: -16 } };
const pageTransition = { type: 'spring' as const, stiffness: 140, damping: 20, mass: 0.9 };

export default function PortfolioAdd() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [imageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер: 5 МБ');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите изображение');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Необходимо войти в систему');
      return;
    }

    if (!title.trim() || !description.trim()) {
      alert('Заполните название и описание проекта');
      return;
    }

    setLoading(true);
    try {
      // First, ensure profile exists
      const { data: existingProfile } = await getSupabase()
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!existingProfile) {
        // Create profile if it doesn't exist
        const { error: profileError } = await getSupabase()
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            name: user.email?.split('@')[0] || 'User',
            role: 'freelancer'
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error(`Не удалось создать профиль: ${profileError.message}`);
        }
      }

      let uploadedImageUrl = imageUrl.trim() || null;

      // Upload image if file is selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `portfolio/${fileName}`;

        const { error: uploadError } = await getSupabase().storage
          .from('portfolio-images')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Ошибка при загрузке изображения: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = getSupabase().storage
          .from('portfolio-images')
          .getPublicUrl(filePath);

        uploadedImageUrl = publicUrl;
      }

      const { error } = await getSupabase()
        .from('portfolio_projects')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          project_url: link.trim() || null,
          image_url: uploadedImageUrl,
          tags
        });

      if (error) {
        console.error('Insert error:', error);
        throw new Error(`Ошибка при добавлении проекта: ${error.message}`);
      }

      alert('Проект успешно добавлен в портфолио!');
      window.location.hash = '/me';
    } catch (error: any) {
      console.error('Error adding portfolio project:', error);
      alert(error.message || 'Ошибка при добавлении проекта. Проверьте подключение к базе данных.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    window.location.hash = '/me';
  };

  return (
    <motion.div
      key="portfolio-add"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen bg-background"
    >
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Добавить проект в портфолио</h1>
          <p className="text-[#3F7F6E]">Покажите свои лучшие работы потенциальным клиентам</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Информация о проекте</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="grid gap-6">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Название проекта <span className="text-red-500">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Интернет-магазин на React и Node.js"
                  required
                  className="h-11"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Описание проекта <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder="Расскажите о проекте: какую задачу решали, какие технологии использовали, какого результата достигли..."
                  className="w-full rounded-md border px-3 py-2 bg-background resize-none"
                  required
                />
                <p className="text-xs text-[#3F7F6E] mt-1">
                  Подробное описание поможет клиентам понять ваш опыт
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Ссылка на проект (необязательно)</label>
                <Input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://example.com или https://github.com/username/repo"
                  className="h-11"
                />
                <p className="text-xs text-[#3F7F6E] mt-1">
                  Ссылка на живой сайт или репозиторий GitHub
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Технологии и навыки</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Введите технологию и нажмите Enter или +"
                    className="h-10"
                  />
                  <Button type="button" onClick={handleAddTag} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-[#3F7F6E]">
                  Например: React, TypeScript, Node.js, PostgreSQL, Tailwind CSS
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Изображение проекта (необязательно)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {!imagePreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-[#6FE7C8] transition-colors"
                  >
                    <Upload className="h-12 w-12 mx-auto mb-3 text-[#3F7F6E]" />
                    <p className="text-sm text-[#3F7F6E] mb-1">Нажмите для загрузки изображения</p>
                    <p className="text-xs text-[#3F7F6E]">PNG, JPG, GIF до 5 МБ</p>
                  </div>
                ) : (
                  <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
                    <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="absolute top-3 right-3"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </motion.div>
  );
}
