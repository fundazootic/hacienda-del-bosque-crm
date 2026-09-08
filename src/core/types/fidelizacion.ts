/** Niveles nombrados con los árboles de la hacienda. */
export type NivelFidelidad = 'semilla' | 'guadua' | 'ceiba' | 'saman'

export interface MembresiaFidelidad {
  id: string
  clienteId: string
  nivel: NivelFidelidad
  puntos: number
  puntosVigentesHasta: string
  visitasAno: number
  ingresoAcumulado: number
  desde: string
}

export interface MovimientoPuntos {
  id: string
  clienteId: string
  tipo: 'acumulacion' | 'redencion' | 'ajuste' | 'cortesia'
  puntos: number
  concepto: string
  fecha: string
  referenciaVentaId?: string
}

export interface Beneficio {
  id: string
  nombre: string
  descripcion: string
  nivelMinimo: NivelFidelidad
  costoPuntos: number
  activo: boolean
}
