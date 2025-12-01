import type { OTPStore } from '../types/index.js';

// Store OTPs in memory (in production, use Redis or similar)
const otpStore = new Map<string, OTPStore>();

// Generate a 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const storeOTP = (phoneNumber: string, otp: string): void => {
  otpStore.set(phoneNumber, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
  });
};

export interface OTPVerificationResult {
  valid: boolean;
  error?: string;
}

export const verifyOTP = (phoneNumber: string, otp: string): OTPVerificationResult => {
  const stored = otpStore.get(phoneNumber);
  
  if (!stored) {
    return { valid: false, error: 'OTP not found' };
  }
  
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(phoneNumber);
    return { valid: false, error: 'OTP expired' };
  }
  
  if (stored.otp !== otp) {
    return { valid: false, error: 'Invalid OTP' };
  }
  
  otpStore.delete(phoneNumber);
  return { valid: true };
};

