import type { MembresiaFidelidad, NivelFidelidad } from '@/core/types'
import {
  clientesRepo,
  fidelizacionRepo,
  NIVELES,
  nivelPorClave,
  nivelQueCorresponde,
} from '@/core/data/repositories'
import { formatearNumero } from '@/core/utils/format'

/** Colores de cada nivel: se usan igual en toda la pantalla. */
export const COLOR_NIVEL: Record<NivelFidelidad, { fondo: string; texto: string; punto: string }> = {
  semilla: { fondo: 'bg-crema-100', texto: 'text-carbon/70', punto: 'bg-crema-300' },
  guadua: { fondo: 'bg-bosque-50', texto: 'text-bosque-600', punto: 'bg-bosque-300' },
  ceiba: { fondo: 'bg-bosque-100', texto: 'text-bosque-700', punto: 'bg-bosque-500' },
  saman: { fondo: 'bg-laton-100', texto: 'text-laton-700', punto: 'bg-laton-400' },
}

export interface MiembroPrograma {
  membresia: MembresiaFidelidad
  nombre: string
  nivelActual: NivelFidelidad
  /** Nivel que le corresponde hoy por sus visitas o su gasto. */
  nivelQueLeCorresponde: NivelFidelidad
  /** true cuando ya cumplió los requisitos del siguiente nivel. */
  listoParaSubir: boolean
  siguiente?: (typeof NIVELES)[number]
  /** Qué le falta, en palabras. */
  falta?: string
  avance: number
}

/** Lista de clientes del programa, ya interpretada para mostrar. */
export function miembros(): MiembroPrograma[] {
  return fidelizacionRepo.membresias().map((membresia) => {
    const indiceActual = NIVELES.findIndex((n) => n.nivel === membresia.nivel)
    const siguiente = NIVELES[indiceActual + 1]
    const corresponde = nivelQueCorresponde(membresia)

    let falta: string | undefined
    let avance = 100

    if (siguiente) {
      const faltanVisitas = Math.max(0, siguiente.visitas - membresia.visitasAno)
      const faltaGasto = Math.max(0, siguiente.gasto - membresia.ingresoAcumulado)

      avance = Math.min(
        100,
        Math.max(
          siguiente.visitas > 0 ? (membresia.visitasAno / siguiente.visitas) * 100 : 0,
          siguiente.gasto > 0 ? (membresia.ingresoAcumulado / siguiente.gasto) * 100 : 0,
        ),
      )

      falta =
        faltanVisitas === 0 || faltaGasto === 0
          ? `Ya cumple para ser ${siguiente.nombre}`
          : `Le faltan ${faltanVisitas} ${faltanVisitas === 1 ? 'visita' : 'visitas'} para ser ${siguiente.nombre}`
    }

    return {
      membresia,
      nombre: clientesRepo.nombreDe(membresia.clienteId),
      nivelActual: membresia.nivel,
      nivelQueLeCorresponde: corresponde,
      listoParaSubir: corresponde !== membresia.nivel,
      siguiente,
      falta,
      avance,
    }
  })
}

/** Cifras de cabecera, en lenguaje llano. */
export function resumenPrograma() {
  const lista = miembros()
  const puntos = lista.reduce((s, m) => s + m.membresia.puntos, 0)

  return {
    clientes: lista.length,
    puntos,
    puntosTexto: `${formatearNumero(puntos)} puntos sin usar`,
    listosParaSubir: lista.filter((m) => m.listoParaSubir).length,
    porNivel: NIVELES.map((n) => ({
      ...n,
      cantidad: lista.filter((m) => m.nivelActual === n.nivel).length,
    })),
    beneficiosDisponibles: fidelizacionRepo.beneficios().length,
  }
}

export const nombreNivel = (nivel: NivelFidelidad) => nivelPorClave(nivel).nombre
