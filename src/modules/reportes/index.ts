/**
 * API pública del módulo Reportes.
 * Otros módulos solo pueden importar desde aquí.
 */
export {
  periodos,
  periodoPorClave,
  resumenPeriodo,
  ingresosPorCategoria,
  desempenoEquipo,
  motivosDePerdida,
} from './services/reportesService'
export type { Periodo, ClavePeriodo, Fila, FilaEquipo, FilaPerdida } from './services/reportesService'
