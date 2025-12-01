# 🗄️ Database Setup Guide

## Quick Setup

Since I cannot run sudo commands that require a password, please run one of these commands manually:

### Option 1: Using psql (Recommended)

```bash
sudo -u postgres psql
```

Then in the PostgreSQL prompt:
```sql
CREATE DATABASE chocobar;
\q
```

### Option 2: Using createdb command

```bash
sudo -u postgres createdb chocobar
```

### Option 3: Using the SQL script

```bash
sudo -u postgres psql -f create-database.sql
```

## Verify Database Creation

```bash
sudo -u postgres psql -l | grep chocobar
```

You should see the `chocobar` database listed.

## Update .env File

After creating the database, update your `.env` file with the correct connection string:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/chocobar?schema=public"
```

Or if you created a specific user:

```env
DATABASE_URL="postgresql://chocobar_user:password@localhost:5432/chocobar?schema=public"
```

## Run Prisma Migrations

Once the database is created and `.env` is configured:

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations to create tables
npm run prisma:migrate

# (Optional) Seed initial data
npm run prisma:seed
```

## Troubleshooting

### If you get "role does not exist" error:

Create a PostgreSQL user for your system user:

```bash
sudo -u postgres psql
```

```sql
CREATE USER mra7m WITH PASSWORD 'your_password';
ALTER USER mra7m CREATEDB;
\q
```

Then you can create the database without sudo:

```bash
createdb chocobar
```

### If you get "permission denied" error:

Make sure your user has database creation privileges, or use the postgres superuser as shown above.

