const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const numero = new Intl.NumberFormat('es-CO')

export const formatearMoneda = (valor: number) => cop.format(valor)

/** Cifras compactas para tarjetas de indicadores: $ 128,4 M */
export function formatearMonedaCompacta(valor: number) {
  if (Math.abs(valor) >= 1_000_000_000) return `$ ${(valor / 1_000_000_000).toFixed(1).replace('.', ',')} MM`
  if (Math.abs(valor) >= 1_000_000) return `$ ${(valor / 1_000_000).toFixed(1).replace('.', ',')} M`
  if (Math.abs(valor) >= 1_000) return `$ ${(valor / 1_000).toFixed(0)} K`
  return cop.format(valor)
}

export const formatearNumero = (valor: number) => numero.format(valor)

export const formatearPorcentaje = (valor: number, decimales = 0) =>
  `${valor.toFixed(decimales).replace('.', ',')} %`

export function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}
