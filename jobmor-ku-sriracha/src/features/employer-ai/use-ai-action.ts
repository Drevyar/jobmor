import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { AiError } from '../../../supabase/functions/_shared/ai-contracts';
import type { AiRequest, AiResponse } from '../../../supabase/functions/_shared/ai-contracts';
import { requestEmployerAi } from './ai-service';
export function useAiAction() {
  const [result, setResult] = useState<AiResponse | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  useFocusEffect(useCallback(() => {
    setResult(null); setError(''); setBusy(false);
    return () => { sequence.current++; controller.current?.abort(); controller.current = null; };
  }, []));
  const run = async (request: AiRequest) => {
    if (controller.current) return;
    const id = ++sequence.current;
    const abort = new AbortController(); controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), 45000);
    setBusy(true); setResult(null); setError('');
    try {
      const response = await requestEmployerAi(request, abort.signal);
      if (id === sequence.current) setResult(response);
    } catch (reason) {
      if (id === sequence.current) setError(reason instanceof AiError ? reason.code : 'unavailable');
    } finally {
      clearTimeout(timeout);
      if (id === sequence.current) { setBusy(false); controller.current = null; }
    }
  };
  return { result, error, busy, run, clear: () => { setResult(null); setError(''); } };
}
