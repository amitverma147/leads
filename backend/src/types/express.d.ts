import { Role } from '../config/constants';

declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
      role: Role;
      organizationId: string;
    }

    interface Request {
      user?: User;
      requestId?: string;
    }
  }
}

export {};