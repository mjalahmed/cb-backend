# 🔄 Frontend Changes Required

## Complete API Changes Summary

---

## 1. Authentication System Update

**Changed from:** Phone number + OTP login  
**Changed to:** Username/Password login + Phone verification (optional)

### Register User
```
POST /api/v1/auth/register
```

**Request:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",  // optional
  "password": "password123",
  "phoneNumber": "+1234567890"
}
```

**Response:**
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

### Login
```
POST /api/v1/auth/login
```

**Request:**
```json
{
  "username": "johndoe",
  "password": "password123"
}
```

**Response:**
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

### Verify Phone
```
POST /api/v1/auth/verify-phone
```

**Request:**
```json
{
  "phoneNumber": "+1234567890",
  "otp": "123456"
}
```

---

## 2. Image Upload (Supabase)

### Upload Product Image
```
POST /api/v1/admin/upload/image
```

**Access:** Admin Only

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data
```

**Request (FormData):**
- `image` (File): Image file (max 5MB, images only)
- `fileName` (optional, string): Custom filename
- `folder` (optional, string): Folder path (default: 'products')

**Response:**
```json
{
  "success": true,
  "url": "https://your-project.supabase.co/storage/v1/object/public/product-images/products/1234567890_chocolate.jpg",
  "message": "Image uploaded successfully"
}
```

---

## 3. Admin - Categories CRUD (NEW)

### Get All Categories
```
GET /api/v1/admin/categories
```

**Access:** Admin Only

**Response:**
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

### Get Single Category
```
GET /api/v1/admin/categories/:id
```

**Response:**
```json
{
  "category": {
    "id": "uuid",
    "name": "Chocolate Bars",
    "description": "Classic chocolate bars",
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

### Create Category
```
POST /api/v1/admin/categories
```

**Request:**
```json
{
  "name": "Truffles",
  "description": "Premium chocolate truffles"
}
```

**Response:**
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

### Update Category
```
PATCH /api/v1/admin/categories/:id
```

**Request:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

### Delete Category
```
DELETE /api/v1/admin/categories/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Error (if category has products):**
```json
{
  "error": "Cannot delete category with existing products. Please remove or reassign products first."
}
```

---

## 4. Admin - Products

### Create Product
```
POST /api/v1/admin/products
```

**Request:**
```json
{
  "name": "Dark Chocolate Bar",
  "description": "Rich dark chocolate",
  "price": 12.99,
  "categoryId": "uuid",
  "imageUrl": "https://your-project.supabase.co/storage/v1/object/public/product-images/products/image.jpg",
  "isAvailable": true
}
```

**Note:** Upload image first using `/api/v1/admin/upload/image`, then use the returned URL.

### Update Product
```
PATCH /api/v1/admin/products/:id
```

---

## 5. User Object Changes

**Before:**
```json
{
  "id": "uuid",
  "phoneNumber": "+1234567890",
  "role": "CUSTOMER"
}
```

**After:**
```json
{
  "id": "uuid",
  "username": "johndoe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "phoneVerified": false,
  "role": "CUSTOMER"
}
```

---

## 6. JWT Token Changes

**Before:** Token contained `phoneNumber`  
**After:** Token contains `username`

---

## 7. Validation Rules

- **Username:** 3-30 characters, letters/numbers/underscores only
- **Password:** Minimum 6 characters
- **Email:** Standard email format (optional)
- **Phone:** E.164 format (e.g., `+1234567890`)
- **Image Upload:** Max 5MB, images only (jpeg, png, gif, webp)
- **Category Name:** Required, must be unique

---

## 8. Example Frontend Code

### Register
```javascript
const register = async (userData) => {
  const res = await fetch('http://localhost:3000/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: userData.username,
      email: userData.email,
      password: userData.password,
      phoneNumber: userData.phoneNumber
    })
  });
  return res.json();
};
```

### Login
```javascript
const login = async (username, password) => {
  const res = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  localStorage.setItem('token', data.token);
  return data;
};
```

### Upload Image (Admin)
```javascript
const uploadImage = async (file, token) => {
  const formData = new FormData();
  formData.append('image', file);
  
  const res = await fetch('http://localhost:3000/api/v1/admin/upload/image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  return res.json();
};
```

### Create Category (Admin)
```javascript
const createCategory = async (categoryData, token) => {
  const res = await fetch('http://localhost:3000/api/v1/admin/categories', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: categoryData.name,
      description: categoryData.description
    })
  });
  return res.json();
};
```

### Get All Categories (Admin)
```javascript
const getCategories = async (token) => {
  const res = await fetch('http://localhost:3000/api/v1/admin/categories', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return res.json();
};
```

### Update Category (Admin)
```javascript
const updateCategory = async (categoryId, updates, token) => {
  const res = await fetch(`http://localhost:3000/api/v1/admin/categories/${categoryId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  return res.json();
};
```

### Delete Category (Admin)
```javascript
const deleteCategory = async (categoryId, token) => {
  const res = await fetch(`http://localhost:3000/api/v1/admin/categories/${categoryId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return res.json();
};
```

### Create Product with Image (Admin)
```javascript
const createProduct = async (productData, imageFile, token) => {
  // 1. Upload image first
  const uploadRes = await uploadImage(imageFile, token);
  const imageUrl = uploadRes.url;
  
  // 2. Create product with image URL
  const res = await fetch('http://localhost:3000/api/v1/admin/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...productData,
      imageUrl
    })
  });
  return res.json();
};
```

---

## 9. Breaking Changes

⚠️ **Must Update:**
- Login form: Change from phone/OTP to username/password
- Registration: Add username, password, email fields
- User state: Update to include `username`, `email`, `phoneVerified`
- JWT handling: Token now has `username` instead of `phoneNumber`
- Product creation: Now requires image upload step first (for admin)
- **NEW:** Add category management UI for admin

---

## 10. New Features Summary

✅ Username/Password authentication  
✅ Phone verification (optional)  
✅ Supabase image uploads  
✅ **Category CRUD operations (Admin)**  
✅ Product management with images  

---

**Base URL:** `http://localhost:3000/api/v1`  
**All endpoints require:** `Content-Type: application/json` header (except image upload which uses `multipart/form-data`)
