import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function apiErrorResponse(error: unknown) {
  if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof SyntaxError) return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Ya existe un registro con estos datos' }, { status: 409 });
    if (error.code === 'P2025') return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    if (error.code === 'P2034') return NextResponse.json({ error: 'La herramienta cambió durante la operación. Intenta de nuevo.' }, { status: 409 });
  }
  console.error('Error de API:', error);
  return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
}

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  const body: unknown = await request.json();
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError(400, 'Datos inválidos');
  return body as Record<string, unknown>;
}

export function requiredText(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new ApiError(400, `Falta ${label}`);
  return value.trim();
}

export function optionalText(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new ApiError(400, 'Texto inválido');
  return value.trim() || null;
}
