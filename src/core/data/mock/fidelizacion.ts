import type { Beneficio, MembresiaFidelidad, MovimientoPuntos } from '@/core/types'

export const membresias: MembresiaFidelidad[] = [
  { id: 'mem-01', clienteId: 'cli-013', nivel: 'saman', puntos: 14820, puntosVigentesHasta: '2027-06-30', visitasAno: 9, ingresoAcumulado: 71950000, desde: '2021-11-30' },
  { id: 'mem-02', clienteId: 'cli-001', nivel: 'ceiba', puntos: 9640, puntosVigentesHasta: '2027-06-30', visitasAno: 7, ingresoAcumulado: 96400000, desde: '2022-04-15' },
  { id: 'mem-03', clienteId: 'cli-007', nivel: 'guadua', puntos: 4275, puntosVigentesHasta: '2027-06-30', visitasAno: 4, ingresoAcumulado: 42750000, desde: '2023-08-01' },
  { id: 'mem-04', clienteId: 'cli-003', nivel: 'guadua', puntos: 2890, puntosVigentesHasta: '2027-06-30', visitasAno: 2, ingresoAcumulado: 28900000, desde: '2024-11-08' },
  { id: 'mem-05', clienteId: 'cli-009', nivel: 'semilla', puntos: 1860, puntosVigentesHasta: '2027-06-30', visitasAno: 3, ingresoAcumulado: 18600000, desde: '2025-02-27' },
  { id: 'mem-06', clienteId: 'cli-010', nivel: 'semilla', puntos: 1240, puntosVigentesHasta: '2026-12-31', visitasAno: 0, ingresoAcumulado: 12400000, desde: '2024-01-09' },
]

export const beneficios: Beneficio[] = [
  { id: 'ben-01', nombre: 'Copa de bienvenida', descripcion: 'Espumoso de la casa para la mesa completa.', nivelMinimo: 'semilla', costoPuntos: 0, activo: true },
  { id: 'ben-02', nombre: 'Postre de la casa', descripcion: 'Postre de temporada de cortesía en fechas especiales.', nivelMinimo: 'semilla', costoPuntos: 400, activo: true },
  { id: 'ben-03', nombre: 'Mesa preferencial', descripcion: 'Reserva garantizada en el jardín con 24 horas de aviso.', nivelMinimo: 'guadua', costoPuntos: 800, activo: true },
  { id: 'ben-04', nombre: 'Cata guiada para dos', descripcion: 'Recorrido por la bodega con el sommelier.', nivelMinimo: 'ceiba', costoPuntos: 2500, activo: true },
  { id: 'ben-05', nombre: 'Cena de aniversario', descripcion: 'Menú de cinco tiempos para dos personas en su aniversario.', nivelMinimo: 'saman', costoPuntos: 6000, activo: true },
]

export const movimientosPuntos: MovimientoPuntos[] = [
  { id: 'mov-01', clienteId: 'cli-013', tipo: 'acumulacion', puntos: 1180, concepto: 'Almuerzo familiar Grajales', fecha: '2026-08-29', referenciaVentaId: 'vta-0804' },
  { id: 'mov-02', clienteId: 'cli-013', tipo: 'redencion', puntos: -6000, concepto: 'Cena de aniversario nivel Samán', fecha: '2026-08-29' },
  { id: 'mov-03', clienteId: 'cli-001', tipo: 'acumulacion', puntos: 360, concepto: 'Degustación menú de temporada', fecha: '2026-08-22', referenciaVentaId: 'vta-0803' },
  { id: 'mov-04', clienteId: 'cli-007', tipo: 'acumulacion', puntos: 290, concepto: 'Cena previa al aniversario', fecha: '2026-08-30', referenciaVentaId: 'vta-0805' },
  { id: 'mov-05', clienteId: 'cli-009', tipo: 'cortesia', puntos: 500, concepto: 'Reconocimiento por referido', fecha: '2026-07-19' },
]

export const membresiaPorCliente = (clienteId: string) =>
  membresias.find((m) => m.clienteId === clienteId)
