# 🔄 Frontend Changes Required

## 1. Authentication System Update

**Changed from:** Phone number + OTP login  
**Changed to:** Username/Password login + Phone verification (optional)

---

## 2. New API Endpoints

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

**Note:** OTP is automatically sent to phone number after registration.

---

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

---

### Verify Phone (Renamed from verify-otp)
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

**Response:**
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

---

### Send OTP (Updated)
```
POST /api/v1/auth/send-otp
```

**Request:**
```json
{
  "phoneNumber": "+1234567890"
}
```

**Note:** Phone number must belong to an existing user account.

---

## 3. Image Upload Endpoint (NEW - Supabase)

### Upload Product Image
```
POST /api/v1/admin/upload/image
```

**Access:** Admin Only (requires JWT token)

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data
```

**Request (FormData):**
- `image` (File): Image file (max 5MB, images only)
- `fileName` (optional, string): Custom filename
- `folder` (optional, string): Folder path (default: 'products')

**Response (200):**
```json
{
  "success": true,
  "url": "https://your-project.supabase.co/storage/v1/object/public/product-images/products/1234567890_chocolate.jpg",
  "message": "Image uploaded successfully"
}
```

**Error Response (400):**
```json
{
  "error": "No image file provided"
}
```

**Error Response (500):**
```json
{
  "error": "Failed to upload image"
}
```

---

## 4. Updated Product Endpoints

### Create Product (Updated)
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
  "imageUrl": "https://your-project.supabase.co/storage/v1/object/public/product-images/products/1234567890_chocolate.jpg",
  "isAvailable": true
}
```

**Note:** Use the `imageUrl` from the upload endpoint response.

---

### Update Product (Updated)
```
PATCH /api/v1/admin/products/:id
```

**Request:**
```json
{
  "name": "Updated Name",
  "imageUrl": "https://your-project.supabase.co/storage/v1/object/public/product-images/products/new_image.jpg",
  "price": 15.99
}
```

---

## 5. Removed Endpoints

- ❌ `POST /api/v1/auth/verify-otp` (replaced by `/verify-phone`)

---

## 6. User Object Changes

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

## 7. JWT Token Changes

**Before:** Token contained `phoneNumber`  
**After:** Token contains `username`

---

## 8. New User Flow

1. **Registration Page**
   - Username (required, 3-30 chars, alphanumeric + underscore)
   - Email (optional)
   - Password (required, min 6 chars)
   - Phone Number (required, E.164 format)
   - After submit → OTP automatically sent

2. **Phone Verification Page** (Optional but recommended)
   - Enter OTP received via SMS
   - Updates `phoneVerified` to `true`

3. **Login Page**
   - Username
   - Password
   - Returns JWT token

---

## 9. Image Upload Flow (NEW)

### For Admin - Product Image Upload

1. **Upload Image First:**
   ```javascript
   const formData = new FormData();
   formData.append('image', file);
   formData.append('fileName', 'chocolate-bar.jpg'); // optional
   formData.append('folder', 'products'); // optional

   const uploadRes = await fetch('http://localhost:3000/api/v1/admin/upload/image', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${adminToken}`
     },
     body: formData
   });

   const { url } = await uploadRes.json();
   ```

2. **Use URL in Product Creation:**
   ```javascript
   const productRes = await fetch('http://localhost:3000/api/v1/admin/products', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${adminToken}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       name: 'Dark Chocolate Bar',
       price: 12.99,
       categoryId: 'uuid',
       imageUrl: url // Use URL from upload
     })
   });
   ```

---

## 10. Validation Rules

- **Username:** 3-30 characters, letters/numbers/underscores only
- **Password:** Minimum 6 characters
- **Email:** Standard email format (optional)
- **Phone:** E.164 format (e.g., `+1234567890`)
- **Image Upload:** Max 5MB, images only (jpeg, png, gif, webp)

---

## 11. Breaking Changes

⚠️ **Must Update:**
- Login form: Change from phone/OTP to username/password
- Registration: Add username, password, email fields
- User state: Update to include `username`, `email`, `phoneVerified`
- JWT handling: Token now has `username` instead of `phoneNumber`
- Product creation: Now requires image upload step first (for admin)

---

## 12. Example Frontend Code

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

### Verify Phone
```javascript
const verifyPhone = async (phoneNumber, otp) => {
  const res = await fetch('http://localhost:3000/api/v1/auth/verify-phone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, otp })
  });
  return res.json();
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

## 13. Environment Variables Needed (Backend)

The backend needs these Supabase environment variables:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# OR
SUPABASE_ANON_KEY=your_anon_key
```

**Note:** Frontend doesn't need these - image uploads are handled by backend.

---

## 14. Supabase Setup Required

1. Create Supabase project
2. Create storage bucket named `product-images`
3. Set bucket to public (or configure RLS policies)
4. Add environment variables to backend `.env`

---

**Base URL:** `http://localhost:3000/api/v1`  
**All endpoints require:** `Content-Type: application/json` header (except image upload which uses `multipart/form-data`)

