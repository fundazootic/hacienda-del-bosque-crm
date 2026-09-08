import { useId, useState } from 'react'
import clsx from 'clsx'
import { formatearMoneda } from '@/core/utils/format'

interface Punto {
  periodo: string
  mes: string
  total: number
  actual: boolean
}

/**
 * Tendencia de ingresos por mes.
 *
 * Se dibuja a mano en SVG en lugar de traer una librería de gráficas: son
 * barras verticales con etiqueta y globo al pasar el cursor, y la librería que
 * había antes pesaba 366 kB —más que todo el resto del CRM junto— para esto.
 * Sin librería, además, no hay animación que se quede a medias cuando la
 * pestaña está en segundo plano.
 */
export function TendenciaVentas({
  datos,
  oscuro = false,
  className = 'h-24',
}: {
  datos: Punto[]
  oscuro?: boolean
  /** Altura del bloque: el tablero la quiere discreta, los reportes amplia. */
  className?: string
}) {
  const [activo, setActivo] = useState<string | null>(null)
  const id = useId()

  const maximo = Math.max(...datos.map((d) => d.total), 1)
  const punto = datos.find((d) => d.periodo === activo)

  return (
    <div className={clsx('relative w-full', className)}>
      {/* Globo con la cifra del mes señalado */}
      {punto ? (
        <div
          className={clsx(
            'pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-lg border px-3 py-1.5 text-center shadow-elevada',
            oscuro ? 'border-bosque-600 bg-bosque-900' : 'border-crema-300 bg-white',
          )}
        >
          <p
            className={clsx(
              'text-[11.5px] uppercase tracking-marca',
              oscuro ? 'text-laton-300/80' : 'text-bosque-400',
            )}
          >
            {punto.mes}
          </p>
          <p
            className={clsx(
              'font-display text-base leading-tight',
              oscuro ? 'text-crema-50' : 'text-bosque-800',
            )}
          >
            {formatearMoneda(punto.total)}
          </p>
        </div>
      ) : null}

      <ul className="flex h-full items-end gap-1.5" onMouseLeave={() => setActivo(null)}>
        {datos.map((d) => {
          const alto = Math.max(2, (d.total / maximo) * 100)
          const señalado = d.periodo === activo

          return (
            <li
              key={d.periodo}
              className="flex h-full flex-1 flex-col justify-end gap-1.5"
              onMouseEnter={() => setActivo(d.periodo)}
            >
              <div
                className="flex flex-1 items-end"
                role="img"
                aria-labelledby={`${id}-${d.periodo}`}
              >
                <div
                  className={clsx(
                    'w-full rounded-t transition-[height,opacity] duration-500',
                    d.actual
                      ? 'bg-laton-400'
                      : oscuro
                        ? 'bg-bosque-500'
                        : 'bg-bosque-300',
                    señalado ? 'opacity-100' : 'opacity-90',
                  )}
                  style={{ height: `${alto}%` }}
                />
              </div>
              <p
                id={`${id}-${d.periodo}`}
                className={clsx(
                  'text-center text-[11.5px] transition-colors',
                  señalado
                    ? oscuro
                      ? 'text-crema-50'
                      : 'text-bosque-700'
                    : oscuro
                      ? 'text-crema-200/50'
                      : 'text-carbon/45',
                )}
              >
                {d.mes}
                <span className="sr-only"> · {formatearMoneda(d.total)}</span>
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
