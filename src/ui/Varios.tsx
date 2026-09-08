import type { ReactNode } from 'react'
import clsx from 'clsx'
import { Leaf } from 'lucide-react'

/** Iniciales del usuario o cliente, con acabado de sello. */
export function Avatar({
  iniciales,
  tamano = 'md',
  tono = 'bosque',
}: {
  iniciales: string
  tamano?: 'sm' | 'md' | 'lg'
  tono?: 'bosque' | 'laton' | 'claro'
}) {
  const tamanos = {
    sm: 'h-7 w-7 text-[11.5px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-11 w-11 text-sm',
  }
  const tonos = {
    bosque: 'bg-bosque-700 text-crema-100',
    laton: 'bg-laton-400 text-bosque-800',
    claro: 'bg-crema-200 text-bosque-600',
  }
  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-medium tracking-wide',
        tamanos[tamano],
        tonos[tono],
      )}
    >
      {iniciales}
    </span>
  )
}

/** Encabezado de página: título editorial + acciones. */
export function EncabezadoPagina({
  antetitulo,
  titulo,
  descripcion,
  acciones,
}: {
  antetitulo?: string
  titulo: string
  descripcion?: string
  acciones?: ReactNode
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-crema-300/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {antetitulo ? <p className="eyebrow mb-2">{antetitulo}</p> : null}
        <h1 className="font-display text-3xl font-light leading-tight text-bosque-800 sm:text-4xl">
          {titulo}
        </h1>
        {descripcion ? (
          <p className="mt-2 max-w-2xl text-sm text-carbon/60">{descripcion}</p>
        ) : null}
      </div>
      {acciones ? <div className="flex flex-wrap items-center gap-2">{acciones}</div> : null}
    </header>
  )
}

export function EstadoVacio({
  titulo,
  mensaje,
  accion,
}: {
  titulo: string
  mensaje?: string
  accion?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-crema-100 text-bosque-300">
        <Leaf size={20} />
      </span>
      <p className="font-display text-lg text-bosque-700">{titulo}</p>
      {mensaje ? <p className="max-w-sm text-sm text-carbon/55">{mensaje}</p> : null}
      {accion}
    </div>
  )
}

/** Barra de progreso sobria, usada en metas y embudos. */
export function BarraProgreso({
  porcentaje,
  tono = 'bosque',
  className,
}: {
  porcentaje: number
  tono?: 'bosque' | 'laton'
  className?: string
}) {
  const ancho = Math.max(0, Math.min(100, porcentaje))
  return (
    <div className={clsx('h-1.5 w-full overflow-hidden rounded-full bg-crema-200', className)}>
      <div
        className={clsx(
          'h-full rounded-full transition-all duration-700',
          tono === 'bosque'
            ? 'bg-gradient-to-r from-bosque-500 to-bosque-400'
            : 'bg-gradient-to-r from-laton-500 to-laton-300',
        )}
        style={{ width: `${ancho}%` }}
      />
    </div>
  )
}

/** Separador con filete dorado de marca. */
export function Filete({ className }: { className?: string }) {
  return <div className={clsx('filete', className)} />
}
