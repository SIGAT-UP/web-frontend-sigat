import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { Bell, ChevronDown, Box, ClipboardCheck, FileBarChart, History, Home, LogOut, Map, MapPin, Settings2, Sprout, CalendarDays, Leaf, Users, ScrollText, Droplets, Wheat, CircleDot, Layers, type LucideIcon } from 'lucide-react';
import { useAuth } from './auth';
import { usePageMetaValue, PageMetaProvider } from './pageMeta';
import { services } from '@/data/services';
import { useDataAsOf } from '@/data/hooks';
import { fNumeric, fShort, fTime } from '@/core/utils/format';
import { ActiveLotPicker } from './activeLot';
import isotipo from '@/assets/brand/sigat-isotipo.svg';

type Item = { to: string; label: string; icon: LucideIcon };
const MENU: Record<string, Item[]> = {
  AGRONOMO: [
    { to: '/agronomo/inicio', label: 'Inicio', icon: Home }, { to: '/agronomo/mapa', label: 'Mapa', icon: Map }, { to: '/agronomo/lote', label: 'Lote', icon: Leaf },
    { to: '/agronomo/trampas', label: 'Trampas', icon: MapPin }, { to: '/agronomo/historial', label: 'Historial', icon: History }, { to: '/agronomo/revisiones', label: 'Revisiones', icon: ClipboardCheck },
    { to: '/agronomo/resumen', label: 'Resumen y reportes', icon: FileBarChart }, { to: '/agronomo/planeacion', label: 'Planeación', icon: CalendarDays },
    { to: '/agronomo/programa', label: 'Programa de inspección', icon: Settings2 }, { to: '/agronomo/catalogos', label: 'Catálogos', icon: Box },
  ],
  ADMIN: [
    { to: '/admin/inicio', label: 'Inicio', icon: Home }, { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
    { to: '/admin/cartografia', label: 'Cartografía', icon: Leaf }, { to: '/admin/auditoria', label: 'Auditoría', icon: ScrollText },
  ],
  PRODUCTOR: [
    { to: '/productor/inicio', label: 'Inicio', icon: Home }, { to: '/productor/mi-cultivo', label: 'Mi cultivo', icon: Sprout }, { to: '/productor/estado', label: 'Estado', icon: CircleDot },
    { to: '/productor/aplicaciones', label: 'Aplicaciones', icon: Droplets }, { to: '/productor/cosecha', label: 'Cosecha', icon: Wheat }, { to: '/productor/historial', label: 'Historial', icon: History },
    { to: '/productor/planeaciones', label: 'Planeaciones', icon: Layers },
  ],
};
const SUBTITLE: Record<string, string> = { AGRONOMO: 'Vigilancia de Durazno', ADMIN: 'Administración', PRODUCTOR: 'Vigilancia de Durazno' };

function Shell() {
  const { user, logout } = useAuth(); const nav = useNavigate(); const qc = useQueryClient();
  const meta = usePageMetaValue(); const [open, setOpen] = useState(false);
  const asOf = useDataAsOf();
  const notes = useQuery({ queryKey: ['notifications', user?.id], queryFn: () => services.notifications.list(), enabled: !!user });
  if (!user) return null;
  const unread = notes.data?.filter(n => !n.read).length ?? 0;
  const items = MENU[user.role];
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-[218px] shrink-0 flex-col bg-nav px-3 py-4 text-nav-muted" aria-label="Menú principal">
        <div className="mb-5 flex items-center gap-2.5 px-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white p-1"><img src={isotipo} alt="" className="h-full w-full" /></span>
          <div className="leading-tight"><div className="text-[15px] font-extrabold tracking-wide text-white">SIGAT</div><div className="text-[10px] text-nav-muted">{SUBTITLE[user.role]}</div></div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5">
          {items.map(i => (
            <NavLink key={i.to} to={i.to} className={({ isActive }) => clsx('relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] font-medium transition-colors', isActive ? 'bg-brand text-white' : 'hover:bg-nav-raised hover:text-white')}>
              <i.icon size={15} aria-hidden /> {i.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={async () => { await logout(); nav('/login'); }} className="flex items-center gap-2.5 rounded-lg border-t border-white/10 px-3 pt-3 pb-1 text-[12px] text-nav-muted hover:text-white"><LogOut size={14} /> Cerrar sesión</button>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white/95 px-7 py-3 backdrop-blur">
          <div className="min-w-0 flex-1"><h1 className="truncate text-[17px] font-bold leading-tight text-ink">{meta.title}</h1>{meta.subtitle && <p className="truncate text-[11px] text-ink-2">{meta.subtitle}</p>}</div>
          {user.role === 'AGRONOMO' && <ActiveLotPicker />}
          {asOf.data && <span className="hidden shrink-0 whitespace-nowrap rounded-full border border-line px-3 py-1 text-[10px] font-medium text-ink-2 md:inline">Datos al {fShort(asOf.data)} · {fTime(asOf.data)}</span>}
          <div className="relative">
            <button aria-label="Notificaciones" onClick={async () => { setOpen(!open); if (!open && unread) { await services.notifications.markAllRead(); qc.invalidateQueries({ queryKey: ['notifications'] }); } }} className="relative rounded-full p-2 text-ink-2 hover:bg-surface">
              <Bell size={17} />{unread > 0 && <span className="absolute right-0.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">{unread}</span>}
            </button>
            {open && (
              <div className="absolute right-0 top-11 z-40 w-[340px] rounded-[14px] border border-line bg-white p-2 shadow-modal">
                {!notes.data?.length && <p className="p-4 text-center text-[12px] text-ink-2">Sin notificaciones</p>}
                {notes.data?.map(n => (
                  <button key={n.id} onClick={() => { setOpen(false); if (n.to) nav(n.to); }} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-surface">
                    <div className="text-[12px] font-semibold">{n.title}</div><div className="text-[11px] text-ink-2">{n.body}</div><div className="mt-0.5 text-[10px] text-ink-3">{fNumeric(n.at)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="button" onClick={() => nav(`/${user.role.toLowerCase()}/perfil`)} title="Mi perfil" className="flex items-center gap-2.5 text-left">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand-strong">{user.initials}</span>
            <div className="leading-tight"><div className="text-[12px] font-semibold">{user.name}</div><div className="text-[10px] text-ink-2">{user.roleLabel}</div></div>
            <ChevronDown size={14} className="text-ink-3" />
          </button>
        </header>
        <main className="px-7 py-6"><Outlet /></main>
      </div>
    </div>
  );
}
export default function AppShell() { return <PageMetaProvider><Shell /></PageMetaProvider>; }
