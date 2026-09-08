import type { OrigenCliente } from './cliente'

/** Qué se celebra. Cataloga tanto la oportunidad como el evento resultante. */
export type TipoExperiencia =
  | 'cumpleanos'
  | 'aniversario'
  | 'matrimonio'
  | 'cena_romantica'
  | 'evento_empresarial'
  | 'evento_social'
  | 'celebracion_familiar'
  | 'reserva_grupo'
  | 'otro'

/**
 * Pipeline comercial de la experiencia, de la primera llamada a la celebración.
 * `confirmado` y `realizado` son estados ganados; `perdido` cierra sin venta.
 */
export type EstadoExperiencia =
  | 'nuevo'
  | 'contactado'
  | 'visita'
  | 'cotizacion'
  | 'negociacion'
  | 'confirmado'
  | 'realizado'
  | 'perdido'

/** La fuente por la que llegó la solicitud. Comparte catálogo con el origen del cliente. */
export type FuenteExperiencia = OrigenCliente

/**
 * Una experiencia es la unidad de trabajo del área comercial: nace como
 * solicitud, avanza por el pipeline y termina celebrada o perdida.
 *
 * Reemplaza al par oportunidad + evento: era la misma celebración contada dos
 * veces, con el riesgo de que las cifras no coincidieran.
 */
export interface Experiencia {
  id: string
  codigo: string
  clienteId: string
  /** Comercial responsable de la experiencia. */
  comercialId: string
  titulo: string
  tipo: TipoExperiencia
  estado: EstadoExperiencia

  fechaTentativa?: string
  numeroPersonas: number
  /** Lo que el cliente declara tener disponible. */
  presupuesto?: number
  /** Lo que la hacienda cotizó. */
  valorCotizado?: number
  /** Valor cerrado. Obligatorio al confirmar. */
  valorFinal?: number

  fuente: FuenteExperiencia
  observaciones?: string
  proximoSeguimiento?: string
  /** Obligatorio al marcar perdida. */
  motivoPerdida?: string

  // Detalle operativo: se completa cuando la experiencia se confirma
  espacioId?: string
  horaInicio?: string
  horaFin?: string
  menuId?: string
  requerimientos: string[]
  anticipo?: number
  responsableOperativo?: string

  creadoEn: string
  creadoPor: string
  actualizadoEn: string
}

/** Datos que llegan del formulario. */
export type DatosExperiencia = Omit<
  Experiencia,
  'id' | 'codigo' | 'creadoEn' | 'creadoPor' | 'actualizadoEn'
>

/** Etapas en el orden en que se recorren. */
export const ETAPAS_EXPERIENCIA: EstadoExperiencia[] = [
  'nuevo',
  'contactado',
  'visita',
  'cotizacion',
  'negociacion',
  'confirmado',
  'realizado',
  'perdido',
]

/** Etapas abiertas: la experiencia sigue en juego. */
export const ETAPAS_ABIERTAS: EstadoExperiencia[] = [
  'nuevo',
  'contactado',
  'visita',
  'cotizacion',
  'negociacion',
]

export const esGanada = (estado: EstadoExperiencia) =>
  estado === 'confirmado' || estado === 'realizado'

export const esAbierta = (estado: EstadoExperiencia) =>
  ETAPAS_ABIERTAS.includes(estado)
