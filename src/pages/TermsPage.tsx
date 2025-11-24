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

const TermsPage: React.FC = () => {
  return (
    <motion.div
      key="terms"
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
              <h1 className="weglot-translate">Пользовательское соглашение</h1>
              <p><strong className="weglot-translate">Дата вступления в силу:</strong> <span className="weglot-translate">12 ноября 2025 года</span></p>
              <p><strong className="weglot-translate">Домен:</strong> https://taskhub.space</p>

              <h2 className="weglot-translate">1. Общие положения</h2>
              <p className="weglot-translate">
                Настоящее Пользовательское соглашение регулирует отношения между владельцем онлайн-платформы TaskHub
                (далее — «Платформа») и пользователем (далее — «Пользователь»). Используя Платформу, Пользователь
                подтверждает согласие с условиями Соглашения.
              </p>

              <h2 className="weglot-translate">2. Регистрация и аккаунт</h2>
              <p className="weglot-translate">
                Пользователь обязан указать достоверные данные при регистрации. Администрация вправе ограничить или
                удалить аккаунт при нарушении правил.
              </p>

              <h2 className="weglot-translate">3. Статусы пользователей</h2>
              <p className="weglot-translate">
                На Платформе предусмотрены три роли: Исполнитель, Заказчик и Администратор. Каждая роль имеет
                определённые права и обязанности в рамках использования Платформы.
              </p>

              <h2 className="weglot-translate">4. Условия размещения заданий и исполнения</h2>
              <p className="weglot-translate">
                Платежи осуществляются через систему Escrow. Средства блокируются до завершения сделки. После успешного
                выполнения работы и подтверждения заказчиком, средства передаются исполнителю за вычетом комиссии платформы.
              </p>

              <h2 className="weglot-translate">5. Ограничения</h2>
              <p className="weglot-translate">
                Запрещено размещение незаконного контента, фишинг, спам, мошенничество, передача аккаунта третьим лицам.
                Любые действия, нарушающие законодательство или правила платформы, влекут за собой блокировку аккаунта.
              </p>

              <h2 className="weglot-translate">6. Ответственность</h2>
              <p className="weglot-translate">
                TaskHub не несет ответственности за убытки, возникшие в результате действий пользователей. Все финансовые
                операции проходят через платежную систему Stripe, которая соответствует стандартам безопасности PCI-DSS.
              </p>

              <h2 className="weglot-translate">7. Комиссии платформы</h2>
              <p className="weglot-translate">
                Платформа взимает комиссию с каждой завершённой сделки. Размер комиссии указывается при создании сделки
                и может быть изменён администрацией без предварительного уведомления.
              </p>

              <h2 className="weglot-translate">8. Интеллектуальная собственность</h2>
              <p className="weglot-translate">
                Все права на результаты работы принадлежат исполнителю до момента полной оплаты заказчиком. После оплаты
                права переходят к заказчику в соответствии с условиями конкретной сделки.
              </p>

              <h2 className="weglot-translate">9. Изменения условий</h2>
              <p className="weglot-translate">
                TaskHub вправе изменять условия соглашения без предварительного уведомления. Актуальная версия всегда
                доступна на странице /terms. Продолжение использования платформы после внесения изменений означает
                принятие новых условий.
              </p>

              <h2 className="weglot-translate">10. Разрешение споров</h2>
              <p className="weglot-translate">
                Споры между пользователями решаются путем переговоров с возможным привлечением службы поддержки платформы.
                При невозможности урегулирования спора мирным путём, вопрос решается в судебном порядке в юрисдикции,
                определяемой Администрацией.
              </p>

              <h2 className="weglot-translate">11. Конфиденциальность</h2>
              <p className="weglot-translate">
                Обработка персональных данных осуществляется в соответствии с Политикой конфиденциальности, доступной
                на странице /privacy.
              </p>

              <h2 className="weglot-translate">12. Прекращение использования</h2>
              <p className="weglot-translate">
                Пользователь вправе в любой момент прекратить использование Платформы путём удаления аккаунта.
                Администрация также вправе заблокировать или удалить аккаунт пользователя при нарушении условий соглашения.
              </p>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 weglot-translate">
                  Если у вас есть вопросы по данному соглашению, свяжитесь с нами через форму обратной связи на сайте.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </motion.div>
  );
};

export default TermsPage;
