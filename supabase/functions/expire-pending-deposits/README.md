# Expire Pending Deposits

Эта Edge Function автоматически помечает просроченные депозиты как истёкшие.

## Назначение

Если пользователь начал пополнение кошелька (deposit через Stripe), но не завершил оплату в течение 20 минут, транзакция автоматически переводится в статус `expired` с `provider_status: timeout`.

## Логика работы

1. Находит все транзакции где:
   - `type = 'deposit'`
   - `status = 'pending'`
   - `created_at <= now() - 20 minutes`

2. Обновляет найденные транзакции:
   - `status = 'expired'`
   - `provider_status = 'timeout'`
   - `updated_at = now()`

3. Возвращает статистику:
   ```json
   {
     "processed": 5,
     "updated": 5,
     "message": "Updated 5 expired deposits"
   }
   ```

## Настройка расписания

### Через Supabase Dashboard:

1. Перейдите в **Edge Functions** → **expire-pending-deposits**
2. Откройте вкладку **Settings**
3. Включите **Scheduled Invocations**
4. Укажите cron expression: `*/5 * * * *` (каждые 5 минут)
5. Сохраните изменения

### Через CLI:

```bash
supabase functions schedule expire-pending-deposits --cron "*/5 * * * *"
```

### Примеры cron expressions:

- `*/5 * * * *` - каждые 5 минут
- `*/10 * * * *` - каждые 10 минут
- `0 * * * *` - каждый час в начале часа

## Ручной запуск для тестирования

Вы можете вручную запустить функцию через HTTP:

```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/expire-pending-deposits' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

Или через Supabase Dashboard:
1. Перейдите в **Edge Functions** → **expire-pending-deposits**
2. Нажмите **Invoke function**

## Логи

Функция выводит в консоль:
- Количество найденных просроченных депозитов
- Детали каждого депозита (ID, сумма, дата создания)
- Количество успешно обновлённых транзакций
- Любые ошибки при выполнении

Просмотр логов через CLI:
```bash
supabase functions logs expire-pending-deposits
```

## Безопасность

- Использует `SUPABASE_SERVICE_ROLE_KEY` для обхода RLS
- Автоматически обрабатывает только pending депозиты старше 20 минут
- Не влияет на успешные или уже обработанные транзакции
