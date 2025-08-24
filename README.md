# Arx Predict Express Server

A robust Express.js server built with TypeScript, featuring Redis, PostgreSQL (with Prisma), Ably chat functionality, and Helius webhook support for Solana blockchain events.

## 🚀 Features

- **Express.js with TypeScript** - Modern, type-safe server development
- **PostgreSQL + Prisma** - Robust database with type-safe ORM
- **Redis** - High-performance caching and session storage
- **Ably Chat** - Real-time chat functionality with channels
- **Helius Integration** - Solana blockchain webhook processing
- **Security** - Helmet, CORS, rate limiting, and validation
- **Health Monitoring** - Comprehensive health checks for all services
- **Error Handling** - Centralized error handling with detailed logging

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Redis 6+
- npm or yarn

## 🛠️ Installation

### Option 1: Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd arx-predict-express
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Database Configuration
   DATABASE_URL="postgresql://arx_user:arx_password@localhost:5432/arx_predict_db"
   
   # Redis Configuration
   REDIS_URL="redis://localhost:6379"
   
   # Ably Configuration
   ABLY_API_KEY="your_ably_api_key_here"
   ABLY_APP_ID="your_ably_app_id_here"
   
   # Helius Configuration
   HELIUS_API_KEY="your_helius_api_key_here"
   HELIUS_WEBHOOK_SECRET="your_webhook_secret_here"
   ```

3. **Start the development environment**
   ```bash
   # Using Makefile (recommended)
   make dev
   
   # Or using Docker Compose directly
   docker-compose up -d
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client and push schema
   make db-push
   
   # Seed the database with sample data
   make db-seed
   ```

5. **Access the services**
   - **Express Server**: http://localhost:3000
   - **pgAdmin**: http://localhost:5050 (admin@arx-predict.com / admin123)
   - **Redis Commander**: http://localhost:8081

### Option 2: Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd arx-predict-express
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Database Configuration
   DATABASE_URL="postgresql://username:password@localhost:5432/arx_predict_db"
   
   # Redis Configuration
   REDIS_URL="redis://localhost:6379"
   
   # Ably Configuration
   ABLY_API_KEY="your_ably_api_key_here"
   ABLY_APP_ID="your_ably_app_id_here"
   
   # Helius Configuration
   HELIUS_API_KEY="your_helius_api_key_here"
   HELIUS_WEBHOOK_SECRET="your_webhook_secret_here"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # (Optional) Run migrations
   npm run db:migrate
   
   # (Optional) Seed the database
   npm run db:seed
   ```

5. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

## 🗄️ Database Setup

### PostgreSQL
1. Create a new database:
   ```sql
   CREATE DATABASE arx_predict_db;
   ```

2. Update your `.env` file with the correct connection string.

### Redis
1. Start Redis server:
   ```bash
   redis-server
   ```

2. Verify connection:
   ```bash
   redis-cli ping
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | redis://localhost:6379 |
| `ABLY_API_KEY` | Ably API key | - |
| `ABLY_APP_ID` | Ably app ID | - |
| `HELIUS_API_KEY` | Helius API key | - |
| `HELIUS_WEBHOOK_SECRET` | Webhook verification secret | - |

## 📡 API Endpoints

### Health Checks
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health status
- `GET /health/database` - Database health
- `GET /health/redis` - Redis health

### Chat API
- `GET /api/chat/history/:channel` - Get chat history
- `POST /api/chat/send` - Send a message
- `POST /api/chat/token` - Generate Ably client token
- `GET /api/chat/channels` - Get available channels
- `GET /api/chat/user/:userId` - Get user messages

### Helius API
- `POST /api/helius/webhook` - Receive webhook events
- `GET /api/helius/events` - Get webhook events
- `GET /api/helius/transaction/:signature` - Get transaction details
- `GET /api/helius/account/:account` - Get account info

## 🔗 Helius Webhook Setup

1. **Get your Helius API key** from [helius.xyz](https://helius.xyz)

2. **Create a webhook** in the Helius dashboard:
   - URL: `https://yourdomain.com/api/helius/webhook`
   - Events: Select the events you want to monitor
   - Secret: Set a webhook secret for verification

3. **Update your `.env`** with the webhook secret

4. **The server will automatically**:
   - Verify webhook signatures
   - Store events in the database
   - Process events based on type
   - Publish real-time updates via Ably

## 💬 Ably Chat Setup

1. **Create an Ably account** at [ably.com](https://ably.com)

2. **Get your API key** from the Ably dashboard

3. **Update your `.env`** with the Ably credentials

4. **The server provides**:
   - Real-time message publishing
   - Channel management
   - Message history
   - Client token generation

## 🧪 Testing

```bash
# Health check
curl http://localhost:3000/health

# Send a chat message
curl -X POST http://localhost:3000/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello World!",
    "channel": "general",
    "userId": "user_id_here"
  }'

# Get chat history
curl http://localhost:3000/api/chat/history/general
```

## 📊 Monitoring

The server includes comprehensive health monitoring:

- **Service Health**: Database, Redis, and overall system status
- **Performance Metrics**: Memory usage, CPU usage, uptime
- **Error Logging**: Detailed error tracking with stack traces
- **Request Logging**: All incoming requests with timestamps

## 🚨 Error Handling

The server includes robust error handling:

- **Custom Error Classes**: Structured error responses
- **Validation**: Request validation with detailed error messages
- **Rate Limiting**: Protection against abuse
- **Graceful Shutdown**: Proper cleanup on server termination

## 🔒 Security Features

- **Helmet**: Security headers and CSP
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Request throttling per IP
- **Input Validation**: Request body and parameter validation
- **Webhook Verification**: HMAC signature verification for Helius webhooks

## 📁 Project Structure

```
src/
├── config/          # Database and service configurations
├── middleware/      # Express middleware
├── routes/          # API route handlers
├── services/        # Business logic services
├── prisma/          # Database schema and migrations
├── app.ts           # Express application setup
└── index.ts         # Server entry point
```

## 🐳 Docker

### Development Environment

The project includes a complete Docker setup for development:

```bash
# Start development environment
make dev

# View logs
make logs

# Stop services
make down

# Clean up everything
make clean
```

### Production Environment

```bash
# Start production environment
make prod

# Build production images
docker-compose -f docker-compose.prod.yml build
```

### Useful Docker Commands

```bash
# Check service status
make status

# View individual service logs
make postgres-logs
make redis-logs
make app-logs

# Access container shells
make shell
make postgres-shell
make redis-shell

# Database operations
make db-reset
make db-seed
make db-studio
```

### Docker Compose Files

- **`docker-compose.yml`** - Base configuration
- **`docker-compose.override.yml`** - Development overrides
- **`docker-compose.prod.yml`** - Production configuration

## 🚀 Deployment

### Docker Production

```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up -d

# Scale the application
docker-compose -f docker-compose.prod.yml up -d --scale app=3
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database and Redis URLs
3. Set secure webhook secrets
4. Configure CORS origins for production domains
5. Use production Docker Compose file

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Check the health endpoints for service status
- Review the logs for detailed error information

## 🔄 Updates

Keep your dependencies updated:
```bash
npm update
npm run db:generate  # After Prisma updates
```
