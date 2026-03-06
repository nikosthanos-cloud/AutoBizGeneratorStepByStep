/**
 * Proxy to the NestJS backend. Used when NEXT_PUBLIC_API_URL is not set:
 * frontend calls /api/backend/api/public/chat etc., we forward to BACKEND_URL.
 * On Vercel set API_URL (or NEXT_PUBLIC_API_URL) to your Railway backend URL.
 */
import { type NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxy(request, context, 'GET');
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxy(request, context, 'POST');
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxy(request, context, 'PUT');
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxy(request, context, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxy(request, context, 'DELETE');
}

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
  method: string,
) {
  const { path = [] } = await context.params;
  const pathStr = path.length ? path.join('/') : '';
  const targetUrl = `${BACKEND_URL.replace(/\/$/, '')}/${pathStr}`;
  const search = request.nextUrl.search;
  const url = search ? `${targetUrl}${search}` : targetUrl;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');

  let body: BodyInit | undefined;
  try {
    body = await request.text();
  } catch {
    // no body
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body || undefined,
    });

    const resHeaders = new Headers(res.headers);
    resHeaders.delete('transfer-encoding');
    resHeaders.delete('connection');

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: resHeaders,
    });
  } catch (err) {
    console.error('[api/backend proxy]', err);
    return NextResponse.json(
      {
        message:
          'Backend unreachable. Set API_URL or NEXT_PUBLIC_API_URL to your Railway URL.',
      },
      { status: 502 },
    );
  }
}
