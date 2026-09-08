import type { CanalNotificacion, Notificacion } from '@/core/types'

export interface ResultadoDespacho {
  entregada: boolean
  /** El mensaje se compuso y registró, pero no salió a la red. */
  simulado?: boolean
  motivo?: string
}

/** Mensaje de correo ya compuesto, listo para el servicio de envío. */
export interface MensajeCorreo {
  para: string
  nombreDestinatario: string
  asunto: string
  cuerpoHtml: string
}

export type ModoNotificador = 'real' | 'simulado'

/**
 * Contrato de un canal de notificación.
 *
 * Los módulos no saben cómo se entrega un aviso: solo lo despachan. Conectar
 * un servicio real (SMTP, SendGrid, SES) es reemplazar la implementación de
 * `enviarCorreo` y cambiar `modo` a `'real'`; nada más del sistema se entera.
 */
export interface Notificador {
  canal: CanalNotificacion
  disponible: boolean
  modo: ModoNotificador
  enviar: (notificacion: Notificacion) => Promise<ResultadoDespacho>
}

/** Canal CRM: el aviso queda en la bandeja del comercial dentro del sistema. */
export const notificadorCRM: Notificador = {
  canal: 'crm',
  disponible: true,
  modo: 'real',
  enviar: async () => ({ entregada: true }),
}

/**
 * Canal correo — compone y registra, todavía sin servicio de envío.
 *
 * El sistema arma el mensaje completo y lo deja en la bitácora con resultado
 * «simulado». Se marca así a propósito: nadie debe creer que un correo salió
 * cuando no existe aún el servicio que lo entrega.
 *
 * Para activarlo de verdad:
 *   1. Implementar `enviarCorreo` contra el proveedor (o un endpoint propio).
 *   2. Cambiar `modo` a `'real'`.
 * El resto —alertas, destinatarios, plantillas y bitácora— ya está construido.
 */
export const notificadorCorreo: Notificador & {
  enviarCorreo: (mensaje: MensajeCorreo) => Promise<ResultadoDespacho>
} = {
  canal: 'correo',
  disponible: true,
  modo: 'simulado',

  enviarCorreo: async (mensaje) => {
    if (!mensaje.para.includes('@')) {
      return { entregada: false, motivo: 'Dirección de correo no válida.' }
    }
    // Aquí irá la llamada al servicio de mensajería.
    return {
      entregada: false,
      simulado: true,
      motivo: 'Mensaje compuesto y registrado. Sin servicio de envío conectado.',
    }
  },

  enviar: async () => ({
    entregada: false,
    simulado: true,
    motivo: 'Use enviarCorreo para los resúmenes del equipo.',
  }),
}

const notificadores: Record<CanalNotificacion, Notificador> = {
  crm: notificadorCRM,
  correo: notificadorCorreo,
}

export const notificadorDe = (canal: CanalNotificacion) => notificadores[canal]

export const canalDisponible = (canal: CanalNotificacion) => notificadores[canal].disponible

export const canalEsReal = (canal: CanalNotificacion) => notificadores[canal].modo === 'real'

/**
 * Despacha una notificación por el canal indicado.
 * Un canal apagado nunca debe romper la generación de recordatorios: devuelve
 * el rechazo en lugar de lanzar.
 */
export async function despachar(
  notificacion: Notificacion,
  canal: CanalNotificacion = 'crm',
): Promise<ResultadoDespacho> {
  const notificador = notificadores[canal]
  if (!notificador.disponible) {
    return { entregada: false, motivo: `Canal ${canal} no disponible.` }
  }
  return notificador.enviar(notificacion)
}
