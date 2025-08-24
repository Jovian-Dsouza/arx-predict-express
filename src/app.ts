import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

// Import routes
import healthRoutes from './routes/healthRoutes';
import heliusRoutes from './routes/heliusRoutes';
import marketRoutes from './routes/marketRoutes';
import priceRoutes from './routes/priceRoutes';

// Import middleware
import { errorHandler, notFound } from './middleware/errorHandler';

// Import database configuration
import { initRedis, closeConnections, checkDatabaseHealth } from './config/database';

// Import Solana event monitor and queue
import { SolanaEventMonitor, solanaEventQueue } from './services/solanaEventMonitor';
import { processSolanaEvent } from './services/solanaEventQueueProcessor';

// Import cron service
import cronService from './services/cronService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy configuration to fix X-Forwarded-For header issues
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check route (no rate limiting)
app.use('/health', healthRoutes);

// API routes
app.use('/api/helius', heliusRoutes);
app.use('/api/markets', marketRoutes);
app.use('/api/prices', priceRoutes);

// Root route
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Arx Predict Express Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
          endpoints: {
        health: '/health',
        chat: '/api/chat',
        helius: '/api/helius',
        webhook: '/api/helius/webhook',
        markets: '/api/markets',
        prices: '/api/prices',
        cron: '/health/cron',
        wallet: '/health/wallet',
      },
  });
});

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await closeConnections();
  await solanaEventQueue.close();
  cronService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await closeConnections();
  await solanaEventQueue.close();
  cronService.shutdown();
  process.exit(0);
});

// Initialize server
const startServer = async () => {
  try {
    // Try to initialize Redis connection, but don't fail if it's not available
    try {
      await initRedis();
      console.log('Redis connected successfully');
    } catch (redisError) {
      const errorMessage = redisError instanceof Error ? redisError.message : 'Unknown error';
      console.warn('⚠️  Redis connection failed, continuing without Redis:', errorMessage);
      console.log('💡 Start Redis with: redis-server');
    }

    // Check database connection
    try {
      const isDbHealthy = await checkDatabaseHealth();
      if (isDbHealthy) {
        console.log('✅ Database connection check passed');
      } else {
        console.warn('⚠️  Database connection check failed');
      }
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error';
      console.warn('⚠️  Database connection check failed, continuing without it:', errorMessage);
    }

    // Initialize Solana event monitor
    let solanaMonitor: SolanaEventMonitor | null = null;
    try {
      const solanaRpcUrl = process.env['SOLANA_RPC_URL'];
      const solanaProgramId = process.env['SOLANA_PROGRAM_ID'];
      
      if (solanaRpcUrl && solanaProgramId) {
        solanaMonitor = new SolanaEventMonitor();
        
        await solanaMonitor.initialize();
        await solanaMonitor.startMonitoring();
        
        // Set global reference for health checks
        globalThis.solanaMonitor = solanaMonitor;
        
        console.log('🔗 Solana event monitoring started successfully');
      } else {
        console.warn('⚠️  Solana monitoring not configured - missing SOLANA_RPC_URL or SOLANA_PROGRAM_ID');
      }
    } catch (solanaError) {
      const errorMessage = solanaError instanceof Error ? solanaError.message : 'Unknown error';
      console.warn('⚠️  Solana event monitoring failed, continuing without it:', errorMessage);
    }

    // Setup Solana event queue processor
    try {
      solanaEventQueue.process(processSolanaEvent);
      console.log('✅ Solana event queue processor started successfully');
    } catch (queueError) {
      const errorMessage = queueError instanceof Error ? queueError.message : 'Unknown error';
      console.warn('⚠️  Solana event queue processor failed, continuing without it:', errorMessage);
    }

    // Initialize cron service
    try {
      cronService.startAllJobs();
      console.log('✅ Cron service started successfully');
    } catch (cronError) {
      const errorMessage = cronError instanceof Error ? cronError.message : 'Unknown error';
      console.warn('⚠️  Cron service failed to start, continuing without it:', errorMessage);
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`💬 Chat API: http://localhost:${PORT}/api/chat`);
      console.log(`🔗 Helius API: http://localhost:${PORT}/api/helius`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      if (solanaMonitor) {
        console.log(`🔗 Solana monitoring: Active`);
      }
      console.log(`📋 Solana event queue: Active`);
      console.log(`⏰ Cron service: Active`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

export default app;
