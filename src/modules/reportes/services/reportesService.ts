import type {
  CategoriaCliente,
  CategoriaVenta,
  OrigenCliente,
  TipoExperiencia,
  Usuario,
} from '@/core/types'
import { esGanada } from '@/core/types'
import {
  clientesRepo,
  equipoRepo,
  experienciasRepo,
  valorNeto,
  ventasRepo,
} from '@/core/data/repositories'
import {
  etiquetaCategoria,
  etiquetaExperiencia,
  etiquetaOrigen,
} from '@/core/utils/etiquetas'
import { HOY_DEMO } from '@/core/utils/fecha'
import { formatearMonedaCompacta, formatearPorcentaje } from '@/core/utils/format'

export const HOY = HOY_DEMO

/* ─────────────────────────────────────────────────────────────────────────────
 * Períodos
 * Un informe siempre responde «¿de cuándo?». El período es un rango de fechas
 * en texto ISO: comparar cadenas basta y evita zonas horarias.
 * ────────────────────────────────────────────────────────────────────────── */

export type ClavePeriodo = 'mes' | 'trimestre' | 'anio'

export interface Periodo {
  clave: ClavePeriodo
  etiqueta: string
  /** Cómo se lee en una frase: «en septiembre», «en lo que va del año». */
  frase: string
  desde: string
  hasta: string
}

const restarMeses = (iso: string, meses: number) => {
  const [a, m] = iso.split('-').map(Number)
  const total = a * 12 + (m - 1) - meses
  const anio = Math.floor(total / 12)
  const mes = (total % 12) + 1
  return `${anio}-${String(mes).padStart(2, '0')}`
}

const nombreMes = (periodo: string) =>
  new Intl.DateTimeFormat('es-CO', { month: 'long' }).format(new Date(`${periodo}-15T12:00:00`))

export function periodos(): Periodo[] {
  const mes = HOY.slice(0, 7)
  const anio = HOY.slice(0, 4)

  return [
    {
      clave: 'mes',
      etiqueta: `Este mes · ${nombreMes(mes)}`,
      frase: `en ${nombreMes(mes)}`,
      desde: `${mes}-01`,
      hasta: HOY,
    },
    {
      clave: 'trimestre',
      etiqueta: 'Últimos 3 meses',
      frase: 'en los últimos 3 meses',
      desde: `${restarMeses(mes, 2)}-01`,
      hasta: HOY,
    },
    {
      clave: 'anio',
      etiqueta: `Todo el año ${anio}`,
      frase: `en lo que va de ${anio}`,
      desde: `${anio}-01-01`,
      hasta: HOY,
    },
  ]
}

export const periodoPorClave = (clave: ClavePeriodo) =>
  periodos().find((p) => p.clave === clave) ?? periodos()[1]

const dentro = (fecha: string | undefined, p: Periodo) =>
  !!fecha && fecha >= p.desde && fecha <= p.hasta

/* ─────────────────────────────────────────────────────────────────────────────
 * 1. Resumen del período
 * ────────────────────────────────────────────────────────────────────────── */

export function resumenPeriodo(usuario: Usuario, p: Periodo) {
  const ventas = ventasRepo.listarVisibles(usuario).filter((v) => dentro(v.fecha, p))
  const experiencias = experienciasRepo.listarVisibles(usuario)
  const cerradas = experiencias.filter((e) => esGanada(e.estado) && dentro(e.fechaTentativa, p))
  const nuevos = clientesRepo.listarVisibles(usuario).filter((c) => dentro(c.fechaRegistro, p))

  const total = ventas.reduce((s, v) => s + valorNeto(v), 0)

  return {
    total,
    operaciones: ventas.length,
    ticket: ventas.length > 0 ? total / ventas.length : 0,
    celebraciones: cerradas.length,
    comensales: cerradas.reduce((s, e) => s + e.numeroPersonas, 0),
    clientesNuevos: nuevos.length,
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
 * 2. Informe de ventas
 * ────────────────────────────────────────────────────────────────────────── */

export interface Fila {
  clave: string
  etiqueta: string
  cantidad: number
  valor: number
  /** Porcentaje sobre el total del informe. */
  proporcion: number
}

const ordenarYProporcionar = (filas: Omit<Fila, 'proporcion'>[]): Fila[] => {
  const total = filas.reduce((s, f) => s + f.valor, 0)
  return filas
    .filter((f) => f.cantidad > 0)
    .map((f) => ({ ...f, proporcion: total > 0 ? (f.valor / total) * 100 : 0 }))
    .sort((a, b) => b.valor - a.valor)
}

const ETIQUETA_CATEGORIA_VENTA: Record<CategoriaVenta, string> = {
  evento: 'Eventos',
  restaurante: 'Restaurante',
  experiencia: 'Experiencias',
  bar: 'Bar',
  otros: 'Otros',
}

/** De dónde viene el dinero: eventos, restaurante, bar… */
export function ingresosPorCategoria(usuario: Usuario, p: Periodo): Fila[] {
  const ventas = ventasRepo.listarVisibles(usuario).filter((v) => dentro(v.fecha, p))

  return ordenarYProporcionar(
    (Object.keys(ETIQUETA_CATEGORIA_VENTA) as CategoriaVenta[]).map((clave) => {
      const items = ventas.filter((v) => v.categoria === clave)
      return {
        clave,
        etiqueta: ETIQUETA_CATEGORIA_VENTA[clave],
        cantidad: items.length,
        valor: items.reduce((s, v) => s + valorNeto(v), 0),
      }
    }),
  )
}

/** Qué celebraciones dejan más dinero. Cruza la venta con su experiencia. */
export function ingresosPorTipoDeExperiencia(usuario: Usuario, p: Periodo): Fila[] {
  const ventas = ventasRepo
    .listarVisibles(usuario)
    .filter((v) => dentro(v.fecha, p) && v.experienciaId)

  const tipos = Object.keys(etiquetaExperiencia) as TipoExperiencia[]

  return ordenarYProporcionar(
    tipos.map((tipo) => {
      const items = ventas.filter((v) => experienciasRepo.obtener(v.experienciaId!)?.tipo === tipo)
      return {
        clave: tipo,
        etiqueta: etiquetaExperiencia[tipo],
        cantidad: items.length,
        valor: items.reduce((s, v) => s + valorNeto(v), 0),
      }
    }),
  )
}

/**
 * Mes a mes del período, para la gráfica.
 * Se listan TODOS los meses del rango, incluidos los que quedaron en cero: un
 * mes sin ventas es información, y saltárselo falsea la tendencia.
 */
export function ventasPorMes(usuario: Usuario, p: Periodo) {
  const primero = p.desde.slice(0, 7)
  const ultimo = p.hasta.slice(0, 7)

  const claves: string[] = []
  let cursor = primero
  while (cursor <= ultimo && claves.length < 12) {
    claves.push(cursor)
    cursor = restarMeses(cursor, -1)
  }
  // Un solo mes no dibuja tendencia: se añaden los dos anteriores como contexto.
  while (claves.length < 3) claves.unshift(restarMeses(claves[0], 1))

  const ventas = ventasRepo.listarVisibles(usuario)

  return claves.map((periodo) => ({
    periodo,
    mes: nombreMes(periodo).slice(0, 3),
    total: ventas
      .filter((v) => v.fecha.startsWith(periodo))
      .reduce((s, v) => s + valorNeto(v), 0),
    actual: periodo === HOY.slice(0, 7),
  }))
}

/* ─────────────────────────────────────────────────────────────────────────────
 * 3. Informe de equipo
 * Solo Gerencia lo consulta: compara a los comerciales entre sí.
 * ────────────────────────────────────────────────────────────────────────── */

export interface FilaEquipo {
  id: string
  nombre: string
  iniciales: string
  canal: 'Interno' | 'Freelancer'
  clientes: number
  trabajadas: number
  ganadas: number
  perdidas: number
  cierre: number
  vendido: number
  ticket: number
}

export function desempenoEquipo(p: Periodo): FilaEquipo[] {
  const ventas = ventasRepo.listar().filter((v) => dentro(v.fecha, p))
  const experiencias = experienciasRepo.listar()

  return equipoRepo
    .comerciales()
    .map((c) => {
      const suyas = experiencias.filter(
        (e) => e.comercialId === c.id && dentro(e.actualizadoEn.slice(0, 10), p),
      )
      const ganadas = suyas.filter((e) => esGanada(e.estado)).length
      const perdidas = suyas.filter((e) => e.estado === 'perdido').length
      const cerradas = ganadas + perdidas
      const misVentas = ventas.filter((v) => v.comercialId === c.id)
      const vendido = misVentas.reduce((s, v) => s + valorNeto(v), 0)

      return {
        id: c.id,
        nombre: c.nombre,
        iniciales: c.iniciales,
        canal: c.rol === 'comercial_freelancer' ? ('Freelancer' as const) : ('Interno' as const),
        clientes: clientesRepo.listar().filter((cl) => cl.comercialId === c.id).length,
        trabajadas: suyas.length,
        ganadas,
        perdidas,
        cierre: cerradas > 0 ? (ganadas / cerradas) * 100 : 0,
        vendido,
        ticket: misVentas.length > 0 ? vendido / misVentas.length : 0,
      }
    })
    .sort((a, b) => b.vendido - a.vendido)
}

/* ─────────────────────────────────────────────────────────────────────────────
 * 4. Informe de clientes
 * ────────────────────────────────────────────────────────────────────────── */

export function clientesPorCategoria(usuario: Usuario): Fila[] {
  const clientes = clientesRepo.listarVisibles(usuario)
  const categorias = Object.keys(etiquetaCategoria) as CategoriaCliente[]

  return ordenarYProporcionar(
    categorias.map((clave) => {
      const items = clientes.filter((c) => c.categoria === clave)
      return {
        clave,
        etiqueta: etiquetaCategoria[clave],
        cantidad: items.length,
        valor: items.reduce((s, c) => s + c.valorHistorico, 0),
      }
    }),
  )
}

/** Por dónde llegan los clientes y cuánto ha dejado cada canal. */
export function clientesPorOrigen(usuario: Usuario): Fila[] {
  const clientes = clientesRepo.listarVisibles(usuario)
  const origenes = Object.keys(etiquetaOrigen) as OrigenCliente[]

  return ordenarYProporcionar(
    origenes.map((clave) => {
      const items = clientes.filter((c) => c.origen === clave)
      return {
        clave,
        etiqueta: etiquetaOrigen[clave],
        cantidad: items.length,
        valor: items.reduce((s, c) => s + c.valorHistorico, 0),
      }
    }),
  )
}

/** Qué se pide más, se cierre o no: la demanda real de la hacienda. */
export function solicitudesPorTipo(usuario: Usuario, p: Periodo): Fila[] {
  const experiencias = experienciasRepo
    .listarVisibles(usuario)
    .filter((e) => dentro(e.creadoEn.slice(0, 10), p))
  const tipos = Object.keys(etiquetaExperiencia) as TipoExperiencia[]

  return ordenarYProporcionar(
    tipos.map((tipo) => {
      const items = experiencias.filter((e) => e.tipo === tipo)
      return {
        clave: tipo,
        etiqueta: etiquetaExperiencia[tipo],
        cantidad: items.length,
        valor: items.reduce((s, e) => s + (e.valorFinal ?? e.valorCotizado ?? 0), 0),
      }
    }),
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
 * 5. Informe de pérdidas
 * El motivo es obligatorio al marcar una experiencia como perdida: aquí se lee
 * agrupado, que es la única forma de que sirva para decidir algo.
 * ────────────────────────────────────────────────────────────────────────── */

const OTROS = 'Otros motivos'

/**
 * Agrupa los motivos escritos a mano en familias legibles.
 * No inventa categorías: solo reconoce las palabras que el equipo usa de verdad
 * al cerrar una experiencia. Lo que no encaje queda en «Otros motivos».
 */
const familiaDeMotivo = (motivo: string) => {
  const texto = motivo.toLowerCase()
  if (texto.includes('precio') || texto.includes('presupuesto') || texto.includes('costo'))
    return 'Precio o presupuesto'
  if (
    texto.includes('proveedor') ||
    texto.includes('competencia') ||
    texto.includes('otro lugar') ||
    texto.includes('otra opción')
  )
    return 'Se fue con otro proveedor'
  if (
    texto.includes('casa') ||
    texto.includes('instalaciones') ||
    texto.includes('sede') ||
    texto.includes('finca')
  )
    return 'Lo celebraron en su propio espacio'
  if (texto.includes('fecha') || texto.includes('disponib') || texto.includes('agenda'))
    return 'Fecha no disponible'
  if (texto.includes('aplaz') || texto.includes('poster') || texto.includes('cancel') || texto.includes('viaje'))
    return 'Aplazó o canceló la celebración'
  if (texto.includes('respond') || texto.includes('contacto') || texto.includes('contest'))
    return 'El cliente no volvió a responder'
  return OTROS
}

export interface FilaPerdida extends Fila {
  ejemplos: string[]
}

export function motivosDePerdida(usuario: Usuario, p: Periodo): FilaPerdida[] {
  const perdidas = experienciasRepo
    .listarVisibles(usuario)
    .filter((e) => e.estado === 'perdido' && dentro(e.actualizadoEn.slice(0, 10), p))

  const familias = new Map<string, { cantidad: number; valor: number; ejemplos: string[] }>()

  perdidas.forEach((e) => {
    const familia = familiaDeMotivo(e.motivoPerdida ?? '')
    const actual = familias.get(familia) ?? { cantidad: 0, valor: 0, ejemplos: [] }
    actual.cantidad += 1
    actual.valor += e.valorCotizado ?? e.presupuesto ?? 0
    if (e.motivoPerdida && actual.ejemplos.length < 2) actual.ejemplos.push(e.motivoPerdida)
    familias.set(familia, actual)
  })

  const totalCantidad = perdidas.length

  return [...familias.entries()]
    .map(([etiqueta, d]) => ({
      clave: etiqueta,
      etiqueta,
      cantidad: d.cantidad,
      valor: d.valor,
      proporcion: totalCantidad > 0 ? (d.cantidad / totalCantidad) * 100 : 0,
      ejemplos: d.ejemplos,
    }))
    // «Otros motivos» siempre al final: es un cajón de sastre, no una conclusión.
    .sort((a, b) => {
      if (a.clave === OTROS) return 1
      if (b.clave === OTROS) return -1
      return b.cantidad - a.cantidad || b.valor - a.valor
    })
}

/* ─────────────────────────────────────────────────────────────────────────────
 * 6. Lecturas en palabras
 * Cada informe viene con su conclusión escrita: Gerencia no debería tener que
 * interpretar una tabla para saber qué está pasando.
 * ────────────────────────────────────────────────────────────────────────── */

export function lecturaIngresos(filas: Fila[], p: Periodo) {
  if (filas.length === 0) return `No hay ventas registradas ${p.frase}.`
  const primera = filas[0]
  return `Lo que más deja ${p.frase} es ${primera.etiqueta.toLowerCase()}: ${formatearMonedaCompacta(
    primera.valor,
  )}, ${formatearPorcentaje(primera.proporcion)} de todo lo vendido.`
}

export function lecturaEquipo(filas: FilaEquipo[], p: Periodo) {
  const conVentas = filas.filter((f) => f.vendido > 0)
  if (conVentas.length === 0) return `Ningún comercial registró ventas ${p.frase}.`
  const mejor = conVentas[0]
  const conCierre = filas.filter((f) => f.ganadas + f.perdidas >= 2)
  const masEfectivo = [...conCierre].sort((a, b) => b.cierre - a.cierre)[0]

  const frase = `${mejor.nombre} es quien más vendió ${p.frase}: ${formatearMonedaCompacta(mejor.vendido)}.`
  if (!masEfectivo || masEfectivo.id === mejor.id) return frase
  return `${frase} El que más cierra de lo que trabaja es ${masEfectivo.nombre}: ${formatearPorcentaje(
    masEfectivo.cierre,
  )} de sus negocios terminan en venta.`
}

export function lecturaClientes(categorias: Fila[], origenes: Fila[]) {
  const porRecuperar = categorias.find((c) => c.clave === 'por_recuperar')
  const mejorOrigen = origenes[0]
  const partes: string[] = []
  if (mejorOrigen)
    partes.push(
      `La mayoría del valor llega por ${mejorOrigen.etiqueta.toLowerCase()} (${formatearMonedaCompacta(
        mejorOrigen.valor,
      )} históricos).`,
    )
  if (porRecuperar && porRecuperar.cantidad > 0)
    partes.push(
      `Hay ${porRecuperar.cantidad} ${
        porRecuperar.cantidad === 1 ? 'cliente' : 'clientes'
      } por recuperar que ya dejaron ${formatearMonedaCompacta(porRecuperar.valor)}.`,
    )
  return partes.join(' ') || 'Todavía no hay suficientes clientes para sacar conclusiones.'
}

export function lecturaPerdidas(filas: FilaPerdida[], p: Periodo) {
  if (filas.length === 0) return `No se perdió ninguna experiencia ${p.frase}.`
  // La conclusión nunca se cuelga del cajón de sastre.
  const primera = filas.find((f) => f.clave !== OTROS) ?? filas[0]
  return `La razón más repetida ${p.frase} es «${primera.etiqueta.toLowerCase()}»: ${
    primera.cantidad
  } de ${filas.reduce((s, f) => s + f.cantidad, 0)} casos, por ${formatearMonedaCompacta(
    primera.valor,
  )} que no entraron.`
}
