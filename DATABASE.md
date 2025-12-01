# 🗄️ Database Management Guide

Complete guide for managing your Chocobar database with Prisma.

## 📊 Viewing the Database

### Prisma Studio (Visual Database Browser)

The easiest way to view and edit your database:

```bash
npm run db:studio
# or
npm run prisma:studio
# or
npm run db:view
```

This will open Prisma Studio in your browser at `http://localhost:5555` where you can:
- ✅ Browse all tables (Users, Products, Orders, etc.)
- ✅ View, edit, and delete records
- ✅ Add new records
- ✅ Filter and search data
- ✅ See relationships between tables

**Note:** Prisma Studio runs in read-write mode, so be careful when editing production data!

---

## 🔄 Migration Commands

### Create and Apply Migrations

```bash
# Create a new migration (development)
npm run prisma:migrate

# This will:
# 1. Create a new migration file
# 2. Apply it to your database
# 3. Regenerate Prisma Client
```

### Reset Database (⚠️ DANGER: Deletes all data!)

```bash
# Reset database and re-run all migrations
npm run prisma:migrate:reset

# Reset and seed database
npm run db:reset
```

### Deploy Migrations (Production)

```bash
# Apply pending migrations (production)
npm run prisma:migrate:deploy
```

### Check Migration Status

```bash
# See which migrations have been applied
npm run prisma:migrate:status
```

---

## 🛠️ Prisma Schema Management

### Format Schema File

```bash
# Format your schema.prisma file
npm run prisma:format
```

### Validate Schema

```bash
# Check if your schema is valid
npm run prisma:validate
```

### Generate Prisma Client

```bash
# Generate Prisma Client after schema changes
npm run prisma:generate
```

---

## 🌱 Seeding the Database

### Run Seed Script

```bash
# Seed database with initial data (categories)
npm run prisma:seed
```

### Reset and Seed

```bash
# Reset database and seed in one command
npm run db:reset
```

---

## 📋 Common Workflows

### Initial Setup

```bash
# 1. Generate Prisma Client
npm run prisma:generate

# 2. Create and apply migrations
npm run prisma:migrate

# 3. Seed initial data
npm run prisma:seed

# 4. View database
npm run db:studio
```

### After Schema Changes

```bash
# 1. Format schema
npm run prisma:format

# 2. Validate schema
npm run prisma:validate

# 3. Create migration
npm run prisma:migrate

# 4. View changes in Studio
npm run db:studio
```

### Development Reset

```bash
# Reset everything and start fresh
npm run db:reset
```

---

## 🎯 Quick Reference

| Command | Description |
|---------|-------------|
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |
| `npm run db:view` | Alias for Prisma Studio |
| `npm run prisma:migrate` | Create and apply new migration |
| `npm run prisma:migrate:reset` | Reset database (⚠️ deletes all data) |
| `npm run prisma:migrate:deploy` | Deploy migrations (production) |
| `npm run prisma:migrate:status` | Check migration status |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:format` | Format schema file |
| `npm run prisma:validate` | Validate schema |
| `npm run prisma:seed` | Seed database |
| `npm run db:reset` | Reset + seed database |

---

## 🔍 Database Schema Overview

### Models

- **User** - Customer and admin users (phone-based auth)
- **Category** - Product categories
- **Product** - Menu items/products
- **Order** - Customer orders
- **OrderItem** - Items in each order
- **Payment** - Payment records

### Relationships

```
User ──< Order ──< OrderItem >── Product
                ──< Payment

Product >── Category
```

---

## 💡 Tips

1. **Always use Prisma Studio** to verify data changes
2. **Run `prisma:format`** before committing schema changes
3. **Use `prisma:validate`** to catch schema errors early
4. **Never run `migrate:reset`** on production!
5. **Check `migrate:status`** before deploying to production

---

## 🚨 Troubleshooting

### Migration Conflicts

If you have migration conflicts:

```bash
# Check status
npm run prisma:migrate:status

# Reset if needed (development only!)
npm run prisma:migrate:reset
```

### Prisma Client Out of Sync

If you get type errors:

```bash
npm run prisma:generate
```

### Can't Connect to Database

1. Check your `DATABASE_URL` in `.env`
2. Ensure PostgreSQL is running
3. Verify database exists
4. Check network/firewall settings

---

**Happy Database Managing! 🎉**

