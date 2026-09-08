import type { ReactNode } from 'react'
import clsx from 'clsx'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

interface IndicadorProps {
  etiqueta: string
  valor: string
  detalle?: string
  variacion?: number
  icono?: ReactNode
  /** Destaca la tarjeta con el fondo verde de la marca. */
  destacado?: boolean
}

/** Tarjeta de indicador (KPI) del dashboard. */
export function Indicador({
  etiqueta,
  valor,
  detalle,
  variacion,
  icono,
  destacado = false,
}: IndicadorProps) {
  const positiva = (variacion ?? 0) >= 0

  return (
    <article
      className={clsx(
        'group relative overflow-hidden rounded-xl border p-5 shadow-suave transition-shadow hover:shadow-elevada',
        destacado
          ? 'border-bosque-700 bg-bosque-800 text-crema-100'
          : 'border-crema-300/70 bg-white',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={clsx(
            'text-[11.5px] font-medium uppercase tracking-marca',
            destacado ? 'text-laton-300' : 'text-bosque-400',
          )}
        >
          {etiqueta}
        </p>
        {icono ? (
          <span
            className={clsx(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
              destacado ? 'bg-bosque-700 text-laton-300' : 'bg-crema-100 text-bosque-500',
            )}
          >
            {icono}
          </span>
        ) : null}
      </div>

      <p
        className={clsx(
          'mt-3 font-display text-3xl leading-none tracking-tight',
          destacado ? 'text-crema-50' : 'text-bosque-800',
        )}
      >
        {valor}
      </p>

      <div className="mt-2 flex items-center gap-2">
        {variacion !== undefined ? (
          <span
            className={clsx(
              'inline-flex items-center gap-0.5 text-[12.5px] font-medium',
              positiva
                ? destacado
                  ? 'text-emerald-300'
                  : 'text-emerald-600'
                : destacado
                  ? 'text-rose-300'
                  : 'text-rose-600',
            )}
          >
            {positiva ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(variacion).toFixed(1).replace('.', ',')} %
          </span>
        ) : null}
        {detalle ? (
          <span className={clsx('text-[12.5px]', destacado ? 'text-crema-200/70' : 'text-carbon/50')}>
            {detalle}
          </span>
        ) : null}
      </div>

      {/* Filete dorado de marca */}
      <span className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-laton-400/70 via-laton-300/20 to-transparent" />
    </article>
  )
}
