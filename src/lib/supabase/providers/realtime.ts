/**
 * Supabase implementation of the RealtimeProvider interface for browser-side usage.
 * Creates a browser Supabase client internally.
 */
import type { RealtimeChannel, RealtimeProvider } from '@/lib/providers/realtime';

import { createClient } from '../client';

export function createBrowserRealtimeProvider(): RealtimeProvider {
  const supabase = createClient();

  return {
    subscribe(channelName, configs, callback, onStatus) {
      let channel = supabase.channel(channelName);

      for (const config of configs) {
        channel = channel.on(
          'postgres_changes' as never,
          {
            event: config.event,
            schema: config.schema ?? 'public',
            table: config.table,
            ...(config.filter ? { filter: config.filter } : {}),
          } as never,
          callback as never
        );
      }

      channel.subscribe((status) => {
        if (onStatus) {
          const mapped =
            status === 'SUBSCRIBED'
              ? 'SUBSCRIBED'
              : status === 'CLOSED'
                ? 'CLOSED'
                : 'CHANNEL_ERROR';

          onStatus(mapped);
        }
      });

      const realtimeChannel: RealtimeChannel = {
        unsubscribe() {
          void supabase.removeChannel(channel);
        },
      };

      return realtimeChannel;
    },
  };
}
