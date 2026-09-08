import type { ReactNode } from 'react'
import clsx from 'clsx'

export type TonoIndicador = 'neutro' | 'atencion' | 'urgente' | 'laton'

const ACENTOS: Record<TonoIndicador, string> = {
  neutro: 'before:bg-bosque-300',
  atencion: 'before:bg-amber-400',
  urgente: 'before:bg-terracota',
  laton: 'before:bg-laton-400',
}

const ICONOS: Record<TonoIndicador, string> = {
  neutro: 'bg-crema-100 text-bosque-500',
  atencion: 'bg-amber-50 text-amber-600',
  urgente: 'bg-rose-50 text-terracota',
  laton: 'bg-laton-100 text-laton-700',
}

interface IndicadorCompactoProps {
  etiqueta: string
  valor: string
  detalle?: string
  icono?: ReactNode
  tono?: TonoIndicador
  /** Texto de la acción sugerida al pie de la tarjeta. */
  accion?: string
  onAccion?: () => void
}

/**
 * Indicador secundario en formato horizontal: ocupa poca altura y permite
 * leer varias señales de atención de un solo vistazo.
 */
export function IndicadorCompacto({
  etiqueta,
  valor,
  detalle,
  icono,
  tono = 'neutro',
  accion,
  onAccion,
}: IndicadorCompactoProps) {
  return (
    <article
      className={clsx(
        'relative overflow-hidden rounded-xl border border-crema-300/70 bg-white px-4 py-3.5 shadow-suave transition-shadow hover:shadow-elevada',
        'before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:content-[""]',
        ACENTOS[tono],
      )}
    >
      <div className="flex items-center gap-3">
        {icono ? (
          <span
            className={clsx(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
              ICONOS[tono],
            )}
          >
            {icono}
          </span>
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="text-[11.5px] uppercase tracking-marca text-bosque-400">{etiqueta}</p>
          <p className="mt-0.5 flex items-baseline gap-2">
            <span className="font-display text-2xl leading-none text-bosque-800">{valor}</span>
            {detalle ? (
              <span className="truncate text-[12.5px] text-carbon/50">{detalle}</span>
            ) : null}
          </p>
        </div>

        {accion ? (
          <button
            onClick={onAccion}
            className="shrink-0 text-[12.5px] font-medium text-bosque-500 underline-offset-4 transition-colors hover:text-bosque-700 hover:underline"
          >
            {accion}
          </button>
        ) : null}
      </div>
    </article>
  )
}
