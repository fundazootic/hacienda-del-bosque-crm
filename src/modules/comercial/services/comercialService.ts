import type { AsignacionHistorial, CategoriaCliente, Cliente, Usuario } from '@/core/types'
import { esGanada } from '@/core/types'
import {
  clientesRepo,
  comercialRepo,
  equipoRepo,
  experienciasRepo,
  ventasRepo,
} from '@/core/data/repositories'

import { HOY_DEMO } from '@/core/utils/fecha'

export const HOY = HOY_DEMO
const ANIO = HOY.slice(0, 4)

export type TipoComercial = 'interno' | 'freelancer'

export const tipoDeComercial = (u: Usuario): TipoComercial =>
  u.rol === 'comercial_freelancer' ? 'freelancer' : 'interno'

export const ETIQUETA_TIPO: Record<TipoComercial, string> = {
  interno: 'Comercial interno',
  freelancer: 'Freelancer',
}

export interface CarteraComercial {
  comercial: Usuario
  tipo: TipoComercial
  clientes: Cliente[]
  porCategoria: Record<CategoriaCliente, number>
  valorCartera: number
  ventasAnio: number
  oportunidadesActivas: number
  valorEnCurso: number
  /** Clientes que llegaron por reasignación, no por registro propio. */
  recibidos: number
  /** Clientes que salieron de su cartera hacia otro comercial. */
  cedidos: number
  solicitudesPendientes: number
  ultimaAsignacion?: string
}

const CATEGORIAS: CategoriaCliente[] = ['vip', 'frecuente', 'ocasional', 'nuevo', 'por_recuperar']

/** Foto comparable de la cartera de cada comercial. */
export function carteraPorComercial(): CarteraComercial[] {
  const clientes = clientesRepo.listar()
  const historial = clientesRepo.historialAsignaciones()
  const experiencias = experienciasRepo.listar()
  const ventas = ventasRepo.listar().filter((v) => v.fecha.startsWith(ANIO))
  const pendientes = comercialRepo.pendientes()

  return equipoRepo
    .comerciales()
    .map((comercial) => {
      const suyos = clientes.filter((c) => c.comercialId === comercial.id)
      const activas = experiencias.filter(
        (e) =>
          e.comercialId === comercial.id && !esGanada(e.estado) && e.estado !== 'perdido',
      )

      const porCategoria = CATEGORIAS.reduce(
        (acc, cat) => ({ ...acc, [cat]: suyos.filter((c) => c.categoria === cat).length }),
        {} as Record<CategoriaCliente, number>,
      )

      return {
        comercial,
        tipo: tipoDeComercial(comercial),
        clientes: suyos,
        porCategoria,
        valorCartera: suyos.reduce((s, c) => s + c.valorHistorico, 0),
        ventasAnio: ventas
          .filter((v) => v.comercialId === comercial.id)
          .reduce((s, v) => s + v.monto - v.descuento, 0),
        oportunidadesActivas: activas.length,
        valorEnCurso: activas.reduce(
          (s, e) => s + (e.valorCotizado ?? e.presupuesto ?? 0),
          0,
        ),
        recibidos: suyos.filter((c) => c.fechaAsignacion !== c.fechaRegistro).length,
        cedidos: historial.filter((h) => h.comercialAnteriorId === comercial.id).length,
        solicitudesPendientes: pendientes.filter((s) => s.propietarioActualId === comercial.id)
          .length,
        ultimaAsignacion: suyos
          .map((c) => c.fechaAsignacion)
          .sort((a, b) => b.localeCompare(a))[0],
      }
    })
    .sort((a, b) => b.clientes.length - a.clientes.length)
}

/** Cartera de un comercial concreto, para la vista «Mis clientes». */
export function miCartera(usuario: Usuario) {
  const clientes = clientesRepo
    .listarVisibles(usuario)
    .sort((a, b) => b.fechaAsignacion.localeCompare(a.fechaAsignacion))

  const activas = experienciasRepo.abiertas(usuario)
  const ventasAnio = ventasRepo
    .listarVisibles(usuario)
    .filter((v) => v.fecha.startsWith(ANIO))
    .reduce((s, v) => s + v.monto - v.descuento, 0)

  return {
    clientes,
    total: clientes.length,
    valorCartera: clientes.reduce((s, c) => s + c.valorHistorico, 0),
    ventasAnio,
    oportunidadesActivas: activas.length,
    valorEnCurso: activas.reduce((s, e) => s + (e.valorCotizado ?? e.presupuesto ?? 0), 0),
    porCategoria: CATEGORIAS.reduce(
      (acc, cat) => ({ ...acc, [cat]: clientes.filter((c) => c.categoria === cat).length }),
      {} as Record<CategoriaCliente, number>,
    ),
    recibidos: clientes.filter((c) => c.fechaAsignacion !== c.fechaRegistro).length,
    registrados: clientes.filter((c) => c.creadoPor === usuario.id).length,
    solicitudesEnviadas: comercialRepo.solicitadasPor(usuario.id),
    solicitudesRecibidas: comercialRepo.recibidasPor(usuario.id),
  }
}

/** Movimientos de propiedad de toda la hacienda, del más reciente al primero. */
export function movimientosDePropiedad(limite = 12): AsignacionHistorial[] {
  return [...clientesRepo.historialAsignaciones()]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, limite)
}

export const ETIQUETA_ORIGEN_ASIGNACION: Record<string, string> = {
  registro: 'Registro inicial',
  reasignacion_gerencia: 'Reasignación de Gerencia',
  solicitud_aprobada: 'Solicitud aprobada',
}
