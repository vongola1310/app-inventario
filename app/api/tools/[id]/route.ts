import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

/**
 * API Route: PATCH /api/tools/[id]
 * Actualiza campos específicos de una herramienta (ej. fecha de calibración).
 * COMPATIBLE CON NEXT.JS 15: 'params' ahora es una Promesa.
 */
export async function PATCH(
  request: Request,
  // Definimos params como una Promesa
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    // 1. ¡IMPORTANTE! Esperar a que params se resuelva
    const { id } = await params; 
    const toolId = id;

    const body = await request.json();
    const { nextCalibrationDate } = body;

    if (!toolId) {
      return NextResponse.json({ error: 'Falta el ID de la herramienta' }, { status: 400 });
    }

    // Validamos que si envían fecha, sea válida
    if (!nextCalibrationDate) {
       return NextResponse.json({ error: 'Se requiere una nueva fecha' }, { status: 400 });
    }

    // Actualizar en la base de datos
    const updatedTool = await prisma.tool.update({
      where: { id: toolId },
      data: {
        nextCalibrationDate: new Date(nextCalibrationDate),
      },
    });

    return NextResponse.json(updatedTool, { status: 200 });

  } catch (error) {
    console.error('Error al actualizar herramienta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}