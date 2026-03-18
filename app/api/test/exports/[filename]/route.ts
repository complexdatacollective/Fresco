import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import { env } from '~/env.js';
import { LOCAL_EXPORT_DIR } from '~/lib/export/layers/LocalFileStorage';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  if (!env.USE_LOCAL_FILE_STORAGE) {
    return new NextResponse('Not found', { status: 404 });
  }

  const { filename } = await params;

  if (!/^networkCanvasExport-\d+\.zip$/.test(filename)) {
    return new NextResponse('Invalid filename', { status: 400 });
  }

  try {
    const filePath = join(LOCAL_EXPORT_DIR, filename);
    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return new NextResponse('File not found', { status: 404 });
  }
}
