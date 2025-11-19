import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/app/lib/prisma';
import { compare } from 'bcryptjs';
import { authConfig } from '@/auth.config'; // Importamos la config ligera
import { Role } from '@prisma/client';

// 1. Inicializamos NextAuth y extraemos 'handlers'
const { handlers } = NextAuth({
  ...authConfig, // Extendemos la configuración base
  providers: [
    Credentials({
      async authorize(credentials) {
        const email = credentials.email as string | undefined;
        const password = credentials.password as string | undefined;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email },
        });

        // Validar que sea ADMIN
        if (!user || user.role !== Role.ADMIN) return null;

        // Validar contraseña
        const passwordMatch = await compare(password, user.password || '');
        
        if (!passwordMatch) return null;

        return user;
      },
    }),
  ],
});

// 2. Exportamos los manejadores GET y POST desestructurados
export const { GET, POST } = handlers;