import { useState, useEffect } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { MediaEditor } from '../components/MediaEditor';

const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%236FE7C8"/%3E%3Ctext x="100" y="140" font-family="Arial,sans-serif" font-size="120" font-weight="bold" fill="%233F7F6E" text-anchor="middle"%3ET%3C/text%3E%3C/svg%3E';

export default function ProfileCompletionPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(DEFAULT_AVATAR);
  const [skillInput, setSkillInput] = useState('');
  const [showMediaEditor, setShowMediaEditor] = useState(false);
  const [fileToEdit, setFileToEdit] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    specialty: '',
    experience_years: '',
    age: '',
    rate_min: '',
    rate_max: '',
    currency: 'USD',
    skills: [] as string[],
    location: '',
    contact_telegram: '',
    contact_gmail: '',
    bio: '',
  });

  const [ageError, setAgeError] = useState('');
  const [experienceError, setExperienceError] = useState('');

  useEffect(() => {
    if (!user) {
      window.location.hash = '/login';
      return;
    }

    // Load existing profile data if available (e.g., from OAuth)
    const loadProfile = async () => {
      const supabase = getSupabase();
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        // Pre-fill form with existing data
        if (profile.avatar_url) {
          setAvatarPreview(profile.avatar_url);
        }

        setFormData({
          specialty: profile.specialty || '',
          experience_years: profile.experience_years?.toString() || '',
          age: profile.age?.toString() || '',
          rate_min: profile.rate_min?.toString() || '',
          rate_max: profile.rate_max?.toString() || '',
          currency: profile.currency || 'USD',
          skills: profile.skills || [],
          location: profile.location || '',
          contact_telegram: profile.contact_telegram || '',
          contact_gmail: profile.contact_gmail || '',
          bio: profile.bio || '',
        });
      }
    };

    loadProfile();
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setFileToEdit(file);
        setShowMediaEditor(true);
      } else {
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleMediaSave = (editedFile: File) => {
    setAvatarFile(editedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(editedFile);
    setShowMediaEditor(false);
    setFileToEdit(null);
  };

  const handleMediaCancel = () => {
    setShowMediaEditor(false);
    setFileToEdit(null);
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      if (formData.skills.length >= 10) {
        alert('Максимум 10 навыков');
        return;
      }
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      });
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const supabase = getSupabase();
      let avatarUrl = '';

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from('portfolio-images')
          .upload(fileName, avatarFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('portfolio-images')
          .getPublicUrl(fileName);

        avatarUrl = urlData.publicUrl;
      }

      const updateData: any = {
        specialty: formData.specialty || 'не указана',
        experience_years: parseInt(formData.experience_years) || 0,
        age: parseInt(formData.age) || null,
        rate_min: parseInt(formData.rate_min) || 0,
        rate_max: parseInt(formData.rate_max) || 0,
        currency: formData.currency,
        skills: formData.skills.length > 0 ? formData.skills : ['не указаны'],
        location: formData.location || 'не указана',
        contact_telegram: formData.contact_telegram || 'не указан',
        contact_gmail: formData.contact_gmail || 'не указан',
        bio: formData.bio || 'Привет! Я использую TaskHub',
        profile_completed: true,
      };

      if (avatarUrl) {
        updateData.avatar_url = avatarUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      window.location.hash = '/me';
    } catch (error) {
      console.error('Error completing profile:', error);
      alert('Ошибка при сохранении профиля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Завершите настройку профиля
            </h1>
            <p className="text-gray-600">
              Расскажите о себе, чтобы клиенты могли найти вас
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-[#6FE7C8] flex items-center justify-center overflow-hidden">
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-[#3F7F6E] text-white p-2 rounded-full cursor-pointer hover:bg-[#2F6F5E] transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="mt-2 text-sm text-gray-500">Загрузите фото профиля</p>
            </div>

            {/* Specialty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Специальность *
              </label>
              <input
                type="text"
                required
                value={formData.specialty}
                onChange={(e) =>
                  setFormData({ ...formData, specialty: e.target.value })
                }
                placeholder="Например: Full-stack разработчик, UI/UX дизайнер"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3F7F6E] focus:border-transparent"
              />
            </div>

            {/* Experience and Age */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Опыт работы (лет) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="40"
                  value={formData.experience_years}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, experience_years: value });
                    if (parseInt(value) > 40) {
                      setExperienceError('Установите корректный опыт работы');
                    } else {
                      setExperienceError('');
                    }
                  }}
                  placeholder="0"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#3F7F6E] focus:border-transparent ${
                    experienceError ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {experienceError ? (
                  <p className="mt-1 text-xs text-red-600">{experienceError}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">Максимум 40 лет</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Возраст
                </label>
                <input
                  type="number"
                  min="16"
                  max="80"
                  value={formData.age}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, age: value });
                    if (parseInt(value) > 80) {
                      setAgeError('Установите корректный возраст');
                    } else {
                      setAgeError('');
                    }
                  }}
                  placeholder="Не указано"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#3F7F6E] focus:border-transparent ${
                    ageError ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {ageError && <p className="mt-1 text-xs text-red-600">{ageError}</p>}
              </div>
            </div>

            {/* Rates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Стоимость работ *
              </label>
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="number"
                  required
                  min="0"
                  max="1000"
                  value={formData.rate_min}
                  onChange={(e) =>
                    setFormData({ ...formData, rate_min: e.target.value })
                  }
                  placeholder="Мин."
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3F7F6E] focus:border-transparent"
                />
                <input
                  type="number"
                  required
                  min="0"
                  max="1000"
                  value={formData.rate_max}
                  onChange={(e) =>
                    setFormData({ ...formData, rate_max: e.target.value })
                  }
                  placeholder="Макс."
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3F7F6E] focus:border-transparent"
                />
                <select
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3F7F6E] focus:border-transparent"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="RUB">RUB</option>
                  <option value="KZT">KZT</option>
                </select>
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Навыки и технологии *
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  placeholder="Добавьте навык"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3F7F6E] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  disabled={formData.skills.length >= 10}
                  className="px-6 py-3 bg-[#3F7F6E] text-white rounded-lg hover:bg-[#2F6F5E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="hidden sm:inline">Добавить</span>
                  <span className="sm:hidden">+</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-[#3F7F6E]/10 text-[#3F7F6E] rounded-full text-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
              {formData.skills.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Добавьте хотя бы один навык
                </p>
              )}
              {formData.skills.length > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  {formData.skills.length} / 10 навыков
                </p>
              )}
            </div>

            {/* About Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                О себе (до 700 символов)
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={6}
                maxLength={700}
                placeholder="Расскажите о своём опыте, навыках и интересах..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3F7F6E] focus:border-transparent resize-none"
              />
              <div className="text-xs text-gray-500 text-right mt-1">
                {formData.bio.length} / 700
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Контактная информация
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Локация
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="Город, страна"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3F7F6E] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telegram
                  </label>
                  <input
                    type="text"
                    value={formData.contact_telegram}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_telegram: e.target.value })
                    }
                    placeholder="@username"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3F7F6E] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gmail
                  </label>
                  <input
                    type="email"
                    value={formData.contact_gmail}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_gmail: e.target.value })
                    }
                    placeholder="example@gmail.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3F7F6E] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading || formData.skills.length === 0 || !!ageError || !!experienceError}
                className="w-full py-4 bg-[#3F7F6E] text-white rounded-lg font-semibold hover:bg-[#2F6F5E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Сохранение...' : 'Завершить настройку профиля'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showMediaEditor && fileToEdit && (
        <MediaEditor file={fileToEdit} onSave={handleMediaSave} onCancel={handleMediaCancel} />
      )}
    </div>
  );
}
