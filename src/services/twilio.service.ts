import twilio from 'twilio';
import { generateOTP, storeOTP } from '../utils/otp.util.js';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: twilio.Twilio | null = null;

if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

export interface SendOTPResult {
  success: boolean;
  message: string;
  sid?: string;
}

export const sendOTP = async (phoneNumber: string): Promise<SendOTPResult> => {
  try {
    const otp = generateOTP();
    storeOTP(phoneNumber, otp);

    // If Twilio is not configured, log the OTP (for development)
    if (!twilioClient) {
      console.log(`[DEV MODE] OTP for ${phoneNumber}: ${otp}`);
      return { success: true, message: 'OTP sent (dev mode)' };
    }

    if (!fromNumber) {
      throw new Error('TWILIO_PHONE_NUMBER is not configured');
    }

    const message = await twilioClient.messages.create({
      body: `Your Chocobar verification code is: ${otp}. Valid for 10 minutes.`,
      from: fromNumber,
      to: phoneNumber
    });

    return { success: true, message: 'OTP sent successfully', sid: message.sid };
  } catch (error) {
    console.error('Twilio error:', error);
    throw new Error('Failed to send OTP');
  }
};

