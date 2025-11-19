import { Role } from '@prisma/client'; // Importamos tu Enum de Prisma
import 'next-auth';
import '@auth/core/jwt';

// 1. Extender el token (JWT)
declare module '@auth/core/jwt' {
  /** El token que se guarda en la cookie. */
  interface JWT {
    id?: string;
    role?: Role;
    workerId?: string;
  }
}

// 2. Extender la Sesión (Session)
declare module 'next-auth' {
  /** La sesión que se devuelve al cliente. */
  interface Session {
    user: {
      id?: string;
      role?: Role;
      workerId?: string;
    } & DefaultSession['user']; // Combina con las propiedades por defecto (name, email, image)
  }

  /** El objeto 'user' que devuelve el 'authorize'. */
  interface User {
    role?: Role;
    workerId?: string;
  }
}