import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// Inicializamos NextAuth SOLO con la configuración ligera para el Edge
export default NextAuth(authConfig).auth;

export const config = {
  // Excluimos rutas estáticas y de API para no gastar ejecuciones
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};