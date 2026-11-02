import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Eye, EyeOff, KeyRound, Pencil, Plus, RefreshCw, ShieldCheck, Sprout, Trash2, TriangleAlert } from 'lucide-react';
import { Badge, Button, Card, DataTable, ErrorBox, Field, Input, Modal, Notice, Select, StateBadge, Textarea, useAlerts } from '@/core/ui';
import { usePageMeta } from '@/app/pageMeta';
import { services } from '@/data/services';
import { ROLE_PERMISSIONS } from '@/core/config/roles';
import { Q } from '@/features/shared/Query';
import { cedulaValida, correoValido, telefonoValido, usuarioValido } from '@/core/utils/validaciones';
import type { AppUser, NewUserInput, UpdateUserInput, UserRole } from '@/data/models/types';

const ROLES: UserRole[] = ['Agrónomo', 'Productor', 'Técnico', 'Administrador'];
const acceso = (r: UserRole | '') => (!r ? 'Se asigna según el rol' : r === 'Técnico' ? 'Solo móvil' : r === 'Administrador' ? 'Web' : 'Móvil y web');

export default function Users() {
  usePageMeta('Usuarios', 'Usuarios y roles del sistema');
  const q = useQuery({ queryKey: ['users'], queryFn: () => services.admin.users() }); const qc = useQueryClient(); const alerts = useAlerts();
  const [form, setForm] = useState<null | { edit?: AppUser }>(null);
  const [borrar, setBorrar] = useState<AppUser | null>(null);
  const [clave, setClave] = useState<{ user: AppUser; requested: boolean } | null>(null);
  // Desde el aviso «Solicitud de nueva contraseña» se llega con ?id=<usuario>: se abre el diálogo de esa persona.
  const [params, setParams] = useSearchParams();
  const pedido = params.get('id');
  const pedidoUser = pedido ? q.data?.find(x => x.id === pedido) : undefined;
  const dialogo = clave ?? (pedidoUser ? { user: pedidoUser, requested: true } : null);
  const cerrarClave = () => { setClave(null); if (pedido) setParams(p => { p.delete('id'); return p; }, { replace: true }); };
  const refrescar = () => { qc.invalidateQueries({ queryKey: ['users'] }); qc.invalidateQueries({ queryKey: ['audit'] }); };
  const toggle = useMutation({ mutationFn: (v: { id: string; a: boolean }) => services.admin.setUserActive(v.id, v.a), onSuccess: refrescar, onError: e => alerts.error('No se pudo cambiar el estado', e instanceof Error ? e.message : String(e)) });
  return (
    <div className="space-y-4">
      <Q q={q}>{us => (
        <Card>
          <div className="mb-3 flex items-center justify-between"><p className="text-[12px] text-ink-2">{us.length} usuarios · cada usuario tiene un solo rol</p><Button onClick={() => setForm({})}><Plus size={14} /> Nuevo usuario</Button></div>
          <DataTable rows={us} rowKey={u => u.id} noun="registros" columns={[
            { header: 'Nombre', cell: u => <span className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand-strong">{u.initials}</span><span><b>{u.name}</b> {u.note && <Badge tone="warn" className="ml-1">{u.note}</Badge>}<span className="block text-[10px] text-ink-2">{u.email} · C.C. {u.cedula}</span></span></span> },
            { header: 'Usuario', cell: u => u.username },
            { header: 'Rol', cell: u => u.role }, { header: 'Acceso', cell: u => u.access }, { header: 'Estado', cell: u => <StateBadge s={u.active ? 'Activo' : 'Inactiva'} /> },
            { header: 'Acciones', cell: u => (
              <span className="flex flex-wrap gap-3 text-[12px] font-semibold text-brand">
                <button onClick={() => setForm({ edit: u })} className="inline-flex items-center gap-1"><Pencil size={12} /> Editar</button>
                <button onClick={() => toggle.mutate({ id: u.id, a: !u.active })}>{u.active ? 'Desactivar' : 'Activar'}</button>
                <button onClick={() => setClave({ user: u, requested: false })} className="inline-flex items-center gap-1"><KeyRound size={12} /> Asignar contraseña</button>
                <button onClick={() => setBorrar(u)} className="inline-flex items-center gap-1 text-danger"><Trash2 size={12} /> Eliminar</button>
              </span>
            ) },
          ]} />
        </Card>
      )}</Q>
      <div className="grid gap-4 md:grid-cols-2">
        {([['Agrónomo', ShieldCheck], ['Productor', Sprout]] as const).map(([r, I]) => (
          <Card key={r}><div className="mb-3 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand"><I size={17} /></span><div><div className="text-[14px] font-semibold">{r}</div><div className="text-[10px] text-ink-2">Permisos principales</div></div></div>
            <ul className="space-y-1.5 text-[12px]">{ROLE_PERMISSIONS[r].map(p => <li key={p} className="flex items-center gap-2"><Check size={13} className="text-brand" />{p}</li>)}</ul></Card>
        ))}
      </div>
      {form && <UserForm edit={form.edit} onClose={() => setForm(null)} onDone={(titulo, msg) => { setForm(null); refrescar(); alerts.success(titulo, msg); }} />}
      {dialogo && <AssignPassword key={dialogo.user.id} user={dialogo.user} requested={dialogo.requested} onClose={cerrarClave} onDone={msg => { cerrarClave(); refrescar(); alerts.success('Contraseña asignada', msg); }} />}
      {borrar && <DeleteUser user={borrar} onClose={() => setBorrar(null)} onDone={msg => { setBorrar(null); refrescar(); alerts.success('Usuario eliminado', msg); }} />}
    </div>
  );
}

type Datos = Required<Omit<NewUserInput, 'role'>> & { role: UserRole | '' };
const desde = (u?: AppUser): Datos => ({
  cedula: u?.cedula ?? '', firstName: u?.firstName ?? '', lastName: u?.lastName ?? '', email: u?.email ?? '', phone: u?.phone ?? '', address: u?.address ?? '',
  username: u?.username ?? '', password: '', role: u?.role ?? '', centerId: u?.centerId ?? '', municipalityId: u?.municipalityId ?? '',
});

/** Crear y editar usan el mismo formulario. Al editar solo se envían los campos que cambiaron (PATCH). */
function UserForm({ edit, onClose, onDone }: { edit?: AppUser; onClose: () => void; onDone: (titulo: string, msg: string) => void }) {
  const opciones = useQuery({ queryKey: ['userFormOptions'], queryFn: () => services.admin.userFormOptions() });
  const inicial = desde(edit); const [f, setF] = useState<Datos>(inicial); const [show, setShow] = useState(false); const [err, setErr] = useState('');
  const set = (k: keyof Datos) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const cambios = (): UpdateUserInput => {
    const c: Record<string, string> = {};
    (Object.keys(f) as (keyof Datos)[]).forEach(k => { if (k !== 'password' && f[k] !== inicial[k]) c[k] = f[k]; });
    if (c.role) { if (f.centerId) c.centerId = f.centerId; if (f.municipalityId) c.municipalityId = f.municipalityId; }
    return c as UpdateUserInput;
  };
  const m = useMutation({
    mutationFn: () => edit ? services.admin.updateUser(edit.id, cambios()) : services.admin.createUser({ ...f, role: f.role as UserRole }),
    onSuccess: u => onDone(edit ? 'Usuario actualizado' : 'Usuario creado', edit ? `Se guardaron los cambios de ${u.name}.` : f.password ? 'Entrégale la contraseña temporal; al entrar se le pedirá cambiarla.' : 'Aún no tiene contraseña: asígnale una con «Asignar contraseña».'),
  });
  const submit = () => {
    if (!cedulaValida(f.cedula)) return setErr('La cédula debe tener solo números (5 a 15 dígitos).');
    if (!f.firstName.trim() || !f.lastName.trim()) return setErr('Escribe nombres y apellidos.');
    if (!correoValido(f.email)) return setErr('Escribe un correo válido.');
    if (!telefonoValido(f.phone)) return setErr('El teléfono debe tener solo números (7 a 15), con + opcional.');
    if (!usuarioValido(f.username)) return setErr('El usuario debe tener de 3 a 64 caracteres: letras, números, punto, guion o @.');
    if (!edit && f.password && f.password.length < 10) return setErr('La contraseña temporal debe tener al menos 10 caracteres (o déjala vacía y asígnala después).');
    if (!f.role) return setErr('Selecciona un rol.');
    if ((f.role === 'Técnico' || f.role === 'Administrador') && !f.centerId) return setErr('Selecciona el centro de acopio.');
    if (f.role === 'Productor' && !f.municipalityId) return setErr('Selecciona el municipio del productor.');
    if (edit && !Object.keys(cambios()).length) return setErr('No hay cambios para guardar.');
    setErr(''); m.mutate();
  };
  const cambiaCedula = !!edit && f.cedula !== inicial.cedula;
  const cambiaRol = !!edit && f.role !== inicial.role;
  return (
    <Modal open onClose={onClose} icon={edit ? <Pencil size={20} /> : <Plus size={20} />} title={edit ? `Editar a ${edit.name}` : 'Nuevo usuario'}
      subtitle={edit ? 'Corrige nombre, contacto, usuario, rol o cédula. Cada cambio queda en la auditoría a tu nombre.' : 'Completa los datos de la persona y el rol que tendrá en SIGAT.'} width="max-w-[520px]">
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Cédula" hint="Solo números, sin puntos."><Input inputMode="numeric" value={f.cedula} onChange={set('cedula')} placeholder="Ej.: 1094123456" autoFocus={!edit} /></Field>
          <Field label="Usuario" hint="Credencial para iniciar sesión."><Input value={f.username} onChange={set('username')} placeholder="Ej.: agomez" /></Field>
          <Field label="Nombres"><Input value={f.firstName} onChange={set('firstName')} placeholder="Ej.: Ana María" autoFocus={!!edit} /></Field>
          <Field label="Apellidos"><Input value={f.lastName} onChange={set('lastName')} placeholder="Ej.: Gómez" /></Field>
          <Field label="Correo electrónico"><Input type="email" value={f.email} onChange={set('email')} placeholder="nombre@correo.com" /></Field>
          <Field label="Teléfono (opcional)"><Input inputMode="tel" value={f.phone} onChange={set('phone')} placeholder="Ej.: 3001234567" /></Field>
        </div>
        <Field label="Dirección (opcional)"><Input value={f.address} onChange={set('address')} /></Field>
        {!edit && <Field label="Contraseña temporal" hint="Mínimo 10 caracteres. Se le pedirá cambiarla. Si la dejas vacía, asígnala después con «Asignar contraseña»."><div className="relative"><Input type={show ? 'text' : 'password'} value={f.password} onChange={set('password')} className="pr-10" /><button type="button" aria-label="Mostrar u ocultar contraseña" onClick={() => setShow(!show)} className="absolute right-3 top-2.5 text-ink-3">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></Field>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Rol"><Select value={f.role} onChange={set('role')}><option value="">Selecciona un rol</option>{ROLES.map(r => <option key={r}>{r}</option>)}</Select></Field>
          <Field label="Acceso"><Input readOnly value={acceso(f.role)} /></Field>
        </div>
        {(f.role === 'Técnico' || f.role === 'Administrador') && (
          <Field label="Centro de acopio" hint="La base de datos lo exige para técnicos y administradores."><Select value={f.centerId} onChange={set('centerId')}><option value="">Selecciona el centro</option>{(opciones.data?.centers ?? []).map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</Select></Field>
        )}
        {f.role === 'Productor' && (
          <Field label="Municipio" hint="La base de datos lo exige para productores."><Select value={f.municipalityId} onChange={set('municipalityId')}><option value="">Selecciona el municipio</option>{(opciones.data?.municipalities ?? []).map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</Select></Field>
        )}
        {cambiaCedula && <Notice tone="warn" title="Cambio de cédula">Solo se permite si no hay predios ni registros a nombre de esta persona. Si los hay, la corrección es institucional.</Notice>}
        {cambiaRol && <Notice tone="info" title="Cambio de rol">Se cerrarán sus sesiones abiertas y tendrá que volver a iniciar sesión.</Notice>}
        <p className="text-[10px] text-ink-3">Cada usuario tiene un solo rol (RF-002, RF-023). Usuario y correo no se pueden repetir, aunque cambien las mayúsculas.</p>
        {(err || m.error) && <ErrorBox error={err ? new Error(err) : m.error} />}
        <Button block disabled={m.isPending} onClick={submit}>{edit ? 'Guardar cambios' : 'Crear usuario'}</Button><Button block variant="secondary" onClick={onClose}>Cancelar</Button>
      </div>
    </Modal>
  );
}

/** Eliminar: primero se pregunta al servidor qué pasará (borrar o dar de baja) y se pide el motivo. */
function DeleteUser({ user, onClose, onDone }: { user: AppUser; onClose: () => void; onDone: (msg: string) => void }) {
  const preview = useQuery({ queryKey: ['deletePreview', user.id], queryFn: () => services.admin.deletePreview(user.id) });
  const [motivo, setMotivo] = useState(''); const [err, setErr] = useState('');
  const m = useMutation({ mutationFn: () => services.admin.deleteUser(user.id, motivo), onSuccess: r => onDone(r.message) });
  const baja = preview.data?.outcome === 'dado_de_baja';
  return (
    <Modal open onClose={onClose} icon={<TriangleAlert size={20} />} title={`¿Eliminar a ${user.name}?`} subtitle={`${user.role} · ${user.email}`}>
      <div className="space-y-3">
        {preview.isLoading && <p className="text-[12px] text-ink-2">Revisando si tiene registros…</p>}
        {preview.error && <ErrorBox error={preview.error} />}
        {preview.data && <Notice tone={baja ? 'warn' : 'danger'} title={baja ? 'Se dará de baja (definitivo)' : 'Se borrará por completo'}>{preview.data.explanation}</Notice>}
        <Field label="Motivo (obligatorio)" hint="Mínimo 10 caracteres. Queda en la auditoría."><Textarea rows={3} value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ej.: cuenta creada por error / ya no trabaja con el programa" autoFocus /></Field>
        {(err || m.error) && <ErrorBox error={err ? new Error(err) : m.error} />}
        <Button block variant="danger" disabled={m.isPending || !preview.data} onClick={() => { if (motivo.trim().length < 10) return setErr('Escribe el motivo (mínimo 10 caracteres).'); setErr(''); m.mutate(); }}>
          {baja ? 'Dar de baja definitivamente' : 'Eliminar usuario'}
        </Button>
        <Button block variant="secondary" onClick={onClose}>Cancelar</Button>
        <p className="text-[10px] text-ink-3">Si solo necesitas quitarle el acceso por un tiempo, usa Desactivar: se puede revertir.</p>
      </div>
    </Modal>
  );
}

/** Contraseña aleatoria de 12 caracteres sin letras que se confundan al dictarla (0/O, 1/l/I). */
function generarContrasena(): string {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const n = new Uint32Array(12); crypto.getRandomValues(n);
  return Array.from(n, x => abc[x % abc.length]).join('');
}

/**
 * El administrador asigna una contraseña nueva y se la entrega ÉL MISMO a la persona, por el medio que
 * prefiera (en persona, por teléfono…). SIGAT no la envía. Al entrar se le pide cambiarla y sus sesiones
 * abiertas se cierran al instante.
 */
function AssignPassword({ user, requested, onClose, onDone }: { user: AppUser; requested: boolean; onClose: () => void; onDone: (msg: string) => void }) {
  const [clave, setClave] = useState(''); const [repite, setRepite] = useState(''); const [show, setShow] = useState(false); const [err, setErr] = useState(''); const [copiada, setCopiada] = useState(false);
  const m = useMutation({ mutationFn: () => services.admin.assignPassword(user.id, clave), onSuccess: () => onDone(`Entrégale la contraseña a ${user.name} por el medio que prefieras. Al entrar se le pedirá cambiarla.`) });
  const generar = () => { const g = generarContrasena(); setClave(g); setRepite(g); setShow(true); setCopiada(false); };
  const copiar = async () => { try { await navigator.clipboard.writeText(clave); setCopiada(true); } catch { setErr('No se pudo copiar: selecciónala y cópiala a mano.'); } };
  const submit = () => {
    if (clave.length < 10) return setErr('La contraseña debe tener al menos 10 caracteres.');
    if (clave !== repite) return setErr('Las contraseñas no coinciden.');
    if ([user.username, user.email].some(x => x && x.toLowerCase() === clave.trim().toLowerCase())) return setErr('La contraseña no puede ser igual al usuario ni al correo.');
    setErr(''); m.mutate();
  };
  return (
    <Modal open onClose={onClose} icon={<KeyRound size={20} />} title={`Asignar contraseña a ${user.name}`} subtitle={`${user.username} · ${user.role}`} width="max-w-[460px]">
      <div className="space-y-3">
        {requested && <Notice tone="info" title="Pidió una contraseña nueva">Esta persona escribió en «¿Problemas para ingresar?». Asígnale una contraseña y entrégasela tú.</Notice>}
        <Field label="Contraseña nueva" hint="Mínimo 10 caracteres.">
          <div className="relative"><Input type={show ? 'text' : 'password'} value={clave} onChange={e => { setClave(e.target.value); setCopiada(false); }} className="pr-10" autoFocus autoComplete="new-password" />
            <button type="button" aria-label="Mostrar u ocultar contraseña" onClick={() => setShow(!show)} className="absolute right-3 top-2.5 text-ink-3">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
        </Field>
        <Field label="Repite la contraseña"><Input type={show ? 'text' : 'password'} value={repite} onChange={e => setRepite(e.target.value)} autoComplete="new-password" /></Field>
        <div className="flex flex-wrap gap-3 text-[12px] font-semibold text-brand">
          <button type="button" onClick={generar} className="inline-flex items-center gap-1"><RefreshCw size={12} /> Generar una</button>
          {clave && <button type="button" onClick={copiar} className="inline-flex items-center gap-1"><Copy size={12} /> {copiada ? 'Copiada' : 'Copiar'}</button>}
        </div>
        <Notice tone="warn" title="Qué pasa al guardar">Se cierran sus sesiones abiertas en la web y el móvil, y al entrar con esta contraseña se le pedirá cambiarla. SIGAT no se la envía: dásela tú.</Notice>
        {(err || m.error) && <ErrorBox error={err ? new Error(err) : m.error} />}
        <Button block disabled={m.isPending} onClick={submit}>Asignar contraseña</Button>
        <Button block variant="secondary" onClick={onClose}>Cancelar</Button>
      </div>
    </Modal>
  );
}
