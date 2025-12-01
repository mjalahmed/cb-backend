# 🍫 Chocobar Backend API Documentation

Complete API reference for frontend implementation.

## 📋 Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Configuration](#configuration)

---

## 🌐 Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

All endpoints are prefixed with `/api/v1`

---

## 🔐 Authentication

### JWT Token

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Token Format

After successful OTP verification, you'll receive a JWT token that should be stored and sent with each authenticated request.

---

## 📡 API Endpoints

### 1. Authentication Routes

#### POST `/api/v1/auth/send-otp`

Send OTP to phone number via SMS.

**Access:** Public

**Request Body:**
```json
{
  "phoneNumber": "+1234567890"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Error Response (400):**
```json
{
  "errors": [
    {
      "msg": "Invalid phone number format",
      "param": "phoneNumber"
    }
  ]
}
```

---

#### POST `/api/v1/auth/verify-otp`

Verify OTP and receive JWT token.

**Access:** Public

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "phoneNumber": "+1234567890",
    "role": "CUSTOMER"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Invalid OTP"
}
```

---

### 2. User Routes

#### GET `/api/v1/user/me`

Get current authenticated user profile.

**Access:** Authenticated

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "phoneNumber": "+1234567890",
    "role": "CUSTOMER",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (401):**
```json
{
  "error": "No token provided"
}
```

---

### 3. Menu & Products Routes

#### GET `/api/v1/menu/products`

Get all available products.

**Access:** Public

**Query Parameters:**
- `category_id` (optional, UUID): Filter products by category

**Example:**
```
GET /api/v1/menu/products?category_id=uuid-here
```

**Response (200):**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Dark Chocolate Bar",
      "description": "Rich dark chocolate",
      "price": "12.99",
      "imageUrl": "https://example.com/image.jpg",
      "isAvailable": true,
      "category": {
        "id": "uuid",
        "name": "Chocolate Bars"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 4. Admin - Product Routes

#### POST `/api/v1/admin/products`

Create a new product.

**Access:** Admin Only

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "name": "Milk Chocolate Bar",
  "description": "Creamy milk chocolate",
  "price": 10.99,
  "imageUrl": "https://example.com/image.jpg",
  "categoryId": "uuid",
  "isAvailable": true
}
```

**Response (201):**
```json
{
  "product": {
    "id": "uuid",
    "name": "Milk Chocolate Bar",
    "description": "Creamy milk chocolate",
    "price": "10.99",
    "imageUrl": "https://example.com/image.jpg",
    "isAvailable": true,
    "categoryId": "uuid",
    "category": {
      "id": "uuid",
      "name": "Chocolate Bars"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### PATCH `/api/v1/admin/products/:id`

Update a product.

**Access:** Admin Only

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body (all fields optional):**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "price": 15.99,
  "imageUrl": "https://example.com/new-image.jpg",
  "isAvailable": false,
  "categoryId": "uuid"
}
```

**Response (200):**
```json
{
  "product": {
    "id": "uuid",
    "name": "Updated Name",
    ...
  }
}
```

---

### 5. Order Routes

#### POST `/api/v1/orders`

Create a new order.

**Access:** Authenticated

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 2
    },
    {
      "productId": "uuid",
      "quantity": 1
    }
  ],
  "orderType": "DELIVERY",
  "scheduledTime": "2024-01-15T14:30:00.000Z",
  "paymentMethod": "CARD"
}
```

**Fields:**
- `items`: Array of order items (min 1)
- `orderType`: `"DELIVERY"` or `"PICKUP"`
- `scheduledTime`: ISO 8601 date string (optional)
- `paymentMethod`: `"CASH"` or `"CARD"`

**Response (201):**
```json
{
  "order": {
    "id": "uuid",
    "userId": "uuid",
    "totalAmount": "36.97",
    "status": "PENDING",
    "orderType": "DELIVERY",
    "scheduledTime": "2024-01-15T14:30:00.000Z",
    "orderItems": [
      {
        "id": "uuid",
        "productId": "uuid",
        "quantity": 2,
        "priceAtOrder": "12.99",
        "product": {
          "id": "uuid",
          "name": "Dark Chocolate Bar",
          "imageUrl": "https://example.com/image.jpg"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### GET `/api/v1/orders/my`

Get all orders for the authenticated user.

**Access:** Authenticated

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "orders": [
    {
      "id": "uuid",
      "totalAmount": "36.97",
      "status": "PENDING",
      "orderType": "DELIVERY",
      "scheduledTime": "2024-01-15T14:30:00.000Z",
      "orderItems": [
        {
          "id": "uuid",
          "quantity": 2,
          "priceAtOrder": "12.99",
          "product": {
            "id": "uuid",
            "name": "Dark Chocolate Bar",
            "imageUrl": "https://example.com/image.jpg"
          }
        }
      ],
      "payment": {
        "id": "uuid",
        "status": "PENDING",
        "transactionId": null
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 6. Admin - Order Routes

#### GET `/api/v1/admin/orders`

Get all orders (admin view).

**Access:** Admin Only

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `status` (optional): Filter by status (`PENDING`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`)

**Example:**
```
GET /api/v1/admin/orders?status=PENDING
```

**Response (200):**
```json
{
  "orders": [
    {
      "id": "uuid",
      "userId": "uuid",
      "user": {
        "id": "uuid",
        "phoneNumber": "+1234567890"
      },
      "totalAmount": "36.97",
      "status": "PENDING",
      "orderType": "DELIVERY",
      "orderItems": [...],
      "payment": {...},
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### PATCH `/api/v1/admin/orders/:id/status`

Update order status.

**Access:** Admin Only

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "status": "PREPARING"
}
```

**Valid Status Values:**
- `PENDING`
- `PREPARING`
- `READY`
- `COMPLETED`
- `CANCELLED`

**Response (200):**
```json
{
  "order": {
    "id": "uuid",
    "status": "PREPARING",
    ...
  }
}
```

---

### 7. Payment Routes

#### POST `/api/v1/payments/intent`

Create Stripe payment intent for card payment.

**Access:** Authenticated

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "orderId": "uuid",
  "amount": 36.97
}
```

**Response (200):**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "amount": 36.97,
  "orderId": "uuid"
}
```

**Note:** Use the `clientSecret` with Stripe's client-side SDK to process the payment.

---

#### POST `/api/v1/payments/webhook`

Stripe webhook endpoint (handled automatically by Stripe).

**Access:** Public (Stripe only)

**Note:** This endpoint is automatically called by Stripe when payment events occur. No frontend implementation needed.

---

## 📊 Data Models

### User
```typescript
{
  id: string (UUID)
  phoneNumber: string (unique)
  role: "CUSTOMER" | "ADMIN"
  createdAt: ISO 8601 date
  updatedAt: ISO 8601 date
}
```

### Product
```typescript
{
  id: string (UUID)
  name: string
  description: string | null
  price: string (Decimal, e.g., "12.99")
  imageUrl: string | null
  isAvailable: boolean
  categoryId: string (UUID)
  category: Category
  createdAt: ISO 8601 date
  updatedAt: ISO 8601 date
}
```

### Category
```typescript
{
  id: string (UUID)
  name: string
  description: string | null
  createdAt: ISO 8601 date
  updatedAt: ISO 8601 date
}
```

### Order
```typescript
{
  id: string (UUID)
  userId: string (UUID)
  totalAmount: string (Decimal)
  status: "PENDING" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED"
  orderType: "DELIVERY" | "PICKUP"
  scheduledTime: ISO 8601 date | null
  orderItems: OrderItem[]
  payment: Payment | null
  createdAt: ISO 8601 date
  updatedAt: ISO 8601 date
}
```

### OrderItem
```typescript
{
  id: string (UUID)
  orderId: string (UUID)
  productId: string (UUID)
  quantity: number
  priceAtOrder: string (Decimal)
  product: Product
  createdAt: ISO 8601 date
}
```

### Payment
```typescript
{
  id: string (UUID)
  orderId: string (UUID, unique)
  transactionId: string | null
  status: "PENDING" | "SUCCESS" | "FAILED"
  amount: string (Decimal)
  createdAt: ISO 8601 date
  updatedAt: ISO 8601 date
}
```

---

## ⚠️ Error Handling

### Standard Error Response Format

```json
{
  "error": "Error message here"
}
```

### Validation Error Response

```json
{
  "errors": [
    {
      "msg": "Validation error message",
      "param": "fieldName"
    }
  ]
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the backend root with:

```env
# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/chocobar?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Twilio (OTP)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Stripe (Payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Frontend Configuration

**Base API URL:**
```javascript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
```

**Token Storage:**
- Store JWT token in localStorage or httpOnly cookie
- Include token in Authorization header for all authenticated requests

**Example Axios Setup:**
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 🔄 Typical Frontend Flow

### 1. User Authentication Flow

```javascript
// 1. Send OTP
const response = await fetch('http://localhost:3000/api/v1/auth/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phoneNumber: '+1234567890' })
});

// 2. Verify OTP
const verifyResponse = await fetch('http://localhost:3000/api/v1/auth/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phoneNumber: '+1234567890', otp: '123456' })
});

const { token, user } = await verifyResponse.json();
localStorage.setItem('token', token);
```

### 2. Order Creation Flow

```javascript
// 1. Get products
const productsResponse = await fetch('http://localhost:3000/api/v1/menu/products');
const { products } = await productsResponse.json();

// 2. Create order
const orderResponse = await fetch('http://localhost:3000/api/v1/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    items: [
      { productId: 'uuid', quantity: 2 }
    ],
    orderType: 'DELIVERY',
    paymentMethod: 'CARD'
  })
});

const { order } = await orderResponse.json();

// 3. If CARD payment, create payment intent
if (order.paymentMethod === 'CARD') {
  const paymentResponse = await fetch('http://localhost:3000/api/v1/payments/intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      orderId: order.id,
      amount: order.totalAmount
    })
  });
  
  const { clientSecret } = await paymentResponse.json();
  // Use clientSecret with Stripe.js
}
```

### 3. Order Status Tracking

```javascript
// Poll or use WebSocket for real-time updates
const ordersResponse = await fetch('http://localhost:3000/api/v1/orders/my', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { orders } = await ordersResponse.json();
// Display orders with status: PENDING, PREPARING, READY, COMPLETED
```

---

## 📝 Notes

1. **Phone Number Format:** Use E.164 format (e.g., `+1234567890`)
2. **Price Format:** Prices are returned as strings to preserve decimal precision
3. **UUID Format:** All IDs are UUIDs (v4)
4. **Date Format:** All dates are ISO 8601 strings
5. **OTP Expiry:** OTPs expire after 10 minutes
6. **Token Expiry:** JWT tokens expire after 7 days (configurable)
7. **Admin Access:** To create an admin user, authenticate via OTP first, then manually update the user's role to `ADMIN` in the database

---

## 🚀 Quick Start Checklist

- [ ] Backend server running on port 3000
- [ ] Database connected and migrated
- [ ] Environment variables configured
- [ ] Test OTP flow (check console if Twilio not configured)
- [ ] Test product listing endpoint
- [ ] Test order creation with authentication
- [ ] Configure Stripe for payment testing

---

**Last Updated:** 2024-01-01
**API Version:** v1

