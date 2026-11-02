import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { ErrorBox, Loading } from '@/core/ui';

/** Muestra carga/errores y entrega el dato ya resuelto. */
export function Q<T>({ q, children }: { q: UseQueryResult<T>; children: (d: T) => ReactNode }) {
  if (q.isLoading) return <Loading />;
  if (q.error || q.data === undefined) return <ErrorBox error={q.error} />;
  return <>{children(q.data)}</>;
}
