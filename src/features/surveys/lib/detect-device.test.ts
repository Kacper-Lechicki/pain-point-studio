// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { detectDeviceType } from './detect-device';

function setUserAgent(ua: string) {
  Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
}

// ── detectDeviceType ──────────────────────────────────────────────────

describe('detectDeviceType', () => {
  const originalUA = navigator.userAgent;

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', { value: originalUA, configurable: true });
  });

  it('returns "desktop" when navigator is undefined', () => {
    const orig = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', { value: undefined, configurable: true });

    expect(detectDeviceType()).toBe('desktop');

    Object.defineProperty(globalThis, 'navigator', { value: orig, configurable: true });
  });

  it('returns "desktop" for desktop user agent', () => {
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    expect(detectDeviceType()).toBe('desktop');
  });

  it('returns "mobile" for iPhone user agent', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');
    expect(detectDeviceType()).toBe('mobile');
  });

  it('returns "mobile" for Android Mobile user agent', () => {
    setUserAgent('Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Mobile');
    expect(detectDeviceType()).toBe('mobile');
  });

  it('returns "tablet" for iPad user agent', () => {
    setUserAgent('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15');
    expect(detectDeviceType()).toBe('tablet');
  });

  it('returns "tablet" for Android tablet user agent (no Mobile keyword)', () => {
    setUserAgent('Mozilla/5.0 (Linux; Android 13; SM-X800) AppleWebKit/537.36');
    expect(detectDeviceType()).toBe('tablet');
  });

  it('returns "mobile" for BlackBerry user agent', () => {
    setUserAgent('Mozilla/5.0 (BlackBerry; U; BlackBerry 9900)');
    expect(detectDeviceType()).toBe('mobile');
  });

  it('returns "mobile" for Opera Mini user agent', () => {
    setUserAgent('Opera/9.80 (Android; Opera Mini/36.2 Mobile) Presto/2.12.423 Version/12.16');
    expect(detectDeviceType()).toBe('mobile');
  });
});
