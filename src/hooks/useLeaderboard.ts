import { useEffect, useState, useRef } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import type { LeaderboardEntry } from '../lib/types';

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const supabase = getSupabaseClient();
  const mounted = useRef(true);
  const previousEntryIds = useRef<Set<string>>(new Set());

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('name, college, score, time_submitted, submitted_weight, id, file_url')
        .order('score', { ascending: false })
        .order('time_submitted', { ascending: true });

      if (error) throw error;
      if (!mounted.current || !data) return;

      // Filter only submitted participants (must have at least file_url or time_submitted)
      const submitted = data.filter(p => (p.file_url || p.time_submitted) && p.score !== null && p.score !== undefined);
      
      // Sort by score (descending), then by time_submitted (ascending)
      submitted.sort((a: any, b: any) => {
        const scoreDiff = (b.score || 0) - (a.score || 0);
        if (scoreDiff !== 0) return scoreDiff;
        
        // If scores are equal, sort by time (earlier is better)
        const timeA = a.time_submitted ? new Date(a.time_submitted).getTime() : Infinity;
        const timeB = b.time_submitted ? new Date(b.time_submitted).getTime() : Infinity;
        return timeA - timeB;
      });
      
      const mapped = submitted.map((r: any, i: number) => {
        const submittedTime = r.time_submitted
          ? new Date(r.time_submitted).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })
          : '-';

        // Check if this is a new entry
        const isNew = !previousEntryIds.current.has(r.id);

        return {
          id: r.id,
          rank: i + 1,
          name: r.name,
          college: r.college || '',
          weightSubmitted: r.submitted_weight || 0,
          score: r.score || 0,
          time: submittedTime,
          isNew,
        };
      });

      // Update previous entry IDs
      previousEntryIds.current = new Set(submitted.map((r: any) => r.id));

      setEntries(mapped);

      // Clear isNew flags after animation
      setTimeout(() => {
        setEntries(prev => prev.map(e => ({ ...e, isNew: false })));
      }, 2000);
    } catch (e) {
      console.warn('Failed to fetch leaderboard', e);
    }
  };

  useEffect(() => {
    mounted.current = true;
    loadLeaderboard();

    // Realtime subscription for participant changes
    const channel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants' },
        () => {
          loadLeaderboard();
        }
      )
      .subscribe();

    // Auto-refresh every 10 seconds as backup
    const interval = setInterval(() => {
      loadLeaderboard();
    }, 10000);

    return () => {
      mounted.current = false;
      clearInterval(interval);
      try { supabase.removeChannel(channel); } catch { }
    };
  }, [supabase]);

  return { entries, refresh: loadLeaderboard };
}
