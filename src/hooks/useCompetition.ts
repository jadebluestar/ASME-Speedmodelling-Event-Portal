import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import type { Competition, CompetitionStatus } from '../lib/types';

const COMPETITION_ID = 1;

interface UseCompetitionResult {
  competition: Competition | null;
  status: CompetitionStatus;
  elapsed: number; // seconds
  startTime: string | null; // ISO
  material: string;
  referenceWeight: number;
  drawingUrl: string | null;
  isLoading: boolean;
  error: string | null;
  start: (material: string, refWeight: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  reset: () => Promise<void>;
  uploadDrawing: (file: File) => Promise<void>;
  updateMaterial: (material: string, refWeight?: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCompetition(): UseCompetitionResult {
  const supabase = getSupabaseClient();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [status, setStatus] = useState<CompetitionStatus>('waiting');
  const [elapsed, setElapsed] = useState<number>(0);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to compute elapsed from start_time stored in DB
  const computeElapsedFrom = useCallback((start_iso: string | null) => {
    if (!start_iso) return 0;
    const start = new Date(start_iso).getTime();
    const now = Date.now();
    return Math.floor((now - start) / 1000);
  }, []);

  // Load competition state
  const loadCompetition = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', COMPETITION_ID)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setCompetition(data);
        const isActive = data.is_active ?? false;
        // Set status based on is_active
        // If is_active is false but start_time exists, it means paused or stopped
        // We'll use 'waiting' as default, but pause/stop will set status appropriately
        const hasStarted = !!data.start_time;
        setStatus(isActive ? 'active' : (hasStarted ? 'paused' : 'waiting'));
        setStartTime(data.start_time ?? null);
        
        if (isActive && data.start_time) {
          setElapsed(computeElapsedFrom(data.start_time));
        } else if (data.start_time && !isActive) {
          // If paused, keep calculating elapsed from start_time
          setElapsed(computeElapsedFrom(data.start_time));
        } else {
          setElapsed(0);
        }
      }
    } catch (err: any) {
      console.error('Error loading competition:', err);
      setError(err.message || 'Failed to load competition');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, computeElapsedFrom]);

  // Initialize and subscribe to changes
  useEffect(() => {
    loadCompetition();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('competition-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'competitions', filter: `id=eq.${COMPETITION_ID}` },
        (payload) => {
          const updated = payload.new as Competition;
          if (updated) {
            setCompetition(updated);
            const isActive = updated.is_active ?? false;
            const hasStarted = !!updated.start_time;
            setStatus(isActive ? 'active' : (hasStarted ? 'paused' : 'waiting'));
            setStartTime(updated.start_time ?? null);
            
            if (isActive && updated.start_time) {
              setElapsed(computeElapsedFrom(updated.start_time));
            } else if (updated.start_time) {
              // If paused, keep the current elapsed time
              setElapsed(computeElapsedFrom(updated.start_time));
            } else {
              setElapsed(0);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadCompetition, supabase, computeElapsedFrom]);

  // Timer tick when active (not paused)
  useEffect(() => {
    if (status === 'active' && startTime) {
      // Update immediately
      setElapsed(computeElapsedFrom(startTime));
      
      // Then update every second
      const interval = setInterval(() => {
        setElapsed(computeElapsedFrom(startTime));
      }, 1000);
      
      return () => clearInterval(interval);
    } else if (status === 'paused' && startTime) {
      // When paused, show the elapsed time but don't increment
      setElapsed(computeElapsedFrom(startTime));
    }
  }, [status, startTime, computeElapsedFrom]);

  const start = async (material: string, refWeight: number) => {
    try {
      const startTimeISO = new Date().toISOString();
      
      const { error } = await supabase
        .from('competitions')
        .update({
          is_active: true,
          start_time: startTimeISO,
          material: material,
          reference_weight: refWeight,
          tolerance: 5 // Default 5% tolerance
        })
        .eq('id', COMPETITION_ID);

      if (error) throw error;
      
      setStartTime(startTimeISO);
      setStatus('active');
      setElapsed(0);
    } catch (err: any) {
      console.error('Error starting competition:', err);
      throw err;
    }
  };

  const pause = async () => {
    try {
      // Set is_active to false so participants can see competition is paused
      const { error } = await supabase
        .from('competitions')
        .update({ is_active: false })
        .eq('id', COMPETITION_ID);

      if (error) throw error;
      setStatus('paused');
    } catch (err: any) {
      console.error('Error pausing competition:', err);
      throw err;
    }
  };

  const resume = async () => {
    try {
      // Resume by setting a new start_time offset by current elapsed
      const iso = new Date(Date.now() - elapsed * 1000).toISOString();
      
      const { error } = await supabase
        .from('competitions')
        .update({ 
          is_active: true, 
          start_time: iso 
        })
        .eq('id', COMPETITION_ID);

      if (error) throw error;
      setStartTime(iso);
      setStatus('active');
    } catch (err: any) {
      console.error('Error resuming competition:', err);
      throw err;
    }
  };

  const stop = async () => {
    try {
      const { error } = await supabase
        .from('competitions')
        .update({ is_active: false })
        .eq('id', COMPETITION_ID);

      if (error) throw error;
      setStatus('expired');
    } catch (err: any) {
      console.error('Error stopping competition:', err);
      throw err;
    }
  };

  const reset = async () => {
    try {
      // Stop timer first
      setStatus('waiting');
      setElapsed(0);
      setStartTime(null);

      // Reset competition
      const { error } = await supabase
        .from('competitions')
        .update({
          is_active: false,
          start_time: null,
          end_time: null,
          material: null,
          reference_weight: null,
          drawing_url: null
        })
        .eq('id', COMPETITION_ID);

      if (error) throw error;

      // Delete all participants (optional - you might want to keep them)
      // Uncomment if you want to delete all participants on reset
      // await supabase.from('participants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
    } catch (err: any) {
      console.error('Error resetting competition:', err);
      throw err;
    }
  };

  const uploadDrawing = async (file: File) => {
    try {
      const filePath = `drawings/${Date.now()}-${file.name}`;

      // Upload to admin-drawings bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('admin-drawings')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('admin-drawings')
        .getPublicUrl(filePath);

      // Update competitions table with drawing URL
      const { error: updateError } = await supabase
        .from('competitions')
        .update({ drawing_url: urlData.publicUrl })
        .eq('id', COMPETITION_ID);

      if (updateError) throw updateError;
    } catch (err: any) {
      console.error('Error uploading drawing:', err);
      throw err;
    }
  };

  const updateMaterial = async (material: string, refWeight?: number) => {
    try {
      const updateData: any = { material };
      if (refWeight !== undefined) {
        updateData.reference_weight = refWeight;
      }
      
      const { error } = await supabase
        .from('competitions')
        .update(updateData)
        .eq('id', COMPETITION_ID);

      if (error) throw error;
    } catch (err: any) {
      console.error('Error updating material:', err);
      throw err;
    }
  };

  return {
    competition,
    status,
    elapsed,
    startTime,
    material: competition?.material || '',
    referenceWeight: competition?.reference_weight || 0,
    drawingUrl: competition?.drawing_url || null,
    isLoading,
    error,
    start,
    pause,
    resume,
    stop,
    reset,
    uploadDrawing,
    updateMaterial,
    refresh: loadCompetition,
  };
}
