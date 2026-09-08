import clsx from 'clsx'
import { EstadoVacio } from '@/ui'
import { formatearMoneda, formatearNumero, formatearPorcentaje } from '@/core/utils/format'
import type { Fila } from '../services/reportesService'

/**
 * Cuerpo común de los informes: una fila por concepto, con barra proporcional.
 * Se prefirió la barra horizontal a la torta: se lee de un vistazo y se puede
 * imprimir en blanco y negro sin perder el orden.
 */
export function FilasInforme({
  filas,
  unidad = ['operación', 'operaciones'],
  vacio = 'Sin datos en este período.',
}: {
  filas: Fila[]
  /** Cómo se llama lo que se cuenta, en singular y plural. */
  unidad?: [string, string]
  vacio?: string
}) {
  if (filas.length === 0) {
    return <EstadoVacio titulo="Nada que mostrar" mensaje={vacio} />
  }

  return (
    <ul className="divide-y divide-crema-200">
      {filas.map((f, indice) => (
        <li key={f.clave} className="px-4 py-3.5 sm:px-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-sm font-medium text-bosque-800">
              {indice === 0 ? (
                <span className="mr-1.5 text-laton-500" aria-hidden>
                  ★
                </span>
              ) : null}
              {f.etiqueta}
            </p>
            <p className="font-display text-lg leading-none text-bosque-800">
              {formatearMoneda(f.valor)}
            </p>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-crema-200">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-700',
                  indice === 0
                    ? 'bg-gradient-to-r from-laton-500 to-laton-300'
                    : 'bg-gradient-to-r from-bosque-500 to-bosque-400',
                )}
                style={{ width: `${Math.max(2, f.proporcion)}%` }}
              />
            </div>
            <p className="w-32 shrink-0 text-right text-[12.5px] text-carbon/55">
              {formatearPorcentaje(f.proporcion)} · {formatearNumero(f.cantidad)}{' '}
              {f.cantidad === 1 ? unidad[0] : unidad[1]}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Frase de conclusión que acompaña a cada informe. */
export function Lectura({ children }: { children: string }) {
  return (
    <p className="border-b border-crema-200 bg-crema-50 px-4 py-3 text-sm leading-relaxed text-bosque-700 sm:px-5">
      {children}
    </p>
  )
}
