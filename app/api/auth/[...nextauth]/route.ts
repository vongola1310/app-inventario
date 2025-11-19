import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/app/lib/prisma';
import { compare } from 'bcryptjs';
import { authConfig } from '@/auth.config'; // Importamos la config ligera
import { Role } from '@prisma/client';

const handler = NextAuth({
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

        if (!user || user.role !== Role.ADMIN) return null;

        const passwordMatch = await compare(password, user.password || '');
        
        if (!passwordMatch) return null;

        return user;
      },
    }),
  ],
});

export { handler as GET, handler as POST };