import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type Variante = 'primario' | 'secundario' | 'fantasma' | 'laton'
type Tamano = 'sm' | 'md'

const variantes: Record<Variante, string> = {
  primario:
    'bg-bosque-700 text-crema-50 hover:bg-bosque-600 border border-bosque-700 shadow-suave',
  secundario:
    'bg-white text-bosque-700 border border-crema-300 hover:border-bosque-300 hover:text-bosque-800',
  fantasma: 'bg-transparent text-carbon/60 border border-transparent hover:bg-crema-200/70',
  laton: 'bg-laton-400 text-bosque-800 border border-laton-400 hover:bg-laton-300',
}

const tamanos: Record<Tamano, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
}

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamano?: Tamano
  icono?: ReactNode
}

export function Boton({
  variante = 'primario',
  tamano = 'md',
  icono,
  className,
  children,
  ...props
}: BotonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-laton-400',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantes[variante],
        tamanos[tamano],
        className,
      )}
      {...props}
    >
      {icono}
      {children}
    </button>
  )
}
