import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // Lógica de JWT (se ejecuta en cada petición segura)
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // @ts-ignore
        token.role = user.role;
        // @ts-ignore
        token.workerId = user.workerId;
      }
      return token;
    },
    // Lógica de Sesión
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // @ts-ignore
        session.user.role = token.role;
        // @ts-ignore
        session.user.workerId = token.workerId as string;
      }
      return session;
    },
    // Lógica de Autorización (El nuevo "Middleware")
    authorized({ auth, request }) { // <--- CORRECCIÓN: Usamos 'request' directamente
      const isLoggedIn = !!auth?.user;
      
      // Accedemos a .nextUrl.pathname dentro del request
      const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');

      if (isAdminRoute) {
        if (isLoggedIn) {
            // @ts-ignore
            return auth.user.role === 'ADMIN';
        }
        return false; // Redirigir a login
      }
      return true;
    },
  },
  providers: [], // Se mantiene vacío aquí para compatibilidad con Edge
} satisfies NextAuthConfig;