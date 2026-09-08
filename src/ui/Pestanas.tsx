import clsx from 'clsx'

export interface Pestana {
  clave: string
  etiqueta: string
  contador?: number
}

/** Navegación por pestañas con filete dorado en la activa. */
export function Pestanas({
  pestanas,
  activa,
  onCambiar,
}: {
  pestanas: Pestana[]
  activa: string
  onCambiar: (clave: string) => void
}) {
  return (
    /*
     * En pantallas angostas las pestañas se desplazan en horizontal. El velo
     * degradado del borde derecho avisa de que hay más: sin él, quien no
     * conoce el gesto cree que solo existen las visibles.
     */
    <div className="relative border-b border-crema-300/70">
      <div className="flex gap-1 overflow-x-auto scrollbar-fina">
      {pestanas.map((p) => {
        const esActiva = p.clave === activa
        return (
          <button
            key={p.clave}
            onClick={() => onCambiar(p.clave)}
            className={clsx(
              'relative shrink-0 px-4 py-3 text-sm transition-colors',
              esActiva ? 'text-bosque-800' : 'text-carbon/50 hover:text-bosque-600',
            )}
          >
            {p.etiqueta}
            {p.contador !== undefined ? (
              <span
                className={clsx(
                  'ml-1.5 text-[12.5px]',
                  esActiva ? 'text-laton-600' : 'text-carbon/35',
                )}
              >
                {p.contador}
              </span>
            ) : null}
            <span
              className={clsx(
                'absolute inset-x-3 bottom-0 h-0.5 rounded-full transition-opacity',
                esActiva ? 'bg-laton-400 opacity-100' : 'opacity-0',
              )}
            />
          </button>
        )
      })}
      </div>
      <span
        className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent sm:hidden"
        aria-hidden
      />
    </div>
  )
}
