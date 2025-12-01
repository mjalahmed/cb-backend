import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        phoneNumber: string;
        role: UserRole;
      };
    }
  }
}

export {};

