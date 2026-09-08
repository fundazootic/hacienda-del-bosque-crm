import type { EstadoExperiencia, Experiencia, TipoExperiencia, Usuario } from '@/core/types'
import { esGanada, ETAPAS_EXPERIENCIA } from '@/core/types'
import type { TonoEtiqueta } from '@/ui'
import { experienciasRepo } from '@/core/data/repositories'
import { normalizarTexto } from '@/core/utils/normalizar'
import { HOY_DEMO } from '@/core/utils/fecha'

export const HOY = HOY_DEMO

/** Valor con el que se cuenta la experiencia según su etapa. */
export const valorDe = (e: Experiencia) => e.valorFinal ?? e.valorCotizado ?? e.presupuesto ?? 0

export const TONO_ESTADO: Record<EstadoExperiencia, TonoEtiqueta> = {
  nuevo: 'contorno',
  contactado: 'neutro',
  visita: 'neutro',
  cotizacion: 'bosque',
  negociacion: 'laton',
  confirmado: 'exito',
  realizado: 'neutro',
  perdido: 'peligro',
}

/** Color de la cinta superior de cada columna del tablero. */
export const COLOR_COLUMNA: Record<EstadoExperiencia, string> = {
  nuevo: 'bg-bosque-200',
  contactado: 'bg-bosque-300',
  visita: 'bg-bosque-400',
  cotizacion: 'bg-bosque-500',
  negociacion: 'bg-laton-400',
  confirmado: 'bg-emerald-500',
  realizado: 'bg-bosque-700',
  perdido: 'bg-terracota',
}

export const TIPOS_EXPERIENCIA: TipoExperiencia[] = [
  'cumpleanos',
  'aniversario',
  'matrimonio',
  'cena_romantica',
  'evento_empresarial',
  'evento_social',
  'celebracion_familiar',
  'reserva_grupo',
  'otro',
]

export interface FiltrosExperiencias {
  texto: string
  tipo: TipoExperiencia | 'todos'
  comercialId: string | 'todos'
  estado: EstadoExperiencia | 'todos'
  soloAbiertas: boolean
}

export const FILTROS_INICIALES: FiltrosExperiencias = {
  texto: '',
  tipo: 'todos',
  comercialId: 'todos',
  estado: 'todos',
  soloAbiertas: false,
}

export const hayFiltros = (f: FiltrosExperiencias) =>
  f.texto.trim() !== '' ||
  f.tipo !== 'todos' ||
  f.comercialId !== 'todos' ||
  f.estado !== 'todos' ||
  f.soloAbiertas

/** Aplica búsqueda y filtros sobre las experiencias visibles del usuario. */
export function filtrarExperiencias(
  usuario: Usuario,
  filtros: FiltrosExperiencias,
  nombreCliente: (id: string) => string,
): Experiencia[] {
  const texto = normalizarTexto(filtros.texto)

  return experienciasRepo
    .listarVisibles(usuario)
    .filter((e) => {
      if (filtros.tipo !== 'todos' && e.tipo !== filtros.tipo) return false
      if (filtros.comercialId !== 'todos' && e.comercialId !== filtros.comercialId) return false
      if (filtros.estado !== 'todos' && e.estado !== filtros.estado) return false
      if (filtros.soloAbiertas && (esGanada(e.estado) || e.estado === 'perdido')) return false
      if (!texto) return true
      return (
        normalizarTexto(e.titulo).includes(texto) ||
        normalizarTexto(e.codigo).includes(texto) ||
        normalizarTexto(nombreCliente(e.clienteId)).includes(texto)
      )
    })
    .sort(ordenarPorAgenda)
}

/**
 * Orden de trabajo: primero lo que viene (de lo más próximo a lo más lejano) y
 * después lo ya ocurrido, de lo más reciente hacia atrás.
 */
export function ordenarPorAgenda(a: Experiencia, b: Experiencia) {
  const fa = a.fechaTentativa ?? ''
  const fb = b.fechaTentativa ?? ''
  const futuraA = fa >= HOY
  const futuraB = fb >= HOY
  if (futuraA !== futuraB) return futuraA ? -1 : 1
  if (!fa || !fb) return fa ? -1 : 1
  return futuraA ? fa.localeCompare(fb) : fb.localeCompare(fa)
}

export interface ColumnaTablero {
  estado: EstadoExperiencia
  experiencias: Experiencia[]
  valor: number
}

/** Agrupa por etapa conservando el orden del pipeline. */
export function agruparPorEstado(experiencias: Experiencia[]): ColumnaTablero[] {
  return ETAPAS_EXPERIENCIA.map((estado) => {
    const items = experiencias.filter((e) => e.estado === estado)
    return {
      estado,
      experiencias: items,
      valor: items.reduce((s, e) => s + valorDe(e), 0),
    }
  })
}

/** Cifras de cabecera del módulo. */
export function resumenExperiencias(experiencias: Experiencia[]) {
  const abiertas = experiencias.filter((e) => !esGanada(e.estado) && e.estado !== 'perdido')
  const confirmadas = experiencias.filter((e) => e.estado === 'confirmado')
  const realizadas = experiencias.filter((e) => e.estado === 'realizado')
  const perdidas = experiencias.filter((e) => e.estado === 'perdido')
  const cerradas = confirmadas.length + realizadas.length + perdidas.length

  const agendadas = confirmadas.filter((e) => (e.fechaTentativa ?? '') >= HOY)

  return {
    total: experiencias.length,
    abiertas: abiertas.length,
    valorAbierto: abiertas.reduce((s, e) => s + valorDe(e), 0),
    confirmadas: confirmadas.length,
    valorConfirmado: confirmadas.reduce((s, e) => s + valorDe(e), 0),
    realizadas: realizadas.length,
    perdidas: perdidas.length,
    tasaCierre:
      cerradas > 0 ? ((confirmadas.length + realizadas.length) / cerradas) * 100 : 0,
    comensalesAgendados: agendadas.reduce((s, e) => s + e.numeroPersonas, 0),
    seguimientosVencidos: abiertas.filter(
      (e) => e.proximoSeguimiento && e.proximoSeguimiento < HOY,
    ).length,
  }
}

/** Motivos frecuentes de pérdida, para no obligar a redactar desde cero. */
export const MOTIVOS_PERDIDA = [
  'Precio por encima del presupuesto',
  'Eligió otro proveedor',
  'Aplazó la celebración',
  'Cambió de plan o de ciudad',
  'No hubo disponibilidad en la fecha',
  'Sin respuesta del cliente',
]
