import type { Cliente, EstadoExperiencia, Experiencia, Rol, Usuario } from '@/core/types'
import { esGanada } from '@/core/types'
import { nombreCompleto } from '@/core/utils/cliente'
import { HOY_DEMO } from '@/core/utils/fecha'
import {
  clientesRepo,
  comercialRepo,
  equipoRepo,
  experienciasRepo,
  seguimientosRepo,
  ventasRepo,
} from '@/core/data/repositories'

/** Fecha de referencia del prototipo (definida en core/utils/fecha). */
export const HOY = HOY_DEMO

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const periodo = (iso: string) => iso.slice(0, 7)

export const MES_ACTUAL = periodo(HOY)
export const ANIO_ACTUAL = HOY.slice(0, 4)

function restarMeses(anioMes: string, cantidad: number) {
  const [anio, mes] = anioMes.split('-').map(Number)
  const d = new Date(anio, mes - 1 - cantidad, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Suma o resta días a una fecha ISO sin arrastrar zonas horarias. */
export function sumarDias(iso: string, dias: number) {
  const [a, m, d] = iso.split('-').map(Number)
  const fecha = new Date(a, m - 1, d + dias)
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

export const diasEntre = (desde: string, hasta: string) =>
  Math.round(
    (new Date(hasta + 'T00:00:00').getTime() - new Date(desde + 'T00:00:00').getTime()) / 86400000,
  )

/** Próxima ocurrencia de una fecha anual (MM-DD) a partir de hoy. */
export function proximaOcurrencia(mmdd: string, desde = HOY) {
  const anio = Number(desde.slice(0, 4))
  const candidato = `${anio}-${mmdd}`
  return candidato >= desde ? candidato : `${anio + 1}-${mmdd}`
}

/** Valor con el que cuenta una experiencia: lo cerrado, lo cotizado o el presupuesto. */
export const valorDeExperiencia = (e: Experiencia) =>
  e.valorFinal ?? e.valorCotizado ?? e.presupuesto ?? 0

/** Probabilidad implícita de cada etapa, para ponderar el pipeline. */
export const PROBABILIDAD_ETAPA: Record<EstadoExperiencia, number> = {
  nuevo: 10,
  contactado: 20,
  visita: 35,
  cotizacion: 55,
  negociacion: 75,
  confirmado: 100,
  realizado: 100,
  perdido: 0,
}

const variacion = (actual: number, anterior: number) =>
  anterior === 0 ? (actual > 0 ? 100 : 0) : ((actual - anterior) / anterior) * 100

/** Días sin visitar a partir de los cuales un cliente se considera en riesgo. */
const DIAS_PARA_RECUPERAR = 90
/** Ventana de anticipación para cumpleaños y aniversarios. */
export const DIAS_FECHAS_ESPECIALES = 30
/** Valor desde el cual un seguimiento entra a Momentos Hacienda. */
const UMBRAL_MOMENTO = 40_000_000

// ────────────────────────────────────────────────────────────────────────────
// 1. Panorama gerencial — los ocho indicadores de lectura inmediata
// ────────────────────────────────────────────────────────────────────────────

export function panoramaGerencial(usuario: Usuario) {
  const mesAnterior = restarMeses(MES_ACTUAL, 1)

  // Cartera
  const clientes = clientesRepo.listarVisibles(usuario)
  const nuevosMes = clientes.filter((c) => periodo(c.fechaRegistro) === MES_ACTUAL)
  const nuevosPrevios = clientes.filter((c) => periodo(c.fechaRegistro) === mesAnterior)

  // Experiencias abiertas (de Nuevo a Negociación)
  const activas = experienciasRepo.abiertas(usuario)
  const valorActivas = activas.reduce((s, e) => s + valorDeExperiencia(e), 0)
  const valorPonderado = activas.reduce(
    (s, e) => s + (valorDeExperiencia(e) * PROBABILIDAD_ETAPA[e.estado]) / 100,
    0,
  )

  // En negociación: ya cotizadas y todavía sin cerrar
  const enNegociacion = activas.filter(
    (e) => e.estado === 'cotizacion' || e.estado === 'negociacion',
  )
  const valorNegociacion = enNegociacion.reduce((s, e) => s + valorDeExperiencia(e), 0)

  // Confirmadas con fecha por delante
  const confirmados = experienciasRepo
    .listarVisibles(usuario)
    .filter((e) => e.estado === 'confirmado' && (e.fechaTentativa ?? '') >= HOY)

  // Ventas del mes
  const ventasMes = ventasRepo.delPeriodo(usuario, MES_ACTUAL)
  const ventasPrevias = ventasRepo.delPeriodo(usuario, mesAnterior)
  const totalMes = ventasMes.reduce((s, v) => s + v.monto - v.descuento, 0)
  const totalPrevio = ventasPrevias.reduce((s, v) => s + v.monto - v.descuento, 0)
  const meta =
    usuario.metaMensual ?? equipoRepo.comerciales().reduce((s, u) => s + (u.metaMensual ?? 0), 0)

  // Seguimientos
  const pendientes = seguimientosRepo
    .pendientes(usuario)
    .filter((s) => Boolean(s.fechaProximaAccion))
  const vencidos = pendientes.filter((s) => (s.fechaProximaAccion ?? '') < HOY)

  // Cumpleaños próximos
  const limiteFechas = sumarDias(HOY, DIAS_FECHAS_ESPECIALES)
  const idsVisibles = new Set(clientes.map((c) => c.id))
  const fechas = seguimientosRepo
    .fechasEspeciales()
    .filter((f) => f.activa && idsVisibles.has(f.clienteId))
    .map((f) => ({ ...f, proximaFecha: proximaOcurrencia(f.fecha) }))
    .filter((f) => f.proximaFecha <= limiteFechas)

  const cumpleanos = fechas.filter((f) => f.tipo === 'cumpleanos')
  const aniversarios = fechas.filter((f) => f.tipo !== 'cumpleanos')

  // Clientes por recuperar
  const porRecuperar = clientesParaRecuperar(usuario)

  return {
    clientesTotales: clientes.length,
    clientesNuevos: nuevosMes.length,
    variacionClientes: variacion(nuevosMes.length, nuevosPrevios.length),
    oportunidadesActivas: activas.length,
    valorActivas,
    valorPonderado,
    eventosEnNegociacion: enNegociacion.length,
    valorNegociacion,
    eventosConfirmados: confirmados.length,
    comensales: confirmados.reduce((s, e) => s + e.numeroPersonas, 0),
    totalMes,
    variacionVentas: variacion(totalMes, totalPrevio),
    operacionesMes: ventasMes.length,
    meta,
    avanceMeta: meta > 0 ? (totalMes / meta) * 100 : 0,
    seguimientosPendientes: pendientes.length,
    seguimientosVencidos: vencidos.length,
    cumpleanosProximos: cumpleanos.length,
    aniversariosProximos: aniversarios.length,
    diasProximoCumpleanos: cumpleanos.length
      ? diasEntre(
          HOY,
          cumpleanos.sort((a, b) => a.proximaFecha.localeCompare(b.proximaFecha))[0].proximaFecha,
        )
      : null,
    clientesPorRecuperar: porRecuperar.length,
    valorEnRiesgo: porRecuperar.reduce((s, c) => s + c.valorHistorico, 0),
  }
}

/**
 * Clientes por recuperar: inactivos, o sin visitar hace más de 90 días
 * y sin ninguna experiencia agendada.
 */
export function clientesParaRecuperar(usuario: Usuario): Cliente[] {
  const conEventoFuturo = new Set(
    experienciasRepo
      .listar()
      .filter((e) => (e.fechaTentativa ?? '') >= HOY && e.estado !== 'perdido')
      .map((e) => e.clienteId),
  )

  return clientesRepo
    .listarVisibles(usuario)
    .filter((c) => {
      if (conEventoFuturo.has(c.id)) return false
      if (c.categoria === 'por_recuperar') return true
      if (c.categoria === 'nuevo') return false
      return Boolean(c.ultimaVisita) && diasEntre(c.ultimaVisita!, HOY) > DIAS_PARA_RECUPERAR
    })
    .sort((a, b) => b.valorHistorico - a.valorHistorico)
}

// ────────────────────────────────────────────────────────────────────────────
// 2. Tendencia de ventas — una sola lectura, sin saturar de gráficas
// ────────────────────────────────────────────────────────────────────────────

export function tendenciaVentas(usuario: Usuario, meses = 6) {
  const periodos = Array.from({ length: meses }, (_, i) => restarMeses(MES_ACTUAL, meses - 1 - i))
  const ventas = ventasRepo.listarVisibles(usuario)

  return periodos.map((p) => {
    const [, mes] = p.split('-').map(Number)
    return {
      periodo: p,
      mes: MESES_CORTOS[mes - 1],
      total: ventas
        .filter((v) => periodo(v.fecha) === p)
        .reduce((s, v) => s + v.monto - v.descuento, 0),
      actual: p === MES_ACTUAL,
    }
  })
}

// ────────────────────────────────────────────────────────────────────────────
// 3. Pipeline comercial
// ────────────────────────────────────────────────────────────────────────────

/** El tablero del dashboard resume las cinco etapas abiertas. */
const ETAPAS_PIPELINE: EstadoExperiencia[] = [
  'nuevo',
  'contactado',
  'visita',
  'cotizacion',
  'negociacion',
]

export function pipelineComercial(usuario: Usuario) {
  const visibles = experienciasRepo.listarVisibles(usuario)
  const activas = experienciasRepo.abiertas(usuario)
  const ganadas = visibles.filter((e) => esGanada(e.estado))
  const perdidas = visibles.filter((e) => e.estado === 'perdido')
  const cerradas = ganadas.length + perdidas.length

  const valorTotal = activas.reduce((s, e) => s + valorDeExperiencia(e), 0)

  const etapas = ETAPAS_PIPELINE.map((etapa) => {
    const items = activas.filter((e) => e.estado === etapa)
    const valor = items.reduce((s, e) => s + valorDeExperiencia(e), 0)
    return {
      etapa,
      cantidad: items.length,
      valor,
      proporcionValor: valorTotal > 0 ? (valor / valorTotal) * 100 : 0,
    }
  })

  return {
    etapas,
    valorTotal,
    valorPonderado: activas.reduce(
      (s, e) => s + (valorDeExperiencia(e) * PROBABILIDAD_ETAPA[e.estado]) / 100,
      0,
    ),
    tasaCierre: cerradas > 0 ? (ganadas.length / cerradas) * 100 : 0,
    ganadas: ganadas.length,
    perdidas: perdidas.length,
    valorGanado: ganadas.reduce((s, e) => s + valorDeExperiencia(e), 0),
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 4. Actividad comercial: interno frente a freelancer
// ────────────────────────────────────────────────────────────────────────────

export type Canal = 'interno' | 'freelancer'

const CANAL_POR_ROL: Partial<Record<Rol, Canal>> = {
  comercial_interno: 'interno',
  comercial_freelancer: 'freelancer',
}

export interface ResumenCanal {
  canal: Canal
  nombre: string
  comerciales: number
  clientesAsignados: number
  oportunidades: number
  oportunidadesActivas: number
  ventasCerradas: number
  valorVendido: number
  tasaConversion: number
  ticketPromedio: number
}

/** Comparativa de los dos canales comerciales en el año en curso. */
export function actividadPorCanal(): ResumenCanal[] {
  const equipo = equipoRepo.comerciales()
  const clientes = clientesRepo.listar()
  const experiencias = experienciasRepo.listar()
  const ventas = ventasRepo.listar().filter((v) => v.fecha.startsWith(ANIO_ACTUAL))

  const canales: { canal: Canal; nombre: string }[] = [
    { canal: 'interno', nombre: 'Comercial interno' },
    { canal: 'freelancer', nombre: 'Comercial freelancer' },
  ]

  return canales.map(({ canal, nombre }) => {
    const ids = new Set(
      equipo.filter((u) => CANAL_POR_ROL[u.rol] === canal).map((u) => u.id),
    )

    const experienciasCanal = experiencias.filter((e) => ids.has(e.comercialId))
    const ganadas = experienciasCanal.filter((e) => esGanada(e.estado))
    const perdidas = experienciasCanal.filter((e) => e.estado === 'perdido')
    const cerradas = ganadas.length + perdidas.length
    const valorVendido = ventas
      .filter((v) => ids.has(v.comercialId))
      .reduce((s, v) => s + v.monto - v.descuento, 0)

    return {
      canal,
      nombre,
      comerciales: ids.size,
      clientesAsignados: clientes.filter((c) => ids.has(c.comercialId)).length,
      oportunidades: experienciasCanal.length,
      oportunidadesActivas: experienciasCanal.filter(
        (e) => !esGanada(e.estado) && e.estado !== 'perdido',
      ).length,
      ventasCerradas: ganadas.length,
      valorVendido,
      tasaConversion: cerradas > 0 ? (ganadas.length / cerradas) * 100 : 0,
      ticketPromedio: ganadas.length > 0 ? valorVendido / ganadas.length : 0,
    }
  })
}

/** Detalle por asesor, para abrir la comparativa cuando Gerencia lo necesite. */
export function detallePorComercial() {
  const ventas = ventasRepo.listar().filter((v) => v.fecha.startsWith(ANIO_ACTUAL))
  const experiencias = experienciasRepo.listar()
  const clientes = clientesRepo.listar()

  return equipoRepo
    .comerciales()
    .map((comercial) => {
      const suyas = experiencias.filter((e) => e.comercialId === comercial.id)
      const ganadas = suyas.filter((e) => esGanada(e.estado)).length
      const cerradas = ganadas + suyas.filter((e) => e.estado === 'perdido').length

      return {
        comercial,
        canal: CANAL_POR_ROL[comercial.rol] ?? 'interno',
        clientes: clientes.filter((c) => c.comercialId === comercial.id).length,
        oportunidades: suyas.length,
        ventasCerradas: ganadas,
        valorVendido: ventas
          .filter((v) => v.comercialId === comercial.id)
          .reduce((s, v) => s + v.monto - v.descuento, 0),
        tasaConversion: cerradas > 0 ? (ganadas / cerradas) * 100 : 0,
      }
    })
    .sort((a, b) => b.valorVendido - a.valorVendido)
}

// ────────────────────────────────────────────────────────────────────────────
// 5. Momentos Hacienda — la agenda que genera ventas
// ────────────────────────────────────────────────────────────────────────────

export type TipoMomento = 'cumpleanos' | 'aniversario' | 'evento' | 'seguimiento'

export interface Momento {
  id: string
  tipo: TipoMomento
  fecha: string
  titulo: string
  detalle: string
  clienteId: string
  comercialId?: string
  destacado: boolean
  vencido: boolean
  valor?: number
}

/**
 * Reúne en una sola línea de tiempo los cumpleaños, aniversarios, eventos y
 * seguimientos importantes de las próximas semanas.
 */
export function momentosHacienda(usuario: Usuario, dias = 30): Momento[] {
  const limite = sumarDias(HOY, dias)
  const clientes = clientesRepo.listarVisibles(usuario)
  const idsVisibles = new Set(clientes.map((c) => c.id))
  const momentos: Momento[] = []

  // Cumpleaños y aniversarios
  for (const fecha of seguimientosRepo.fechasEspeciales()) {
    if (!fecha.activa || !idsVisibles.has(fecha.clienteId)) continue
    const proxima = proximaOcurrencia(fecha.fecha)
    if (proxima > limite) continue

    const cliente = clientes.find((c) => c.id === fecha.clienteId)
    momentos.push({
      id: `fe-${fecha.id}`,
      tipo: fecha.tipo === 'cumpleanos' ? 'cumpleanos' : 'aniversario',
      fecha: proxima,
      titulo: cliente ? nombreCompleto(cliente) : fecha.descripcion,
      detalle: fecha.tipo === 'cumpleanos' ? 'Cumpleaños' : fecha.descripcion,
      clienteId: fecha.clienteId,
      comercialId: cliente?.comercialId,
      destacado: cliente?.categoria === 'vip',
      vencido: false,
    })
  }

  // Experiencias agendadas
  for (const experiencia of experienciasRepo.listarVisibles(usuario)) {
    const fecha = experiencia.fechaTentativa
    if (!fecha || fecha < HOY || fecha > limite) continue
    if (experiencia.estado === 'perdido') continue

    momentos.push({
      id: `ev-${experiencia.id}`,
      tipo: 'evento',
      fecha,
      titulo: experiencia.titulo,
      detalle: `${experiencia.numeroPersonas} personas${experiencia.horaInicio ? ` · ${experiencia.horaInicio}` : ''}`,
      clienteId: experiencia.clienteId,
      comercialId: experiencia.comercialId,
      destacado: esGanada(experiencia.estado),
      vencido: false,
      valor: valorDeExperiencia(experiencia),
    })
  }

  /*
   * Seguimientos: aquí solo entran los importantes — los que sostienen una
   * negociación relevante o a un cliente VIP. Los vencidos y la agenda
   * completa se leen en el indicador de seguimientos pendientes.
   */
  for (const seg of seguimientosRepo.pendientes(usuario)) {
    const fecha = seg.fechaProximaAccion
    if (!fecha || fecha < HOY || fecha > limite) continue

    const cliente = clientes.find((c) => c.id === seg.clienteId)
    const experiencia =
      seg.entidadTipo === 'experiencia' ? experienciasRepo.obtener(seg.entidadId) : undefined
    const valorAsociado = experiencia ? valorDeExperiencia(experiencia) : undefined

    const esVip = cliente?.categoria === 'vip'
    if (!esVip && (valorAsociado ?? 0) < UMBRAL_MOMENTO) continue

    momentos.push({
      id: `sg-${seg.id}`,
      tipo: 'seguimiento',
      fecha,
      titulo: seg.proximaAccion ?? seg.asunto,
      detalle: valorAsociado
        ? `Negociación por ${(valorAsociado / 1_000_000).toFixed(1).replace('.', ',')} M`
        : 'Seguimiento comprometido',
      clienteId: seg.clienteId,
      comercialId: seg.comercialId,
      destacado: esVip,
      vencido: false,
    })
  }

  return momentos.sort((a, b) => a.fecha.localeCompare(b.fecha))
}

/** Solicitudes de reasignación pendientes de decisión de Gerencia. */
export const conflictosPendientes = () => comercialRepo.pendientes()
