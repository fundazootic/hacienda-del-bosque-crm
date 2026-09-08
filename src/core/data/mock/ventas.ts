import type { CategoriaVenta, EstadoPago, Venta } from '@/core/types'
import { usuarioPorId } from './usuarios'

/**
 * Constructor compacto: la comisión se calcula con el porcentaje pactado del
 * comercial (los internos no generan comisión variable en este prototipo).
 */
function v(
  id: string,
  fecha: string,
  clienteId: string,
  comercialId: string,
  categoria: CategoriaVenta,
  descripcion: string,
  monto: number,
  estadoPago: EstadoPago,
  experienciaId?: string,
  descuento = 0,
): Venta {
  const porcentaje = usuarioPorId(comercialId)?.comisionPorcentaje ?? 0
  return {
    id,
    codigo: `VTA-${id.slice(-4)}`,
    clienteId,
    comercialId,
    experienciaId,
    categoria,
    descripcion,
    fecha,
    monto,
    descuento,
    estadoPago,
    comisionPorcentaje: porcentaje,
    comisionValor: Math.round(((monto - descuento) * porcentaje) / 100),
    comisionLiquidada: fecha < '2026-08-01',
  }
}

export const ventas: Venta[] = [
  // Marzo 2026
  v('vta-0301', '2026-03-07', 'cli-002', 'u-004', 'evento', 'Convención comercial Manuelita', 46800000, 'pagado'),
  v('vta-0302', '2026-03-15', 'cli-013', 'u-003', 'restaurante', 'Almuerzo familiar Grajales', 5200000, 'pagado'),
  v('vta-0303', '2026-03-22', 'cli-009', 'u-005', 'experiencia', 'Cata de maridaje privada', 6800000, 'pagado'),
  v('vta-0304', '2026-03-29', 'cli-005', 'u-002', 'evento', 'Almuerzo directivo Cavasa', 9400000, 'pagado'),
  // Abril 2026
  v('vta-0401', '2026-04-05', 'cli-001', 'u-003', 'restaurante', 'Cena de temporada', 4300000, 'pagado'),
  v('vta-0402', '2026-04-12', 'cli-014', 'u-004', 'evento', 'Encuentro de líderes Comfandi', 33500000, 'pagado'),
  v('vta-0403', '2026-04-19', 'cli-007', 'u-006', 'experiencia', 'Brunch dominical familiar', 3900000, 'pagado', 'exp-016'),
  v('vta-0404', '2026-04-26', 'cli-011', 'u-002', 'evento', 'Taller de sostenibilidad', 18200000, 'pagado'),
  // Mayo 2026
  v('vta-0501', '2026-05-09', 'cli-013', 'u-003', 'evento', 'Celebración de grado', 21400000, 'pagado', 'exp-013'),
  v('vta-0502', '2026-05-17', 'cli-003', 'u-005', 'restaurante', 'Cena de cumpleaños', 6100000, 'pagado'),
  v('vta-0503', '2026-05-24', 'cli-002', 'u-004', 'evento', 'Reunión de gerencia regional', 28700000, 'pagado'),
  v('vta-0504', '2026-05-31', 'cli-001', 'u-003', 'bar', 'Coctelería de autor', 2800000, 'pagado'),
  // Junio 2026
  v('vta-0601', '2026-06-06', 'cli-011', 'u-002', 'evento', 'Foro ambiental del Valle', 15600000, 'pagado', 'exp-018'),
  v('vta-0602', '2026-06-14', 'cli-003', 'u-005', 'evento', 'Celebración empresarial Arboleda', 22800000, 'pagado', 'exp-022'),
  v('vta-0603', '2026-06-21', 'cli-007', 'u-006', 'restaurante', 'Almuerzo de aniversario', 5400000, 'pagado'),
  v('vta-0604', '2026-06-28', 'cli-014', 'u-004', 'evento', 'Jornada de integración', 26900000, 'pagado'),
  // Julio 2026
  v('vta-0701', '2026-07-04', 'cli-013', 'u-003', 'restaurante', 'Cena familiar mensual', 4700000, 'pagado'),
  v('vta-0702', '2026-07-11', 'cli-002', 'u-004', 'evento', 'Aniversario de fundación', 51200000, 'pagado', 'exp-014'),
  v('vta-0703', '2026-07-19', 'cli-009', 'u-005', 'experiencia', 'Cata privada de vinos', 7300000, 'pagado'),
  v('vta-0704', '2026-07-26', 'cli-005', 'u-002', 'evento', 'Almuerzo de junta directiva · julio', 12800000, 'pagado', 'exp-019'),
  // Agosto 2026
  v('vta-0801', '2026-08-08', 'cli-005', 'u-002', 'evento', 'Almuerzo de junta Cavasa', 6400000, 'pagado', 'exp-026'),
  v('vta-0802', '2026-08-15', 'cli-014', 'u-004', 'evento', 'Anticipo jornada de bienestar', 19450000, 'anticipo', 'exp-006'),
  v('vta-0803', '2026-08-22', 'cli-001', 'u-003', 'restaurante', 'Degustación menú de temporada', 3600000, 'pagado'),
  v('vta-0804', '2026-08-29', 'cli-013', 'u-003', 'evento', 'Almuerzo familiar Grajales', 11800000, 'pagado', 'exp-025'),
  v('vta-0805', '2026-08-30', 'cli-007', 'u-006', 'restaurante', 'Cena previa al aniversario', 2900000, 'pagado'),
  v('vta-0806', '2026-08-31', 'cli-002', 'u-004', 'evento', 'Anticipo encuentro de líderes', 15690000, 'anticipo', 'exp-004'),
  // Septiembre 2026 (mes en curso)
  v('vta-0901', '2026-09-01', 'cli-004', 'u-006', 'evento', 'Anticipo boda Domínguez · Vallejo', 28350000, 'anticipo', 'exp-002'),
  v('vta-0902', '2026-09-02', 'cli-003', 'u-005', 'evento', 'Anticipo cumpleaños 40', 7480000, 'anticipo', 'exp-011'),
  v('vta-0903', '2026-09-03', 'cli-007', 'u-006', 'evento', 'Anticipo aniversario Ospina', 4450000, 'anticipo', 'exp-012'),
  v('vta-0904', '2026-09-03', 'cli-013', 'u-003', 'restaurante', 'Cena de la colección de vinos', 3850000, 'pagado'),
]

export const ventaPorId = (id: string) => ventas.find((x) => x.id === id)
