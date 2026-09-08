import { format, formatDistanceToNowStrict, isPast, isToday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Fecha de referencia del prototipo. Todos los módulos y repositorios la usan
 * para que las cifras, la agenda y los registros nuevos hablen del mismo día.
 * Al conectar datos reales se reemplaza por `new Date()` aquí y en ningún otro sitio.
 */
export const HOY_DEMO = '2026-09-04'

export const aFecha = (iso: string) => parseISO(iso)

export const formatearFecha = (iso: string, patron = "d 'de' MMMM, yyyy") =>
  format(parseISO(iso), patron, { locale: es })

export const formatearFechaCorta = (iso: string) =>
  format(parseISO(iso), "d MMM yyyy", { locale: es })

export const formatearDiaMes = (iso: string) => format(parseISO(iso), 'd MMM', { locale: es })

export const formatearHora = (hora: string) => hora

export const relativo = (iso: string) =>
  formatDistanceToNowStrict(parseISO(iso), { locale: es, addSuffix: true })

export const estaVencido = (iso: string) => isPast(parseISO(iso)) && !isToday(parseISO(iso))

export const esHoy = (iso: string) => isToday(parseISO(iso))

/** Devuelve el día del año (MM-DD) para comparar cumpleaños sin importar el año. */
export const mmdd = (iso: string) => iso.slice(5, 10)

export const nombreMes = (fecha: Date) => format(fecha, 'MMMM', { locale: es })
