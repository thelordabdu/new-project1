/**
 * Proxy: forwards Whoop OAuth callback from ngrok (port 3000) → backend (port 8000).
 * Whoop's redirect_uri must be https — ngrok only tunnels port 3000, so the
 * callback lands here first, then we forward it to FastAPI with all query params intact.
 */
import { type NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams.toString()
  const backendUrl = `${BACKEND_URL}/api/v1/oauth/whoop/callback?${params}`

  const response = await fetch(backendUrl, {
    redirect: 'manual', // let the backend's redirect pass through
  })

  // Backend redirects to frontend after completing OAuth — pass that redirect along
  if (response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) {
    const location = response.headers.get('location')
    if (location) {
      return NextResponse.redirect(location)
    }
  }

  // Non-redirect response — return as-is
  const body = await response.text()
  return new NextResponse(body, {
    status: response.status,
    headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' },
  })
}
