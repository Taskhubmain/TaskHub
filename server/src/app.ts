import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { getEnv } from './env';
import { logger } from './common/utils/logger';
import { errorHandler } from './common/middleware/error';
import { createRateLimiter } from './common/middleware/rateLimit';
import { swaggerSpec } from './swagger';

import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import profilesRoutes from './modules/profiles/profiles.routes';
import ordersRoutes from './modules/orders/orders.routes';
import tasksRoutes from './modules/tasks/tasks.routes';
import proposalsRoutes from './modules/proposals/proposals.routes';
import dealsRoutes from './modules/deals/deals.routes';
import threadsRoutes from './modules/messages/threads.routes';
import messagesRoutes from './modules/messages/messages.routes';
import reviewsRoutes from './modules/reviews/reviews.routes';
import favoritesRoutes from './modules/favorites/favorites.routes';
import walletRoutes from './modules/wallet/wallet.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import disputesRoutes from './modules/disputes/disputes.routes';

export function createApp() {
  const app = express();
  const env = getEnv();

  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(pinoHttp({ logger }));
  app.use(createRateLimiter());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  const apiRouter = express.Router();
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/users', usersRoutes);
  apiRouter.use('/profile', profilesRoutes);
  apiRouter.use('/orders', ordersRoutes);
  apiRouter.use('/tasks', tasksRoutes);
  apiRouter.use('/proposals', proposalsRoutes);
  apiRouter.use('/deals', dealsRoutes);
  apiRouter.use('/threads', threadsRoutes);
  apiRouter.use('/threads', messagesRoutes);
  apiRouter.use('/reviews', reviewsRoutes);
  apiRouter.use('/favorites', favoritesRoutes);
  apiRouter.use('/wallet', walletRoutes);
  apiRouter.use('/notifications', notificationsRoutes);
  apiRouter.use('/disputes', disputesRoutes);

  app.use('/api/v1', apiRouter);

  app.use(errorHandler);

  return app;
}
