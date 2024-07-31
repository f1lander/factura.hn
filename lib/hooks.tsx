import { useState, useEffect } from 'react';
import supabaseClient from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { Company, companyService } from '@/lib/supabase/services/company';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [matches, query]);

  return matches;
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useAccount() {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = supabaseClient();
  useEffect(() => {
    const checkAuthAndFetchCompany = async () => {
      try {
        debugger;
        setIsLoading(true);
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        setUser(user);

        if (user) {
          // Fetch company data
          const companyData = await companyService.getCompany(user.id);
          setCompany(companyData);
        }
      } catch (err) {
        console.error('Error in authentication or fetching company:', err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetchCompany();

    // Set up authentication listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const companyData = await companyService.getCompany(session.user.id);
        setCompany(companyData);
      } else {
        setCompany(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return {
    isAuthenticated: user !== null,
    user,
    company,
    error,
    isLoading
  };
}
