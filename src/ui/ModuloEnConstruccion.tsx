import { Compass } from 'lucide-react'
import { EncabezadoPagina } from './Varios'
import { Tarjeta } from './Tarjeta'

/**
 * Marcador de módulo aún no desarrollado.
 * Cada módulo del menú ya tiene su ruta y su lugar en la arquitectura;
 * se irán reemplazando uno a uno sin tocar el resto del sistema.
 */
export function ModuloEnConstruccion({
  titulo,
  antetitulo,
  descripcion,
  alcance,
}: {
  titulo: string
  antetitulo: string
  descripcion: string
  alcance: string[]
}) {
  return (
    <div className="space-y-8">
      <EncabezadoPagina antetitulo={antetitulo} titulo={titulo} descripcion={descripcion} />

      <Tarjeta className="overflow-hidden">
        <div className="flex flex-col gap-6 p-8 md:flex-row md:items-start">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-bosque-50 text-bosque-500">
            <Compass size={22} />
          </span>
          <div className="space-y-4">
            <div>
              <p className="eyebrow">Módulo previsto</p>
              <p className="mt-2 max-w-2xl font-display text-xl font-light text-bosque-800">
                Este módulo ya está contemplado en la arquitectura y se construirá en la siguiente
                etapa del prototipo.
              </p>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {alcance.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 rounded-lg border border-crema-200 bg-crema-50 px-3 py-2 text-sm text-carbon/70"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-laton-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Tarjeta>
    </div>
  )
}
