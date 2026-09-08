import type { ReactNode } from 'react'
import clsx from 'clsx'

interface TarjetaProps {
  children: ReactNode
  className?: string
  /** Variante oscura para bloques destacados (fondo verde bosque). */
  tono?: 'clara' | 'oscura'
}

export function Tarjeta({ children, className, tono = 'clara' }: TarjetaProps) {
  return (
    <section
      className={clsx(
        // min-w-0: la tarjeta casi siempre es hija de un grid, y sin esto su
        // contenido puede ensanchar la columna y sacar scroll horizontal.
        'min-w-0 rounded-xl border shadow-suave',
        tono === 'clara'
          ? 'border-crema-300/70 bg-white'
          : 'border-bosque-700 bg-bosque-800 text-crema-100',
        className,
      )}
    >
      {children}
    </section>
  )
}

interface CabeceraTarjetaProps {
  titulo: string
  descripcion?: string
  acciones?: ReactNode
  icono?: ReactNode
  className?: string
}

export function CabeceraTarjeta({
  titulo,
  descripcion,
  acciones,
  icono,
  className,
}: CabeceraTarjetaProps) {
  return (
    <header
      className={clsx(
        'flex flex-wrap items-start justify-between gap-3 border-b border-crema-200 px-4 py-4 sm:px-5',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {icono ? (
          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-bosque-50 text-bosque-500">
            {icono}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="font-display text-xl leading-tight text-bosque-800">{titulo}</h2>
          {descripcion ? (
            <p className="mt-0.5 text-xs text-carbon/55">{descripcion}</p>
          ) : null}
        </div>
      </div>
      {acciones ? <div className="flex flex-wrap items-center gap-2">{acciones}</div> : null}
    </header>
  )
}

export function CuerpoTarjeta({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={clsx('px-4 py-4 sm:px-5', className)}>{children}</div>
}
