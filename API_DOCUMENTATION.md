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

After successful login, you'll receive a JWT token that should be stored and sent with each authenticated request.

### Authentication Flow

1. **Register** - Create account with username, password, and phone number
2. **Verify Phone** - Verify phone number with OTP sent during registration
3. **Login** - Authenticate with username and password to get JWT token

---

## 📡 API Endpoints

### 1. Authentication Routes

#### POST `/api/v1/auth/register`

Register a new user account.

**Access:** Public

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123",
  "phoneNumber": "+1234567890"
}
```

**Fields:**
- `username` (required): 3-30 characters, alphanumeric and underscores only
- `email` (optional): Valid email format
- `password` (required): Minimum 6 characters
- `phoneNumber` (required): E.164 format phone number

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your phone number.",
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "phoneVerified": false,
    "role": "CUSTOMER"
  }
}
```

**Error Response (400):**
```json
{
  "errors": [
    {
      "msg": "Username already taken",
      "param": "username"
    }
  ]
}
```

**Note:** An OTP is automatically sent to the provided phone number after registration.

---

#### POST `/api/v1/auth/login`

Login with username and password.

**Access:** Public

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "phoneVerified": true,
    "role": "CUSTOMER"
  }
}
```

**Error Response (401):**
```json
{
  "error": "Invalid username or password"
}
```

---

#### POST `/api/v1/auth/send-otp`

Send OTP to phone number for verification.

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

**Error Response (404):**
```json
{
  "error": "Phone number not found"
}
```

**Note:** Phone number must belong to an existing user account.

---

#### POST `/api/v1/auth/verify-phone`

Verify phone number with OTP code.

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
  "message": "Phone number verified successfully",
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "phoneVerified": true,
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

### 5. Admin - Category Routes

#### GET `/api/v1/admin/categories`

Get all categories with product counts.

**Access:** Admin Only

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Chocolate Bars",
      "description": "Classic chocolate bars",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "_count": {
        "products": 5
      }
    }
  ]
}
```

---

#### GET `/api/v1/admin/categories/:id`

Get a single category with its products.

**Access:** Admin Only

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "category": {
    "id": "uuid",
    "name": "Chocolate Bars",
    "description": "Classic chocolate bars",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "products": [
      {
        "id": "uuid",
        "name": "Dark Chocolate Bar",
        "price": "12.99",
        "isAvailable": true,
        "imageUrl": "https://example.com/image.jpg"
      }
    ],
    "_count": {
      "products": 5
    }
  }
}
```

---

#### POST `/api/v1/admin/categories`

Create a new category.

**Access:** Admin Only

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "name": "Truffles",
  "description": "Premium chocolate truffles"
}
```

**Response (201):**
```json
{
  "category": {
    "id": "uuid",
    "name": "Truffles",
    "description": "Premium chocolate truffles",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Category with this name already exists"
}
```

---

#### PATCH `/api/v1/admin/categories/:id`

Update a category.

**Access:** Admin Only

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body (all fields optional):**
```json
{
  "name": "Updated Category Name",
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "category": {
    "id": "uuid",
    "name": "Updated Category Name",
    "description": "Updated description",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### DELETE `/api/v1/admin/categories/:id`

Delete a category.

**Access:** Admin Only

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Error Response (400):**
```json
{
  "error": "Cannot delete category with existing products. Please remove or reassign products first."
}
```

**Note:** Categories with products cannot be deleted. Remove or reassign products first.

---

### 6. Order Routes

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

### 7. Admin - Order Routes

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

### 8. Payment Routes

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
  username: string (unique)
  email: string | null (optional, unique)
  password: string (hashed, not returned in API)
  phoneNumber: string | null (optional, unique)
  phoneVerified: boolean
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

### 1. User Registration & Authentication Flow

```javascript
// 1. Register new user
const registerResponse = await fetch('http://localhost:3000/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    email: 'john@example.com',
    password: 'securepassword123',
    phoneNumber: '+1234567890'
  })
});

const { user } = await registerResponse.json();
// OTP is automatically sent to phone number

// 2. Verify phone number with OTP
const verifyResponse = await fetch('http://localhost:3000/api/v1/auth/verify-phone', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '+1234567890',
    otp: '123456'
  })
});

// 3. Login with username and password
const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    password: 'securepassword123'
  })
});

const { token, user: loggedInUser } = await loginResponse.json();
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

1. **Username Format:** 3-30 characters, alphanumeric and underscores only
2. **Password Requirements:** Minimum 6 characters
3. **Phone Number Format:** Use E.164 format (e.g., `+1234567890`)
4. **Email Format:** Standard email format (optional during registration)
5. **Price Format:** Prices are returned as strings to preserve decimal precision
6. **UUID Format:** All IDs are UUIDs (v4)
7. **Date Format:** All dates are ISO 8601 strings
8. **OTP Expiry:** OTPs expire after 10 minutes
9. **Token Expiry:** JWT tokens expire after 7 days (configurable)
10. **Phone Verification:** Users can register and login without phone verification, but phone verification is recommended for order delivery
11. **Admin Access:** To create an admin user, register normally, then manually update the user's role to `ADMIN` in the database

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

