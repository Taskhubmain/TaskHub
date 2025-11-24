import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../components/ui/card';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5
};

const PrivacyPage: React.FC = () => {
  return (
    <motion.div
      key="privacy"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen bg-gradient-to-b from-[#EFFFF8]/30 to-background"
    >
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <Card className="shadow-lg border-[#6FE7C8]/20">
          <CardContent className="p-8 md:p-12">
            <div className="legal-content prose prose-lg max-w-none">
              <h1 className="weglot-translate">Политика конфиденциальности</h1>
              <p><strong className="weglot-translate">Дата вступления в силу:</strong> <span className="weglot-translate">12 ноября 2025 года</span></p>
              <p><strong className="weglot-translate">Домен:</strong> https://taskhub.space</p>

              <h2 className="weglot-translate">1. Общие положения</h2>
              <p className="weglot-translate">
                Настоящая Политика конфиденциальности описывает, как Платформа TaskHub собирает, обрабатывает,
                использует и защищает персональные данные Пользователей в соответствии с применимым законодательством
                о защите данных.
              </p>

              <h2 className="weglot-translate">2. Сбор данных</h2>
              <p className="weglot-translate">
                Мы собираем следующие категории данных:
              </p>
              <ul className="weglot-translate">
                <li>Имя и фамилия</li>
                <li>Адрес электронной почты (email)</li>
                <li>Платежные данные (обрабатываются через Stripe)</li>
                <li>IP-адрес и данные об устройстве</li>
                <li>Файлы cookie для улучшения работы сайта</li>
                <li>Контент, созданный пользователем (профили, заказы, задания, сообщения)</li>
                <li>История транзакций и сделок</li>
              </ul>

              <h2 className="weglot-translate">3. Использование данных</h2>
              <p className="weglot-translate">
                Собранные данные используются для следующих целей:
              </p>
              <ul className="weglot-translate">
                <li>Обеспечение работы Платформы и предоставление услуг</li>
                <li>Обработка платежей и финансовых транзакций</li>
                <li>Связь с пользователями и техническая поддержка</li>
                <li>Улучшение качества сервиса и пользовательского опыта</li>
                <li>Аналитика и статистика использования платформы</li>
                <li>Предотвращение мошенничества и обеспечение безопасности</li>
                <li>Выполнение юридических обязательств</li>
              </ul>

              <h2 className="weglot-translate">4. Передача третьим лицам</h2>
              <p className="weglot-translate">
                Мы передаём персональные данные только в следующих случаях:
              </p>
              <ul className="weglot-translate">
                <li><strong>Stripe</strong> — для обработки платежей (PCI-DSS стандарт)</li>
                <li><strong>Supabase</strong> — для хранения данных в защищённой базе данных</li>
                <li><strong>Weglot</strong> — для автоматического перевода интерфейса</li>
                <li><strong>Государственные органы</strong> — по официальному запросу в соответствии с законодательством</li>
              </ul>
              <p className="weglot-translate">
                Мы не продаём и не передаём персональные данные третьим лицам для маркетинговых целей.
              </p>

              <h2 className="weglot-translate">5. Cookies и аналитика</h2>
              <p className="weglot-translate">
                Мы используем файлы cookie для следующих целей:
              </p>
              <ul className="weglot-translate">
                <li>Управление сеансами пользователей (session management)</li>
                <li>Персонализация пользовательского опыта</li>
                <li>Анализ трафика и поведения пользователей</li>
                <li>Запоминание языковых предпочтений</li>
              </ul>
              <p className="weglot-translate">
                Пользователь может отключить cookie в настройках браузера, но это может повлиять на функциональность сайта.
              </p>

              <h2 className="weglot-translate">6. Хранение данных</h2>
              <p className="weglot-translate">
                Все персональные данные хранятся на защищённых серверах с использованием современных методов шифрования
                и защиты. Мы применяем технические и организационные меры для предотвращения несанкционированного доступа,
                изменения, раскрытия или уничтожения данных.
              </p>
              <p className="weglot-translate">
                Данные хранятся в течение срока, необходимого для достижения целей обработки, или в соответствии
                с требованиями законодательства.
              </p>

              <h2 className="weglot-translate">7. Права пользователей</h2>
              <p className="weglot-translate">
                В соответствии с законодательством о защите данных, пользователи имеют следующие права:
              </p>
              <ul className="weglot-translate">
                <li><strong>Право на доступ</strong> — запросить копию своих персональных данных</li>
                <li><strong>Право на исправление</strong> — исправить неточные или неполные данные</li>
                <li><strong>Право на удаление</strong> — запросить удаление персональных данных</li>
                <li><strong>Право на ограничение обработки</strong> — ограничить способы использования данных</li>
                <li><strong>Право на переносимость</strong> — получить данные в структурированном формате</li>
                <li><strong>Право на возражение</strong> — возразить против обработки данных</li>
              </ul>
              <p className="weglot-translate">
                Для реализации своих прав обратитесь к нам через форму обратной связи на сайте.
              </p>

              <h2 className="weglot-translate">8. Безопасность данных несовершеннолетних</h2>
              <p className="weglot-translate">
                Наша Платформа не предназначена для использования лицами младше 18 лет. Мы не собираем осознанно
                персональные данные несовершеннолетних. Если вы узнали, что несовершеннолетний предоставил нам свои
                данные, немедленно свяжитесь с нами для удаления информации.
              </p>

              <h2 className="weglot-translate">9. Международная передача данных</h2>
              <p className="weglot-translate">
                Ваши данные могут обрабатываться на серверах, расположенных в разных странах. Мы обеспечиваем
                соблюдение стандартов защиты данных независимо от местоположения серверов.
              </p>

              <h2 className="weglot-translate">10. Изменения политики</h2>
              <p className="weglot-translate">
                Мы вправе обновлять настоящую Политику конфиденциальности. Все изменения публикуются на данной странице
                с указанием даты вступления в силу. Рекомендуем периодически проверять данную страницу для ознакомления
                с актуальной версией.
              </p>

              <h2 className="weglot-translate">11. Контактная информация</h2>
              <p className="weglot-translate">
                Если у вас возникли вопросы относительно обработки ваших персональных данных или вы хотите воспользоваться
                своими правами, свяжитесь с нами через форму обратной связи на сайте или по электронной почте.
              </p>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 weglot-translate">
                  Мы серьёзно относимся к защите ваших персональных данных и прилагаем все усилия для обеспечения их
                  безопасности в соответствии с современными стандартами.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </motion.div>
  );
};

export default PrivacyPage;
