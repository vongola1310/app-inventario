import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';
import { authConfig } from '@/auth.config';

export const { handlers, auth } = NextAuth({
  ...authConfig,
  providers: [Credentials({
    async authorize(credentials) {
      const { email, password } = credentials;
      if (typeof email !== 'string' || typeof password !== 'string') return null;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || user.role !== 'ADMIN' || !user.password) return null;
      if (!(await compare(password, user.password))) return null;
      return { id: user.id, name: user.name, email: user.email, role: user.role, workerId: user.workerId };
    },
  })],
});
