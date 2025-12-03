import twilio from 'twilio';
import { generateOTP, storeOTP } from '../utils/otp.util.js';
import logger from '../utils/logger.js';

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
      logger.warn(`[DEV MODE] OTP for ${phoneNumber}: ${otp}`);
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

    logger.info('OTP sent via Twilio', { phoneNumber, sid: message.sid });
    return { success: true, message: 'OTP sent successfully', sid: message.sid };
  } catch (error) {
    logger.error('Twilio error', {
      phoneNumber,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error('Failed to send OTP');
  }
};

