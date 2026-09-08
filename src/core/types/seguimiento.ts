export type TipoSeguimiento =
  | 'llamada'
  | 'correo'
  | 'visita'
  | 'reunion'
  | 'degustacion'
  | 'nota'

export type ResultadoSeguimiento =
  | 'pendiente'
  | 'exitoso'
  | 'sin_respuesta'
  | 'reprogramado'
  | 'cerrado'

export type EntidadRelacionada = 'cliente' | 'experiencia'

export interface Seguimiento {
  id: string
  entidadTipo: EntidadRelacionada
  entidadId: string
  clienteId: string
  comercialId: string
  tipo: TipoSeguimiento
  asunto: string
  detalle: string
  fecha: string
  resultado: ResultadoSeguimiento
  proximaAccion?: string
  fechaProximaAccion?: string
  creadoEn: string
}

/** Datos que llegan del formulario de gestión. */
export type DatosSeguimiento = Omit<Seguimiento, 'id' | 'creadoEn'>

/** Cumpleaños, aniversarios y fechas conmemorativas del cliente. */
export interface FechaEspecial {
  id: string
  clienteId: string
  tipo: 'cumpleanos' | 'aniversario' | 'fecha_corporativa' | 'otra'
  descripcion: string
  /** Formato MM-DD: se repite cada año. */
  fecha: string
  recordatorioDias: number
  activa: boolean
}
