import { NextRequest, NextResponse } from 'next/server';

const CACHE_MS = 10 * 60 * 1000; // 10 min

export async function GET(request: NextRequest) {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key?.trim()) {
    return NextResponse.json({ error: 'OpenWeather API key not set' }, { status: 503 });
  }

  const city = process.env.OPENWEATHER_CITY?.trim() || 'Fayetteville,US';
  const lat = process.env.OPENWEATHER_LAT?.trim();
  const lon = process.env.OPENWEATHER_LON?.trim();

  let q: string;
  if (lat && lon) {
    q = `lat=${lat}&lon=${lon}`;
  } else {
    q = `q=${encodeURIComponent(city)}`;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?${q}&appid=${key}&units=imperial`;
  try {
    const res = await fetch(url, { next: { revalidate: Math.floor(CACHE_MS / 1000) } });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `OpenWeather error: ${res.status} ${text.slice(0, 100)}` },
        { status: 502 }
      );
    }
    const data = await res.json();
    return NextResponse.json({
      temp: Math.round(Number(data.main?.temp) ?? 0),
      description: data.weather?.[0]?.description ?? '',
      icon: data.weather?.[0]?.icon ?? '',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Weather fetch failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
