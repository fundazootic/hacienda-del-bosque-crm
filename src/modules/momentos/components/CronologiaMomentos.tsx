import { Link } from 'react-router-dom'
import clsx from 'clsx'
import {
  Cake,
  CalendarHeart,
  Gift,
  Lightbulb,
  UserRoundX,
  BellOff,
  ArrowRight,
} from 'lucide-react'
import type { Momento, TipoMomento } from '@/core/types'
import { clientesRepo, equipoRepo } from '@/core/data/repositories'
import { etiquetaCategoria } from '@/core/utils/etiquetas'
import { formatearFecha, formatearFechaCorta } from '@/core/utils/fecha'
import { formatearMonedaCompacta } from '@/core/utils/format'
import { Avatar, Boton, Etiqueta, EstadoVacio } from '@/ui'
import { TONO_CATEGORIA } from '@/modules/clientes'
import { agruparCronologia, cercania, TONO_TIPO } from '../services/momentosService'

const ICONOS: Record<TipoMomento, typeof Cake> = {
  cumpleanos: Cake,
  aniversario: Gift,
  evento: CalendarHeart,
  recuperacion: UserRoundX,
}

const FONDOS: Record<TipoMomento, string> = {
  cumpleanos: 'bg-laton-100 text-laton-700',
  aniversario: 'bg-rose-50 text-terracota',
  evento: 'bg-bosque-50 text-bosque-600',
  recuperacion: 'bg-amber-50 text-amber-600',
}

/**
 * Cronología de momentos.
 * Cada fila trae lo necesario para decidir sin abrir la ficha: quién es el
 * cliente, quién lo atiende, cuándo se le habló por última vez, qué compró y
 * qué conviene hacer ahora.
 */
export function CronologiaMomentos({
  momentos,
  onRegistrar,
}: {
  momentos: Momento[]
  onRegistrar?: (momento: Momento) => void
}) {
  if (momentos.length === 0) {
    return (
      <EstadoVacio
        titulo="Sin momentos en esta ventana"
        mensaje="Amplíe el rango o revise otro tipo de momento."
      />
    )
  }

  const grupos = agruparCronologia(momentos)

  return (
    <div className="divide-y divide-crema-200">
      {grupos.map((grupo) => (
        <section key={grupo.clave}>
          <p className="flex items-center justify-between bg-crema-50 px-5 py-2">
            <span className="text-[11.5px] uppercase tracking-marca text-bosque-500">
              {grupo.etiqueta}
            </span>
            <span className="text-[12.5px] text-carbon/45">
              {grupo.momentos.length} {grupo.momentos.length === 1 ? 'momento' : 'momentos'}
            </span>
          </p>

          <ul className="divide-y divide-crema-200">
            {grupo.momentos.map((m) => {
              const Icono = ICONOS[m.tipo]
              const cliente = clientesRepo.obtener(m.clienteId)
              const responsable = equipoRepo.obtener(m.comercialId)

              return (
                <li key={m.id} className="transition-colors hover:bg-crema-50/60">
                  {/* Línea principal */}
                  <div className="flex items-center gap-4 px-5 pt-4">
                    <div className="flex w-14 shrink-0 flex-col items-center rounded-lg border border-crema-300 bg-crema-50 py-1.5">
                      <span className="text-[11px] uppercase tracking-wider text-bosque-400">
                        {formatearFechaCorta(m.fecha).split(' ')[1]}
                      </span>
                      <span className="font-display text-xl leading-none text-bosque-800">
                        {formatearFechaCorta(m.fecha).split(' ')[0]}
                      </span>
                    </div>

                    <span
                      className={clsx(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                        FONDOS[m.tipo],
                      )}
                    >
                      <Icono size={16} strokeWidth={1.7} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/clientes/${m.clienteId}`}
                          className="truncate font-display text-lg leading-tight text-bosque-800 underline-offset-4 hover:underline"
                        >
                          {m.titulo}
                        </Link>
                        {cliente ? (
                          <Etiqueta tono={TONO_CATEGORIA[cliente.categoria]}>
                            {etiquetaCategoria[cliente.categoria]}
                          </Etiqueta>
                        ) : null}
                        {cliente && !cliente.autorizaComunicaciones ? (
                          <span
                            className="flex items-center gap-1 text-[11.5px] text-carbon/40"
                            title="No autoriza comunicaciones escritas"
                          >
                            <BellOff size={11} />
                            sin autorización
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[12.5px] text-carbon/50">
                        <span>{m.detalle}</span>
                        <span>{formatearFecha(m.fecha, "d 'de' MMMM")}</span>
                      </p>
                    </div>

                    <div className="hidden w-40 shrink-0 items-center gap-2 lg:flex">
                      <Avatar
                        iniciales={responsable?.iniciales ?? '—'}
                        tamano="sm"
                        tono={responsable?.rol === 'comercial_freelancer' ? 'laton' : 'bosque'}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-xs text-carbon/70">
                          {responsable?.nombre.split(' ').slice(0, 2).join(' ') ?? 'Sin asignar'}
                        </span>
                        <span className="block text-[11.5px] uppercase tracking-wider text-carbon/35">
                          Responsable
                        </span>
                      </span>
                    </div>

                    <div className="w-20 shrink-0 text-right">
                      <p
                        className={clsx(
                          'text-xs font-medium',
                          m.dias === 0 ? 'text-laton-600' : 'text-carbon/55',
                        )}
                      >
                        {cercania(m.dias)}
                      </p>
                      {m.valor ? (
                        <p className="text-[11.5px] text-carbon/40">
                          {formatearMonedaCompacta(m.valor)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Contexto y acción */}
                  <div className="mx-5 mb-4 mt-3 grid gap-3 rounded-lg border border-crema-200 bg-crema-50/70 px-4 py-3 sm:grid-cols-[1fr_1fr_1.4fr] sm:items-start">
                    <div>
                      <p className="text-[11.5px] uppercase tracking-wider text-bosque-400">
                        Última interacción
                      </p>
                      <p className="mt-0.5 text-xs text-carbon/70">
                        {m.ultimaInteraccion
                          ? formatearFechaCorta(m.ultimaInteraccion)
                          : 'Sin registro'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11.5px] uppercase tracking-wider text-bosque-400">
                        Última venta o evento
                      </p>
                      <p className="mt-0.5 truncate text-xs text-carbon/70">
                        {m.ultimaVentaOEvento
                          ? `${m.ultimaVentaOEvento.descripcion} · ${formatearFechaCorta(m.ultimaVentaOEvento.fecha)}`
                          : 'Sin ventas registradas'}
                      </p>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1 text-[11.5px] uppercase tracking-wider text-bosque-400">
                          <Lightbulb size={11} />
                          Acción recomendada
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-bosque-700">
                          {m.accionRecomendada}
                        </p>
                      </div>

                      {onRegistrar ? (
                        <Boton
                          variante="secundario"
                          tamano="sm"
                          className="shrink-0"
                          onClick={() => onRegistrar(m)}
                        >
                          Atender
                        </Boton>
                      ) : (
                        <Link
                          to={`/clientes/${m.clienteId}`}
                          className="shrink-0 text-[12.5px] text-bosque-600 hover:underline"
                        >
                          <ArrowRight size={14} />
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

/** Tono para las etiquetas de tipo, reutilizado por los filtros. */
export { TONO_TIPO }
