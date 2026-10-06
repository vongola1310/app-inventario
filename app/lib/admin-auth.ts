import { auth } from '@/auth';
import { prisma } from './prisma';
import { ApiError } from './api-error';

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new ApiError(401, 'Debes iniciar sesión');
  // Consultar el rol vigente evita mantener permisos de una sesión antigua.
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== 'ADMIN') throw new ApiError(403, 'Acceso exclusivo para administradores');
  return user;
}
