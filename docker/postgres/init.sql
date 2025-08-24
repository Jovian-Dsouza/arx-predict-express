-- Initialize the database with proper permissions
-- This script runs when the PostgreSQL container starts for the first time

-- Create the database if it doesn't exist (already handled by POSTGRES_DB env var)
-- CREATE DATABASE arx_predict_db;

-- Grant all privileges to the user
GRANT ALL PRIVILEGES ON DATABASE arx_predict_db TO arx_user;

-- Connect to the database
\c arx_predict_db;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO arx_user;

-- Grant table privileges (will be applied to future tables)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO arx_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO arx_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO arx_user;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Database arx_predict_db initialized successfully for user arx_user';
END $$;
