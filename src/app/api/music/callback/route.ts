import { NextRequest, NextResponse } from 'next/server';
import { exchangeCode, getSpotifyCookieHeaders } from '@/lib/music/spotify';

const secure = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');

  if (error) {
    return new NextResponse(
      `<html><body style="background:#020408;color:#f87171;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh">
        <div style="text-align:center"><h2>Spotify Auth Failed</h2><p>${error}</p><a href="/" style="color:#22d3ee">Back to Dashboard</a></div>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } },
    );
  }

  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  try {
    const tokens = await exchangeCode(code);
    const headers = new Headers({ 'Content-Type': 'text/html' });
    getSpotifyCookieHeaders(tokens, secure).forEach((value) => headers.append('Set-Cookie', value));
    return new NextResponse(
      `<html><body style="background:#020408;color:#22c55e;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh">
        <div style="text-align:center">
          <h2 style="font-size:2rem">&#10003; Spotify Connected!</h2>
          <p style="color:#9ca3af">Redirecting to dashboard...</p>
          <script>setTimeout(()=>window.location.href='/',1500)</script>
        </div>
      </body></html>`,
      { headers },
    );
  } catch (err) {
    console.error('[Spotify Callback]', err);
    return new NextResponse(
      `<html><body style="background:#020408;color:#f87171;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh">
        <div style="text-align:center"><h2>Token Exchange Failed</h2><p>${String(err)}</p><a href="/" style="color:#22d3ee">Back to Dashboard</a></div>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } },
    );
  }
}
