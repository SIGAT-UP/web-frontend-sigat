import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from './AppShell';
import { RoleGuard, RootRedirect } from './guards';
import Login from '@/features/auth/login/Login';
import AgHome from '@/features/agronomist/Home';
import MapPage from '@/features/agronomist/MapPage';
import LotInfo from '@/features/agronomist/LotInfo';
import Traps from '@/features/agronomist/Traps';
import History from '@/features/agronomist/History';
import Reviews from '@/features/agronomist/Reviews';
import ReviewDetail from '@/features/agronomist/ReviewDetail';
import PlanningHub from '@/features/agronomist/PlanningHub';
import { NewPlanning, AssignPlanning } from '@/features/agronomist/PlanningForms';
import Summary from '@/features/agronomist/Summary';
import Program from '@/features/agronomist/Program';
import Catalogs from '@/features/agronomist/Catalogs';
import PlanningDetail from '@/features/shared/PlanningDetail';
import AdminHome from '@/features/admin/AdminHome';
import Users from '@/features/admin/Users';
import Audit from '@/features/admin/Audit';
import { CartographyList, CartographyEdit } from '@/features/admin/Cartography';
import Profile from '@/features/shared/Profile';
import * as P from '@/features/producer/Pages';

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  { path: '/login', element: <Login /> },
  { element: <RoleGuard role="AGRONOMO" />, children: [{ element: <AppShell />, children: [
    { path: '/agronomo', element: <Navigate to="/agronomo/inicio" replace /> },
    { path: '/agronomo/inicio', element: <AgHome /> }, { path: '/agronomo/mapa', element: <MapPage /> }, { path: '/agronomo/lote', element: <LotInfo /> },
    { path: '/agronomo/trampas', element: <Traps /> }, { path: '/agronomo/historial', element: <History /> },
    { path: '/agronomo/revisiones', element: <Reviews /> }, { path: '/agronomo/revisiones/:id', element: <ReviewDetail /> },
    { path: '/agronomo/resumen', element: <Summary /> }, { path: '/agronomo/planeacion', element: <PlanningHub /> },
    { path: '/agronomo/planeacion/nueva', element: <NewPlanning /> }, { path: '/agronomo/planeacion/asignar', element: <AssignPlanning /> },
    { path: '/agronomo/planeacion/:id', element: <PlanningDetail backTo="/agronomo/planeacion" backLabel="Volver a planeaciones" title="Detalle de la planeación" /> },
    { path: '/agronomo/perfil', element: <Profile /> }, { path: '/agronomo/programa', element: <Program /> }, { path: '/agronomo/catalogos', element: <Catalogs /> },
  ] }] },
  { element: <RoleGuard role="ADMIN" />, children: [{ element: <AppShell />, children: [
    { path: '/admin', element: <Navigate to="/admin/inicio" replace /> }, { path: '/admin/inicio', element: <AdminHome /> }, { path: '/admin/usuarios', element: <Users /> },
    { path: '/admin/cartografia', element: <CartographyList /> }, { path: '/admin/cartografia/:id', element: <CartographyEdit /> }, { path: '/admin/auditoria', element: <Audit /> }, { path: '/admin/perfil', element: <Profile /> },
  ] }] },
  { element: <RoleGuard role="PRODUCTOR" />, children: [{ element: <AppShell />, children: [
    { path: '/productor', element: <Navigate to="/productor/inicio" replace /> }, { path: '/productor/inicio', element: <P.ProducerHome /> }, { path: '/productor/mi-cultivo', element: <P.MyCrop /> },
    { path: '/productor/estado', element: <P.LotState /> }, { path: '/productor/estado/:id', element: <P.LotState /> },
    { path: '/productor/aplicaciones', element: <P.Applications /> }, { path: '/productor/aplicaciones/nueva', element: <P.NewApplication /> },
    { path: '/productor/cosecha', element: <P.Harvests /> }, { path: '/productor/cosecha/registrar', element: <P.NewHarvest /> },
    { path: '/productor/historial', element: <P.ProducerHistory /> }, { path: '/productor/planeaciones', element: <P.ProducerPlannings /> },
    { path: '/productor/planeaciones/:id', element: <P.ProducerPlanningDetail /> }, { path: '/productor/perfil', element: <P.Profile /> },
  ] }] },
  { path: '*', element: <Navigate to="/" replace /> },
]);
