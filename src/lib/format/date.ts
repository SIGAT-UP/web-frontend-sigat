import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

/** Fecha legible en la zona del usuario; el servidor guarda UTC. */
export function formatearFecha(iso: string): string {
  return format(parseISO(iso), "d 'de' MMMM 'de' yyyy", { locale: es })
}

export function formatearFechaHora(iso: string): string {
  return format(parseISO(iso), "d MMM yyyy, HH:mm", { locale: es })
}
