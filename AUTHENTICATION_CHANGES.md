# 🔐 Authentication System Changes

## Overview

The authentication system has been updated from **phone number OTP-only** to **username/password with phone verification**.

## What Changed

### Before (OTP-Only)
- Users authenticated using phone number + OTP
- No username or password
- Phone number was the primary identifier

### After (Username/Password + Phone Verification)
- Users register with username, password, email (optional), and phone number
- Users login with username and password
- Phone number is verified separately using OTP
- Phone verification is optional but recommended

## New User Flow

1. **Registration**
   - User provides: username, password, email (optional), phone number
   - Account is created immediately
   - OTP is automatically sent to phone number
   - User can login even before phone verification

2. **Phone Verification** (Optional but Recommended)
   - User receives OTP via SMS
   - User verifies phone number with OTP
   - `phoneVerified` flag is set to `true`

3. **Login**
   - User provides: username and password
   - JWT token is returned
   - User can access protected routes

## Database Schema Changes

### User Model Updates

**Added Fields:**
- `username` (String, unique, required)
- `email` (String, optional, unique)
- `password` (String, hashed, required)
- `phoneVerified` (Boolean, default: false)

**Changed Fields:**
- `phoneNumber` (now optional, can be null)

## API Endpoints

### New Endpoints

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login with username/password
- `POST /api/v1/auth/verify-phone` - Verify phone number (renamed from verify-otp)

### Updated Endpoints

- `POST /api/v1/auth/send-otp` - Now requires existing user account

## Migration Steps

### 1. Update Database Schema

```bash
# Create migration
npm run prisma:migrate

# This will add new fields to User model
```

### 2. Migrate Existing Users (if any)

If you have existing users in the database, you'll need to:

1. Create a migration script to:
   - Generate usernames from phone numbers (or ask users to set them)
   - Generate temporary passwords (users will need to reset)
   - Set `phoneVerified` based on existing data

2. Or manually update users through Prisma Studio:
   ```bash
   npm run db:studio
   ```

### 3. Update Frontend

Update your frontend to:
- Show registration form (username, password, email, phone)
- Show login form (username, password)
- Handle phone verification flow separately
- Store JWT token after login

## Security Improvements

1. **Password Hashing**: Passwords are hashed using bcrypt (10 salt rounds)
2. **Username Validation**: Usernames must be 3-30 characters, alphanumeric + underscores
3. **Password Requirements**: Minimum 6 characters
4. **Phone Verification**: Separate verification step ensures phone ownership

## Benefits

1. **Cost Reduction**: OTP is only sent once during registration, not every login
2. **Better UX**: Faster login with username/password
3. **Flexibility**: Users can login without phone verification
4. **Security**: Multiple authentication factors (password + phone verification)

## Testing

### Register New User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "phoneNumber": "+1234567890"
  }'
```

### Verify Phone

```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-phone \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "otp": "123456"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

## Notes

- Phone verification is **optional** - users can use the system without verifying
- OTP is only sent during registration and when explicitly requested
- Password is never returned in API responses
- JWT token now contains `username` instead of `phoneNumber`

---

**Updated:** 2024
**Status:** ✅ Complete

