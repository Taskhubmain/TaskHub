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

const PaymentsInfoPage: React.FC = () => {
  return (
    <motion.div
      key="payments"
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
              <h1 className="weglot-translate">Политика платежей и возвратов</h1>
              <p><strong className="weglot-translate">Дата вступления в силу:</strong> <span className="weglot-translate">12 ноября 2025 года</span></p>
              <p><strong className="weglot-translate">Домен:</strong> https://taskhub.space</p>

              <h2 className="weglot-translate">1. Общие положения</h2>
              <p className="weglot-translate">
                Платформа TaskHub обеспечивает безопасные и прозрачные финансовые расчёты между Заказчиком и Исполнителем
                через систему Escrow и платёжный сервис Stripe. Настоящая Политика описывает порядок проведения платежей,
                условия возврата средств и механизм работы системы безопасных сделок.
              </p>

              <h2 className="weglot-translate">2. Порядок оплаты</h2>
              <p className="weglot-translate">
                Процесс оплаты на платформе происходит следующим образом:
              </p>
              <ol className="weglot-translate">
                <li>Заказчик создаёт заказ или принимает предложение от Исполнителя</li>
                <li>Заказчик вносит оплату, средства резервируются в системе Escrow</li>
                <li>Исполнитель выполняет работу в соответствии с условиями сделки</li>
                <li>Заказчик проверяет и подтверждает выполнение работы</li>
                <li>После подтверждения средства автоматически переводятся Исполнителю за вычетом комиссии платформы</li>
              </ol>
              <p className="weglot-translate">
                Все платежи обрабатываются через Stripe, который соответствует стандарту безопасности PCI-DSS.
                TaskHub не хранит банковские данные пользователей.
              </p>

              <h2 className="weglot-translate">3. Система Escrow</h2>
              <p className="weglot-translate">
                Escrow — это механизм безопасной сделки, при котором средства заказчика блокируются на специальном счёте
                до момента успешного выполнения работы. Это защищает обе стороны:
              </p>
              <ul className="weglot-translate">
                <li><strong>Заказчика</strong> — от недобросовестных исполнителей, так как оплата произойдёт только после подтверждения работы</li>
                <li><strong>Исполнителя</strong> — от неоплаты, так как средства уже зарезервированы и гарантированно будут переведены</li>
              </ul>

              <h2 className="weglot-translate">4. Возвраты средств</h2>
              <p className="weglot-translate">
                Возврат средств возможен в следующих случаях:
              </p>
              <ul className="weglot-translate">
                <li><strong>Ошибочный платёж</strong> — если оплата была произведена по ошибке</li>
                <li><strong>Невыполнение задания</strong> — если исполнитель не выполнил работу в срок или отказался от сделки</li>
                <li><strong>Нарушение условий</strong> — если работа не соответствует заявленным требованиям и стороны не пришли к соглашению</li>
                <li><strong>Технический сбой</strong> — если произошла техническая ошибка при обработке платежа</li>
              </ul>
              <p className="weglot-translate">
                Возврат средств производится на тот же способ оплаты, который использовался при внесении средств.
                Срок возврата составляет от 5 до 14 рабочих дней в зависимости от платёжной системы.
              </p>

              <h2 className="weglot-translate">5. Комиссии платформы</h2>
              <p className="weglot-translate">
                Платформа TaskHub взимает комиссию с каждой завершённой сделки:
              </p>
              <ul className="weglot-translate">
                <li>Комиссия удерживается автоматически при выплате средств исполнителю</li>
                <li>Размер комиссии указывается при создании сделки и может варьироваться</li>
                <li>Комиссия покрывает расходы на обработку платежей, поддержку платформы и развитие сервиса</li>
                <li>Администрация вправе изменять размер комиссии без предварительного уведомления</li>
              </ul>
              <p className="weglot-translate">
                Текущие тарифы комиссии доступны в разделе информации о сделке.
              </p>

              <h2 className="weglot-translate">6. Пополнение кошелька</h2>
              <p className="weglot-translate">
                Пользователи могут пополнять внутренний кошелёк платформы для быстрых платежей:
              </p>
              <ul className="weglot-translate">
                <li>Минимальная сумма пополнения — $10</li>
                <li>Максимальная сумма пополнения — $10,000</li>
                <li>Средства доступны сразу после успешной оплаты</li>
                <li>Баланс кошелька отображается в личном кабинете</li>
              </ul>

              <h2 className="weglot-translate">7. Вывод средств</h2>
              <p className="weglot-translate">
                Исполнители могут выводить заработанные средства на свои банковские счета:
              </p>
              <ul className="weglot-translate">
                <li>Минимальная сумма для вывода — $20</li>
                <li>Вывод осуществляется через Stripe Connect</li>
                <li>Требуется верификация аккаунта Stripe</li>
                <li>Срок обработки запроса на вывод — до 3 рабочих дней</li>
                <li>Могут применяться комиссии платёжной системы</li>
              </ul>

              <h2 className="weglot-translate">8. Споры и разногласия</h2>
              <p className="weglot-translate">
                При возникновении споров относительно выполнения работы или качества результата:
              </p>
              <ol className="weglot-translate">
                <li>Стороны обязаны попытаться решить вопрос мирным путём через переговоры</li>
                <li>При отсутствии согласия можно открыть спор через систему платформы</li>
                <li>Администрация рассматривает спор на основании предоставленных доказательств</li>
                <li>Решение принимается в течение 7 рабочих дней с момента открытия спора</li>
                <li>Решение администрации является окончательным</li>
              </ol>

              <h2 className="weglot-translate">9. Ответственность и безопасность</h2>
              <p className="weglot-translate">
                TaskHub принимает все необходимые меры для обеспечения безопасности финансовых операций:
              </p>
              <ul className="weglot-translate">
                <li>Использование защищённого HTTPS-соединения</li>
                <li>Шифрование всех финансовых данных</li>
                <li>Соответствие стандартам PCI-DSS через Stripe</li>
                <li>Мониторинг подозрительных транзакций</li>
                <li>Двухфакторная аутентификация для защиты аккаунтов</li>
              </ul>
              <p className="weglot-translate">
                TaskHub не несёт ответственности за убытки, возникшие в результате действий пользователей,
                нарушения ими условий соглашения или предоставления недостоверных данных.
              </p>

              <h2 className="weglot-translate">10. Блокировка средств</h2>
              <p className="weglot-translate">
                Администрация платформы вправе приостанавливать или блокировать сделки в следующих случаях:
              </p>
              <ul className="weglot-translate">
                <li>Подозрение на мошенничество или отмывание денег</li>
                <li>Нарушение условий пользовательского соглашения</li>
                <li>Получение жалоб от других пользователей</li>
                <li>Требование правоохранительных органов</li>
                <li>Технические проблемы с платёжной системой</li>
              </ul>

              <h2 className="weglot-translate">11. Налогообложение</h2>
              <p className="weglot-translate">
                Пользователи самостоятельно несут ответственность за уплату налогов в соответствии с законодательством
                своей страны. TaskHub предоставляет историю транзакций для целей налоговой отчётности.
              </p>

              <h2 className="weglot-translate">12. Изменения политики</h2>
              <p className="weglot-translate">
                Администрация вправе вносить изменения в настоящую Политику без предварительного уведомления.
                Актуальная версия всегда доступна на данной странице. Рекомендуем периодически проверять обновления.
              </p>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 weglot-translate">
                  Если у вас возникли вопросы относительно платежей, возвратов или работы системы Escrow,
                  свяжитесь с нашей службой поддержки через форму обратной связи на сайте.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </motion.div>
  );
};

export default PaymentsInfoPage;
