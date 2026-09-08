import type { Anticipacion, Momento, TipoMomento } from '@/core/types'
import type { TonoEtiqueta } from '@/ui'
import { HOY_DEMO } from '@/core/utils/fecha'

export const HOY = HOY_DEMO

/** Ventanas de la vista cronológica. */
export type Ventana = 0 | 7 | 15 | 30

export const VENTANAS: { valor: Ventana; etiqueta: string }[] = [
  { valor: 0, etiqueta: 'Hoy' },
  { valor: 7, etiqueta: 'Próximos 7 días' },
  { valor: 15, etiqueta: 'Próximos 15 días' },
  { valor: 30, etiqueta: 'Próximos 30 días' },
]

export const ETIQUETA_TIPO: Record<TipoMomento, string> = {
  cumpleanos: 'Cumpleaños',
  aniversario: 'Aniversarios',
  evento: 'Eventos próximos',
  recuperacion: 'Por recuperar',
}

export const TONO_TIPO: Record<TipoMomento, TonoEtiqueta> = {
  cumpleanos: 'laton',
  aniversario: 'peligro',
  evento: 'bosque',
  recuperacion: 'alerta',
}

export const ORDEN_TIPOS: TipoMomento[] = ['cumpleanos', 'aniversario', 'evento', 'recuperacion']

export const ANTICIPACIONES: Anticipacion[] = [30, 15, 7, 0]

export const ETIQUETA_ANTICIPACION: Record<Anticipacion, string> = {
  30: '30 días antes',
  15: '15 días antes',
  7: '7 días antes',
  0: 'El mismo día',
}

/** Momentos que caen dentro de la ventana seleccionada. */
export const enVentana = (momentos: Momento[], ventana: Ventana) =>
  momentos.filter((m) => m.dias >= 0 && m.dias <= ventana)

export function conteosPorVentana(momentos: Momento[]) {
  return VENTANAS.reduce<Record<number, number>>((acc, v) => {
    acc[v.valor] = enVentana(momentos, v.valor).length
    return acc
  }, {})
}

export function conteosPorTipo(momentos: Momento[]) {
  const base: Record<string, number> = { todos: momentos.length }
  for (const m of momentos) base[m.tipo] = (base[m.tipo] ?? 0) + 1
  return base
}

/** Texto humano de la cercanía del momento. */
export function cercania(dias: number) {
  if (dias === 0) return 'hoy'
  if (dias === 1) return 'mañana'
  if (dias <= 7) return `en ${dias} días`
  if (dias <= 14) return 'la próxima semana'
  return `en ${dias} días`
}

/** Agrupa la cronología por cercanía, para que se lea como una agenda. */
export interface GrupoCronologia {
  clave: string
  etiqueta: string
  momentos: Momento[]
}

export function agruparCronologia(momentos: Momento[]): GrupoCronologia[] {
  const grupos: GrupoCronologia[] = [
    { clave: 'hoy', etiqueta: 'Hoy', momentos: [] },
    { clave: 'semana', etiqueta: 'Próximos 7 días', momentos: [] },
    { clave: 'quincena', etiqueta: 'Entre 8 y 15 días', momentos: [] },
    { clave: 'mes', etiqueta: 'Entre 16 y 30 días', momentos: [] },
  ]

  for (const m of momentos) {
    if (m.dias === 0) grupos[0].momentos.push(m)
    else if (m.dias <= 7) grupos[1].momentos.push(m)
    else if (m.dias <= 15) grupos[2].momentos.push(m)
    else grupos[3].momentos.push(m)
  }

  return grupos.filter((g) => g.momentos.length > 0)
}

/** Cifras de cabecera del módulo. */
export function resumenMomentos(momentos: Momento[]) {
  const hoy = momentos.filter((m) => m.dias === 0)
  return {
    hoy: hoy.length,
    semana: enVentana(momentos, 7).length,
    cumpleanos: momentos.filter((m) => m.tipo === 'cumpleanos').length,
    aniversarios: momentos.filter((m) => m.tipo === 'aniversario').length,
    eventos: momentos.filter((m) => m.tipo === 'evento').length,
    recuperacion: momentos.filter((m) => m.tipo === 'recuperacion').length,
    valorEnRiesgo: momentos
      .filter((m) => m.tipo === 'recuperacion')
      .reduce((s, m) => s + (m.valor ?? 0), 0),
  }
}
