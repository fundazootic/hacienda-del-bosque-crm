import { useEffect, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { X } from 'lucide-react'

/**
 * Panel deslizante para crear y editar sin abandonar el contexto de la lista.
 * Se prefiere sobre una pantalla aparte: el comercial nunca pierde de vista
 * dónde estaba.
 */
export function PanelLateral({
  abierto,
  onCerrar,
  antetitulo,
  titulo,
  descripcion,
  pie,
  children,
  ancho = 'md',
}: {
  abierto: boolean
  onCerrar: () => void
  antetitulo?: string
  titulo: string
  descripcion?: string
  pie?: ReactNode
  children: ReactNode
  ancho?: 'md' | 'lg'
}) {
  /*
   * El panel se desmonta cuando está cerrado: si se quedara fuera del lienzo
   * con un `translate`, generaría barra de desplazamiento horizontal.
   * `visible` da el fotograma inicial para que la animación de entrada corra.
   */
  const [montado, setMontado] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (abierto) {
      setMontado(true)
      const id = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(id)
    }
    setVisible(false)
    const t = setTimeout(() => setMontado(false), 300)
    return () => clearTimeout(t)
  }, [abierto])

  useEffect(() => {
    if (!abierto) return
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', alPresionar)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', alPresionar)
      document.body.style.overflow = ''
    }
  }, [abierto, onCerrar])

  if (!montado) return null

  return (
    <>
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-bosque-900/40 backdrop-blur-sm transition-opacity duration-300',
          visible ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onCerrar}
        aria-hidden
      />

      <aside
        className={clsx(
          'fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-crema-50 shadow-elevada transition-transform duration-300 ease-out',
          ancho === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-xl',
          visible ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-start justify-between gap-4 border-b border-crema-300/70 bg-white px-5 py-5 sm:px-6">
          <div className="min-w-0">
            {antetitulo ? <p className="eyebrow mb-1.5">{antetitulo}</p> : null}
            <h2 className="font-display text-2xl font-light leading-tight text-bosque-800">
              {titulo}
            </h2>
            {descripcion ? (
              <p className="mt-1 text-xs text-carbon/55">{descripcion}</p>
            ) : null}
          </div>
          <button
            onClick={onCerrar}
            className="shrink-0 rounded-lg p-2 text-carbon/40 transition-colors hover:bg-crema-100 hover:text-carbon/70"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">{children}</div>

        {pie ? (
          <footer className="flex items-center justify-end gap-2 border-t border-crema-300/70 bg-white px-5 py-4 sm:px-6">
            {pie}
          </footer>
        ) : null}
      </aside>
    </>
  )
}
