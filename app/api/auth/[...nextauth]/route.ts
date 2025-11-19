import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/app/lib/prisma';
import { compare } from 'bcryptjs'; // Importamos 'compare' para contraseñas
import { Role } from '@prisma/client';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  // 1. Definimos los "Proveedores" (métodos de login)
  providers: [
    Credentials({
      // 2. Esta es la función "authorize" que valida al usuario
      async authorize(credentials) {
        // Obtenemos el email y password del formulario de login
        const email = credentials.email as string | undefined;
        const password = credentials.password as string | undefined;

        if (!email || !password) {
          throw new Error('Por favor, ingresa email y contraseña');
        }

        // 3. Buscar al usuario en la base de datos
        const user = await prisma.user.findUnique({
          where: { email: email },
        });

        // 4. Validar que el usuario exista
        if (!user) {
          console.log('Usuario no encontrado');
          return null; // Rechazar login
        }

        // 5. Validar que el usuario sea ADMIN
        if (user.role !== Role.ADMIN) {
          console.log('Usuario no es admin');
          return null; // Rechazar login (solo admins pueden loguearse al panel)
        }

        // 6. Validar que la contraseña sea correcta
        // Comparamos la contraseña del formulario con la hasheada en la DB
        const passwordMatch = await compare(password, user.password || '');
        
        if (!passwordMatch) {
          console.log('Contraseña incorrecta');
          return null; // Rechazar login
        }

        console.log('¡Login exitoso!');
        // 7. ¡Éxito! Devolvemos el usuario
        return user;
      },
    }),
  ],

  // 8. Callbacks para enriquecer el Token y la Sesión
  callbacks: {
    // El 'jwt' callback se ejecuta al crear el token
    async jwt({ token, user }) {
      // Si 'user' existe (justo después de iniciar sesión), añadimos sus datos al token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.workerId = user.workerId;
      }
      return token;
    },
    // El 'session' callback se ejecuta al pedir la sesión
    async session({ session, token }) {
      // Añadimos los datos del token a la sesión del cliente
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.workerId = token.workerId as string;
      }
      return session;
    },
  },

  // 9. Definir la página de Login
  // Si alguien intenta entrar a /admin, lo redirigiremos aquí
  pages: {
    signIn: '/login',
  },
});