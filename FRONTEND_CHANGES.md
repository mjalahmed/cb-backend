# Frontend Changes - API Updates

## Overview
This document outlines the changes to the API that affect frontend implementation.

---

## 1. Authentication Changes

### Login - Case Insensitive
- **Change**: Username/email lookup is now case-insensitive
- **Impact**: Users can log in with any case combination (e.g., "User", "USER", "user" all work)
- **No API changes required** - Same endpoint, same request/response format

### Registration - Password Requirements
- **Change**: Password validation now requires minimum 8 characters
- **New Requirements**:
  - Minimum 8 characters
- **Error Response**: 
  ```json
  {
    "error": "Password must be at least 8 characters long"
  }
  ```
- **Action Required**: Update password input validation on frontend to enforce minimum 8 characters

### Registration - Case Insensitive Username/Email
- **Change**: Usernames and emails are stored in lowercase
- **Impact**: Duplicate checks are case-insensitive
- **Example**: If "John" is registered, "john", "JOHN", or "JoHn" cannot be registered
- **No API changes required** - Same endpoint, same request/response format

---

## 2. Pagination Support

All listing endpoints now support pagination. Add these optional parameters to requests:

### Parameters
- `page` (number, optional, default: 1) - Page number (minimum: 1)
- `limit` (number, optional, default: 20) - Items per page (minimum: 1, maximum: 100)

### Response Format
All paginated endpoints now return:
```json
{
  "data": [...],  // Array of items
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 100,
    "totalPages": 5
  }
}
```

### Affected Endpoints

#### 1. Get Products
**Endpoint**: `POST /api/v1/menu/products`

**Request Body** (add pagination):
```json
{
  "categoryId": "optional-uuid",
  "page": 1,
  "limit": 20
}
```

**Response**:
```json
{
  "products": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 50,
    "totalPages": 3
  }
}
```

#### 2. Get User Orders
**Endpoint**: `POST /api/v1/orders/my`

**Request Body** (add pagination and sorting):
```json
{
  "page": 1,
  "limit": 20,
  "sortBy": "date"  // Optional: "date" | "status" | "amount"
}
```

**Response**:
```json
{
  "orders": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 45,
    "totalPages": 3
  }
}
```

#### 3. Get Admin Orders
**Endpoint**: `POST /api/v1/admin/orders`

**Request Body** (add pagination and sorting):
```json
{
  "status": "PENDING",  // Optional filter
  "page": 1,
  "limit": 20,
  "sortBy": "date"  // Optional: "date" | "status" | "amount"
}
```

**Response**:
```json
{
  "orders": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 120,
    "totalPages": 6
  }
}
```

#### 4. Get Categories (Admin)
**Endpoint**: `POST /api/v1/admin/categories`

**Request Body** (add pagination):
```json
{
  "page": 1,
  "limit": 20
}
```

**Response**:
```json
{
  "categories": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 15,
    "totalPages": 1
  }
}
```

---

## 3. Order Sorting

### New Parameter: `sortBy`
Available on order endpoints to control sorting order.

**Options**:
- `"date"` (default) - Sort by creation date, newest first
- `"status"` - Sort by status alphabetically
- `"amount"` - Sort by total amount, highest first

**Endpoints**:
- `POST /api/v1/orders/my`
- `POST /api/v1/admin/orders`

**Example Request**:
```json
{
  "page": 1,
  "limit": 20,
  "sortBy": "amount"
}
```

---

## 4. Order Response Fields

### Guaranteed Fields
All order responses now explicitly include:
- `status` - Order status (PENDING, PREPARING, READY, COMPLETED, CANCELLED)
- `createdAt` - Order creation date/time (ISO 8601 format)
- `updatedAt` - Last update date/time (ISO 8601 format)

**Example Order Object**:
```json
{
  "id": "uuid",
  "userId": "uuid",
  "totalAmount": "50.00",
  "status": "PENDING",
  "orderType": "DELIVERY",
  "scheduledTime": null,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "orderItems": [...],
  "payment": {...}
}
```

---

## 5. Error Responses

### Password Validation Errors
When password doesn't meet requirements, you'll receive this error message:

```json
{
  "error": "Password must be at least 8 characters long"
}
```

---

## Migration Guide

### Required Frontend Updates

1. **Password Input Validation**
   - Add client-side validation for minimum 8 characters
   - Display requirement to users before submission
   - Show error message from API if validation fails

2. **Pagination UI**
   - Add pagination controls to all listing pages
   - Display page numbers, total pages, and total count
   - Implement "Load More" or page navigation

3. **Order Sorting**
   - Add sorting dropdown/buttons to order lists
   - Default to "date" sorting
   - Update UI when sort order changes

4. **Order Display**
   - Ensure status and date fields are displayed
   - Format dates appropriately for user's locale
   - Show order status with appropriate styling/colors

### Optional Enhancements

1. **Case Insensitive Login**
   - Consider normalizing username/email input to lowercase for consistency
   - Show helpful message that login is case-insensitive

2. **Pagination Defaults**
   - Use reasonable defaults (page: 1, limit: 20)
   - Allow users to change items per page
   - Remember user's preference if possible

---

## Summary of Breaking Changes

⚠️ **None** - All changes are backward compatible. Existing API calls will continue to work with default values.

### New Optional Parameters
- All pagination parameters are optional (defaults provided)
- Sorting parameter is optional (defaults to "date")
- Existing requests without these parameters will work as before

### Response Format Changes
- Paginated endpoints now include `pagination` object in response
- Order responses explicitly include `status`, `createdAt`, `updatedAt` (were already included, now guaranteed)

---

## Testing Checklist

- [ ] Test login with different case combinations
- [ ] Test password validation with various invalid passwords
- [ ] Test pagination on products list
- [ ] Test pagination on orders list
- [ ] Test sorting on orders (date, status, amount)
- [ ] Verify order responses include status and date fields
- [ ] Test pagination edge cases (page 0, negative numbers, etc.)
- [ ] Verify error messages are displayed correctly
