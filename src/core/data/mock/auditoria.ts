import type { RegistroAuditoria } from '@/core/types'

/**
 * Bitácora inicial del prototipo.
 * Refleja la historia que ya traen los demás datos ficticios: quién registró
 * cada cuenta, qué duplicados frenó el sistema y cómo se resolvieron las
 * solicitudes de reasignación.
 */
export const registrosAuditoria: RegistroAuditoria[] = [
  {
    id: 'aud-001', fecha: '2025-08-05T09:12:00', accion: 'cliente_reasignado', actorId: 'u-001',
    entidad: 'cliente', entidadId: 'cli-013',
    descripcion: 'Ana Lucía Grajales Ferrer pasó de Andrés Felipe Ocampo a Valentina Zúñiga Caicedo',
    detalle: { motivo: 'Especialización en clientes recurrentes' },
  },
  {
    id: 'aud-002', fecha: '2026-02-14T15:40:00', accion: 'cliente_reasignado', actorId: 'u-001',
    entidad: 'cliente', entidadId: 'cli-010',
    descripcion: 'Gloria Inés Zapata Muñoz pasó de Andrés Felipe Ocampo a Valentina Zúñiga Caicedo',
    detalle: { motivo: 'Redistribución de cartera inactiva' },
  },
  {
    id: 'aud-003', fecha: '2026-08-19T11:05:00', accion: 'solicitud_creada', actorId: 'u-004',
    entidad: 'solicitud', entidadId: 'sol-03',
    descripcion: 'Julián Escobar Mejía solicitó la cuenta de Tomás Guerrero Alzate',
    detalle: { propietario: 'Andrés Felipe Ocampo' },
  },
  {
    id: 'aud-004', fecha: '2026-08-20T08:15:00', accion: 'solicitud_aprobada', actorId: 'u-001',
    entidad: 'solicitud', entidadId: 'sol-03',
    descripcion: 'Gerencia aprobó el traslado de Tomás Guerrero Alzate',
    detalle: { comentario: 'La cuenta encaja mejor en el portafolio corporativo.' },
  },
  {
    id: 'aud-005', fecha: '2026-08-20T08:15:30', accion: 'cliente_reasignado', actorId: 'u-001',
    entidad: 'cliente', entidadId: 'cli-011',
    descripcion: 'Tomás Guerrero Alzate pasó de Andrés Felipe Ocampo a Julián Escobar Mejía',
    detalle: { motivo: 'Solicitud sol-03 aprobada' },
  },
  {
    id: 'aud-006', fecha: '2026-08-25T10:02:00', accion: 'cliente_creado', actorId: 'u-004',
    entidad: 'cliente', entidadId: 'cli-008',
    descripcion: 'Julián Escobar Mejía registró a Ana María Solís Ordóñez',
    detalle: { origen: 'Prensa' },
  },
  {
    id: 'aud-007', fecha: '2026-08-27T16:05:00', accion: 'duplicado_bloqueado', actorId: 'u-005',
    entidad: 'cliente', entidadId: 'cli-008',
    descripcion: 'Mauricio Lozano Vélez intentó registrar a Ana María Solís Ordóñez',
    detalle: { criterio: 'correo', responsable: 'Julián Escobar Mejía' },
  },
  {
    id: 'aud-008', fecha: '2026-08-27T16:12:00', accion: 'solicitud_creada', actorId: 'u-005',
    entidad: 'solicitud', entidadId: 'sol-02',
    descripcion: 'Mauricio Lozano Vélez solicitó la cuenta de Ana María Solís Ordóñez',
    detalle: { propietario: 'Julián Escobar Mejía' },
  },
  {
    id: 'aud-009', fecha: '2026-08-28T09:40:00', accion: 'solicitud_rechazada', actorId: 'u-001',
    entidad: 'solicitud', entidadId: 'sol-02',
    descripcion: 'Gerencia rechazó el traslado de Ana María Solís Ordóñez',
    detalle: { comentario: 'Las cuentas corporativas se atienden por el canal interno.' },
  },
  {
    id: 'aud-010', fecha: '2026-09-01T09:20:00', accion: 'cliente_creado', actorId: 'u-006',
    entidad: 'cliente', entidadId: 'cli-012',
    descripcion: 'Daniela Sarmiento Rivas registró a Juan Pablo Saavedra Cruz',
    detalle: { origen: 'Página web' },
  },
  {
    id: 'aud-011', fecha: '2026-09-02T10:24:00', accion: 'duplicado_bloqueado', actorId: 'u-006',
    entidad: 'cliente', entidadId: 'cli-003',
    descripcion: 'Daniela Sarmiento Rivas intentó registrar a Santiago Arboleda Ríos',
    detalle: { criterio: 'teléfono', responsable: 'Mauricio Lozano Vélez' },
  },
  {
    id: 'aud-012', fecha: '2026-09-02T10:31:00', accion: 'solicitud_creada', actorId: 'u-006',
    entidad: 'solicitud', entidadId: 'sol-01',
    descripcion: 'Daniela Sarmiento Rivas solicitó la cuenta de Santiago Arboleda Ríos',
    detalle: { propietario: 'Mauricio Lozano Vélez' },
  },
]
