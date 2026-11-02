import { Code2, Compass, Heart, Mail, MapPin, Target } from 'lucide-react';
import { Avatar, IconTile } from '@/core/ui/patterns';
import { Badge, Card } from '@/core/ui';
import { ABOUT } from '@/data/content/about';
import { env } from '@/config/env';

const ICONS = [Target, Compass, Heart];
const YEAR = new Date().getFullYear();

export default function AboutUs() {
  return (
    <section id="sobre-nosotros" aria-labelledby="about-title" className="bg-white">
      <div className="mx-auto max-w-[1100px] px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-4 h-1 w-9 rounded bg-[#22e07a]" />
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand">Sobre nosotros</p>
          <h2 id="about-title" className="mt-2 text-[34px] font-semibold leading-tight">{ABOUT.tagline}</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-2">{ABOUT.intro}</p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {ABOUT.pillars.map((p, i) => { const I = ICONS[i]; return (
            <Card key={p.title}><IconTile><I size={20} /></IconTile><h3 className="mt-3 text-[15px] font-semibold">{p.title}</h3><p className="mt-1 text-[13px] leading-relaxed text-ink-2">{p.text}</p></Card>); })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand">Nuestro equipo de software</p>
          <h3 className="mt-2 text-[24px] font-semibold">Las personas detrás de SIGAT</h3>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {ABOUT.team.map((m, i) => (
            <Card key={i} className="flex flex-col items-center text-center">
              <Avatar initials={m.initials} size={72} />
              <h4 className="mt-4 text-[16px] font-semibold">{m.name}</h4>
              <p className="mt-0.5 flex items-center gap-1.5 text-[12px] font-medium text-brand"><Code2 size={14} />{m.role}</p>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-2">{m.bio}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">{m.skills.map(s => <Badge key={s} tone="ok">{s}</Badge>)}</div>
            </Card>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-6 border-t border-line pt-8 text-[13px] text-ink-2">
          <span className="flex items-center gap-2"><Mail size={15} className="text-brand" />{ABOUT.contact.email}</span>
          <span className="flex items-center gap-2"><MapPin size={15} className="text-brand" />{ABOUT.contact.location}</span>
          <span>© {YEAR} {ABOUT.company} · Versión {env.appVersion}</span>
        </div>
      </div>
    </section>
  );
}
