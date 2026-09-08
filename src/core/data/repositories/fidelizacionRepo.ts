import type {
  Beneficio,
  MembresiaFidelidad,
  MovimientoPuntos,
  NivelFidelidad,
  Usuario,
} from '@/core/types'
import { membresias, beneficios, movimientosPuntos } from '@/core/data/mock/fidelizacion'
import { clientes } from '@/core/data/mock/clientes'
import { HOY_DEMO } from '@/core/utils/fecha'
import { formatearNumero } from '@/core/utils/format'
import { notificarCambio } from '@/core/data/store'
import { auditoriaRepo } from './auditoriaRepo'

const nombreCliente = (id: string) => {
  const c = clientes.find((x) => x.id === id)
  return c ? `${c.nombres} ${c.apellidos}` : 'Cliente sin registro'
}

/**
 * Reglas del programa, escritas una sola vez y en un solo sitio.
 * Un cliente sube de nivel cuando cumple **cualquiera** de las dos condiciones:
 * las visitas del año o lo que ha gastado en total.
 */
export const NIVELES: {
  nivel: NivelFidelidad
  nombre: string
  visitas: number
  gasto: number
  resumen: string
}[] = [
  {
    nivel: 'semilla',
    nombre: 'Semilla',
    visitas: 0,
    gasto: 0,
    resumen: 'Empieza aquí todo cliente que se registra en el programa.',
  },
  {
    nivel: 'guadua',
    nombre: 'Guadua',
    visitas: 3,
    gasto: 20_000_000,
    resumen: 'Ya volvió varias veces: la hacienda le guarda la mesa.',
  },
  {
    nivel: 'ceiba',
    nombre: 'Ceiba',
    visitas: 6,
    gasto: 50_000_000,
    resumen: 'Cliente habitual de la casa, con acceso a la bodega de vinos.',
  },
  {
    nivel: 'saman',
    nombre: 'Samán',
    visitas: 9,
    gasto: 80_000_000,
    resumen: 'El nivel más alto: la hacienda lo invita en su aniversario.',
  },
]

/** Cuántos pesos vale un punto: 1 punto por cada $10.000 consumidos. */
export const PESOS_POR_PUNTO = 10_000

export const nivelPorClave = (nivel: NivelFidelidad) =>
  NIVELES.find((n) => n.nivel === nivel) ?? NIVELES[0]

/** Nivel que le corresponde a un cliente según sus visitas y su gasto. */
export function nivelQueCorresponde(membresia: MembresiaFidelidad): NivelFidelidad {
  let resultado: NivelFidelidad = 'semilla'
  for (const n of NIVELES) {
    if (membresia.visitasAno >= n.visitas || membresia.ingresoAcumulado >= n.gasto) {
      resultado = n.nivel
    }
  }
  return resultado
}

export const fidelizacionRepo = {
  membresias: (): MembresiaFidelidad[] =>
    [...membresias].sort((a, b) => b.puntos - a.puntos),

  membresiaDe: (clienteId: string) => membresias.find((m) => m.clienteId === clienteId),

  beneficios: (): Beneficio[] => beneficios.filter((b) => b.activo),

  beneficio: (id: string) => beneficios.find((b) => b.id === id),

  movimientos: (): MovimientoPuntos[] =>
    [...movimientosPuntos].sort((a, b) => b.fecha.localeCompare(a.fecha)),

  movimientosDe: (clienteId: string) =>
    fidelizacionRepo.movimientos().filter((m) => m.clienteId === clienteId),

  /**
   * Entrega un beneficio a un cliente y le descuenta los puntos.
   * Devuelve el motivo si no se puede: nivel insuficiente o puntos que no alcanzan.
   */
  entregarBeneficio: (
    clienteId: string,
    beneficioId: string,
    autor: Usuario,
  ): { ok: boolean; motivo?: string } => {
    const indice = membresias.findIndex((m) => m.clienteId === clienteId)
    const beneficio = beneficios.find((b) => b.id === beneficioId)
    if (indice < 0 || !beneficio) return { ok: false, motivo: 'No se encontró el registro.' }

    const membresia = membresias[indice]
    const ordenCliente = NIVELES.findIndex((n) => n.nivel === membresia.nivel)
    const ordenBeneficio = NIVELES.findIndex((n) => n.nivel === beneficio.nivelMinimo)

    if (ordenCliente < ordenBeneficio) {
      return {
        ok: false,
        motivo: `Este beneficio es para clientes ${nivelPorClave(beneficio.nivelMinimo).nombre} o superior.`,
      }
    }
    if (membresia.puntos < beneficio.costoPuntos) {
      return {
        ok: false,
        motivo: `Le faltan ${formatearNumero(beneficio.costoPuntos - membresia.puntos)} puntos.`,
      }
    }

    membresias[indice] = { ...membresia, puntos: membresia.puntos - beneficio.costoPuntos }

    movimientosPuntos.unshift({
      id: `mov-${Date.now().toString(36)}`,
      clienteId,
      tipo: 'redencion',
      puntos: -beneficio.costoPuntos,
      concepto: beneficio.nombre,
      fecha: HOY_DEMO,
    })

    auditoriaRepo.registrar({
      accion: 'beneficio_entregado',
      actorId: autor.id,
      entidad: 'cliente',
      entidadId: clienteId,
      descripcion: `${autor.nombre} entregó «${beneficio.nombre}» a ${nombreCliente(clienteId)}`,
      detalle: { puntos: beneficio.costoPuntos, nivel: nivelPorClave(membresia.nivel).nombre },
    })

    notificarCambio()
    return { ok: true }
  },

  /** Suma o resta puntos a mano (cortesías y ajustes). Solo Gerencia. */
  registrarPuntos: (
    clienteId: string,
    puntos: number,
    concepto: string,
    autor: Usuario,
  ): { ok: boolean; motivo?: string } => {
    const indice = membresias.findIndex((m) => m.clienteId === clienteId)
    if (indice < 0) return { ok: false, motivo: 'El cliente no está en el programa.' }
    if (puntos === 0) return { ok: false, motivo: 'Indique cuántos puntos.' }

    const membresia = membresias[indice]
    if (membresia.puntos + puntos < 0) {
      return { ok: false, motivo: 'El cliente no tiene tantos puntos para descontar.' }
    }

    membresias[indice] = { ...membresia, puntos: membresia.puntos + puntos }

    movimientosPuntos.unshift({
      id: `mov-${Date.now().toString(36)}`,
      clienteId,
      tipo: puntos > 0 ? 'cortesia' : 'ajuste',
      puntos,
      concepto: concepto.trim() || (puntos > 0 ? 'Cortesía de la casa' : 'Ajuste manual'),
      fecha: HOY_DEMO,
    })

    auditoriaRepo.registrar({
      accion: 'puntos_registrados',
      actorId: autor.id,
      entidad: 'cliente',
      entidadId: clienteId,
      descripcion: `${autor.nombre} ${puntos > 0 ? 'sumó' : 'descontó'} ${formatearNumero(Math.abs(puntos))} puntos a ${nombreCliente(clienteId)}`,
      detalle: { concepto: concepto.trim() || undefined },
    })

    notificarCambio()
    return { ok: true }
  },

  /** Sube al cliente al nivel que le corresponde por sus visitas o su gasto. */
  actualizarNivel: (clienteId: string, autor: Usuario) => {
    const indice = membresias.findIndex((m) => m.clienteId === clienteId)
    if (indice < 0) return

    const membresia = membresias[indice]
    const nuevo = nivelQueCorresponde(membresia)
    if (nuevo === membresia.nivel) return

    membresias[indice] = { ...membresia, nivel: nuevo }

    auditoriaRepo.registrar({
      accion: 'nivel_actualizado',
      actorId: autor.id,
      entidad: 'cliente',
      entidadId: clienteId,
      descripcion: `${nombreCliente(clienteId)} pasó a nivel ${nivelPorClave(nuevo).nombre}`,
      detalle: {
        anterior: nivelPorClave(membresia.nivel).nombre,
        visitas: membresia.visitasAno,
      },
    })

    notificarCambio()
  },
}
