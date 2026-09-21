import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { StudentError } from './student-service';

export function studentErrorKey(error: unknown) {
  return error instanceof StudentError ? error.key : 'error';
}

// Follow the existing focus-refresh pattern. Never retain another account's data.
export function useStudentData<T>(load: () => Promise<T>) {
  const { session, role } = useAuth();
  const account = session?.user.id;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const sequence = useRef(0);
  useFocusEffect(useCallback(() => {
    void revision;
    const request = ++sequence.current;
    setData(null); setError('');
    if (!account || role !== 'student') { setError('signInRequired'); setLoading(false); return; }
    setLoading(true);
    void load().then(result => {
      if (request === sequence.current) setData(result);
    }).catch((reason: unknown) => {
      if (request === sequence.current) setError(studentErrorKey(reason));
    }).finally(() => {
      if (request === sequence.current) setLoading(false);
    });
    return () => { sequence.current++; };
  }, [load, account, role, revision]));
  return { data, setData, error, loading, reload: () => setRevision(value => value + 1) };
}
