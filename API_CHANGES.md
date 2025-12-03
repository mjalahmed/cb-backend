# 🔄 API Changes - All Routes Now Use POST with Request Bodies

## ⚠️ Breaking Changes

**All routes have been changed to POST method with request bodies instead of URL parameters and query strings.**

---

## 1. Authentication Routes (No Changes)

These already use POST:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/send-otp`
- `POST /api/v1/auth/verify-phone`

---

## 2. User Routes

### Changed: Get User Profile

**Before:**
```
GET /api/v1/user/me
```

**After:**
```
POST /api/v1/user/me
```

**Request Body:**
```json
{}
```

**Response:** (Same as before)
```json
{
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "phoneVerified": true,
    "role": "CUSTOMER",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 3. Menu Routes

### Changed: Get Products

**Before:**
```
GET /api/v1/menu/products?category_id=uuid
```

**After:**
```
POST /api/v1/menu/products
```

**Request Body:**
```json
{
  "categoryId": "uuid"  // optional
}
```

**Response:** (Same as before)
```json
{
  "products": [...]
}
```

---

## 4. Order Routes

### Create Order (No Change)
```
POST /api/v1/orders
```
Already uses POST - no changes needed.

### Changed: Get My Orders

**Before:**
```
GET /api/v1/orders/my
```

**After:**
```
POST /api/v1/orders/my
```

**Request Body:**
```json
{}
```

**Response:** (Same as before)
```json
{
  "orders": [...]
}
```

---

## 5. Admin - Product Routes

### Create Product (No Change)
```
POST /api/v1/admin/products
```
Already uses POST - no changes needed.

### Changed: Update Product

**Before:**
```
PATCH /api/v1/admin/products/:id
```

**After:**
```
POST /api/v1/admin/products/update
```

**Request Body:**
```json
{
  "id": "uuid",
  "name": "Updated Name",  // optional
  "description": "Updated description",  // optional
  "price": 15.99,  // optional
  "imageUrl": "https://...",  // optional
  "isAvailable": false,  // optional
  "categoryId": "uuid"  // optional
}
```

**Response:** (Same as before)
```json
{
  "product": {...}
}
```

---

## 6. Admin - Category Routes

### Changed: Get All Categories

**Before:**
```
GET /api/v1/admin/categories
```

**After:**
```
POST /api/v1/admin/categories
```

**Request Body:**
```json
{}
```

**Response:** (Same as before)
```json
{
  "categories": [...]
}
```

### Changed: Get Single Category

**Before:**
```
GET /api/v1/admin/categories/:id
```

**After:**
```
POST /api/v1/admin/categories/get
```

**Request Body:**
```json
{
  "id": "uuid"
}
```

**Response:** (Same as before)
```json
{
  "category": {...}
}
```

### Changed: Create Category

**Before:**
```
POST /api/v1/admin/categories
```

**After:**
```
POST /api/v1/admin/categories/create
```

**Request Body:** (Same as before)
```json
{
  "name": "Truffles",
  "description": "Premium chocolate truffles"
}
```

### Changed: Update Category

**Before:**
```
PATCH /api/v1/admin/categories/:id
```

**After:**
```
POST /api/v1/admin/categories/update
```

**Request Body:**
```json
{
  "id": "uuid",
  "name": "Updated Name",  // optional
  "description": "Updated description"  // optional
}
```

### Changed: Delete Category

**Before:**
```
DELETE /api/v1/admin/categories/:id
```

**After:**
```
POST /api/v1/admin/categories/delete
```

**Request Body:**
```json
{
  "id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

---

## 7. Admin - Order Routes

### Changed: Get All Orders

**Before:**
```
GET /api/v1/admin/orders?status=PENDING
```

**After:**
```
POST /api/v1/admin/orders
```

**Request Body:**
```json
{
  "status": "PENDING"  // optional
}
```

**Response:** (Same as before)
```json
{
  "orders": [...]
}
```

### Changed: Update Order Status

**Before:**
```
PATCH /api/v1/admin/orders/:id/status
```

**After:**
```
POST /api/v1/admin/orders/status
```

**Request Body:**
```json
{
  "id": "uuid",
  "status": "PREPARING"
}
```

**Response:** (Same as before)
```json
{
  "order": {...}
}
```

---

## 8. Payment Routes (No Changes)

These already use POST:
- `POST /api/v1/payments/intent`
- `POST /api/v1/payments/webhook`

---

## 9. Upload Routes (No Changes)

Already uses POST:
- `POST /api/v1/admin/upload/image`

---

## Summary of Changes

| Old Route | New Route | Method Change |
|-----------|-----------|---------------|
| `GET /api/v1/user/me` | `POST /api/v1/user/me` | GET → POST |
| `GET /api/v1/menu/products?category_id=uuid` | `POST /api/v1/menu/products` | GET → POST, query → body |
| `GET /api/v1/orders/my` | `POST /api/v1/orders/my` | GET → POST |
| `PATCH /api/v1/admin/products/:id` | `POST /api/v1/admin/products/update` | PATCH → POST, param → body |
| `GET /api/v1/admin/categories` | `POST /api/v1/admin/categories` | GET → POST |
| `GET /api/v1/admin/categories/:id` | `POST /api/v1/admin/categories/get` | GET → POST, param → body |
| `PATCH /api/v1/admin/categories/:id` | `POST /api/v1/admin/categories/update` | PATCH → POST, param → body |
| `DELETE /api/v1/admin/categories/:id` | `POST /api/v1/admin/categories/delete` | DELETE → POST, param → body |
| `GET /api/v1/admin/orders?status=PENDING` | `POST /api/v1/admin/orders` | GET → POST, query → body |
| `PATCH /api/v1/admin/orders/:id/status` | `POST /api/v1/admin/orders/status` | PATCH → POST, param → body |

---

## Example Code Updates

### Get User Profile

**Before:**
```javascript
const res = await fetch('http://localhost:3000/api/v1/user/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**After:**
```javascript
const res = await fetch('http://localhost:3000/api/v1/user/me', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
});
```

### Get Products

**Before:**
```javascript
const res = await fetch('http://localhost:3000/api/v1/menu/products?category_id=uuid');
```

**After:**
```javascript
const res = await fetch('http://localhost:3000/api/v1/menu/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ categoryId: 'uuid' })
});
```

### Update Product

**Before:**
```javascript
const res = await fetch(`http://localhost:3000/api/v1/admin/products/${productId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: 'Updated Name' })
});
```

**After:**
```javascript
const res = await fetch('http://localhost:3000/api/v1/admin/products/update', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: productId,
    name: 'Updated Name'
  })
});
```

### Get Categories

**Before:**
```javascript
const res = await fetch('http://localhost:3000/api/v1/admin/categories', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**After:**
```javascript
const res = await fetch('http://localhost:3000/api/v1/admin/categories', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
});
```

### Delete Category

**Before:**
```javascript
const res = await fetch(`http://localhost:3000/api/v1/admin/categories/${categoryId}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**After:**
```javascript
const res = await fetch('http://localhost:3000/api/v1/admin/categories/delete', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ id: categoryId })
});
```

---

## Important Notes

1. **All routes now use POST method**
2. **All IDs and parameters are in request body, not URL**
3. **All query parameters are in request body**
4. **Empty body `{}` for routes that don't need parameters**
5. **Content-Type: application/json header required for all POST requests**

---

**Base URL:** `http://localhost:3000/api/v1`

