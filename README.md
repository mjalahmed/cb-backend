# 🍫 Chocobar Ordering System - Backend API

A complete Node.js/Express backend API for the Chocobar ordering system with OTP authentication, order management, and Stripe payment integration.

## 🚀 Features

- **OTP Authentication** via Twilio SMS
- **JWT-based Authorization** with role-based access (CUSTOMER/ADMIN)
- **Order Management** with status tracking
- **Stripe Payment Integration** for card payments
- **Product & Menu Management** with categories
- **RESTful API** with proper error handling
- **CORS enabled** for frontend integration
- **Prisma ORM** with PostgreSQL

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Twilio account (for OTP)
- Stripe account (for payments)

## 🛠️ Installation

1. **Clone the repository** (if applicable) or navigate to the project directory

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Fill in all required values:
     - Database connection string
     - JWT secret
     - Twilio credentials
     - Stripe keys

4. **Set up the database:**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate

   # Run migrations
   npm run prisma:migrate
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

   Or for production:
   ```bash
   npm start
   ```

## 📁 Project Structure

```
cb-backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── index.js               # Main server file
│   ├── middleware/
│   │   └── auth.middleware.js # Authentication middleware
│   ├── routes/
│   │   ├── auth.routes.js     # Authentication routes
│   │   ├── user.routes.js     # User routes
│   │   ├── menu.routes.js     # Menu routes
│   │   ├── orders.routes.js   # Order routes
│   │   ├── payments.routes.js # Payment routes
│   │   └── admin/
│   │       ├── products.routes.js
│   │       └── orders.routes.js
│   ├── services/
│   │   └── twilio.service.js  # Twilio OTP service
│   └── utils/
│       ├── jwt.util.js         # JWT utilities
│       └── otp.util.js         # OTP utilities
├── .env                        # Environment variables
├── .env.example               # Environment template
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user (username, password, phone)
- `POST /api/v1/auth/login` - Login with username and password
- `POST /api/v1/auth/send-otp` - Send OTP to phone number for verification
- `POST /api/v1/auth/verify-phone` - Verify phone number with OTP

### User
- `GET /api/v1/user/me` - Get current user profile (Auth required)

### Menu
- `GET /api/v1/menu/products` - Get all available products (optional: `?category_id=uuid`)

### Orders
- `POST /api/v1/orders` - Create new order (Auth required)
- `GET /api/v1/orders/my` - Get user's orders (Auth required)

### Payments
- `POST /api/v1/payments/intent` - Create Stripe payment intent (Auth required)
- `POST /api/v1/payments/webhook` - Stripe webhook endpoint (Public)

### Admin - Products
- `POST /api/v1/admin/products` - Create product (Admin required)
- `PATCH /api/v1/admin/products/:id` - Update product (Admin required)

### Admin - Orders
- `GET /api/v1/admin/orders` - Get all orders (optional: `?status=PENDING`) (Admin required)
- `PATCH /api/v1/admin/orders/:id/status` - Update order status (Admin required)

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📝 Environment Variables

See `.env.example` for all required environment variables. Key variables:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_PHONE_NUMBER` - Twilio phone number
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

## 🗄️ Database Management

### View Database (Prisma Studio)

```bash
npm run db:studio
# or
npm run db:view
```

This opens a visual database browser at `http://localhost:5555` where you can view, edit, and manage all your data.

### Common Database Commands

```bash
# View database
npm run db:studio

# Create migration
npm run prisma:migrate

# Reset database (⚠️ deletes all data)
npm run prisma:migrate:reset

# Seed database
npm run prisma:seed

# Reset and seed
npm run db:reset
```

📖 **See [DATABASE.md](./DATABASE.md) for complete database management guide**

## 🧪 Development Notes

- In development mode, if Twilio is not configured, OTPs will be logged to console
- Stripe payment intents will return mock data if Stripe is not configured
- Use `npm run db:studio` to view and manage database records

## 📄 License

ISC

