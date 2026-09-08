import { useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import clsx from 'clsx'
import { Plus, X } from 'lucide-react'

const BASE_CONTROL =
  'w-full rounded-lg border bg-white px-3 text-sm text-carbon placeholder:text-carbon/30 transition-colors focus:outline-none focus:ring-2 focus:ring-bosque-100 disabled:bg-crema-100 disabled:text-carbon/40'

/** Bloque de sección dentro de un formulario extenso. */
export function SeccionFormulario({
  titulo,
  descripcion,
  children,
}: {
  titulo: string
  descripcion?: string
  children: ReactNode
}) {
  return (
    <section className="border-b border-crema-200 px-6 py-5 last:border-b-0">
      <div className="mb-4">
        <p className="eyebrow">{titulo}</p>
        {descripcion ? <p className="mt-1 text-xs text-carbon/50">{descripcion}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

export function Campo({
  etiqueta,
  requerido,
  ayuda,
  error,
  ancho = 'medio',
  children,
}: {
  etiqueta: string
  requerido?: boolean
  ayuda?: string
  error?: string
  ancho?: 'medio' | 'completo'
  children: ReactNode
}) {
  return (
    <label className={clsx('block', ancho === 'completo' && 'sm:col-span-2')}>
      <span className="mb-1.5 block text-[12.5px] font-medium uppercase tracking-wider text-bosque-500">
        {etiqueta}
        {requerido ? <span className="ml-0.5 text-terracota">*</span> : null}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-[12.5px] text-terracota">{error}</span>
      ) : ayuda ? (
        <span className="mt-1 block text-[12.5px] text-carbon/45">{ayuda}</span>
      ) : null}
    </label>
  )
}

/** Variante de Campo para contenidos compuestos (listas, grupos de botones). */
export function CampoBloque({
  etiqueta,
  ayuda,
  children,
}: {
  etiqueta: string
  ayuda?: string
  children: ReactNode
}) {
  return (
    <div className="sm:col-span-2">
      <span className="mb-1.5 block text-[12.5px] font-medium uppercase tracking-wider text-bosque-500">
        {etiqueta}
      </span>
      {children}
      {ayuda ? <span className="mt-1 block text-[12.5px] text-carbon/45">{ayuda}</span> : null}
    </div>
  )
}

export function Entrada({
  invalido,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalido?: boolean }) {
  return (
    <input
      className={clsx(
        BASE_CONTROL,
        'h-10',
        invalido ? 'border-terracota/60' : 'border-crema-300 focus:border-bosque-300',
        className,
      )}
      {...props}
    />
  )
}

export function AreaTexto({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      className={clsx(BASE_CONTROL, 'border-crema-300 py-2 focus:border-bosque-300', className)}
      {...props}
    />
  )
}

export function Seleccion({
  opciones,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { opciones: { valor: string; texto: string }[] }) {
  return (
    <select
      className={clsx(
        BASE_CONTROL,
        'h-10 cursor-pointer border-crema-300 pr-8 focus:border-bosque-300',
        className,
      )}
      {...props}
    >
      {opciones.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.texto}
        </option>
      ))}
    </select>
  )
}

/** Interruptor para autorizaciones y consentimientos. */
export function Interruptor({
  activo,
  onCambiar,
  titulo,
  descripcion,
}: {
  activo: boolean
  onCambiar: (valor: boolean) => void
  titulo: string
  descripcion?: string
}) {
  return (
    <button
      type="button"
      onClick={() => onCambiar(!activo)}
      className="flex w-full items-start gap-3 rounded-lg border border-crema-300 bg-white px-3.5 py-3 text-left transition-colors hover:border-bosque-300 sm:col-span-2"
    >
      <span
        className={clsx(
          'mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors',
          activo ? 'bg-bosque-600' : 'bg-crema-300',
        )}
      >
        <span
          className={clsx(
            'h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
            activo && 'translate-x-4',
          )}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-bosque-800">{titulo}</span>
        {descripcion ? (
          <span className="mt-0.5 block text-[12.5px] leading-relaxed text-carbon/50">
            {descripcion}
          </span>
        ) : null}
      </span>
    </button>
  )
}

/** Lista de valores tipo etiqueta: preferencias, restricciones, alergias. */
export function ListaEditable({
  valores,
  onCambiar,
  marcador,
  tono = 'bosque',
}: {
  valores: string[]
  onCambiar: (valores: string[]) => void
  marcador: string
  tono?: 'bosque' | 'terracota'
}) {
  const [borrador, setBorrador] = useState('')

  const agregar = () => {
    const limpio = borrador.trim()
    if (!limpio || valores.includes(limpio)) return
    onCambiar([...valores, limpio])
    setBorrador('')
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={borrador}
          onChange={(e) => setBorrador(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              agregar()
            }
          }}
          placeholder={marcador}
          className={clsx(BASE_CONTROL, 'h-10 border-crema-300 focus:border-bosque-300')}
        />
        <button
          type="button"
          onClick={agregar}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-crema-300 bg-white text-bosque-600 transition-colors hover:border-bosque-300"
          aria-label="Agregar"
        >
          <Plus size={16} />
        </button>
      </div>

      {valores.length > 0 ? (
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {valores.map((valor) => (
            <li
              key={valor}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px]',
                tono === 'bosque'
                  ? 'border-bosque-100 bg-bosque-50 text-bosque-700'
                  : 'border-rose-100 bg-rose-50 text-terracota',
              )}
            >
              {valor}
              <button
                type="button"
                onClick={() => onCambiar(valores.filter((v) => v !== valor))}
                className="opacity-50 transition-opacity hover:opacity-100"
                aria-label={`Quitar ${valor}`}
              >
                <X size={11} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
