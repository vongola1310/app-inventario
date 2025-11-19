import NextAuth from 'next-auth';
import { auth } from '@/app/api/auth/[...nextauth]/route'; // Importamos la config
import { Role } from '@prisma/client';

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;

  // 1. Definimos la ruta de administrador
  const isAdminRoute = nextUrl.pathname.startsWith('/admin');

  // 2. Si el usuario intenta acceder a /admin
  if (isAdminRoute) {
    // 2a. ¿No está logueado O no es un ADMIN?
    if (!session || session.user?.role !== Role.ADMIN) {
      // 2b. ¡Redirigir a la página de Login!
      return Response.redirect(new URL('/login', nextUrl));
    }
  }

  // 3. Si no es una ruta de admin, o si es un admin, déjalo pasar.
  return;
});

// Configuración del Middleware:
// Esto le dice al middleware qué rutas debe vigilar
export const config = {
  matcher: ['/admin/:path*'], // Proteger /admin y todo lo que esté dentro
};