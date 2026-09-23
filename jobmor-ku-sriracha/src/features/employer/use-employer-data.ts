import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { EmployerError } from './employer-service';

export function errorKey(error: unknown) {
  if (__DEV__ && !(error instanceof EmployerError)) console.error('Employer request failed', error);
  return error instanceof EmployerError ? error.key : 'error';
}

/** Refresh on navigation focus and discard responses from previous jobs/accounts. */
export function useEmployerData<T>(load: () => Promise<T>) {
  const { session } = useAuth();
  const account = session?.user.id;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const sequence = useRef(0);
  useFocusEffect(useCallback(() => {
    // Account and explicit refresh changes both invalidate the current request.
    void revision;
    if (!account) { setData(null); setError('signInRequired'); setLoading(false); return; }
    const request = ++sequence.current;
    setData(null); setLoading(true); setError('');
    void load().then(result => {
      if (request === sequence.current) setData(result);
    }).catch((reason: unknown) => {
      if (request === sequence.current) setError(errorKey(reason));
    }).finally(() => {
      if (request === sequence.current) setLoading(false);
    });
    return () => { sequence.current++; };
  }, [load, account, revision]));
  return { data, setData, error, loading, reload: () => setRevision(value => value + 1) };
}
