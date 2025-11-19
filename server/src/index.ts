import 'dotenv/config';
import { loadEnv } from './env';
import { connectDatabase, disconnectDatabase } from './prisma/client';
import { startServer } from './server';
import { logger } from './common/utils/logger';

async function bootstrap() {
  try {
    loadEnv();
    logger.info('Environment variables loaded');

    await connectDatabase();
    logger.info('Database connected');

    startServer();
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap();
