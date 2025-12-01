# 🚀 Migration Guide: Username/Password Authentication

## Important: Run These Commands First!

After pulling these changes, you **MUST** run these commands in order:

```bash
# 1. Generate Prisma Client with new schema
npm run prisma:generate

# 2. Create and apply database migration
npm run prisma:migrate

# 3. (Optional) Verify everything works
npm run type-check
```

## What Changed

### Database Schema
- Added `username`, `email`, `password`, and `phoneVerified` fields to User model
- Made `phoneNumber` optional

### API Endpoints
- New: `POST /api/v1/auth/register`
- New: `POST /api/v1/auth/login`
- Changed: `POST /api/v1/auth/verify-otp` → `POST /api/v1/auth/verify-phone`
- Updated: `POST /api/v1/auth/send-otp` (now requires existing user)

### Authentication Flow
- **Before**: Phone number + OTP = Login
- **After**: Username + Password = Login, Phone OTP = Verification

## Migration Steps

### Step 1: Update Prisma Client

```bash
npm run prisma:generate
```

This regenerates the Prisma Client with the new User model fields.

### Step 2: Create Database Migration

```bash
npm run prisma:migrate
```

When prompted, name your migration: `add_username_password_auth`

This will:
- Create a migration file
- Add new columns to the `users` table
- Update existing data (if any)

### Step 3: Handle Existing Users (If Any)

If you have existing users in your database, you'll need to:

1. **Option A: Manual Update via Prisma Studio**
   ```bash
   npm run db:studio
   ```
   - Open users table
   - Add username, password, email for each user
   - Set phoneVerified based on your needs

2. **Option B: Migration Script**
   Create a script to migrate existing users:
   ```typescript
   // migrate-users.ts
   import { prisma } from './src/index.js';
   import { hashPassword } from './src/utils/password.util.js';
   
   async function migrateUsers() {
     const users = await prisma.user.findMany();
     
     for (const user of users) {
       // Generate username from phone number
       const username = user.phoneNumber.replace(/\D/g, '') || `user_${user.id.slice(0, 8)}`;
       
       // Generate temporary password (users should reset)
       const tempPassword = await hashPassword('TempPassword123!');
       
       await prisma.user.update({
         where: { id: user.id },
         data: {
           username,
           password: tempPassword,
           phoneVerified: true // Assuming existing users are verified
         }
       });
     }
   }
   ```

### Step 4: Verify Everything Works

```bash
# Type check
npm run type-check

# Start server
npm run dev

# Test registration
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "phoneNumber": "+1234567890"
  }'
```

## Breaking Changes

⚠️ **Important**: This is a breaking change for existing frontends!

1. **Login Flow Changed**: Frontend must use username/password instead of phone/OTP
2. **Registration Required**: Users must register before they can login
3. **JWT Payload Changed**: Token now contains `username` instead of `phoneNumber`

## Rollback (If Needed)

If you need to rollback:

```bash
# Revert migration
npm run prisma:migrate:reset

# Or manually revert the last migration
# Check prisma/migrations/ folder for the migration file
```

## Testing Checklist

- [ ] Run `npm run prisma:generate`
- [ ] Run `npm run prisma:migrate`
- [ ] Run `npm run type-check` (should pass)
- [ ] Test registration endpoint
- [ ] Test login endpoint
- [ ] Test phone verification endpoint
- [ ] Test protected routes with JWT token
- [ ] Verify database schema in Prisma Studio

## Need Help?

- Check `AUTHENTICATION_CHANGES.md` for detailed changes
- Check `API_DOCUMENTATION.md` for updated API endpoints
- Check `chocobar-mvp.md` for updated MVP requirements

---

**Status:** ✅ Ready for Migration

