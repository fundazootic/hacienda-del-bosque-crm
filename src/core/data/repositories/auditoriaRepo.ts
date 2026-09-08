import type { AccionAuditoria, EntidadAuditada, RegistroAuditoria } from '@/core/types'
import { registrosAuditoria } from '@/core/data/mock/auditoria'
import { HOY_DEMO } from '@/core/utils/fecha'
import { notificarCambio } from '@/core/data/store'

let secuencia = registrosAuditoria.length

/**
 * Bitácora del sistema. Solo admite altas: no existe método para borrar ni
 * editar un registro, ni siquiera para Gerencia. Todo lo que toca la propiedad
 * comercial de un cliente pasa por aquí.
 */
export const auditoriaRepo = {
  registrar: (entrada: {
    accion: AccionAuditoria
    actorId: string
    entidad: EntidadAuditada
    entidadId: string
    descripcion: string
    detalle?: Record<string, string | number | undefined>
  }): RegistroAuditoria => {
    secuencia += 1
    const registro: RegistroAuditoria = {
      id: `aud-${String(secuencia).padStart(3, '0')}`,
      // El prototipo vive en su fecha de referencia; la hora sí es la real
      fecha: `${HOY_DEMO}T${new Date().toTimeString().slice(0, 8)}`,
      ...entrada,
    }
    registrosAuditoria.push(registro)
    notificarCambio()
    return registro
  },

  /** Todos los registros, del más reciente al más antiguo. */
  listar: (): RegistroAuditoria[] =>
    [...registrosAuditoria].sort((a, b) => b.fecha.localeCompare(a.fecha)),

  listarPorEntidad: (entidad: EntidadAuditada, entidadId: string) =>
    auditoriaRepo.listar().filter((r) => r.entidad === entidad && r.entidadId === entidadId),

  listarPorActor: (actorId: string) =>
    auditoriaRepo.listar().filter((r) => r.actorId === actorId),

  listarPorAccion: (accion: AccionAuditoria) =>
    auditoriaRepo.listar().filter((r) => r.accion === accion),
}
