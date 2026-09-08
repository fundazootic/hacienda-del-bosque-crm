export type CategoriaVenta =
  | 'evento'
  | 'restaurante'
  | 'experiencia'
  | 'bar'
  | 'otros'

export type EstadoPago = 'anticipo' | 'parcial' | 'pagado' | 'vencido'

export interface Venta {
  id: string
  codigo: string
  clienteId: string
  comercialId: string
  experienciaId?: string
  categoria: CategoriaVenta
  descripcion: string
  fecha: string
  monto: number
  descuento: number
  estadoPago: EstadoPago
  comisionPorcentaje: number
  comisionValor: number
  comisionLiquidada: boolean
}

/** Datos que llegan del formulario: el resto lo calcula el repositorio. */
export type DatosVenta = Omit<
  Venta,
  'id' | 'codigo' | 'comisionPorcentaje' | 'comisionValor' | 'comisionLiquidada' | 'descuento'
> & { descuento?: number }
