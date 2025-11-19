import { PrismaClient } from '@prisma/client'

// Esta es la "mejor práctica" para que Next.js no cree
// miles de conexiones en desarrollo.

const globalForPrisma = globalThis as typeof global & {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma