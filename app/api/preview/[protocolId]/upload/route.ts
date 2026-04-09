import { File } from 'node:buffer';
import { type NextRequest, NextResponse } from 'next/server';
import { checkPreviewAuth } from '~/app/api/[version]/preview/_handlers/v1/helpers';
import { prisma } from '~/lib/db';
import { getUTApi } from '~/lib/uploadthing/server-helpers';

/**
 * Proxy route used only when the storage provider is UploadThing. Architect
 * (or any preview client) PUTs the raw file bytes here; we re-upload to
 * UploadThing via `UTApi.uploadFiles` and create the Asset record with the
 * real UT-assigned key once the upload succeeds.
 *
 * We deliberately do NOT cryptographically sign these proxy URLs. The
 * security model matches the existing S3 presigned URL flow: anyone who
 * possesses the URL can upload once, until the preview protocol is marked
 * non-pending (or until prunePreviewProtocols removes it). Protection comes
 * from the unguessability of `protocolId` + `assetId` plus the narrow
 * acceptance window.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

type RouteContext = {
  params: Promise<{ protocolId: string }>;
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const authError = await checkPreviewAuth(request);
  if (authError) {
    return NextResponse.json(authError.response, {
      status: authError.status,
      headers: corsHeaders,
    });
  }

  const { protocolId } = await context.params;

  const url = new URL(request.url);
  const assetId = url.searchParams.get('assetId');
  const name = url.searchParams.get('name');
  const assetType = url.searchParams.get('assetType') ?? 'file';
  const sizeParam = url.searchParams.get('size');

  if (!assetId || !name || !sizeParam) {
    return NextResponse.json(
      { error: 'Missing required query params' },
      { status: 400, headers: corsHeaders },
    );
  }

  const expectedSize = Number.parseInt(sizeParam, 10);
  if (!Number.isFinite(expectedSize) || expectedSize <= 0) {
    return NextResponse.json(
      { error: 'Invalid size' },
      { status: 400, headers: corsHeaders },
    );
  }

  const previewProtocol = await prisma.previewProtocol.findUnique({
    where: { id: protocolId },
    select: { id: true, isPending: true },
  });

  if (!previewProtocol) {
    return NextResponse.json(
      { error: 'Preview protocol not found' },
      { status: 404, headers: corsHeaders },
    );
  }

  if (!previewProtocol.isPending) {
    return NextResponse.json(
      { error: 'Preview protocol is not accepting uploads' },
      { status: 409, headers: corsHeaders },
    );
  }

  const existing = await prisma.asset.findFirst({
    where: {
      assetId,
      previewProtocols: { some: { id: protocolId } },
    },
    select: { key: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: 'Asset already uploaded' },
      { status: 409, headers: corsHeaders },
    );
  }

  const body = await request.arrayBuffer();
  if (body.byteLength !== expectedSize) {
    return NextResponse.json(
      { error: 'Uploaded size does not match expected size' },
      { status: 400, headers: corsHeaders },
    );
  }

  const contentType =
    request.headers.get('content-type') ?? 'application/octet-stream';

  let uploadedKey: string;
  let uploadedUrl: string;
  try {
    const utapi = await getUTApi();
    const file = new File([Buffer.from(body)], name, { type: contentType });
    const response = await utapi.uploadFiles(file);

    if (!response.data) {
      throw new Error(response.error?.message ?? 'Upload returned no data');
    }

    uploadedKey = response.data.key;
    uploadedUrl = response.data.ufsUrl;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('UploadThing proxy upload failed:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 502, headers: corsHeaders },
    );
  }

  await prisma.asset.create({
    data: {
      key: uploadedKey,
      assetId,
      name,
      type: assetType,
      url: uploadedUrl,
      size: expectedSize,
      previewProtocols: { connect: { id: protocolId } },
    },
  });

  return NextResponse.json(
    { status: 'ok', key: uploadedKey, url: uploadedUrl },
    { status: 200, headers: corsHeaders },
  );
}
