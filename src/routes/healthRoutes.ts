import { Router, Request, Response } from 'express';
import { checkDatabaseHealth } from '../config/database';
import { redisClient } from '../config/database';

const router = Router();

// Basic health check
router.get('/', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Detailed health check
router.get('/detailed', async (_req: Request, res: Response) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    
    // Check Redis health, but don't fail if Redis is not available
    let redisHealth = false;
    try {
      redisHealth = await redisClient.ping().then(() => true).catch(() => false);
    } catch (redisError) {
      console.warn('Redis health check failed:', redisError);
      redisHealth = false;
    }

    const healthStatus = {
      success: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: dbHealth ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
        },
        redis: {
          status: redisHealth ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
        },
      },
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version,
      },
    };

    const overallHealth = dbHealth && redisHealth;
    const statusCode = overallHealth ? 200 : 503;

    return res.status(statusCode).json(healthStatus);

  } catch (error) {
    console.error('Health check error:', error);
    return res.status(503).json({
      success: false,
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Database health check
router.get('/database', async (_req: Request, res: Response) => {
  try {
    const isHealthy = await checkDatabaseHealth();
    
    return res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Database health check error:', error);
    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Redis health check
router.get('/redis', async (_req: Request, res: Response) => {
  try {
    const isHealthy = await redisClient.ping().then(() => true).catch(() => false);
    
    return res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Redis health check error:', error);
    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
