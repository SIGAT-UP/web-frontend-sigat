import { useQuery } from '@tanstack/react-query';
import { services } from './services';

/** Hooks de lectura. Las pantallas nunca llaman a `services` directamente para leer. */
export const useFarm = (enabled = true) => useQuery({ queryKey: ['farm'], queryFn: () => services.lots.farm(), enabled });
export const useLots = () => useQuery({ queryKey: ['lots'], queryFn: () => services.lots.list() });
export const useLot = (id: string) => useQuery({ queryKey: ['lot', id], queryFn: () => services.lots.get(id), enabled: !!id });
export const useControl = (id: string) => useQuery({ queryKey: ['control', id], queryFn: () => services.lots.control(id), enabled: !!id });
export const useTraps = (lotId?: string) => useQuery({ queryKey: ['traps', lotId ?? 'all'], queryFn: () => services.lots.traps(lotId) });
export const useRecentActivity = (lotId: string) => useQuery({ queryKey: ['activity', lotId], queryFn: () => services.lots.recentActivity(lotId), enabled: !!lotId });
export const useLotHistory = (lotId: string) => useQuery({ queryKey: ['history', lotId], queryFn: () => services.lots.history(lotId), enabled: !!lotId });
export const useReviews = () => useQuery({ queryKey: ['reviews'], queryFn: () => services.reviews.list() });
export const useReview = (id: string) => useQuery({ queryKey: ['review', id], queryFn: () => services.reviews.get(id), enabled: !!id });
export const usePlannings = () => useQuery({ queryKey: ['plannings'], queryFn: () => services.planning.list() });
export const usePlanning = (id: string) => useQuery({ queryKey: ['planning', id], queryFn: () => services.planning.get(id), enabled: !!id });
export const useDataAsOf = () => useQuery({ queryKey: ['asOf'], queryFn: () => services.auth.dataAsOf(), staleTime: 60_000 });
