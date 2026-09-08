/**
 * Alertas por correo dirigidas al equipo interno.
 *
 * Regla que no admite excepciones: los destinatarios son siempre usuarios del
 * CRM. Ninguna alerta puede apuntar a un cliente.
 */
export interface AlertaCorreo {
  id: string
  nombre: string
  descripcion: string
  frecuencia: 'diaria'
  /** Hora de envío del resumen, en formato HH:MM. */
  horaEnvio: string
  activa: boolean
  /** Ventanas de días que incluye el resumen. */
  ventanas: number[]
  /** Usuarios del CRM que reciben la alerta. */
  destinatarios: string[]
  /**
   * Si está activo, cada destinatario recibe solo los clientes de su cartera.
   * Gerencia siempre recibe el resumen completo.
   */
  soloCarteraPropia: boolean
  ultimoEnvio?: string
}

export type ResultadoEnvio =
  | 'simulado'
  | 'enviado'
  | 'error'
  | 'sin_destinatarios'
  | 'sin_contenido'

export interface DestinatarioEnvio {
  usuarioId: string
  nombre: string
  email: string
  entregado: boolean
  motivo?: string
  /** Cuántos registros llevaba el resumen de este destinatario. */
  registros: number
}

/**
 * Bitácora de envíos: qué se mandó, a quién, cuándo y con qué resultado.
 * Es append-only, como el resto de la auditoría del sistema.
 */
export interface EnvioCorreo {
  id: string
  alertaId: string
  fecha: string
  asunto: string
  destinatarios: DestinatarioEnvio[]
  resultado: ResultadoEnvio
  detalle: string
  disparadoPor: 'manual' | 'programado'
  actorId?: string
  /** Cuerpo generado, conservado para consulta y para la vista previa. */
  cuerpoHtml?: string
}
