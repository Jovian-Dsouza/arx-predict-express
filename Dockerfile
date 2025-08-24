# Multi-stage build for production optimization
FROM node:24.5.0-alpine AS base

# Install dependencies for node-gyp and other native modules
# Use OpenSSL 3.x which is compatible with Node.js 24 and Prisma
RUN apk add --no-cache python3 make g++ curl openssl openssl-dev

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies needed for building)
RUN npm ci

# # Development stage
# FROM base AS development

# # Install development dependencies
# RUN npm ci

# # Copy source code
# COPY . .

# # Generate Prisma client
# RUN npx prisma generate

# # Expose port
# EXPOSE 3000

# # Start development server with migrations
# CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]

# Production stage
FROM base AS production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Remove source files, dev dependencies, and keep only production dependencies
# Keep Prisma schema for migrations, but remove other unnecessary files
RUN npm prune --production && rm -rf src/ docker/ .env.example README.md

# Expose port
EXPOSE 3001

# Start production server with migrations
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
