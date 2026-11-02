import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/router';
import { AuthProvider } from '@/app/auth';
import { AlertProvider } from '@/core/ui';
import { ApiError } from '@/data/http/client';
import './index.css';

/** Reintenta solo fallos de red o del servidor (5xx); los 4xx son definitivos. */
// No se reintenta lo que no va a cambiar: errores del cliente (4xx) ni funciones aún no implementadas en el backend (501).
const retry = (count: number, error: unknown) => count < 2 && !(error instanceof ApiError && ((error.status >= 400 && error.status < 500) || error.status === 501));
const qc = new QueryClient({ defaultOptions: { queries: { retry, refetchOnWindowFocus: false, staleTime: 30_000 }, mutations: { retry: false } } });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <AlertProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </AlertProvider>
    </QueryClientProvider>
  </StrictMode>,
);
