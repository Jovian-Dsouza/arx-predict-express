import { Router, Request, Response } from 'express';
import { checkDatabaseHealth } from '../config/database';
import { redisClient } from '../config/database';
import cronService from '../services/cronService';

// Global reference to the Solana monitor (will be set from app.ts)
declare global {
  var solanaMonitor: any;
}

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

    // Check Solana monitoring health
    let solanaHealth = false;
    let solanaDetails = null;
    try {
      const solanaMonitor = globalThis.solanaMonitor;
      if (solanaMonitor) {
        const status = solanaMonitor.getStatus();
        solanaHealth = status.isRunning;
        solanaDetails = {
          isRunning: status.isRunning,
          activeListeners: status.listeners,
          listenerCount: status.listeners.length
        };
      }
    } catch (solanaError) {
      console.warn('Solana monitoring health check failed:', solanaError);
      solanaHealth = false;
    }

    // Check cron service health
    let cronHealth = false;
    let cronDetails = null;
    try {
      const jobStatus = cronService.getJobStatus();
      cronHealth = jobStatus.length > 0 && jobStatus.some(job => job.isRunning);
      cronDetails = {
        totalJobs: jobStatus.length,
        runningJobs: jobStatus.filter(job => job.isRunning).length,
        jobs: jobStatus
      };
    } catch (cronError) {
      console.warn('Cron service health check failed:', cronError);
      cronHealth = false;
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
        solana: {
          status: solanaHealth ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          details: solanaDetails
        },
        cron: {
          status: cronHealth ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          details: cronDetails
        }
      },
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version,
      },
    };

    const overallHealth = dbHealth && redisHealth && solanaHealth && cronHealth;
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

// Solana monitoring status check
router.get('/solana', (_req: Request, res: Response) => {
  try {
    const solanaMonitor = globalThis.solanaMonitor;
    
    if (!solanaMonitor) {
      return res.status(503).json({
        success: false,
        status: 'not_configured',
        message: 'Solana monitoring not configured or failed to initialize',
        timestamp: new Date().toISOString(),
      });
    }

    const status = solanaMonitor.getStatus();
    
    return res.status(200).json({
      success: true,
      status: status.isRunning ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      details: {
        isRunning: status.isRunning,
        activeListeners: status.listeners,
        listenerCount: status.listeners.length
      }
    });

  } catch (error) {
    console.error('Solana monitoring health check error:', error);
    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Cron service status check
router.get('/cron', (_req: Request, res: Response) => {
  try {
    const jobStatus = cronService.getJobStatus();
    const isHealthy = jobStatus.length > 0 && jobStatus.some(job => job.isRunning);
    
    return res.status(200).json({
      success: true,
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      details: {
        totalJobs: jobStatus.length,
        runningJobs: jobStatus.filter(job => job.isRunning).length,
        jobs: jobStatus
      }
    });

  } catch (error) {
    console.error('Cron service health check error:', error);
    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
