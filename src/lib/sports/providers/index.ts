import { SportsProvider } from './provider.interface';
import { MockProvider } from './mock.provider';
import { ESPNProvider } from './espn.provider';

export function getProvider(): SportsProvider {
  const demoMode = process.env.DEMO_MODE === 'true';
  if (demoMode) {
    return new MockProvider();
  }
  return new ESPNProvider();
}

export function getMockProvider(): SportsProvider {
  return new MockProvider();
}

export { MockProvider, ESPNProvider };
export type { SportsProvider };
