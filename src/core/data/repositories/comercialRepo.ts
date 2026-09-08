import type { SolicitudReasignacion, Usuario } from '@/core/types'
import { clientes, solicitudesReasignacion } from '@/core/data/mock/clientes'
import { usuarios } from '@/core/data/mock/usuarios'
import { HOY_DEMO } from '@/core/utils/fecha'
import { notificarCambio } from '@/core/data/store'
import { auditoriaRepo } from './auditoriaRepo'
import { clientesRepo } from './clientesRepo'

const ahora = () => `${HOY_DEMO}T${new Date().toTimeString().slice(0, 8)}`
const nombreUsuario = (id: string) => usuarios.find((u) => u.id === id)?.nombre ?? 'Sin asignar'
const nombreCliente = (id: string) => {
  const c = clientes.find((x) => x.id === id)
  return c ? `${c.nombres} ${c.apellidos}` : 'Cliente sin registro'
}

export interface ResultadoSolicitud {
  creada: boolean
  solicitud?: SolicitudReasignacion
  motivoRechazo?: string
}

/**
 * Proceso de reasignación de cuentas.
 *
 * Separa deliberadamente quién pide de quién decide: un comercial crea la
 * solicitud, pero solo Gerencia la aprueba o la rechaza. Ninguna de las dos
 * acciones toca el historial anterior — siempre se agrega, nunca se sustituye.
 */
export const comercialRepo = {
  solicitudes: (): SolicitudReasignacion[] =>
    [...solicitudesReasignacion].sort((a, b) => b.fecha.localeCompare(a.fecha)),

  pendientes: (): SolicitudReasignacion[] =>
    comercialRepo.solicitudes().filter((s) => s.estado === 'pendiente'),

  /** Solicitudes que hizo un comercial. */
  solicitadasPor: (comercialId: string) =>
    comercialRepo.solicitudes().filter((s) => s.solicitanteId === comercialId),

  /** Solicitudes que otros hicieron sobre la cartera de un comercial. */
  recibidasPor: (comercialId: string) =>
    comercialRepo.solicitudes().filter((s) => s.propietarioActualId === comercialId),

  deCliente: (clienteId: string) =>
    comercialRepo.solicitudes().filter((s) => s.clienteId === clienteId),

  /** Ya existe una solicitud abierta de este comercial sobre este cliente. */
  tieneSolicitudAbierta: (clienteId: string, solicitanteId: string) =>
    solicitudesReasignacion.some(
      (s) =>
        s.clienteId === clienteId &&
        s.solicitanteId === solicitanteId &&
        s.estado === 'pendiente',
    ),

  /**
   * Un comercial pide una cuenta que hoy es de otro.
   * Queda en estado pendiente: el solicitante no puede resolverla.
   */
  solicitar: (
    datos: {
      clienteId: string
      motivo: string
      origen: SolicitudReasignacion['origen']
      intentoDuplicadoId?: string
    },
    solicitante: Usuario,
  ): ResultadoSolicitud => {
    const cliente = clientes.find((c) => c.id === datos.clienteId)
    if (!cliente) return { creada: false, motivoRechazo: 'El cliente no existe.' }

    if (cliente.comercialId === solicitante.id) {
      return { creada: false, motivoRechazo: 'La cuenta ya está a su nombre.' }
    }
    if (comercialRepo.tieneSolicitudAbierta(datos.clienteId, solicitante.id)) {
      return {
        creada: false,
        motivoRechazo: 'Ya tiene una solicitud pendiente sobre este cliente.',
      }
    }

    const solicitud: SolicitudReasignacion = {
      id: `sol-${Date.now().toString(36)}`,
      clienteId: datos.clienteId,
      solicitanteId: solicitante.id,
      propietarioActualId: cliente.comercialId,
      motivo: datos.motivo.trim(),
      origen: datos.origen,
      intentoDuplicadoId: datos.intentoDuplicadoId,
      fecha: ahora(),
      estado: 'pendiente',
    }

    solicitudesReasignacion.unshift(solicitud)

    auditoriaRepo.registrar({
      accion: 'solicitud_creada',
      actorId: solicitante.id,
      entidad: 'solicitud',
      entidadId: solicitud.id,
      descripcion: `${solicitante.nombre} solicitó la cuenta de ${nombreCliente(datos.clienteId)}`,
      detalle: {
        propietario: nombreUsuario(cliente.comercialId),
        motivo: solicitud.motivo,
      },
    })

    notificarCambio()
    return { creada: true, solicitud }
  },

  /**
   * Gerencia aprueba: se reasigna la cuenta y el movimiento entra al historial
   * de propietarios con la solicitud que lo originó.
   */
  aprobar: (solicitudId: string, gerente: Usuario, comentario?: string) => {
    const solicitud = solicitudesReasignacion.find((s) => s.id === solicitudId)
    if (!solicitud || solicitud.estado !== 'pendiente') return

    solicitud.estado = 'aprobada'
    solicitud.resueltaPor = gerente.id
    solicitud.fechaResolucion = ahora()
    solicitud.comentarioResolucion = comentario?.trim() || undefined

    auditoriaRepo.registrar({
      accion: 'solicitud_aprobada',
      actorId: gerente.id,
      entidad: 'solicitud',
      entidadId: solicitud.id,
      descripcion: `Gerencia aprobó el traslado de ${nombreCliente(solicitud.clienteId)}`,
      detalle: {
        solicitante: nombreUsuario(solicitud.solicitanteId),
        comentario: solicitud.comentarioResolucion,
      },
    })

    clientesRepo.reasignar(
      solicitud.clienteId,
      solicitud.solicitanteId,
      `Solicitud aprobada: ${solicitud.motivo}`,
      gerente,
      'solicitud_aprobada',
      solicitud.id,
    )

    notificarCambio()
  },

  /** Gerencia rechaza: la cuenta no se mueve y queda el motivo por escrito. */
  rechazar: (solicitudId: string, gerente: Usuario, comentario?: string) => {
    const solicitud = solicitudesReasignacion.find((s) => s.id === solicitudId)
    if (!solicitud || solicitud.estado !== 'pendiente') return

    solicitud.estado = 'rechazada'
    solicitud.resueltaPor = gerente.id
    solicitud.fechaResolucion = ahora()
    solicitud.comentarioResolucion = comentario?.trim() || undefined

    auditoriaRepo.registrar({
      accion: 'solicitud_rechazada',
      actorId: gerente.id,
      entidad: 'solicitud',
      entidadId: solicitud.id,
      descripcion: `Gerencia rechazó el traslado de ${nombreCliente(solicitud.clienteId)}`,
      detalle: {
        solicitante: nombreUsuario(solicitud.solicitanteId),
        comentario: solicitud.comentarioResolucion,
      },
    })

    notificarCambio()
  },
}
