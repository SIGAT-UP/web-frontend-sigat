import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { services } from '@/data/services';
import { UNAUTHORIZED_EVENT } from '@/data/http/client';
import type { SessionUser } from '@/data/models/types';

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<SessionUser>;
  logout: () => Promise<void>;
}
const Ctx = createContext<AuthState>(null as never);
// eslint-disable-next-line react/only-export-components
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    let alive = true;
    services.auth.current().then(u => { if (alive) setUser(u); }).catch(() => { if (alive) setUser(null); }).finally(() => { if (alive) setLoading(false); });
    // El cliente HTTP avisa cuando el servidor rechaza el token (sesión vencida o revocada).
    const onUnauthorized = () => { qc.clear(); setUser(null); };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => { alive = false; window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized); };
  }, [qc]);

  const login = useCallback(async (email: string, password: string, remember = false) => {
    const u = await services.auth.login(email, password, remember); qc.clear(); setUser(u); return u;
  }, [qc]);
  const logout = useCallback(async () => { await services.auth.logout(); qc.clear(); setUser(null); }, [qc]);
  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react/only-export-components
export const HOME: Record<SessionUser['role'], string> = { AGRONOMO: '/agronomo/inicio', ADMIN: '/admin/inicio', PRODUCTOR: '/productor/inicio' };
