import { type NextRequest } from 'next/server';
import { generatePresignedUploadUrl } from '~/lib/uploadthing-presigned';
import { checkPreviewAuth, jsonResponse, OPTIONS } from '../helpers';

export { OPTIONS };

export async function POST(req: NextRequest) {
  const authError = await checkPreviewAuth(req);
  if (authError) return authError;

  try {
    // Get file info from request body
    const body = (await req.json()) as {
      fileName?: string;
      fileSize?: number;
      fileType?: string;
    };

    const { fileName, fileSize, fileType } = body;

    if (!fileName || typeof fileName !== 'string') {
      return jsonResponse({ error: 'fileName is required' }, 400);
    }

    if (!fileSize || typeof fileSize !== 'number') {
      return jsonResponse(
        { error: 'fileSize is required and must be a number' },
        400,
      );
    }

    // Verify it's a .netcanvas file
    if (!fileName.endsWith('.netcanvas')) {
      return jsonResponse({ error: 'File must be a .netcanvas file' }, 400);
    }

    // Generate presigned URL
    const result = await generatePresignedUploadUrl({
      fileName,
      fileSize,
      fileType: fileType ?? 'application/octet-stream',
    });

    if (!result) {
      return jsonResponse(
        {
          error:
            'Failed to generate presigned URL. UploadThing token may not be configured.',
        },
        500,
      );
    }

    return jsonResponse({
      success: true,
      uploadUrl: result.uploadUrl,
      fileKey: result.fileKey,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error generating presigned URL:', error);

    return jsonResponse(
      {
        error: 'Failed to generate presigned URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500,
    );
  }
}
