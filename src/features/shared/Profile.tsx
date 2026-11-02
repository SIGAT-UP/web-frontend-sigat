import { CheckList, DescriptionList, ProfileHeader, Section } from '@/core/ui/patterns';
import { BackLink } from '@/core/ui/PageHeader';
import { usePageMeta } from '@/app/pageMeta';
import { useAuth, HOME } from '@/app/auth';
import { ROLE_PERMISSIONS } from '@/core/config/roles';
import { useFarm } from '@/data/hooks';

const FUNCTIONS = { ADMIN: ROLE_PERMISSIONS['Administrador'], AGRONOMO: ROLE_PERMISSIONS['Agrónomo'] } as const;

/** Mi perfil para Agrónomo y Administrador (el Productor tiene el suyo con datos de cultivo). */
export default function Profile() {
  usePageMeta('Mi perfil', 'Datos de tu cuenta en SIGAT'); const { user } = useAuth();
  const farm = useFarm(user?.role === 'AGRONOMO');
  if (!user || user.role === 'PRODUCTOR') return null;
  const fx = FUNCTIONS[user.role];
  const farmName = farm.data?.name ?? '—';
  const ctx = user.role === 'ADMIN' ? 'Administración' : farmName;
  const rows: [string, string][] = [['Nombre', user.name], ['Rol en SIGAT', user.roleLabel], ['Correo electrónico', user.email], ...(user.role === 'AGRONOMO' ? [['Predio', farmName] as [string, string]] : [])];
  return (
    <div className="space-y-4">
      <BackLink to={HOME[user.role]}>Volver</BackLink>
      <ProfileHeader initials={user.initials} name={user.name} subtitle={`${user.roleLabel} · ${ctx}`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Datos de la cuenta"><DescriptionList rows={rows} /></Section>
        <Section title="Funciones del rol" subtitle="Gestiona en SIGAT"><CheckList items={fx} /></Section>
      </div>
    </div>
  );
}
