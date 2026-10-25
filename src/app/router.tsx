import { createBrowserRouter } from 'react-router-dom'

import { AuthLayout } from '@/app/layouts/AuthLayout'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { CatalogosPage } from '@/pages/catalogos/CatalogosPage'
import { ConceptosPage } from '@/pages/conceptos/ConceptosPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { ImportacionesPage } from '@/pages/importaciones/ImportacionesPage'
import { LecturasPage } from '@/pages/lecturas/LecturasPage'
import { LoginPage } from '@/pages/login/LoginPage'
import { LotesPage } from '@/pages/lotes/LotesPage'
import { MtdPage } from '@/pages/mtd/MtdPage'
import { PrediosPage } from '@/pages/predios/PrediosPage'
import { ReportesPage } from '@/pages/reportes/ReportesPage'
import { TrampasPage } from '@/pages/trampas/TrampasPage'
import { UsuariosPage } from '@/pages/usuarios/UsuariosPage'

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: <DashboardLayout />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/predios', element: <PrediosPage /> },
      { path: '/lotes', element: <LotesPage /> },
      { path: '/trampas', element: <TrampasPage /> },
      { path: '/lecturas', element: <LecturasPage /> },
      { path: '/mtd', element: <MtdPage /> },
      { path: '/conceptos', element: <ConceptosPage /> },
      { path: '/reportes', element: <ReportesPage /> },
      { path: '/usuarios', element: <UsuariosPage /> },
      { path: '/catalogos', element: <CatalogosPage /> },
      { path: '/importaciones', element: <ImportacionesPage /> },
    ],
  },
])
