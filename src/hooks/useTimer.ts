import { useEffect, useState, useRef, useCallback } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import type { CompetitionStatus } from '../lib/types';

interface UseTimerResult {
  status: CompetitionStatus;
  elapsed: number; // seconds
  startTime: string | null; // ISO
  start: (metadata?: { material?: string; referenceWeight?: number }) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  reset: () => Promise<void>;
}

export function useTimer(): UseTimerResult {
  const supabase = getSupabaseClient();
  const [status, setStatus] = useState<CompetitionStatus>('waiting');
  const [elapsed, setElapsed] = useState<number>(0);
  const [startTime, setStartTime] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Helper to compute elapsed from start_time stored in DB
  const computeElapsedFrom = useCallback((start_iso: string | null) => {
    if (!start_iso) return 0;
    const start = new Date(start_iso).getTime();
    const now = Date.now();
    return Math.floor((now - start) / 1000);
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('competition_status')
          .select('*')
          .limit(1)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        if (!mounted) return;

        const row = (data && data[0]) || null;
        if (row) {
          setStatus(row.status as CompetitionStatus);
          setStartTime(row.start_time ?? null);
          setElapsed(computeElapsedFrom(row.start_time ?? null));
        }
      } catch (e) {
        console.warn('useTimer: failed to load competition_status', e);
      }
    })();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('public:competition_status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competition_status' }, (payload: any) => {
        const row = payload.new || payload.old;
        if (!row) return;
        setStatus(row.status as CompetitionStatus);
        setStartTime(row.start_time ?? null);
        setElapsed(computeElapsedFrom(row.start_time ?? null));
      })
      .subscribe();

    return () => {
      mounted = false;
      try { supabase.removeChannel(channel); } catch { }
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [supabase, computeElapsedFrom]);

  useEffect(() => {
    // Manage local ticking only when active
    if (status === 'active' && startTime) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [status, startTime]);

  async function upsertStatus(newStatus: Partial<{ status: CompetitionStatus; start_time: string | null; metadata: any }>) {
    try {
      const payload = {
        status: newStatus.status ?? status,
        start_time: newStatus.start_time ?? startTime,
        metadata: newStatus.metadata ?? null,
      };
      const { error } = await supabase.from('competition_status').upsert(payload, { onConflict: ['id'] });
      if (error) throw error;
    } catch (e) {
      console.warn('useTimer: failed to upsert status', e);
    }
  }

  const start = async (metadata?: { material?: string; referenceWeight?: number }) => {
    const iso = new Date().toISOString();
    setStartTime(iso);
    setStatus('active');
    setElapsed(0);
    await upsertStatus({ status: 'active', start_time: iso, metadata });
  };

  const pause = async () => {
    setStatus('paused');
    await upsertStatus({ status: 'paused' });
  };

  const resume = async () => {
    // resume by setting a new start_time offset by current elapsed
    const iso = new Date(Date.now() - elapsed * 1000).toISOString();
    setStartTime(iso);
    setStatus('active');
    await upsertStatus({ status: 'active', start_time: iso });
  };

  const stop = async () => {
    setStatus('expired');
    await upsertStatus({ status: 'expired' });
  };

  const reset = async () => {
    setStatus('waiting');
    setElapsed(0);
    setStartTime(null);
    await upsertStatus({ status: 'waiting', start_time: null });
  };

  return { status, elapsed, startTime, start, pause, resume, stop, reset };
}
