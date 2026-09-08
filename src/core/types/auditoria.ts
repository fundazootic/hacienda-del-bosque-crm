/** Acciones que deja registradas el sistema de forma permanente. */
export type AccionAuditoria =
  | 'cliente_creado'
  | 'cliente_editado'
  | 'cliente_reasignado'
  | 'duplicado_bloqueado'
  | 'solicitud_creada'
  | 'solicitud_aprobada'
  | 'solicitud_rechazada'
  | 'experiencia_creada'
  | 'experiencia_editada'
  | 'experiencia_estado'
  | 'alerta_ejecutada'
  | 'alerta_configurada'
  | 'seguimiento_registrado'
  | 'seguimiento_cerrado'
  | 'beneficio_entregado'
  | 'puntos_registrados'
  | 'nivel_actualizado'
  | 'venta_registrada'
  | 'venta_pago'
  | 'comision_liquidada'

export type EntidadAuditada =
  | 'cliente'
  | 'solicitud'
  | 'experiencia'
  | 'alerta'
  | 'seguimiento'
  | 'venta'

/**
 * Bitácora del CRM. Es append-only: ningún módulo puede borrar ni editar
 * un registro, solo agregar. Es la fuente de verdad ante cualquier disputa
 * sobre la propiedad de una cuenta.
 */
export interface RegistroAuditoria {
  id: string
  fecha: string
  accion: AccionAuditoria
  /** Quién ejecutó la acción. */
  actorId: string
  entidad: EntidadAuditada
  entidadId: string
  descripcion: string
  /** Contexto adicional para la lectura gerencial. */
  detalle?: Record<string, string | number | undefined>
}
