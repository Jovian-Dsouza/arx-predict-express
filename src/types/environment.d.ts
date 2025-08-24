declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      DATABASE_URL: string;
      REDIS_URL: string;
      REDIS_HOST: string;
      REDIS_PORT: string;
      REDIS_PASSWORD?: string;
      ABLY_API_KEY: string;
      ABLY_APP_ID: string;
      HELIUS_API_KEY: string;
      HELIUS_WEBHOOK_SECRET: string;
      JWT_SECRET?: string;
      RATE_LIMIT_WINDOW_MS?: string;
      RATE_LIMIT_MAX_REQUESTS?: string;
    }
  }
}

export {};
