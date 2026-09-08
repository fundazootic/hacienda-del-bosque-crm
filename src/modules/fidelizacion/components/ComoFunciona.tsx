import clsx from 'clsx'
import { Sprout, TreeDeciduous, TreePine, Trees } from 'lucide-react'
import type { NivelFidelidad } from '@/core/types'
import { NIVELES, PESOS_POR_PUNTO } from '@/core/data/repositories'
import { formatearMonedaCompacta, formatearNumero } from '@/core/utils/format'
import { COLOR_NIVEL } from '../services/fidelizacionService'

const ICONOS: Record<NivelFidelidad, typeof Sprout> = {
  semilla: Sprout,
  guadua: TreePine,
  ceiba: TreeDeciduous,
  saman: Trees,
}

/**
 * Explicación del programa en la propia pantalla.
 * La idea es que nadie tenga que preguntar cómo funciona: se lee y se entiende.
 */
export function ComoFunciona({
  porNivel,
}: {
  porNivel: { nivel: NivelFidelidad; nombre: string; visitas: number; gasto: number; resumen: string; cantidad: number }[]
}) {
  return (
    <div className="px-5 py-5">
      <p className="mb-4 max-w-3xl text-sm leading-relaxed text-carbon/70">
        Los clientes suben de nivel cuando <strong className="text-bosque-700">vuelven</strong> o
        cuando <strong className="text-bosque-700">gastan</strong>. Basta con cumplir una de las dos
        cosas. Además, por cada{' '}
        <strong className="text-bosque-700">
          {formatearMonedaCompacta(PESOS_POR_PUNTO)}
        </strong>{' '}
        que consumen ganan <strong className="text-bosque-700">1 punto</strong>, y con esos puntos
        pueden pedir un beneficio de la casa.
      </p>

      <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {porNivel.map((n, indice) => {
          const Icono = ICONOS[n.nivel]
          const color = COLOR_NIVEL[n.nivel]

          return (
            <li
              key={n.nivel}
              className="relative overflow-hidden rounded-xl border border-crema-300 bg-white p-4"
            >
              <span className={clsx('absolute inset-x-0 top-0 h-1', color.punto)} />

              <div className="flex items-center gap-3">
                <span
                  className={clsx(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                    color.fondo,
                    color.texto,
                  )}
                >
                  <Icono size={20} strokeWidth={1.6} />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-xl leading-tight text-bosque-800">{n.nombre}</p>
                  <p className="text-xs text-carbon/50">
                    Nivel {indice + 1} de {NIVELES.length}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-carbon/65">{n.resumen}</p>

              <div className="mt-3 rounded-lg bg-crema-50 px-3 py-2.5">
                <p className="text-xs text-carbon/60">
                  {n.visitas === 0 ? (
                    'Se entra al registrarse.'
                  ) : (
                    <>
                      Desde <strong className="text-bosque-700">{n.visitas} visitas</strong> al año
                      <br />o <strong className="text-bosque-700">
                        {formatearMonedaCompacta(n.gasto)}
                      </strong>{' '}
                      gastados en total.
                    </>
                  )}
                </p>
              </div>

              <p className="mt-3 flex items-baseline gap-1.5 border-t border-crema-200 pt-3">
                <span className="font-display text-2xl leading-none text-bosque-800">
                  {formatearNumero(n.cantidad)}
                </span>
                <span className="text-xs text-carbon/50">
                  {n.cantidad === 1 ? 'cliente en este nivel' : 'clientes en este nivel'}
                </span>
              </p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
