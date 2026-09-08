import type { ReactNode } from 'react'
import clsx from 'clsx'

export type TonoEtiqueta =
  | 'neutro'
  | 'bosque'
  | 'laton'
  | 'exito'
  | 'alerta'
  | 'peligro'
  | 'contorno'

const tonos: Record<TonoEtiqueta, string> = {
  neutro: 'bg-crema-200 text-carbon/70 border-crema-300',
  bosque: 'bg-bosque-50 text-bosque-600 border-bosque-100',
  laton: 'bg-laton-100 text-laton-700 border-laton-200',
  exito: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  alerta: 'bg-amber-50 text-amber-700 border-amber-100',
  peligro: 'bg-rose-50 text-rose-700 border-rose-100',
  contorno: 'bg-transparent text-bosque-500 border-bosque-200',
}

export function Etiqueta({
  children,
  tono = 'neutro',
  className,
}: {
  children: ReactNode
  tono?: TonoEtiqueta
  className?: string
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12.5px] font-medium leading-5',
        tonos[tono],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Punto de color para listas y agendas. */
export function Punto({ className }: { className?: string }) {
  return <span className={clsx('inline-block h-1.5 w-1.5 rounded-full', className)} />
}
