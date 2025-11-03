import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { calculateScore } from '../lib/utils';
import type { Participant } from '../lib/types';

interface UseParticipantsResult {
  participants: Participant[];
  participantCount: number;
  submissionCount: number;
  isLoading: boolean;
  error: string | null;
  registerParticipant: (name: string, email: string, college: string) => Promise<Participant>;
  getParticipant: (email: string) => Promise<Participant | null>;
  submitCAD: (email: string, file: File, weight: number, referenceWeight: number, tolerance?: number) => Promise<void>;
  resetSubmissions: (mode?: 'clear' | 'delete') => Promise<void>;
  refresh: () => Promise<void>;
}

export function useParticipants(): UseParticipantsResult {
  const supabase = getSupabaseClient();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadParticipants = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('participants')
        .select('id, name, email, college, submitted_weight, file_url, score, time_submitted, created_at')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setParticipants(data || []);
    } catch (err: any) {
      console.error('Error loading participants:', err);
      setError(err.message || 'Failed to load participants');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadParticipants();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('participants-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants' },
        () => {
          loadParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadParticipants, supabase]);

  const registerParticipant = async (name: string, email: string, college: string): Promise<Participant> => {
    try {
      const { data, error: upsertError } = await supabase
        .from('participants')
        .upsert(
          {
            name,
            email,
            college,
            score: 0,
            submitted_weight: null,
            file_url: null,
            time_submitted: null
          },
          {
            onConflict: 'email'
          }
        )
        .select()
        .single();

      if (upsertError) throw upsertError;

      return data as Participant;
    } catch (err: any) {
      console.error('Error registering participant:', err);
      throw err;
    }
  };

  const getParticipant = async (email: string): Promise<Participant | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('participants')
        .select('*')
        .eq('email', email)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      return data as Participant | null;
    } catch (err: any) {
      console.error('Error getting participant:', err);
      throw err;
    }
  };

  const submitCAD = async (
    email: string,
    file: File,
    weight: number,
    referenceWeight: number,
    tolerance: number = 5
  ): Promise<void> => {
    try {
      // Validate file
      if (!file) {
        throw new Error('No file selected');
      }

      // Check file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > maxSize) {
        throw new Error('File is too large. Maximum size is 50MB.');
      }

      // Validate file extension
      const allowedExtensions = ['.step', '.stp', '.stl', '.iges', '.igs', '.zip', '.rar'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error(`File type not allowed. Accepted formats: ${allowedExtensions.join(', ')}`);
      }

      // Create file path in submissions bucket
      const sanitizedEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
      const filePath = `submissions/${sanitizedEmail}-${Date.now()}-${file.name}`;

      console.log('Uploading CAD file to submissions bucket:', filePath);

      // Check if submissions bucket exists (this will fail gracefully if bucket doesn't exist)
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError) {
        console.warn('Could not list buckets:', bucketError);
      } else {
        const submissionsBucket = buckets?.find(b => b.name === 'submissions');
        if (!submissionsBucket) {
          throw new Error('Storage bucket "submissions" does not exist. Please contact admin to create it in Supabase.');
        }
      }

      // Upload file to Supabase Storage submissions bucket
      // Wrap upload in a timeout to prevent hanging uploads (60 seconds for large files)
      const uploadWithTimeout = async () => {
        const uploadPromise = supabase.storage
          .from('submissions')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false, // Don't overwrite existing files
          });

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Upload timeout: File upload took too long. Please try again with a smaller file or check your connection.'));
          }, 60000); // 60 second timeout
        });

        return Promise.race([uploadPromise, timeoutPromise]);
      };

      const { data: uploadData, error: uploadError } = await uploadWithTimeout();

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        
        // Provide specific error messages
        if (uploadError.message?.includes('already exists') || uploadError.message?.includes('duplicate')) {
          // If file already exists, try with a different timestamp
          const newFilePath = `submissions/${sanitizedEmail}-${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
          console.log('File exists, retrying with new path:', newFilePath);
          
          const { data: retryData, error: retryError } = await supabase.storage
            .from('submissions')
            .upload(newFilePath, file, {
              cacheControl: '3600',
              upsert: false,
            });
          
          if (retryError) {
            throw new Error(`Upload failed: ${retryError.message || 'Unknown error'}`);
          }
          
          // Use the retry path for subsequent operations
          const { data: retryUrlData } = supabase.storage
            .from('submissions')
            .getPublicUrl(newFilePath);
          
          if (!retryUrlData?.publicUrl) {
            throw new Error('Failed to get public URL for uploaded file');
          }
          
          // Continue with retry URL
          const submissionTime = new Date().toISOString();
          const score = calculateScore(weight, referenceWeight, tolerance);
          
          const { error: updateError } = await supabase
            .from('participants')
            .update({
              file_url: retryUrlData.publicUrl,
              time_submitted: submissionTime,
              submitted_weight: weight,
              score: score
            })
            .eq('email', email);
          
          if (updateError) {
            throw new Error(`Failed to save submission: ${updateError.message || 'Unknown error'}`);
          }
          
          console.log('Participant submission updated successfully (retry)');
          return; // Exit early since we handled the retry
        } else if (uploadError.message?.includes('permission') || uploadError.message?.includes('policy')) {
          throw new Error('Permission denied: Storage bucket policy may not allow uploads. Please contact admin.');
        } else if (uploadError.message?.includes('bucket')) {
          throw new Error('Storage bucket error: The submissions bucket may not exist or be configured correctly.');
        } else {
          throw new Error(`Upload failed: ${uploadError.message || 'Unknown error. Please check your connection and try again.'}`);
        }
      }

      console.log('File uploaded successfully:', uploadData);

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('submissions')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }

      console.log('File public URL:', urlData.publicUrl);

      // Record submission time
      const submissionTime = new Date().toISOString();

      // Calculate score based on weight accuracy
      const score = calculateScore(weight, referenceWeight, tolerance);

      console.log('Calculated score:', score, 'for weight:', weight, 'vs reference:', referenceWeight);

      // Update participant record with submission data
      const { error: updateError } = await supabase
        .from('participants')
        .update({
          file_url: urlData.publicUrl,
          time_submitted: submissionTime,
          submitted_weight: weight,
          score: score
        })
        .eq('email', email);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error(`Failed to save submission: ${updateError.message || 'Unknown error'}`);
      }

      console.log('Participant submission updated successfully');
    } catch (err: any) {
      console.error('Error submitting CAD:', err);
      // Re-throw with user-friendly message
      if (err.message) {
        throw err;
      }
      throw new Error('Failed to submit CAD file. Please try again.');
    }
  };

  // Reset leaderboard: either clear submission fields for all participants or delete all rows
  const resetSubmissions = async (mode: 'clear' | 'delete' = 'clear'): Promise<void> => {
    try {
      if (mode === 'delete') {
        const { error } = await supabase
          .from('participants')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('participants')
          .update({
            file_url: null,
            time_submitted: null,
            submitted_weight: null,
            score: 0,
          })
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
      }
      await loadParticipants();
    } catch (err: any) {
      console.error('Error resetting submissions:', err);
      throw err;
    }
  };

  const participantCount = participants.length;
  const submissionCount = participants.filter(p => p.file_url || p.time_submitted).length;

  return {
    participants,
    participantCount,
    submissionCount,
    isLoading,
    error,
    registerParticipant,
    getParticipant,
    submitCAD,
    resetSubmissions,
    refresh: loadParticipants,
  };
}
