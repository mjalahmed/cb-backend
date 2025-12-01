That's a smart move\! Consolidating this detailed plan into a single, copy-and-pasteable canvas ensures all technical and functional requirements are easily transferable to documentation, project management tools, or directly to a development team.

Here is the complete **Chocobar MVP Project Canvas**, formatted for easy copying.

---

# **🍫 Chocobar Ordering System: MVP Project Canvas**

## **🎯 I. Executive Summary**

| Field | Value |
| :---- | :---- |
| **Project Name** | Chocobar Ordering System |
| **Phase Goal** | Launch Core Ordering & Admin System (Phase 1 MVP) |
| **Target Audience** | Local Customers (via Mobile/Web) and Shop Administrators |
| **Core Value Prop** | Seamless mobile/web ordering with OTP login and integrated payment/status tracking. |

---

## **🛠️ II. Technical Stack & Tools**

| Component | Technology | Role/Reasoning |
| :---- | :---- | :---- |
| **Frontend** | **Next.js (React)** | SSR for performance, speed, and better search indexing of the menu. |
| **Backend API** | **Node.js (Express)** | Fast, scalable, unified JavaScript stack. |
| **ORM/Database** | **Prisma** \+ **PostgreSQL** | Provides type safety, clean schema definition, and robust data integrity for transactions. |
| **Authentication** | **Username/Password** + **Twilio** (SMS Gateway) | Username/password for login, OTP for phone number verification. |
| **Authorization** | **JWT** (JSON Web Tokens) | Securely manages user sessions and defines Role (CUSTOMER/ADMIN). |
| **Payment Gateway** | **Stripe** (Recommended) | Handles secure card payments and webhooks for payment confirmation. |

---

## **💻 III. Frontend (Next.js) Functional Requirements**

### **A. Guest & Authentication Flow**

| Feature | Details | Status |
| :---- | :---- | :---- |
| **Menu Viewing** | Display **all Products** and Categories without requiring login. | ✅ |
| **Local Cart** | Allow guests to add items and adjust quantity; data stored locally. | ✅ |
| **User Registration** | Username, password, email (optional), and phone number registration. | ✅ |
| **User Login** | Username and password authentication with JWT tokens. | ✅ |
| **Phone Verification** | OTP sent via Twilio after registration to verify phone number ownership. | ✅ |
| **Mobile UX** | Fully responsive design prioritized for mobile devices. | ✅ |

### **B. Customer Ordering Flow**

| Feature | Details | Status |
| :---- | :---- | :---- |
| **Cart Management** | Add/Remove/Update Quantity of items, calculate Subtotal. | ✅ |
| **Order Type Selection** | Clear toggle between **Delivery** or **Hand-in (Pickup)**. | ✅ |
| **Schedule Picker** | Allow choice of **Time** and **Date** for pickup/delivery (must validate shop hours). | ✅ |
| **Payment Options** | Choice of **Cash on Delivery/Pickup** or **Online Card Payment**. | ✅ |
| **Payment Integration** | Use Stripe client-side SDK to securely process card payments. | ✅ |
| **Order Status Tracker** | Simple list of current and past orders with live status update (e.g., PREPARING). | ✅ |

---

## **⚙️ IV. Backend (Node/Express/Prisma) API Architecture**

### **A. Authentication & User Routes (Public & Protected)**

| Route | Method | Access | Function |
| :---- | :---- | :---- | :---- |
| /api/v1/auth/register | POST | Public | Creates new user account with username, password, email (optional), and phone number. Sends OTP for phone verification. |
| /api/v1/auth/login | POST | Public | Authenticates user with username and password; returns JWT token and User object. |
| /api/v1/auth/send-otp | POST | Public | Sends OTP to user's phone number for verification (requires existing account). |
| /api/v1/auth/verify-phone | POST | Public | Verifies phone number with OTP code; updates phoneVerified status. |
| /api/v1/user/me | GET | Auth | Retrieves the profile of the logged-in user. |

### **B. Menu & Products Routes (Public & Admin)**

| Route | Method | Access | Function |
| :---- | :---- | :---- | :---- |
| /api/v1/menu/products | GET | Public | List all active products. Accepts optional category\_id filter. |
| /api/v1/admin/products | POST | ADMIN | **CRUD:** Create new menu item (name, price, image URL, category). |
| /api/v1/admin/products/:id | PATCH | ADMIN | **CRUD:** Update details or toggle isAvailable. |

### **C. Order & Transaction Routes (Customer & Admin)**

| Route | Method | Access | Function |
| :---- | :---- | :---- | :---- |
| /api/v1/orders | POST | Auth | **CORE:** Validates cart, calculates total, creates Order and OrderItem entries. |
| /api/v1/orders/my | GET | Auth | Retrieve all orders associated with the authenticated user. |
| /api/v1/admin/orders | GET | ADMIN | List all orders (filterable by status: PENDING, PREPARING, etc.). |
| /api/v1/admin/orders/:id/status | PATCH | ADMIN | Update the order's OrderStatus (e.g., *Preparing $\\rightarrow$ Ready*). |
| /api/v1/payments/intent | POST | Auth | Creates a **Stripe Payment Intent** for card checkout. |
| /api/v1/payments/webhook | POST | Public | **Crucial:** Endpoint for Stripe/Gateway to confirm successful payment. |

---

## **💾 V. Data Model (Prisma Schema Summary)**

This defines the structure of your PostgreSQL database, managed by Prisma.

| Model | Key Fields | Relationships | Critical Notes |
| :---- | :---- | :---- | :---- |
| **User** | id, username (Unique), email (Optional, Unique), password (Hashed), phoneNumber (Optional, Unique), phoneVerified (Boolean), role (Enum: CUSTOMER/ADMIN) | Order\[\] (one-to-many) | Core Auth model with username/password and phone verification. |
| **Product** | id, name, price (Decimal/Money), isAvailable (Boolean) | Category (many-to-one), OrderItem\[\] | Menu items; requires price precision. |
| **Order** | id, userId, totalAmount, status (Enum), orderType (Enum), scheduledTime | User, OrderItem\[\], Payment? (one-to-one) | Main transaction record. |
| **OrderItem** | orderId, productId, quantity, priceAtOrder | Order, Product | Ensures price snapshot for historical accuracy. |
| **Payment** | id, orderId (Unique), transactionId, status (Enum: SUCCESS/FAILED) | Order (one-to-one) | Financial record for card transactions. |

---

## **➡️ VI. Next Steps / Action Items**

1. **Backend Setup:** Initialize Node.js/Express project and install **Prisma**.  
2. **Database Migration:** Apply the provided Prisma Schema to generate the initial database tables.  
3. **Auth Implementation:** Code the **Twilio** integration for /auth/send-otp and /auth/verify-otp.  
4. **Frontend Setup:** Initialize the Next.js project and design the mobile-first Menu View.

