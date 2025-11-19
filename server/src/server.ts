import { createServer } from 'http';
import { createApp } from './app';
import { setupSocketIO } from './common/sockets/gateway';
import { getEnv } from './env';
import { logger } from './common/utils/logger';

export function startServer() {
  const env = getEnv();
  const app = createApp();
  const httpServer = createServer(app);

  setupSocketIO(httpServer);

  const port = parseInt(env.PORT, 10);

  httpServer.listen(port, () => {
    logger.info(`Server running on http://localhost:${port}`);
    logger.info(`API docs available at http://localhost:${port}/docs`);
    logger.info(`Health check at http://localhost:${port}/health`);
  });

  const shutdown = async () => {
    logger.info('Shutting down gracefully...');
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return httpServer;
}
