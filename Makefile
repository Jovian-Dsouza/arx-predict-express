# Makefile for Arx Predict Express Server

.PHONY: help build up down restart logs clean dev prod test db-reset db-seed

# Default target
help:
	@echo "Available commands:"
	@echo "  make help      - Show this help message"
	@echo "  make build     - Build all Docker images"
	@echo "  make up        - Start development environment"
	@echo "  make down      - Stop all services"
	@echo "  make restart   - Restart all services"
	@echo "  make logs      - Show logs for all services"
	@echo "  make clean     - Remove all containers, networks, and volumes"
	@echo "  make dev       - Start development environment with hot reload"
	@echo "  make prod      - Start production environment"
	@echo "  make test      - Run tests"
	@echo "  make db-reset  - Reset database (drop and recreate)"
	@echo "  make db-seed   - Seed database with sample data"

# Build all Docker images
build:
	docker-compose build

# Start development environment
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# Restart all services
restart:
	docker-compose restart

# Show logs for all services
logs:
	docker-compose logs -f

# Clean up everything
clean:
	docker-compose down -v --remove-orphans
	docker system prune -f

# Development environment with hot reload
dev:
	docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Production environment
prod:
	docker-compose -f docker-compose.prod.yml up -d

# Run tests
test:
	docker-compose exec app npm test

# Database operations
db-reset:
	docker-compose exec postgres psql -U arx_user -d arx_predict_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	docker-compose exec app npm run db:push

db-seed:
	docker-compose exec app npm run db:seed

# Individual service commands
postgres-logs:
	docker-compose logs -f postgres

redis-logs:
	docker-compose logs -f redis

app-logs:
	docker-compose logs -f app

# Health checks
health:
	@echo "Checking service health..."
	@curl -s http://localhost:3000/health | jq . || echo "App not responding"
	@docker-compose exec postgres pg_isready -U arx_user -d arx_predict_db || echo "PostgreSQL not ready"
	@docker-compose exec redis redis-cli ping || echo "Redis not responding"

# Development shortcuts
install:
	docker-compose exec app npm install

build-app:
	docker-compose exec app npm run build

# Database management
db-studio:
	docker-compose exec app npm run db:studio

db-migrate:
	docker-compose exec app npm run db:migrate

db-push:
	docker-compose exec app npm run db:push

# Container shell access
shell:
	docker-compose exec app sh

postgres-shell:
	docker-compose exec postgres psql -U arx_user -d arx_predict_db

redis-shell:
	docker-compose exec redis redis-cli

# Monitoring
status:
	docker-compose ps

top:
	docker-compose top

# Backup and restore
backup:
	docker-compose exec postgres pg_dump -U arx_user arx_predict_db > backup_$(shell date +%Y%m%d_%H%M%S).sql

restore:
	@echo "Usage: make restore FILE=backup_file.sql"
	@if [ -z "$(FILE)" ]; then echo "Please specify backup file: make restore FILE=backup_file.sql"; exit 1; fi
	docker-compose exec -T postgres psql -U arx_user -d arx_predict_db < $(FILE)
