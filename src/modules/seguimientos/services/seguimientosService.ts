import type { ResultadoSeguimiento, Seguimiento, TipoSeguimiento, Usuario } from '@/core/types'
import type { TonoEtiqueta } from '@/ui'
import { clientesRepo, seguimientosRepo, estaAbierto, estaVencido } from '@/core/data/repositories'
import { normalizarTexto } from '@/core/utils/normalizar'
import { HOY_DEMO } from '@/core/utils/fecha'

export const HOY = HOY_DEMO

export const TONO_RESULTADO: Record<ResultadoSeguimiento, TonoEtiqueta> = {
  pendiente: 'alerta',
  exitoso: 'exito',
  sin_respuesta: 'peligro',
  reprogramado: 'laton',
  cerrado: 'neutro',
}

export const etiquetaResultado: Record<ResultadoSeguimiento, string> = {
  pendiente: 'Pendiente',
  exitoso: 'Exitoso',
  sin_respuesta: 'Sin respuesta',
  reprogramado: 'Reprogramado',
  cerrado: 'Cerrado',
}

export const TIPOS_SEGUIMIENTO: TipoSeguimiento[] = [
  'llamada',
  'correo',
  'visita',
  'reunion',
  'degustacion',
  'nota',
]

export const RESULTADOS: ResultadoSeguimiento[] = [
  'exitoso',
  'sin_respuesta',
  'reprogramado',
  'cerrado',
]

export interface FiltrosSeguimientos {
  texto: string
  tipo: TipoSeguimiento | 'todos'
  resultado: ResultadoSeguimiento | 'todos'
  comercialId: string | 'todos'
}

export const FILTROS_INICIALES: FiltrosSeguimientos = {
  texto: '',
  tipo: 'todos',
  resultado: 'todos',
  comercialId: 'todos',
}

export const hayFiltros = (f: FiltrosSeguimientos) =>
  f.texto.trim() !== '' ||
  f.tipo !== 'todos' ||
  f.resultado !== 'todos' ||
  f.comercialId !== 'todos'

export function filtrarSeguimientos(
  usuario: Usuario,
  filtros: FiltrosSeguimientos,
): Seguimiento[] {
  const texto = normalizarTexto(filtros.texto)

  return seguimientosRepo
    .listarVisibles(usuario)
    .filter((s) => {
      if (filtros.tipo !== 'todos' && s.tipo !== filtros.tipo) return false
      if (filtros.resultado !== 'todos' && s.resultado !== filtros.resultado) return false
      if (filtros.comercialId !== 'todos' && s.comercialId !== filtros.comercialId) return false
      if (!texto) return true
      return (
        normalizarTexto(s.asunto).includes(texto) ||
        normalizarTexto(s.detalle).includes(texto) ||
        normalizarTexto(clientesRepo.nombreDe(s.clienteId)).includes(texto)
      )
    })
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
}

/** Grupos de la agenda, del más urgente al más lejano. */
export interface GrupoAgenda {
  clave: string
  etiqueta: string
  descripcion: string
  seguimientos: Seguimiento[]
}

export function agruparAgenda(pendientes: Seguimiento[]): GrupoAgenda[] {
  const limiteSemana = sumarDias(HOY, 7)

  const grupos: GrupoAgenda[] = [
    { clave: 'vencidos', etiqueta: 'Vencidos', descripcion: 'La fecha comprometida ya pasó', seguimientos: [] },
    { clave: 'hoy', etiqueta: 'Hoy', descripcion: 'Comprometidos para hoy', seguimientos: [] },
    { clave: 'semana', etiqueta: 'Próximos 7 días', descripcion: 'Lo que viene esta semana', seguimientos: [] },
    { clave: 'despues', etiqueta: 'Más adelante', descripcion: 'Agendados a más de una semana', seguimientos: [] },
  ]

  for (const s of pendientes) {
    const fecha = s.fechaProximaAccion ?? ''
    if (fecha < HOY) grupos[0].seguimientos.push(s)
    else if (fecha === HOY) grupos[1].seguimientos.push(s)
    else if (fecha <= limiteSemana) grupos[2].seguimientos.push(s)
    else grupos[3].seguimientos.push(s)
  }

  return grupos.filter((g) => g.seguimientos.length > 0)
}

export function sumarDias(iso: string, dias: number) {
  const [a, m, d] = iso.split('-').map(Number)
  const fecha = new Date(a, m - 1, d + dias)
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

export const diasHasta = (iso: string) =>
  Math.round(
    (new Date(iso + 'T00:00:00').getTime() - new Date(HOY + 'T00:00:00').getTime()) / 86400000,
  )

/** Cifras de cabecera del módulo. */
export function resumenSeguimientos(usuario: Usuario) {
  const todos = seguimientosRepo.listarVisibles(usuario)
  const pendientes = todos.filter(estaAbierto)
  const vencidos = pendientes.filter(estaVencido)
  const hoy = pendientes.filter((s) => s.fechaProximaAccion === HOY)

  // Clientes de la cartera que no tienen ninguna gestión abierta
  const conGestion = new Set(pendientes.map((s) => s.clienteId))
  const sinGestion = clientesRepo
    .listarVisibles(usuario)
    .filter((c) => !conGestion.has(c.id) && c.categoria !== 'nuevo')

  return {
    total: todos.length,
    pendientes: pendientes.length,
    vencidos: vencidos.length,
    hoy: hoy.length,
    semana: pendientes.filter(
      (s) => (s.fechaProximaAccion ?? '') > HOY && (s.fechaProximaAccion ?? '') <= sumarDias(HOY, 7),
    ).length,
    sinGestion: sinGestion.length,
    registradosEsteMes: todos.filter((s) => s.fecha.startsWith(HOY.slice(0, 7))).length,
  }
}
