-- Create Chocobar Database
-- Run this script as PostgreSQL superuser

-- Create database
CREATE DATABASE chocobar;

-- Create user (optional - adjust as needed)
-- CREATE USER chocobar_user WITH PASSWORD 'your_password_here';
-- GRANT ALL PRIVILEGES ON DATABASE chocobar TO chocobar_user;

-- Connect to the database
\c chocobar

-- Note: Prisma will create all tables via migrations
-- Just run: npm run prisma:migrate

