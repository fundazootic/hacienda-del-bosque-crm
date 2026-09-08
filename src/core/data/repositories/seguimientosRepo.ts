import type {
  DatosSeguimiento,
  ResultadoSeguimiento,
  Seguimiento,
  Usuario,
} from '@/core/types'
import { seguimientos, fechasEspeciales } from '@/core/data/mock/seguimientos'
import { clientes } from '@/core/data/mock/clientes'
import { etiquetaSeguimiento } from '@/core/utils/etiquetas'
import { HOY_DEMO } from '@/core/utils/fecha'
import { filtrarPorAlcance } from '@/core/permissions/permisos'
import { notificarCambio } from '@/core/data/store'
import { auditoriaRepo } from './auditoriaRepo'

const nombreCliente = (id: string) => {
  const c = clientes.find((x) => x.id === id)
  return c ? `${c.nombres} ${c.apellidos}` : 'Cliente sin registro'
}

/** Una gestión sigue abierta mientras tenga una próxima acción sin cerrar. */
export const estaAbierto = (s: Seguimiento) =>
  Boolean(s.fechaProximaAccion) && s.resultado !== 'cerrado'

export const estaVencido = (s: Seguimiento) =>
  estaAbierto(s) && (s.fechaProximaAccion ?? '') < HOY_DEMO

/**
 * Bitácora de gestión comercial: llamadas, correos, visitas y degustaciones.
 * Cada registro deja constancia de qué se hizo y de qué sigue.
 */
export const seguimientosRepo = {
  listar: () => seguimientos,

  listarVisibles: (u: Usuario | null) => filtrarPorAlcance(u, seguimientos),

  obtener: (id: string) => seguimientos.find((s) => s.id === id),

  /** Gestiones con próxima acción comprometida, de la más urgente en adelante. */
  pendientes: (u: Usuario | null) =>
    filtrarPorAlcance(u, seguimientos)
      .filter(estaAbierto)
      .sort((a, b) => (a.fechaProximaAccion ?? '').localeCompare(b.fechaProximaAccion ?? '')),

  deCliente: (clienteId: string) =>
    seguimientos
      .filter((s) => s.clienteId === clienteId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha)),

  deExperiencia: (experienciaId: string) =>
    seguimientos.filter((s) => s.entidadTipo === 'experiencia' && s.entidadId === experienciaId),

  fechasEspeciales: () => fechasEspeciales,

  crear: (datos: DatosSeguimiento, autor: Usuario): Seguimiento => {
    const seguimiento: Seguimiento = {
      ...datos,
      id: `seg-${Date.now().toString(36)}`,
      creadoEn: HOY_DEMO,
    }

    seguimientos.unshift(seguimiento)

    auditoriaRepo.registrar({
      accion: 'seguimiento_registrado',
      actorId: autor.id,
      entidad: 'seguimiento',
      entidadId: seguimiento.id,
      descripcion: `${autor.nombre} registró ${etiquetaSeguimiento[seguimiento.tipo].toLowerCase()} con ${nombreCliente(seguimiento.clienteId)}`,
      detalle: {
        asunto: seguimiento.asunto,
        proxima: seguimiento.proximaAccion,
        fecha: seguimiento.fechaProximaAccion,
      },
    })

    notificarCambio()
    return seguimiento
  },

  actualizar: (id: string, datos: DatosSeguimiento, autor: Usuario): Seguimiento | undefined => {
    const indice = seguimientos.findIndex((s) => s.id === id)
    if (indice < 0) return undefined

    const actualizado: Seguimiento = { ...seguimientos[indice], ...datos }
    seguimientos[indice] = actualizado

    auditoriaRepo.registrar({
      accion: 'seguimiento_registrado',
      actorId: autor.id,
      entidad: 'seguimiento',
      entidadId: id,
      descripcion: `${autor.nombre} editó la gestión «${actualizado.asunto}»`,
      detalle: { cliente: nombreCliente(actualizado.clienteId) },
    })

    notificarCambio()
    return actualizado
  },

  /**
   * Cierra una acción pendiente con su resultado y, si el comercial lo indica,
   * encadena la siguiente gestión. Así la agenda nunca se queda sin próximo paso.
   */
  completar: (
    id: string,
    autor: Usuario,
    cierre: {
      resultado: ResultadoSeguimiento
      nota?: string
      siguiente?: {
        tipo: Seguimiento['tipo']
        proximaAccion: string
        fechaProximaAccion: string
      }
    },
  ): { seguimiento?: Seguimiento; encadenado?: Seguimiento } => {
    const indice = seguimientos.findIndex((s) => s.id === id)
    if (indice < 0) return {}

    const anterior = seguimientos[indice]
    const cerrado: Seguimiento = {
      ...anterior,
      resultado: cierre.resultado,
      detalle: cierre.nota?.trim()
        ? `${anterior.detalle}\n· ${cierre.nota.trim()}`
        : anterior.detalle,
      // Al cerrar, la acción deja de estar pendiente
      proximaAccion: cierre.siguiente ? anterior.proximaAccion : undefined,
      fechaProximaAccion: cierre.siguiente ? anterior.fechaProximaAccion : undefined,
    }

    // Si se cierra sin encadenar, la gestión sale de la agenda
    if (!cierre.siguiente) {
      cerrado.resultado = cierre.resultado === 'pendiente' ? 'cerrado' : cierre.resultado
      cerrado.proximaAccion = undefined
      cerrado.fechaProximaAccion = undefined
    }

    seguimientos[indice] = cerrado

    let encadenado: Seguimiento | undefined
    if (cierre.siguiente) {
      // La gestión anterior queda cerrada y nace la siguiente
      seguimientos[indice] = {
        ...cerrado,
        resultado: cierre.resultado,
        proximaAccion: undefined,
        fechaProximaAccion: undefined,
      }

      encadenado = seguimientosRepo.crear(
        {
          entidadTipo: anterior.entidadTipo,
          entidadId: anterior.entidadId,
          clienteId: anterior.clienteId,
          comercialId: anterior.comercialId,
          tipo: cierre.siguiente.tipo,
          asunto: cierre.siguiente.proximaAccion,
          detalle: `Programada al cerrar «${anterior.asunto}».`,
          fecha: HOY_DEMO,
          resultado: 'pendiente',
          proximaAccion: cierre.siguiente.proximaAccion,
          fechaProximaAccion: cierre.siguiente.fechaProximaAccion,
        },
        autor,
      )
    }

    auditoriaRepo.registrar({
      accion: 'seguimiento_cerrado',
      actorId: autor.id,
      entidad: 'seguimiento',
      entidadId: id,
      descripcion: `${autor.nombre} cerró «${anterior.asunto}» con ${nombreCliente(anterior.clienteId)}`,
      detalle: {
        resultado: cierre.resultado,
        nota: cierre.nota?.trim(),
        siguiente: cierre.siguiente?.proximaAccion,
      },
    })

    notificarCambio()
    return { seguimiento: seguimientos[indice], encadenado }
  },
}
