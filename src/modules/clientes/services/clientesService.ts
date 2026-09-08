import type { CategoriaCliente, Cliente, OrigenCliente, Usuario } from '@/core/types'
import { esAbierta } from '@/core/types'
import type { TonoEtiqueta } from '@/ui'
import {
  clientesRepo,
  experienciasRepo,
  fidelizacionRepo,
  seguimientosRepo,
  ventasRepo,
} from '@/core/data/repositories'
import { nombreCompleto } from '@/core/utils/cliente'
import { etiquetaEstadoExperiencia } from '@/core/utils/etiquetas'
import { HOY_DEMO } from '@/core/utils/fecha'
import { normalizarTexto } from '@/core/utils/normalizar'

/** Fecha de referencia del prototipo (coincide con la del dashboard). */
export const HOY = HOY_DEMO

export const TONO_CATEGORIA: Record<CategoriaCliente, TonoEtiqueta> = {
  nuevo: 'contorno',
  frecuente: 'bosque',
  vip: 'laton',
  ocasional: 'neutro',
  por_recuperar: 'alerta',
}

export const ORDEN_CATEGORIAS: CategoriaCliente[] = [
  'vip',
  'frecuente',
  'ocasional',
  'nuevo',
  'por_recuperar',
]

export interface FiltrosClientes {
  texto: string
  categoria: CategoriaCliente | 'todas'
  comercialId: string | 'todos'
  origen: OrigenCliente | 'todos'
  ciudad: string | 'todas'
  soloAutorizados: boolean
}

export const FILTROS_INICIALES: FiltrosClientes = {
  texto: '',
  categoria: 'todas',
  comercialId: 'todos',
  origen: 'todos',
  ciudad: 'todas',
  soloAutorizados: false,
}

export type OrdenClientes = 'recientes' | 'nombre' | 'valor' | 'visita'

/** Aplica búsqueda y filtros sobre la cartera visible del usuario. */
export function filtrarClientes(
  usuario: Usuario,
  filtros: FiltrosClientes,
  orden: OrdenClientes = 'recientes',
): Cliente[] {
  const visibles = clientesRepo.listarVisibles(usuario)
  const buscados = clientesRepo.buscar(filtros.texto, visibles)

  const filtrados = buscados.filter((c) => {
    if (filtros.categoria !== 'todas' && c.categoria !== filtros.categoria) return false
    if (filtros.comercialId !== 'todos' && c.comercialId !== filtros.comercialId) return false
    if (filtros.origen !== 'todos' && c.origen !== filtros.origen) return false
    if (filtros.ciudad !== 'todas' && c.ciudad !== filtros.ciudad) return false
    if (filtros.soloAutorizados && !c.autorizaComunicaciones) return false
    return true
  })

  const ordenados = [...filtrados]
  switch (orden) {
    case 'nombre':
      ordenados.sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), 'es'))
      break
    case 'valor':
      ordenados.sort((a, b) => b.valorHistorico - a.valorHistorico)
      break
    case 'visita':
      ordenados.sort((a, b) => (b.ultimaVisita ?? '').localeCompare(a.ultimaVisita ?? ''))
      break
    default:
      ordenados.sort((a, b) => b.fechaRegistro.localeCompare(a.fechaRegistro))
  }
  return ordenados
}

export function conteosPorCategoria(clientes: Cliente[]) {
  const base: Record<string, number> = { todas: clientes.length }
  for (const c of clientes) base[c.categoria] = (base[c.categoria] ?? 0) + 1
  return base
}

export const ciudadesDe = (clientes: Cliente[]) =>
  [...new Set(clientes.map((c) => c.ciudad))].sort((a, b) => a.localeCompare(b, 'es'))

export const hayFiltrosActivos = (f: FiltrosClientes) =>
  f.texto.trim() !== '' ||
  f.categoria !== 'todas' ||
  f.comercialId !== 'todos' ||
  f.origen !== 'todos' ||
  f.ciudad !== 'todas' ||
  f.soloAutorizados

// ────────────────────────────────────────────────────────────────────────────
// Ficha 360
// ────────────────────────────────────────────────────────────────────────────

export type TipoActividad =
  | 'registro'
  | 'experiencia'
  | 'seguimiento'
  | 'venta'
  | 'asignacion'
  | 'duplicado'

export interface Actividad {
  id: string
  tipo: TipoActividad
  fecha: string
  titulo: string
  detalle?: string
  comercialId?: string
  valor?: number
}

/** Reúne todo lo que le ha pasado a un cliente en una sola línea de tiempo. */
export function actividadReciente(clienteId: string): Actividad[] {
  const cliente = clientesRepo.obtener(clienteId)
  const actividades: Actividad[] = []

  for (const e of experienciasRepo.deCliente(clienteId)) {
    actividades.push({
      id: `act-x-${e.id}`,
      tipo: 'experiencia',
      fecha: e.actualizadoEn,
      titulo: e.titulo,
      detalle:
        e.estado === 'perdido'
          ? `Perdida · ${e.motivoPerdida ?? 'sin motivo registrado'}`
          : `${etiquetaEstadoExperiencia[e.estado]} · ${e.numeroPersonas} personas`,
      comercialId: e.comercialId,
      valor: e.valorFinal ?? e.valorCotizado ?? e.presupuesto,
    })
  }

  for (const s of seguimientosRepo.listar().filter((x) => x.clienteId === clienteId)) {
    actividades.push({
      id: `act-s-${s.id}`,
      tipo: 'seguimiento',
      fecha: s.fecha,
      titulo: s.asunto,
      detalle: s.detalle,
      comercialId: s.comercialId,
    })
  }

  for (const v of ventasRepo.listar().filter((x) => x.clienteId === clienteId)) {
    actividades.push({
      id: `act-v-${v.id}`,
      tipo: 'venta',
      fecha: v.fecha,
      titulo: v.descripcion,
      detalle: 'Venta registrada',
      comercialId: v.comercialId,
      valor: v.monto,
    })
  }

  for (const a of clientesRepo.historialDeCliente(clienteId)) {
    actividades.push({
      id: `act-a-${a.id}`,
      tipo: 'asignacion',
      fecha: a.fecha,
      titulo: 'Reasignación de responsable comercial',
      detalle: a.motivo,
      comercialId: a.comercialNuevoId,
    })
  }

  for (const i of clientesRepo.intentosDeCliente(clienteId)) {
    actividades.push({
      id: `act-d-${i.id}`,
      tipo: 'duplicado',
      fecha: i.fecha.slice(0, 10),
      titulo: 'Intento de registro duplicado',
      detalle: `Detectado por ${i.criterio === 'telefono' ? 'teléfono' : 'correo'}`,
      comercialId: i.comercialSolicitanteId,
    })
  }

  if (cliente) {
    actividades.push({
      id: 'act-registro',
      tipo: 'registro',
      fecha: cliente.fechaRegistro,
      titulo: 'Cliente registrado en el CRM',
      detalle: `Origen: ${cliente.origen.replace(/_/g, ' ')}`,
      comercialId: cliente.creadoPor,
    })
  }

  return actividades.sort((a, b) => b.fecha.localeCompare(a.fecha))
}

/** Todo lo que necesita la ficha 360 de un cliente. */
export function expediente(clienteId: string) {
  const experiencias = experienciasRepo.deCliente(clienteId)

  const seguimientos = seguimientosRepo
    .listar()
    .filter((s) => s.clienteId === clienteId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))

  const ventas = ventasRepo
    .listar()
    .filter((v) => v.clienteId === clienteId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))

  const fechasEspeciales = seguimientosRepo
    .fechasEspeciales()
    .filter((f) => f.clienteId === clienteId)

  const abiertas = experiencias.filter((e) => esAbierta(e.estado))

  return {
    experiencias,
    experienciasAbiertas: abiertas,
    experienciasRealizadas: experiencias.filter((e) => e.estado === 'realizado'),
    experienciasConfirmadas: experiencias.filter((e) => e.estado === 'confirmado'),
    seguimientos,
    ventas,
    fechasEspeciales,
    membresia: fidelizacionRepo.membresias().find((m) => m.clienteId === clienteId),
    actividad: actividadReciente(clienteId),
    totalVentas: ventas.reduce((s, v) => s + v.monto - v.descuento, 0),
    valorEnCurso: abiertas.reduce(
      (s, e) => s + (e.valorCotizado ?? e.presupuesto ?? 0),
      0,
    ),
  }
}

/** Días transcurridos desde la última visita, para la ficha y la lista. */
export function diasSinVisitar(cliente: Cliente): number | null {
  if (!cliente.ultimaVisita) return null
  return Math.round(
    (new Date(HOY + 'T00:00:00').getTime() -
      new Date(cliente.ultimaVisita + 'T00:00:00').getTime()) /
      86400000,
  )
}

/** Coincidencia textual usada para resaltar por qué apareció un resultado. */
export const coincideEmpresa = (cliente: Cliente, texto: string) =>
  Boolean(texto) && normalizarTexto(cliente.empresa ?? '').includes(normalizarTexto(texto))
