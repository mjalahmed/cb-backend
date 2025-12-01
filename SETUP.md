# 🚀 Quick Setup Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Create .env File

Create a `.env` file in the root directory with the following content:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/chocobar?schema=public"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Twilio Configuration (for OTP)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Stripe Configuration (for payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**Important:** Replace all placeholder values with your actual credentials.

## Step 3: Set Up Database

1. Make sure PostgreSQL is running
2. Update the `DATABASE_URL` in your `.env` file
3. Run Prisma migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

## Step 4: Seed Database (Optional)

```bash
npm run prisma:seed
```

This will create default categories for your products.

## Step 5: Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the PORT specified in your .env file).

## 🔑 Getting Your Credentials

### Twilio
1. Sign up at https://www.twilio.com
2. Get your Account SID and Auth Token from the dashboard
3. Get a phone number from Twilio

### Stripe
1. Sign up at https://stripe.com
2. Get your API keys from the dashboard (use test keys for development)
3. Set up a webhook endpoint pointing to: `https://your-domain.com/api/v1/payments/webhook`
4. Get the webhook signing secret from Stripe dashboard

### PostgreSQL
1. Install PostgreSQL locally or use a cloud service
2. Create a database named `chocobar` (or your preferred name)
3. Update the `DATABASE_URL` connection string

## ✅ Verify Installation

Visit `http://localhost:3000/health` - you should see:
```json
{
  "status": "ok",
  "message": "Chocobar API is running"
}
```

## 📝 Notes

- In development mode, if Twilio is not configured, OTPs will be logged to the console
- Stripe payment intents will return mock data if Stripe is not configured
- Use `npm run prisma:studio` to view and manage your database

