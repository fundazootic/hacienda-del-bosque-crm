import type { Notificacion, ReglaRecordatorio } from '@/core/types'

/**
 * Reglas de recordatorio de fábrica.
 * Gerencia las activa o desactiva desde el módulo; el canal de correo queda
 * declarado pero apagado hasta que exista el servicio de envío.
 */
export const reglasRecordatorio: ReglaRecordatorio[] = [
  // Cumpleaños
  {
    id: 'reg-cum-30', tipo: 'cumpleanos', anticipacion: 30, activa: false, canales: ['crm'],
    descripcion: 'Un mes antes, para planear una celebración en la hacienda.',
  },
  {
    id: 'reg-cum-15', tipo: 'cumpleanos', anticipacion: 15, activa: true, canales: ['crm'],
    descripcion: 'Quince días antes: tiempo suficiente para proponer una reserva.',
  },
  {
    id: 'reg-cum-7', tipo: 'cumpleanos', anticipacion: 7, activa: true, canales: ['crm'],
    descripcion: 'Una semana antes, para confirmar la invitación.',
  },
  {
    id: 'reg-cum-0', tipo: 'cumpleanos', anticipacion: 0, activa: true, canales: ['crm'],
    descripcion: 'El día del cumpleaños: saludo del comercial responsable.',
  },

  // Aniversarios
  {
    id: 'reg-ani-30', tipo: 'aniversario', anticipacion: 30, activa: false, canales: ['crm'],
    descripcion: 'Un mes antes del aniversario de bodas.',
  },
  {
    id: 'reg-ani-15', tipo: 'aniversario', anticipacion: 15, activa: true, canales: ['crm'],
    descripcion: 'Quince días antes, para ofrecer el comedor privado.',
  },
  {
    id: 'reg-ani-7', tipo: 'aniversario', anticipacion: 7, activa: true, canales: ['crm'],
    descripcion: 'Una semana antes del aniversario.',
  },
  {
    id: 'reg-ani-0', tipo: 'aniversario', anticipacion: 0, activa: false, canales: ['crm'],
    descripcion: 'El día del aniversario.',
  },

  // Experiencias por celebrar
  {
    id: 'reg-eve-30', tipo: 'evento', anticipacion: 30, activa: false, canales: ['crm'],
    descripcion: 'Un mes antes de la experiencia: revisión de anticipo.',
  },
  {
    id: 'reg-eve-15', tipo: 'evento', anticipacion: 15, activa: true, canales: ['crm'],
    descripcion: 'Quince días antes: cierre de menú y montaje.',
  },
  {
    id: 'reg-eve-7', tipo: 'evento', anticipacion: 7, activa: true, canales: ['crm'],
    descripcion: 'Una semana antes: número final de asistentes.',
  },
  {
    id: 'reg-eve-0', tipo: 'evento', anticipacion: 0, activa: true, canales: ['crm'],
    descripcion: 'El día de la celebración: acompañamiento del comercial.',
  },

  // Clientes por recuperar
  {
    id: 'reg-rec-0', tipo: 'recuperacion', anticipacion: 0, activa: true, canales: ['crm'],
    descripcion: 'Aviso permanente mientras el cliente siga sin visitar la hacienda.',
  },
]

/** Notificaciones generadas. El repositorio las va llenando en la sesión. */
export const notificaciones: Notificacion[] = []
