import type {
  DatosExperiencia,
  EstadoExperiencia,
  Experiencia,
  RegistroAuditoria,
  Usuario,
} from '@/core/types'
import { esAbierta, esGanada } from '@/core/types'
import { experiencias } from '@/core/data/mock/experiencias'
import { clientes } from '@/core/data/mock/clientes'
import { etiquetaEstadoExperiencia } from '@/core/utils/etiquetas'
import { formatearMoneda } from '@/core/utils/format'
import { HOY_DEMO } from '@/core/utils/fecha'
import { filtrarPorAlcance } from '@/core/permissions/permisos'
import { notificarCambio } from '@/core/data/store'
import { auditoriaRepo } from './auditoriaRepo'

const ahora = () => `${HOY_DEMO}T${new Date().toTimeString().slice(0, 8)}`

const nombreCliente = (id: string) => {
  const c = clientes.find((x) => x.id === id)
  return c ? `${c.nombres} ${c.apellidos}` : 'Cliente sin registro'
}

function siguienteCodigo() {
  const anioMes = HOY_DEMO.slice(2, 4) + HOY_DEMO.slice(5, 7)
  const consecutivo = experiencias.length + 1
  return `EXP-${anioMes}-${String(consecutivo).padStart(2, '0')}`
}

export interface ResultadoEstado {
  ok: boolean
  motivoRechazo?: string
}

/**
 * Experiencias: el pipeline comercial de la hacienda.
 *
 * Dos transiciones tienen exigencias propias, porque son las que cierran el
 * negocio: `perdido` obliga a un motivo y `confirmado` a un valor final.
 * Cada movimiento queda en la bitácora — nada se pierde ni se sobrescribe.
 */
export const experienciasRepo = {
  listar: (): Experiencia[] => experiencias,

  listarVisibles: (usuario: Usuario | null): Experiencia[] =>
    filtrarPorAlcance(usuario, experiencias),

  obtener: (id: string) => experiencias.find((e) => e.id === id),

  /** Experiencias aún en juego (de Nuevo a Negociación). */
  abiertas: (usuario: Usuario | null) =>
    experienciasRepo.listarVisibles(usuario).filter((e) => esAbierta(e.estado)),

  /** Confirmadas o realizadas. */
  ganadas: (usuario: Usuario | null) =>
    experienciasRepo.listarVisibles(usuario).filter((e) => esGanada(e.estado)),

  deCliente: (clienteId: string) =>
    experiencias
      .filter((e) => e.clienteId === clienteId)
      .sort((a, b) => (b.fechaTentativa ?? '').localeCompare(a.fechaTentativa ?? '')),

  /** Agenda: confirmadas o realizadas con fecha futura. */
  agenda: (usuario: Usuario | null, desde = HOY_DEMO) =>
    experienciasRepo
      .listarVisibles(usuario)
      .filter((e) => e.fechaTentativa && e.fechaTentativa >= desde && e.estado !== 'perdido')
      .sort((a, b) => (a.fechaTentativa ?? '').localeCompare(b.fechaTentativa ?? '')),

  crear: (datos: DatosExperiencia, autor: Usuario): Experiencia => {
    const experiencia: Experiencia = {
      ...datos,
      id: `exp-${Date.now().toString(36)}`,
      codigo: siguienteCodigo(),
      creadoEn: HOY_DEMO,
      creadoPor: autor.id,
      actualizadoEn: HOY_DEMO,
    }

    experiencias.unshift(experiencia)

    auditoriaRepo.registrar({
      accion: 'experiencia_creada',
      actorId: autor.id,
      entidad: 'experiencia',
      entidadId: experiencia.id,
      descripcion: `${autor.nombre} registró la experiencia «${experiencia.titulo}»`,
      detalle: {
        codigo: experiencia.codigo,
        cliente: nombreCliente(experiencia.clienteId),
        estado: etiquetaEstadoExperiencia[experiencia.estado],
        personas: experiencia.numeroPersonas,
      },
    })

    notificarCambio()
    return experiencia
  },

  /** Edición de datos. El estado se cambia con `cambiarEstado`. */
  actualizar: (id: string, datos: DatosExperiencia, autor: Usuario): Experiencia | undefined => {
    const indice = experiencias.findIndex((e) => e.id === id)
    if (indice < 0) return undefined

    const anterior = experiencias[indice]
    const actualizada: Experiencia = {
      ...anterior,
      ...datos,
      estado: anterior.estado,
      actualizadoEn: HOY_DEMO,
    }
    experiencias[indice] = actualizada

    // Solo se anotan los cambios que le importan a la gestión comercial
    const cambios: string[] = []
    if (anterior.valorCotizado !== actualizada.valorCotizado) cambios.push('valor cotizado')
    if (anterior.fechaTentativa !== actualizada.fechaTentativa) cambios.push('fecha tentativa')
    if (anterior.numeroPersonas !== actualizada.numeroPersonas) cambios.push('número de personas')
    if (anterior.comercialId !== actualizada.comercialId) cambios.push('comercial responsable')
    if (anterior.proximoSeguimiento !== actualizada.proximoSeguimiento)
      cambios.push('próximo seguimiento')

    auditoriaRepo.registrar({
      accion: 'experiencia_editada',
      actorId: autor.id,
      entidad: 'experiencia',
      entidadId: actualizada.id,
      descripcion: `${autor.nombre} editó «${actualizada.titulo}»`,
      detalle: {
        cambios: cambios.length ? cambios.join(', ') : 'detalles de la ficha',
      },
    })

    notificarCambio()
    return actualizada
  },

  /**
   * Movimiento en el pipeline.
   * Devuelve el motivo del rechazo si faltan los datos que exige la etapa.
   */
  cambiarEstado: (
    id: string,
    nuevo: EstadoExperiencia,
    autor: Usuario,
    extra: { motivoPerdida?: string; valorFinal?: number; nota?: string } = {},
  ): ResultadoEstado => {
    const indice = experiencias.findIndex((e) => e.id === id)
    if (indice < 0) return { ok: false, motivoRechazo: 'La experiencia no existe.' }

    const experiencia = experiencias[indice]
    if (experiencia.estado === nuevo) return { ok: true }

    if (nuevo === 'perdido' && !extra.motivoPerdida?.trim()) {
      return { ok: false, motivoRechazo: 'Indique el motivo de la pérdida.' }
    }
    if (nuevo === 'confirmado' && !(extra.valorFinal && extra.valorFinal > 0)) {
      return { ok: false, motivoRechazo: 'Registre el valor final acordado.' }
    }
    if (nuevo === 'realizado' && !esGanada(experiencia.estado)) {
      return {
        ok: false,
        motivoRechazo: 'Una experiencia solo se marca realizada después de confirmarla.',
      }
    }

    const anterior = experiencia.estado
    experiencias[indice] = {
      ...experiencia,
      estado: nuevo,
      actualizadoEn: HOY_DEMO,
      motivoPerdida: nuevo === 'perdido' ? extra.motivoPerdida?.trim() : experiencia.motivoPerdida,
      valorFinal: nuevo === 'confirmado' ? extra.valorFinal : experiencia.valorFinal,
      // Al salir de perdida, el motivo deja de aplicar pero queda en la bitácora
      ...(anterior === 'perdido' && nuevo !== 'perdido' ? { motivoPerdida: undefined } : {}),
    }

    auditoriaRepo.registrar({
      accion: 'experiencia_estado',
      actorId: autor.id,
      entidad: 'experiencia',
      entidadId: id,
      descripcion: `«${experiencia.titulo}» pasó de ${etiquetaEstadoExperiencia[anterior]} a ${etiquetaEstadoExperiencia[nuevo]}`,
      detalle: {
        cliente: nombreCliente(experiencia.clienteId),
        motivo: extra.motivoPerdida?.trim(),
        'valor final':
          nuevo === 'confirmado' && extra.valorFinal
            ? formatearMoneda(extra.valorFinal)
            : undefined,
        nota: extra.nota?.trim() || undefined,
      },
    })

    notificarCambio()
    return { ok: true }
  },

  /** Historial de la experiencia, del movimiento más reciente al primero. */
  historialDe: (id: string): RegistroAuditoria[] =>
    auditoriaRepo.listarPorEntidad('experiencia', id),
}
