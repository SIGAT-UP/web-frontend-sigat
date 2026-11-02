import { Navigate, Outlet } from 'react-router-dom';
import { HOME, useAuth } from './auth';
import type { Role } from '@/data/models/types';
import logoVertical from '@/assets/brand/sigat-logo-vertical.svg';

/** Pantalla breve mientras se valida la sesión guardada. */
export function Splash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface" role="status" aria-live="polite">
      <img src={logoVertical} alt="SIGAT" width={160} height={160} className="animate-pulse" />
      <span className="text-[12px] text-ink-2">Cargando…</span>
    </div>
  );
}

/** Protección por rol: sin sesión → login; otro rol → vuelve a su propio inicio. */
export function RoleGuard({ role }: { role: Role }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={HOME[user.role]} replace />;
  return <Outlet />;
}
export function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  return <Navigate to={user ? HOME[user.role] : '/login'} replace />;
}
