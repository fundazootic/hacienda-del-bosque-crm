import type { AlertaCorreo, EnvioCorreo } from '@/core/types'

/**
 * Alertas por correo configuradas.
 * En esta etapa solo existe el resumen de cumpleaños; el modelo admite más sin
 * cambios (aniversarios, experiencias de la semana, cartera en riesgo).
 */
export const alertasCorreo: AlertaCorreo[] = [
  {
    id: 'alerta-cumpleanos',
    nombre: 'Próximos cumpleaños',
    descripcion:
      'Resumen diario de los clientes que cumplen años, agrupados por cercanía, con su responsable y su último contacto.',
    frecuencia: 'diaria',
    horaEnvio: '07:30',
    activa: true,
    ventanas: [0, 7, 15, 30],
    destinatarios: ['u-001', 'u-002'],
    soloCarteraPropia: true,
    ultimoEnvio: '2026-09-03T07:30:00',
  },
]

/** Bitácora de envíos. Se conserva un par de corridas previas. */
export const enviosCorreo: EnvioCorreo[] = [
  {
    id: 'env-002',
    alertaId: 'alerta-cumpleanos',
    fecha: '2026-09-03T07:30:12',
    asunto: 'Hacienda del Bosque · 1 cumpleaños hoy · 6 en los próximos 30 días (3 sep 2026)',
    destinatarios: [
      {
        usuarioId: 'u-001',
        nombre: 'Camila Restrepo Arboleda',
        email: 'camila.restrepo@haciendadelbosque.co',
        entregado: false,
        motivo: 'Compuesto y registrado. Sin servicio de envío conectado.',
        registros: 6,
      },
      {
        usuarioId: 'u-002',
        nombre: 'Andrés Felipe Ocampo',
        email: 'andres.ocampo@haciendadelbosque.co',
        entregado: false,
        motivo: 'Compuesto y registrado. Sin servicio de envío conectado.',
        registros: 1,
      },
    ],
    resultado: 'simulado',
    detalle: '6 cumpleaños en 30 días · 1 el mismo día',
    disparadoPor: 'programado',
  },
  {
    id: 'env-001',
    alertaId: 'alerta-cumpleanos',
    fecha: '2026-09-02T07:30:09',
    asunto: 'Hacienda del Bosque · Sin cumpleaños hoy · 6 en los próximos 30 días (2 sep 2026)',
    destinatarios: [
      {
        usuarioId: 'u-001',
        nombre: 'Camila Restrepo Arboleda',
        email: 'camila.restrepo@haciendadelbosque.co',
        entregado: false,
        motivo: 'Compuesto y registrado. Sin servicio de envío conectado.',
        registros: 6,
      },
    ],
    resultado: 'simulado',
    detalle: '6 cumpleaños en 30 días',
    disparadoPor: 'programado',
  },
]
