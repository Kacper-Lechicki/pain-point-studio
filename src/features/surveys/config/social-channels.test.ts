/** Tests for social channel configuration. */
import { describe, expect, it } from 'vitest';

import { SOCIAL_CHANNELS } from './social-channels';

describe('SOCIAL_CHANNELS', () => {
  it('should define exactly four channels', () => {
    expect(SOCIAL_CHANNELS).toHaveLength(4);
  });

  it('should include twitter, linkedin, email, and reddit', () => {
    const keys = SOCIAL_CHANNELS.map((ch) => ch.key);
    expect(keys).toEqual(['twitter', 'linkedin', 'email', 'reddit']);
  });

  it('should have a renderable icon for every channel', () => {
    for (const channel of SOCIAL_CHANNELS) {
      // Lucide icons are forwardRef objects, custom icons are plain functions
      const isRenderable =
        typeof channel.icon === 'function' ||
        (typeof channel.icon === 'object' && channel.icon !== null && '$$typeof' in channel.icon);
      expect(isRenderable).toBe(true);
    }
  });

  it('should have a non-empty iconClass for every channel', () => {
    for (const channel of SOCIAL_CHANNELS) {
      expect(channel.iconClass.length).toBeGreaterThan(0);
    }
  });

  it('should have labelKeys matching the surveys.publish.<key> pattern', () => {
    for (const channel of SOCIAL_CHANNELS) {
      expect(channel.labelKey).toBe(`surveys.publish.${channel.key}`);
    }
  });
});
