/**
 * Momentos Hacienda: ocasiones para volver a hablarle a un cliente.
 * Se calculan a partir de sus fechas y de su comportamiento; no se almacenan.
 */
export type TipoMomento = 'cumpleanos' | 'aniversario' | 'evento' | 'recuperacion'

export interface Momento {
  id: string
  tipo: TipoMomento
  clienteId: string
  /** Comercial responsable del cliente: es quien debe actuar. */
  comercialId: string
  /** Fecha en que ocurre el momento (próxima ocurrencia para fechas anuales). */
  fecha: string
  /** Días desde hoy. Negativo significa que ya pasó. */
  dias: number
  titulo: string
  detalle?: string
  /** Valor asociado: el de la experiencia o el histórico del cliente. */
  valor?: number
  experienciaId?: string
  ultimaInteraccion?: string
  ultimaVentaOEvento?: { descripcion: string; fecha: string; valor?: number }
  accionRecomendada: string
}

/** Días de anticipación admitidos. `0` es el día del momento. */
export type Anticipacion = 30 | 15 | 7 | 0

export type CanalNotificacion = 'crm' | 'correo'

/**
 * Regla de recordatorio configurable.
 * Define cuánto antes avisar de cada tipo de momento y por qué canal.
 */
export interface ReglaRecordatorio {
  id: string
  tipo: TipoMomento
  anticipacion: Anticipacion
  activa: boolean
  /** Canales habilitados. Hoy solo 'crm'; 'correo' queda preparado. */
  canales: CanalNotificacion[]
  descripcion: string
}

export type EstadoNotificacion = 'pendiente' | 'vista' | 'atendida' | 'descartada'

/**
 * Notificación generada por una regla.
 * Vive dentro del CRM; el envío por correo se activará cuando exista el
 * servicio de mensajería, sin cambiar esta estructura.
 */
export interface Notificacion {
  id: string
  reglaId: string
  momentoId: string
  tipo: TipoMomento
  clienteId: string
  /** Comercial que debe atenderla. */
  destinatarioId: string
  titulo: string
  mensaje: string
  accionRecomendada: string
  fechaMomento: string
  fechaGenerada: string
  canal: CanalNotificacion
  estado: EstadoNotificacion
  /** Trazabilidad del futuro envío por correo. */
  enviadaPorCorreo: boolean
  fechaEnvioCorreo?: string
}
