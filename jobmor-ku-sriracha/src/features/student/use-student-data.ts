import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { StudentError } from './student-service';

export function studentErrorKey(error: unknown) {
  if (error instanceof StudentError) return error.key;
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = error.code;
    if (code === '42P01' || code === 'PGRST205' || code === 'PGRST204') return 'databaseSetupRequired';
    if (code === '42501') return 'verifiedRequired';
  }
  return 'error';
}

// Follow the existing focus-refresh pattern. Never retain another account's data.
export function useStudentData<T>(load: () => Promise<T>) {
  const { session, role } = useAuth();
  const account = session?.user.id;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const sequence = useRef(0);
  const refresh = useCallback(async (clearExisting: boolean): Promise<boolean> => {
    const request = ++sequence.current;
    if (clearExisting) setData(null);
    setError('');
    if (!account || role !== 'student') { setError('signInRequired'); setLoading(false); return false; }
    setLoading(true);
    try {
      // load คือฟังก์ชัน service ที่หน้าจอส่งมา → รอข้อมูลจาก Supabase → setData ให้ React แสดงผลใหม่
      const result = await load();
      if (request !== sequence.current) return false;
      setData(result);
      return true;
    } catch (reason) {
      if (request === sequence.current) setError(studentErrorKey(reason));
      return false;
    } finally {
      if (request === sequence.current) setLoading(false);
    }
  }, [load, account, role]);
  useFocusEffect(useCallback(() => {
    void refresh(true);
    return () => { sequence.current++; };
  }, [refresh]));
  return { data, setData, error, loading, reload: () => refresh(false) };
}
