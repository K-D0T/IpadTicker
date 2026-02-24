import { NextRequest, NextResponse } from 'next/server';

const VALID_KEYS = [
  'up', 'down', 'left', 'right', 'select', 'menu',
  'play', 'pause', 'playPause', 'home', 'topMenu',
  'volumeUp', 'volumeDown', 'skipForward', 'skipBackward', 'next', 'previous',
] as const;
type KeyName = (typeof VALID_KEYS)[number];

export async function POST(request: NextRequest) {
  const credentials = process.env.APPLETV_CREDENTIALS;
  if (!credentials?.trim()) {
    return NextResponse.json(
      { error: 'Apple TV not configured. Set APPLETV_CREDENTIALS and pair your device.' },
      { status: 503 }
    );
  }

  let body: { key?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const key = (body?.key ?? '').toLowerCase();
  if (!key || !VALID_KEYS.includes(key as KeyName)) {
    return NextResponse.json(
      { error: `Missing or invalid "key". Use one of: ${VALID_KEYS.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const mod = await import('node-appletv');
    const { scan, parseCredentials } = mod;
    const AppleTV = mod.default ?? mod;
    const Key = AppleTV?.Key ?? (mod as { Key?: Record<string, unknown> }).Key;
    if (!Key) {
      return NextResponse.json(
        { error: 'Apple TV module loaded but Key enum not found.' },
        { status: 502 }
      );
    }
    const creds = parseCredentials(credentials);
    const devices = await scan(undefined, 3000);
    const device = devices[0];
    if (!device) {
      return NextResponse.json(
        { error: 'No Apple TV found on the network. Ensure it is on and on the same LAN.' },
        { status: 503 }
      );
    }
    await device.openConnection(creds);

    const keyMap: Record<string, () => Promise<unknown>> = {
      up: () => device.sendKeyCommand(Key.Up),
      down: () => device.sendKeyCommand(Key.Down),
      left: () => device.sendKeyCommand(Key.Left),
      right: () => device.sendKeyCommand(Key.Right),
      select: () => device.sendKeyCommand(Key.Select),
      menu: () => device.sendKeyCommand(Key.Menu),
      play: () => device.sendKeyCommand(Key.Play),
      pause: () => device.sendKeyCommand(Key.Pause),
      playPause: () => device.sendKeyCommand(Key.PlayPause),
      home: () => device.sendKeyCommand(Key.Home),
      topMenu: () => device.sendKeyCommand(Key.TopMenu),
      volumeUp: () => device.sendKeyCommand(Key.VolumeUp),
      volumeDown: () => device.sendKeyCommand(Key.VolumeDown),
      skipForward: () => device.sendKeyCommand(Key.SkipForward),
      skipBackward: () => device.sendKeyCommand(Key.SkipBackward),
      next: () => device.sendKeyCommand(Key.Next),
      previous: () => device.sendKeyCommand(Key.Previous),
    };
    const cmd = keyMap[key];
    if (cmd) await cmd();
    await device.closeConnection();
    return NextResponse.json({ ok: true, key });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isConfig = /credentials|pair|APPLETV|not found|Cannot find module/i.test(message);
    return NextResponse.json(
      { error: isConfig ? 'Apple TV not set up. Install node-appletv, pair your device, and set APPLETV_CREDENTIALS.' : message },
      { status: isConfig ? 503 : 502 }
    );
  }
}
