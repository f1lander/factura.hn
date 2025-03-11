import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase/client';

const supabaseClient = supabase();

/**
 * Custom hook to get the current Supabase authentication token
 * @returns An object containing the auth token, loading state, and error if any
 */
export function useSupabaseAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function getToken() {
      try {
        setLoading(true);
        const { data, error } = await supabaseClient.auth.getSession();

        if (error) {
          throw error;
        }

        setToken(data.session?.access_token || null);
      } catch (err) {
        console.error('Error fetching auth token:', err);
        setError(
          err instanceof Error ? err : new Error('Unknown error occurred')
        );
      } finally {
        setLoading(false);
      }
    }

    getToken();

    // Set up subscription for auth changes
    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        setToken(session?.access_token || null);
        setUserId(session?.user?.id || null);
      }
    );

    // Clean up subscription on unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return { token, userId, loading, error };
}
