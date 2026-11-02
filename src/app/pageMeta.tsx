import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface Meta { title: string; subtitle?: string }
const Ctx = createContext<{ meta: Meta; set: (m: Meta) => void }>({ meta: { title: '' }, set: () => {} });
export const PageMetaProvider = ({ children }: { children: ReactNode }) => { const [meta, set] = useState<Meta>({ title: '' }); return <Ctx.Provider value={{ meta, set }}>{children}</Ctx.Provider>; };
export const usePageMetaValue = () => useContext(Ctx).meta;
/** Cada pantalla declara su título y subtítulo para la barra superior. */
export function usePageMeta(title: string, subtitle?: string) {
  const { set } = useContext(Ctx);
  useEffect(() => { set({ title, subtitle }); document.title = `${title} · SIGAT`; }, [title, subtitle, set]);
}
