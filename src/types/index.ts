import { UserRole, OrderStatus, OrderType } from '@prisma/client';

export interface JWTPayload {
  userId: string;
  phoneNumber: string;
  role: UserRole;
}

export interface OTPStore {
  otp: string;
  expiresAt: number;
}

export interface CreateOrderRequest {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  orderType: OrderType;
  scheduledTime?: string;
  paymentMethod: 'CASH' | 'CARD';
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  isAvailable?: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  isAvailable?: boolean;
  categoryId?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface CreatePaymentIntentRequest {
  orderId: string;
  amount: number;
}

export interface SendOTPRequest {
  phoneNumber: string;
}

export interface VerifyOTPRequest {
  phoneNumber: string;
  otp: string;
}

