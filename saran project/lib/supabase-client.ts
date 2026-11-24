import { createClient, type SupabaseClient, type RealtimeChannel } from '@supabase/supabase-js';

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Clean trailing /rest/v1 or /rest/v1/ or trailing slashes to guarantee valid origin for all endpoints
export const supabaseUrl = rawSupabaseUrl
  ? rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
  : '';
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabasePublishableKey && 
  (supabaseUrl.startsWith('https://') || supabaseUrl.startsWith('http://127.0.0.1') || supabaseUrl.startsWith('http://localhost')) &&
  !supabaseUrl.includes('your-project-ref')
);

// Client-side Supabase instance with publishable key and kernel-level RLS
export const supabase: SupabaseClient<any> | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'bio_hitech_auth_token',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

/**
 * Deduplication cache to prevent re-processing identical realtime broadcast events.
 */
const processedEventCache = new Map<string, number>();

function isDuplicateEvent(table: string, recordId: string, updatedAtStr?: string): boolean {
  const timestamp = updatedAtStr ? new Date(updatedAtStr).getTime() : Date.now();
  const cacheKey = `${table}:${recordId}`;
  const lastProcessed = processedEventCache.get(cacheKey);

  if (lastProcessed && lastProcessed >= timestamp) {
    return true; // Already processed newer or identical record
  }

  processedEventCache.set(cacheKey, timestamp);
  // Keep cache bounded
  if (processedEventCache.size > 1000) {
    const oldestKey = processedEventCache.keys().next().value;
    if (oldestKey) processedEventCache.delete(oldestKey);
  }
  return false;
}

export type RealtimeSyncCallback = (payload: {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRecord: any;
  oldRecord: any;
}) => void;

/**
 * Sets up bidirectional real-time synchronization over Supabase WebSocket channel.
 * Implements deduplication, reconnect resilience, and clean channel teardown.
 */
export function setupRealtimeSync(onSync: RealtimeSyncCallback): () => void {
  if (!supabase) {
    return () => {};
  }

  const channel: RealtimeChannel = supabase
    .channel('bio_hitech_realtime_sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public' },
      (payload) => {
        const table = payload.table;
        const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
        const record = (payload.new || payload.old || {}) as Record<string, any>;
        const recordId = record.id || record.code || '';

        if (isDuplicateEvent(table, recordId, record.updated_at)) {
          return; // Suppress duplicate or outdated event
        }

        onSync({
          table,
          eventType,
          newRecord: payload.new,
          oldRecord: payload.old,
        });
      }
    )
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Supabase Realtime synchronized.');
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        console.warn('[Realtime] Sync disconnected. Automatic reconnect will trigger.', err);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
