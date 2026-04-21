import { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: UserRole;
      };
      requestId?: string;
      requestStartedAtNs?: bigint;
    }
  }
}

export {};
