import type { CategoriaVenta, EstadoPago, Usuario, Venta } from '@/core/types'
import { esGanada } from '@/core/types'
import type { TonoEtiqueta } from '@/ui'
import {
  clientesRepo,
  equipoRepo,
  experienciasRepo,
  ventasRepo,
  valorNeto,
} from '@/core/data/repositories'
import { normalizarTexto } from '@/core/utils/normalizar'
import { HOY_DEMO } from '@/core/utils/fecha'

export const HOY = HOY_DEMO
export const MES_ACTUAL = HOY.slice(0, 7)
export const ANIO_ACTUAL = HOY.slice(0, 4)

export const CATEGORIAS: CategoriaVenta[] = ['evento', 'restaurante', 'experiencia', 'bar', 'otros']

export const etiquetaCategoriaVenta: Record<CategoriaVenta, string> = {
  evento: 'Evento',
  restaurante: 'Restaurante',
  experiencia: 'Experiencia',
  bar: 'Bar',
  otros: 'Otros',
}

export const ESTADOS_PAGO: EstadoPago[] = ['anticipo', 'parcial', 'pagado', 'vencido']

export const TONO_PAGO: Record<EstadoPago, TonoEtiqueta> = {
  anticipo: 'laton',
  parcial: 'alerta',
  pagado: 'exito',
  vencido: 'peligro',
}

export interface FiltrosVentas {
  texto: string
  categoria: CategoriaVenta | 'todas'
  estadoPago: EstadoPago | 'todos'
  comercialId: string | 'todos'
  periodo: string | 'todos'
}

export const FILTROS_INICIALES: FiltrosVentas = {
  texto: '',
  categoria: 'todas',
  estadoPago: 'todos',
  comercialId: 'todos',
  periodo: 'todos',
}

export const hayFiltros = (f: FiltrosVentas) =>
  f.texto.trim() !== '' ||
  f.categoria !== 'todas' ||
  f.estadoPago !== 'todos' ||
  f.comercialId !== 'todos' ||
  f.periodo !== 'todos'

/** Meses con ventas registradas, del más reciente al más antiguo. */
export function periodosDisponibles(usuario: Usuario): string[] {
  return [...new Set(ventasRepo.listarVisibles(usuario).map((v) => v.fecha.slice(0, 7)))].sort(
    (a, b) => b.localeCompare(a),
  )
}

export function filtrarVentas(usuario: Usuario, filtros: FiltrosVentas): Venta[] {
  const texto = normalizarTexto(filtros.texto)

  return ventasRepo
    .listarVisibles(usuario)
    .filter((v) => {
      if (filtros.categoria !== 'todas' && v.categoria !== filtros.categoria) return false
      if (filtros.estadoPago !== 'todos' && v.estadoPago !== filtros.estadoPago) return false
      if (filtros.comercialId !== 'todos' && v.comercialId !== filtros.comercialId) return false
      if (filtros.periodo !== 'todos' && !v.fecha.startsWith(filtros.periodo)) return false
      if (!texto) return true
      return (
        normalizarTexto(v.descripcion).includes(texto) ||
        normalizarTexto(v.codigo).includes(texto) ||
        normalizarTexto(clientesRepo.nombreDe(v.clienteId)).includes(texto)
      )
    })
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
}

/** Cifras de cabecera del módulo. */
export function resumenVentas(usuario: Usuario) {
  const todas = ventasRepo.listarVisibles(usuario)
  const delMes = todas.filter((v) => v.fecha.startsWith(MES_ACTUAL))
  const delAnio = todas.filter((v) => v.fecha.startsWith(ANIO_ACTUAL))
  const porCobrar = todas.filter((v) => v.estadoPago !== 'pagado')
  const vencidas = todas.filter((v) => v.estadoPago === 'vencido')

  const totalMes = delMes.reduce((s, v) => s + valorNeto(v), 0)
  const comisionesPendientes = todas.filter(
    (v) => v.comisionValor > 0 && !v.comisionLiquidada,
  )

  return {
    totalMes,
    operacionesMes: delMes.length,
    totalAnio: delAnio.reduce((s, v) => s + valorNeto(v), 0),
    ticketPromedio: delAnio.length > 0
      ? delAnio.reduce((s, v) => s + valorNeto(v), 0) / delAnio.length
      : 0,
    porCobrar: porCobrar.reduce((s, v) => s + valorNeto(v), 0),
    operacionesPorCobrar: porCobrar.length,
    vencidas: vencidas.length,
    valorVencido: vencidas.reduce((s, v) => s + valorNeto(v), 0),
    comisionesPendientes: comisionesPendientes.reduce((s, v) => s + v.comisionValor, 0),
    operacionesConComision: comisionesPendientes.length,
  }
}

/** Reparto del mes por categoría, para leer de dónde viene el ingreso. */
export function porCategoria(usuario: Usuario, periodo = MES_ACTUAL) {
  const ventas = ventasRepo.listarVisibles(usuario).filter((v) => v.fecha.startsWith(periodo))
  const total = ventas.reduce((s, v) => s + valorNeto(v), 0)

  return CATEGORIAS.map((categoria) => {
    const items = ventas.filter((v) => v.categoria === categoria)
    const valor = items.reduce((s, v) => s + valorNeto(v), 0)
    return {
      categoria,
      cantidad: items.length,
      valor,
      proporcion: total > 0 ? (valor / total) * 100 : 0,
    }
  }).filter((c) => c.cantidad > 0)
}

export interface ComisionComercial {
  comercial: ReturnType<typeof equipoRepo.obtener>
  porcentaje: number
  pendiente: number
  pendienteLiquidable: number
  operacionesPendientes: number
  liquidado: number
  totalVendido: number
}

/**
 * Comisiones por comercial.
 * Solo es liquidable la comisión de una venta ya pagada: la hacienda no paga
 * comisión sobre dinero que aún no ha entrado.
 */
export function comisionesPorComercial(): ComisionComercial[] {
  const ventas = ventasRepo.listar().filter((v) => v.fecha.startsWith(ANIO_ACTUAL))

  return equipoRepo
    .comerciales()
    .filter((u) => (u.comisionPorcentaje ?? 0) > 0)
    .map((comercial) => {
      const suyas = ventas.filter((v) => v.comercialId === comercial.id)
      const pendientes = suyas.filter((v) => v.comisionValor > 0 && !v.comisionLiquidada)

      return {
        comercial,
        porcentaje: comercial.comisionPorcentaje ?? 0,
        pendiente: pendientes.reduce((s, v) => s + v.comisionValor, 0),
        pendienteLiquidable: pendientes
          .filter((v) => v.estadoPago === 'pagado')
          .reduce((s, v) => s + v.comisionValor, 0),
        operacionesPendientes: pendientes.length,
        liquidado: suyas
          .filter((v) => v.comisionLiquidada)
          .reduce((s, v) => s + v.comisionValor, 0),
        totalVendido: suyas.reduce((s, v) => s + valorNeto(v), 0),
      }
    })
    .sort((a, b) => b.pendiente - a.pendiente)
}

/**
 * Experiencias cerradas que todavía no tienen ninguna venta registrada.
 * Es el hueco entre lo que se vendió y lo que se facturó.
 */
export function experienciasPorFacturar(usuario: Usuario) {
  return experienciasRepo
    .listarVisibles(usuario)
    .filter((e) => esGanada(e.estado) && (e.valorFinal ?? 0) > 0)
    .map((e) => ({
      experiencia: e,
      registrado: ventasRepo.deExperiencia(e.id).reduce((s, v) => s + valorNeto(v), 0),
    }))
    .filter((x) => x.registrado < (x.experiencia.valorFinal ?? 0))
    .sort(
      (a, b) =>
        (b.experiencia.valorFinal ?? 0) - b.registrado -
        ((a.experiencia.valorFinal ?? 0) - a.registrado),
    )
}
