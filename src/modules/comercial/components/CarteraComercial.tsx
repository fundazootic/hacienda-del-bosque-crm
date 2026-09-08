import { useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { ChevronDown, Repeat2 } from 'lucide-react'
import { etiquetaCategoria } from '@/core/utils/etiquetas'
import { formatearMonedaCompacta, formatearNumero } from '@/core/utils/format'
import { formatearFechaCorta } from '@/core/utils/fecha'
import { nombreCompleto } from '@/core/utils/cliente'
import { Avatar, BarraProgreso, Etiqueta } from '@/ui'
import { TONO_CATEGORIA } from '@/modules/clientes'
import { ETIQUETA_TIPO, type CarteraComercial as Cartera } from '../services/comercialService'

/**
 * Cartera comercial: la vista con la que Gerencia compara a quién tiene qué.
 * Una fila por comercial, desplegable para ver los clientes asignados.
 */
export function CarteraComercial({ carteras }: { carteras: Cartera[] }) {
  const [abierta, setAbierta] = useState<string | null>(null)

  const maxClientes = Math.max(1, ...carteras.map((c) => c.clientes.length))
  const maxValor = Math.max(1, ...carteras.map((c) => c.valorCartera))

  return (
    <ul className="divide-y divide-crema-200">
      {carteras.map((c) => {
        const desplegada = abierta === c.comercial.id

        return (
          <li key={c.comercial.id}>
            <button
              onClick={() => setAbierta(desplegada ? null : c.comercial.id)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-crema-50"
            >
              <Avatar
                iniciales={c.comercial.iniciales}
                tamano="lg"
                tono={c.tipo === 'freelancer' ? 'laton' : 'bosque'}
              />

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-display text-lg leading-tight text-bosque-800">
                    {c.comercial.nombre}
                  </span>
                  <Etiqueta tono={c.tipo === 'freelancer' ? 'laton' : 'bosque'}>
                    {ETIQUETA_TIPO[c.tipo]}
                  </Etiqueta>
                  {c.solicitudesPendientes > 0 ? (
                    <Etiqueta tono="alerta">
                      {c.solicitudesPendientes === 1
                        ? '1 solicitud sobre su cartera'
                        : `${c.solicitudesPendientes} solicitudes sobre su cartera`}
                    </Etiqueta>
                  ) : null}
                </p>
                <p className="mt-0.5 text-[12.5px] text-carbon/50">
                  {c.comercial.cargo} · {c.recibidos} recibidos · {c.cedidos} cedidos
                  {c.ultimaAsignacion
                    ? ` · última asignación ${formatearFechaCorta(c.ultimaAsignacion)}`
                    : ''}
                </p>

                <div className="mt-2 flex items-center gap-3">
                  <BarraProgreso
                    porcentaje={(c.clientes.length / maxClientes) * 100}
                    tono={c.tipo === 'freelancer' ? 'laton' : 'bosque'}
                    className="max-w-xs flex-1"
                  />
                  <span className="text-[12.5px] text-carbon/45">
                    {formatearNumero(c.clientes.length)} clientes
                  </span>
                </div>
              </div>

              {/* Cifras comparables */}
              <div className="hidden shrink-0 gap-6 text-right lg:flex">
                <div className="w-24">
                  <p className="font-display text-lg text-bosque-800">
                    {formatearMonedaCompacta(c.valorCartera)}
                  </p>
                  <p className="text-[11.5px] uppercase tracking-wider text-carbon/40">
                    Valor cartera
                  </p>
                  <div className="mt-1 h-0.5 w-full overflow-hidden rounded-full bg-crema-200">
                    <div
                      className="h-full rounded-full bg-bosque-400"
                      style={{ width: `${(c.valorCartera / maxValor) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-24">
                  <p className="font-display text-lg text-bosque-800">
                    {formatearMonedaCompacta(c.ventasAnio)}
                  </p>
                  <p className="text-[11.5px] uppercase tracking-wider text-carbon/40">Ventas 2026</p>
                </div>
                <div className="w-24">
                  <p className="font-display text-lg text-bosque-800">
                    {c.oportunidadesActivas}
                  </p>
                  <p className="text-[11.5px] uppercase tracking-wider text-carbon/40">
                    {formatearMonedaCompacta(c.valorEnCurso)} en curso
                  </p>
                </div>
              </div>

              <ChevronDown
                size={16}
                className={clsx(
                  'shrink-0 text-carbon/30 transition-transform',
                  desplegada && 'rotate-180',
                )}
              />
            </button>

            {desplegada ? (
              <div className="border-t border-crema-200 bg-crema-50/60 px-5 py-4">
                {/* Composición por categoría */}
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {(Object.keys(c.porCategoria) as (keyof typeof c.porCategoria)[])
                    .filter((cat) => c.porCategoria[cat] > 0)
                    .map((cat) => (
                      <Etiqueta key={cat} tono={TONO_CATEGORIA[cat]}>
                        {etiquetaCategoria[cat]} · {c.porCategoria[cat]}
                      </Etiqueta>
                    ))}
                </div>

                {c.clientes.length === 0 ? (
                  <p className="py-4 text-center text-xs text-carbon/45">
                    Sin clientes asignados todavía.
                  </p>
                ) : (
                  <ul className="divide-y divide-crema-200 overflow-hidden rounded-lg border border-crema-300 bg-white">
                    {c.clientes.map((cliente) => (
                      <li key={cliente.id}>
                        <Link
                          to={`/clientes/${cliente.id}`}
                          className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-crema-50"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-bosque-800">
                              {nombreCompleto(cliente)}
                            </span>
                            <span className="block truncate text-[12.5px] text-carbon/45">
                              {cliente.codigo}
                              {cliente.empresa ? ` · ${cliente.empresa}` : ''}
                            </span>
                          </span>
                          <Etiqueta tono={TONO_CATEGORIA[cliente.categoria]}>
                            {etiquetaCategoria[cliente.categoria]}
                          </Etiqueta>
                          <span className="hidden w-32 shrink-0 text-right text-[12.5px] text-carbon/50 sm:block">
                            {cliente.fechaAsignacion !== cliente.fechaRegistro ? (
                              <span className="flex items-center justify-end gap-1 text-bosque-500">
                                <Repeat2 size={11} />
                                {formatearFechaCorta(cliente.fechaAsignacion)}
                              </span>
                            ) : (
                              `desde ${formatearFechaCorta(cliente.fechaAsignacion)}`
                            )}
                          </span>
                          <span className="hidden w-20 shrink-0 text-right font-display text-sm text-bosque-700 md:block">
                            {cliente.valorHistorico > 0
                              ? formatearMonedaCompacta(cliente.valorHistorico)
                              : '—'}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
