import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Cambiamos el tipo de 'params' a una Promesa y usamos NextRequest
export async function GET(request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  try {
    // Ahora esperamos (await) a que los parámetros se resuelvan
    const { filename } = await params;
    
    // Medida de seguridad
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return new NextResponse('Archivo no válido', { status: 400 });
    }

    // Ruta exacta donde tu base de datos guarda físicamente las imágenes (public/uploads)
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return new NextResponse('Imagen no encontrada', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    const ext = path.extname(filename).toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.svg') contentType = 'image/svg+xml';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error("Error sirviendo la imagen:", error);
    return new NextResponse('Error interno', { status: 500 });
  }
}