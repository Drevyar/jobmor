import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ALL_ROLES } from '@/constants/roles';
import { startSupabaseAutoRefresh, supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/user';

type AuthState = {
  session: Session | null;
  role: UserRole | null;
  isLoading: boolean;
  error: string | null;
};

type AuthContextValue = AuthState & {
  retry: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && ALL_ROLES.includes(value as UserRole);
}

async function resolveRole(session: Session | null) {
  if (!session) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (error) throw error;
  if (!isUserRole(data?.role)) throw new Error('The signed-in account has no valid profile role.');
  return data.role;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    role: null,
    isLoading: true,
    error: null,
  });
  const [retryCount, setRetryCount] = useState(0);
  const requestId = useRef(0);

  const applySession = useCallback((session: Session | null) => {
    const currentRequest = ++requestId.current;
    setAuthState({ session, role: null, isLoading: true, error: null });

    void resolveRole(session)
      .then((role) => {
        if (currentRequest !== requestId.current) return;
        setAuthState({ session, role, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (currentRequest !== requestId.current) return;
        const message = error instanceof Error ? error.message : 'Could not load the session.';
        setAuthState({ session, role: null, isLoading: false, error: message });
      });
  }, []);

  useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        setAuthState({ session: null, role: null, isLoading: false, error: error.message });
        return;
      }

      applySession(data.session);
    });

    return () => {
      active = false;
    };
  }, [applySession, retryCount]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Supabase advises keeping this callback synchronous. Resolve the profile after it returns.
      setTimeout(() => applySession(session), 0);
    });
    const stopAutoRefresh = startSupabaseAutoRefresh();

    return () => {
      authListener.subscription.unsubscribe();
      stopAutoRefresh();
    };
  }, [applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...authState,
      retry: () => {
        setAuthState((current) => ({ ...current, isLoading: true, error: null }));
        setRetryCount((count) => count + 1);
      },
    }),
    [authState],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
