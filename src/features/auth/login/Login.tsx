import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { HOME, useAuth } from '@/app/auth';
import { services } from '@/data/services';
import { ApiError } from '@/data/http/client';
import { correoValido } from '@/core/utils/validaciones';
import { env } from '@/config/env';
import ScannerPanel from './ScannerPanel';
import AboutUs from '../AboutUs';
import './login.css';

type View = 'login' | 'recover' | 'sent';
const ORDER: View[] = ['login', 'recover', 'sent'];

/** Inicio de sesión de SIGAT: panel verde con minijuego + flujo login → recuperar → solicitud enviada. */
export default function Login() {
  const { user } = useAuth();
  const [view, setView] = useState<View>('login');
  const [dir, setDir] = useState<1 | -1>(1);
  const [email, setEmail] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shownView = useRef<View>(view);

  const go = (next: View) => { setDir(ORDER.indexOf(next) >= ORDER.indexOf(view) ? 1 : -1); setView(next); };

  // Al cambiar de vista, el foco pasa al título nuevo (teclado y lector de pantalla).
  useEffect(() => {
    if (shownView.current === view) return;
    shownView.current = view;
    headingRef.current?.focus({ preventScroll: true });
  }, [view]);

  if (user) return <Navigate to={HOME[user.role]} replace />;

  return (
    <>
    <div className="sg-root" id="login">
      <ScannerPanel />
      <main className="sg-form-side">
        <div className="sg-form-wrap">
          <div key={view} className={`sg-view ${dir === 1 ? 'sg-view--fwd' : 'sg-view--back'}`}>
            {view === 'login' && <LoginForm headingRef={headingRef} email={email} setEmail={setEmail} onForgot={() => go('recover')} />}
            {view === 'recover' && <RecoverForm headingRef={headingRef} initial={email} onBack={() => go('login')} onSent={id => { if (correoValido(id)) setEmail(id); go('sent'); }} />}
            {view === 'sent' && <SentView headingRef={headingRef} onBack={() => go('login')} />}
          </div>
          <a href="#sobre-nosotros" className="sg-about-link">Sobre nosotros y nuestro equipo <span aria-hidden="true">↓</span></a>
          <p className="sg-version">Versión {env.appVersion}</p>
        </div>
      </main>
    </div>
    <AboutUs />
    </>
  );
}

type HeadingRef = RefObject<HTMLHeadingElement | null>;

/* ------------------------------------------------------------------ Iniciar sesión */
function LoginForm({ headingRef, email, setEmail, onForgot }: { headingRef: HeadingRef; email: string; setEmail: (v: string) => void; onForgot: () => void }) {
  const { login } = useAuth(); const nav = useNavigate();
  const [pass, setPass] = useState(''); const [show, setShow] = useState(false); const [remember, setRemember] = useState(false);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !pass) { setErr('Escribe tu usuario o correo y tu contraseña.'); return; }
    setErr(''); setBusy(true);
    try {
      const u = await login(email, pass, remember);
      nav(HOME[u.role], { replace: true });
    } catch (x) {
      // El backend responde con mensajes listos para mostrar (credenciales, rol solo móvil, demasiados intentos…).
      setErr(x instanceof ApiError && x.status === 422 ? 'Usuario o contraseña incorrectos.' : x instanceof Error ? x.message : 'No se pudo iniciar sesión.');
      setBusy(false);
    }
  };

  return (
    <form className="sg-form" onSubmit={submit} noValidate aria-labelledby="sg-login-title">
      <div className="sg-form__head">
        <h2 id="sg-login-title" ref={headingRef} tabIndex={-1} className="sg-form__title">Iniciar sesión</h2>
        <p className="sg-form__sub">Accede con tu usuario o correo electrónico y tu contraseña.</p>
      </div>

      <div className="sg-field">
        <label htmlFor="sg-email">Usuario o correo electrónico</label>
        <input id="sg-email" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="usuario o nombre@correo.com"
          value={email} onChange={e => setEmail(e.target.value)} aria-invalid={!!err && !email.trim()} required />
      </div>

      <div className="sg-field">
        <label htmlFor="sg-pass">Contraseña</label>
        <div className="sg-field__pw">
          <input id="sg-pass" type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="Ingresa tu contraseña"
            value={pass} onChange={e => setPass(e.target.value)} aria-invalid={!!err && !pass} required />
          <button type="button" className="sg-eye" onClick={() => setShow(v => !v)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={show}>
            {show ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-6.5 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
            )}
          </button>
        </div>
      </div>

      <label className="sg-check"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />Mantener la sesión iniciada en este equipo</label>

      {err && <p className="sg-error" role="alert">{err}</p>}

      <button type="submit" className="sg-btn" disabled={busy} aria-busy={busy}>
        {busy && <span className="sg-spinner" aria-hidden="true" />}{busy ? 'Ingresando…' : 'Iniciar sesión'}
      </button>
      <button type="button" className="sg-link" onClick={onForgot}>¿Problemas para ingresar?</button>

    </form>
  );
}

/* ------------------------------------------------------------------ Recuperar contraseña */
function RecoverForm({ headingRef, initial, onBack, onSent }: { headingRef: HeadingRef; initial: string; onBack: () => void; onSent: (identifier: string) => void }) {
  const [id, setId] = useState(initial); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const value = id.trim();
    if (!value) { setErr('Escribe tu usuario o tu correo electrónico.'); return; }
    setErr(''); setBusy(true);
    try {
      await services.auth.requestPasswordReset(value);
      onSent(value);
    } catch (x) {
      // Por seguridad no se revela si la cuenta existe: un 404 se trata como enviado.
      if (x instanceof ApiError && x.status === 404) { onSent(value); return; }
      setErr(x instanceof Error ? x.message : 'No se pudo enviar la solicitud.');
      setBusy(false);
    }
  };

  return (
    <form className="sg-form" onSubmit={submit} noValidate aria-labelledby="sg-recover-title">
      <div className="sg-form__head">
        <h2 id="sg-recover-title" ref={headingRef} tabIndex={-1} className="sg-form__title">Recuperar contraseña</h2>
        <p className="sg-form__sub">Escribe tu usuario o tu correo electrónico. El administrador recibirá tu solicitud y te asignará una nueva contraseña.</p>
      </div>
      <div className="sg-field">
        <label htmlFor="sg-recover">Usuario o correo electrónico</label>
        <input id="sg-recover" type="text" autoComplete="username" placeholder="Ej.: nombre o nombre@correo.com"
          value={id} onChange={e => setId(e.target.value)} aria-invalid={!!err} required />
      </div>
      {err && <p className="sg-error" role="alert">{err}</p>}
      <button type="submit" className="sg-btn" disabled={busy} aria-busy={busy}>
        {busy && <span className="sg-spinner" aria-hidden="true" />}{busy ? 'Enviando…' : 'Enviar solicitud'}
      </button>
      <button type="button" className="sg-link" onClick={onBack}>‹ Volver al inicio de sesión</button>
    </form>
  );
}

/* ------------------------------------------------------------------ Solicitud enviada */
function SentView({ headingRef, onBack }: { headingRef: HeadingRef; onBack: () => void }) {
  return (
    <div className="sg-form" role="status">
      <span className="sg-sent-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
      </span>
      <div className="sg-form__head">
        <h2 ref={headingRef} tabIndex={-1} className="sg-form__title">Solicitud enviada</h2>
        <p className="sg-form__sub">Si los datos corresponden a una cuenta de SIGAT, el administrador recibirá tu solicitud y te asignará una nueva contraseña. Por seguridad, nunca te mostraremos tu contraseña actual.</p>
      </div>
      <button type="button" className="sg-btn" onClick={onBack}>Volver al inicio de sesión</button>
    </div>
  );
}
