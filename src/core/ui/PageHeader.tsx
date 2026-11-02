import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link to={to} className="mb-3 inline-flex items-center gap-0.5 text-[11px] font-semibold text-brand hover:underline"><ChevronLeft size={13} />{children}</Link>;
}
export function PageIntro({ children }: { children: ReactNode }) { return <p className="mb-4 text-[13px] font-medium text-ink">{children}</p>; }
