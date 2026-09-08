import type { Cliente } from '@/core/types'

export const nombreCompleto = (c: Cliente) => `${c.nombres} ${c.apellidos}`.trim()

/** Monograma para el avatar: inicial del nombre y del primer apellido. */
export const inicialesDe = (c: Cliente) =>
  `${c.nombres.trim()[0] ?? ''}${c.apellidos.trim()[0] ?? ''}`.toUpperCase()

/** Un cliente es corporativo cuando llega representando a una empresa. */
export const esCorporativo = (c: Cliente) => Boolean(c.empresa)
