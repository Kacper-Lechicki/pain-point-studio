/**
 * Provider-agnostic realtime subscription interface. Implemented by Supabase
 * Realtime (or any future WebSocket / SSE / polling provider).
 */

export interface RealtimeSubscriptionConfig {
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema?: string;
  filter?: string;
}

export interface RealtimeChannel {
  unsubscribe(): void;
}

export interface RealtimeProvider {
  subscribe(
    channelName: string,
    configs: RealtimeSubscriptionConfig[],
    callback: () => void,
    onStatus?: (status: 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR') => void
  ): RealtimeChannel;
}
