import { describe, expect, it } from 'vitest';

import { DEVICE_ICONS, formatDuration, formatRelativeTime } from './response-formatting';

describe('formatDuration', () => {
  it('returns em dash for null', () => {
    expect(formatDuration(null)).toBe('—');
  });

  it('formats seconds below 60', () => {
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(30)).toBe('30s');
    expect(formatDuration(59.4)).toBe('59s');
  });

  it('rounds fractional seconds', () => {
    expect(formatDuration(30.6)).toBe('31s');
  });

  it('formats minutes without remaining seconds', () => {
    expect(formatDuration(60)).toBe('1m');
    expect(formatDuration(120)).toBe('2m');
  });

  it('formats minutes with remaining seconds', () => {
    expect(formatDuration(90)).toBe('1m 30s');
    expect(formatDuration(150)).toBe('2m 30s');
  });

  it('formats hours without remaining minutes', () => {
    expect(formatDuration(3600)).toBe('1h');
    expect(formatDuration(7200)).toBe('2h');
  });

  it('formats hours with remaining minutes', () => {
    expect(formatDuration(3660)).toBe('1h 1m');
    expect(formatDuration(5400)).toBe('1h 30m');
  });
});

describe('formatRelativeTime', () => {
  it('returns em dash for null', () => {
    expect(formatRelativeTime(null)).toBe('—');
  });

  it('returns em dash for empty string', () => {
    expect(formatRelativeTime('')).toBe('—');
  });

  it('returns "just now" for less than 1 minute ago', () => {
    const now = new Date();
    expect(formatRelativeTime(now.toISOString())).toBe('just now');
  });

  it('returns minutes ago', () => {
    const date = new Date(Date.now() - 5 * 60_000);
    expect(formatRelativeTime(date.toISOString())).toBe('5m ago');
  });

  it('returns hours ago', () => {
    const date = new Date(Date.now() - 3 * 3_600_000);
    expect(formatRelativeTime(date.toISOString())).toBe('3h ago');
  });

  it('returns days ago', () => {
    const date = new Date(Date.now() - 7 * 86_400_000);
    expect(formatRelativeTime(date.toISOString())).toBe('7d ago');
  });

  it('returns locale date string for 30+ days ago', () => {
    const date = new Date(Date.now() - 31 * 86_400_000);
    expect(formatRelativeTime(date.toISOString())).toBe(date.toLocaleDateString());
  });
});

describe('DEVICE_ICONS', () => {
  it('has entries for all device types', () => {
    expect(DEVICE_ICONS).toHaveProperty('desktop');
    expect(DEVICE_ICONS).toHaveProperty('mobile');
    expect(DEVICE_ICONS).toHaveProperty('tablet');
  });
});
