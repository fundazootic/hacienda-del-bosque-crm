import { EstadoVacio } from '@/ui'
import { formatearMoneda, formatearPorcentaje } from '@/core/utils/format'
import type { FilaPerdida } from '../services/reportesService'

/**
 * Por qué se pierden las experiencias.
 * Cada motivo trae dos ejemplos textuales: la cifra dice cuánto pesa, la frase
 * del comercial dice qué pasó de verdad.
 */
export function InformePerdidas({ filas }: { filas: FilaPerdida[] }) {
  if (filas.length === 0) {
    return (
      <EstadoVacio
        titulo="Ninguna pérdida"
        mensaje="No se marcó ninguna experiencia como perdida en este período."
      />
    )
  }

  return (
    <ul className="divide-y divide-crema-200">
      {filas.map((f) => (
        <li key={f.clave} className="px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-sm font-medium text-bosque-800">{f.etiqueta}</p>
            <p className="text-[12.5px] text-carbon/55">
              {f.cantidad} {f.cantidad === 1 ? 'caso' : 'casos'} ·{' '}
              <span className="text-terracota">{formatearMoneda(f.valor)} que no entraron</span>
            </p>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-crema-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-terracota to-terracota/50 transition-all duration-700"
              style={{ width: `${Math.max(3, f.proporcion)}%` }}
            />
          </div>
          <p className="mt-1 text-[11.5px] text-carbon/45">
            {formatearPorcentaje(f.proporcion)} de todo lo perdido
          </p>

          {f.ejemplos.length > 0 ? (
            <ul className="mt-2.5 space-y-1">
              {f.ejemplos.map((e, i) => (
                <li
                  key={i}
                  className="border-l-2 border-crema-300 pl-3 text-[12.5px] italic leading-relaxed text-carbon/60"
                >
                  «{e}»
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
