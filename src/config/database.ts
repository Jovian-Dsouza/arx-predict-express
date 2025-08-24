import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Prisma Client
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Redis Client
const redisOptions: any = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
};

if (process.env.REDIS_PASSWORD) {
  redisOptions.password = process.env.REDIS_PASSWORD;
}

export const redisClient = createClient(redisOptions);

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

// Initialize Redis connection
export const initRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
};

// Graceful shutdown
export const closeConnections = async (): Promise<void> => {
  await prisma.$disconnect();
  await redisClient.quit();
};

// Health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redisClient.ping();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};
