import { CalendarClock, Users2 } from 'lucide-react'
import type { Experiencia } from '@/core/types'
import { clientesRepo, equipoRepo } from '@/core/data/repositories'
import { etiquetaEstadoExperiencia, etiquetaExperiencia } from '@/core/utils/etiquetas'
import { formatearMonedaCompacta } from '@/core/utils/format'
import { formatearFechaCorta } from '@/core/utils/fecha'
import { Avatar, Etiqueta, EstadoVacio } from '@/ui'
import { HOY, TONO_ESTADO, valorDe } from '../services/experienciasService'

/**
 * Vista de lista: la misma información del tablero, pero comparable renglón a
 * renglón. Es la que usa Gerencia para revisar valores y fechas.
 */
export function ListaExperiencias({
  experiencias,
  onAbrir,
  mostrarCliente = true,
  vacio = 'No hay experiencias que coincidan con la búsqueda.',
}: {
  experiencias: Experiencia[]
  onAbrir?: (experiencia: Experiencia) => void
  mostrarCliente?: boolean
  vacio?: string
}) {
  if (experiencias.length === 0) {
    return <EstadoVacio titulo="Sin experiencias" mensaje={vacio} />
  }

  return (
    <ul className="divide-y divide-crema-200">
      {experiencias.map((e) => {
        const responsable = equipoRepo.obtener(e.comercialId)
        const seguimientoVencido = Boolean(e.proximoSeguimiento && e.proximoSeguimiento < HOY)

        return (
          <li key={e.id}>
            <button
              onClick={() => onAbrir?.(e)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-crema-50"
            >
              {/* Tarjetón de fecha */}
              <div className="flex w-14 shrink-0 flex-col items-center rounded-lg border border-crema-300 bg-crema-50 py-1.5">
                {e.fechaTentativa ? (
                  <>
                    <span className="text-[11px] uppercase tracking-wider text-bosque-400">
                      {formatearFechaCorta(e.fechaTentativa).split(' ')[1]}
                    </span>
                    <span className="font-display text-xl leading-none text-bosque-800">
                      {formatearFechaCorta(e.fechaTentativa).split(' ')[0]}
                    </span>
                    <span className="text-[11px] text-carbon/40">
                      {formatearFechaCorta(e.fechaTentativa).split(' ')[2]}
                    </span>
                  </>
                ) : (
                  <span className="py-2 text-[11.5px] text-carbon/35">sin fecha</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-display text-lg leading-tight text-bosque-800">
                    {e.titulo}
                  </span>
                  <Etiqueta tono={TONO_ESTADO[e.estado]}>
                    {etiquetaEstadoExperiencia[e.estado]}
                  </Etiqueta>
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12.5px] text-carbon/50">
                  <span className="text-bosque-500">{e.codigo}</span>
                  {mostrarCliente ? <span>{clientesRepo.nombreDe(e.clienteId)}</span> : null}
                  <span>{etiquetaExperiencia[e.tipo]}</span>
                  <span className="flex items-center gap-1">
                    <Users2 size={11} />
                    {e.numeroPersonas}
                  </span>
                </p>
                {e.estado === 'perdido' && e.motivoPerdida ? (
                  <p className="mt-1 truncate text-[12.5px] italic text-terracota/80">
                    {e.motivoPerdida}
                  </p>
                ) : e.proximoSeguimiento ? (
                  <p
                    className={`mt-1 flex items-center gap-1 text-[12.5px] ${
                      seguimientoVencido ? 'font-medium text-terracota' : 'text-carbon/45'
                    }`}
                  >
                    <CalendarClock size={11} />
                    Seguimiento {formatearFechaCorta(e.proximoSeguimiento)}
                  </p>
                ) : null}
              </div>

              <div className="hidden w-36 shrink-0 items-center gap-2 lg:flex">
                <Avatar
                  iniciales={responsable?.iniciales ?? '—'}
                  tamano="sm"
                  tono={responsable?.rol === 'comercial_freelancer' ? 'laton' : 'bosque'}
                />
                <span className="truncate text-xs text-carbon/70">
                  {responsable?.nombre.split(' ').slice(0, 2).join(' ') ?? 'Sin asignar'}
                </span>
              </div>

              <div className="w-24 shrink-0 text-right">
                <p className="font-display text-base text-bosque-800">
                  {valorDe(e) > 0 ? formatearMonedaCompacta(valorDe(e)) : '—'}
                </p>
                <p className="text-[11.5px] uppercase tracking-wider text-carbon/40">
                  {e.valorFinal ? 'valor final' : e.valorCotizado ? 'cotizado' : 'presupuesto'}
                </p>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
