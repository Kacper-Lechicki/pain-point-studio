import type { DeviceType } from '@/features/surveys/types/response';

/**
 * Detects the device type from the user agent string.
 * Returns 'mobile', 'tablet', or 'desktop'.
 */
export function detectDeviceType(): DeviceType {
  if (typeof navigator === 'undefined') {
    return 'desktop';
  }

  const ua = navigator.userAgent;

  // Tablets — check before mobile since some tablets also match mobile patterns
  if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) {
    return 'tablet';
  }

  // Mobile phones
  if (/iPhone|iPod|Android.*Mobile|webOS|BlackBerry|Opera Mini|IEMobile/i.test(ua)) {
    return 'mobile';
  }

  return 'desktop';
}
