# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install dependencies for node-gyp and other native modules
RUN apk add --no-cache python3 make g++ curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development

# Install development dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Remove source files and dev dependencies
RUN rm -rf src/ prisma/ docker/ .env.example README.md

# Expose port
EXPOSE 3000

# Start production server
CMD ["npm", "start"]
