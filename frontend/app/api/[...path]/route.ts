import { type NextRequest, NextResponse } from 'next/server'

const SERVER_URL = process.env.SAM_SERVER_URL ?? 'http://localhost:3001'

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const upstream = `${SERVER_URL}/${path.join('/')}${req.nextUrl.search}`

  const headers = new Headers(req.headers)
  headers.delete('host')

  const init: RequestInit = {
    method: req.method,
    headers,
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req.body
    ;(init as RequestInit & { duplex: string }).duplex = 'half'
  }

  try {
    const res = await fetch(upstream, init)
    return new NextResponse(res.body, {
      status: res.status,
      headers: res.headers,
    })
  } catch (err) {
    console.error('[proxy] error:', err)
    return NextResponse.json({ error: 'upstream unavailable' }, { status: 502 })
  }
}

export const GET = proxy
export const POST = proxy
export const PATCH = proxy
export const DELETE = proxy
export const PUT = proxy
