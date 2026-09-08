import { useState } from 'react'
import clsx from 'clsx'
import { CalendarClock, GripVertical, Users2 } from 'lucide-react'
import type { EstadoExperiencia, Experiencia } from '@/core/types'
import { clientesRepo, equipoRepo } from '@/core/data/repositories'
import { etiquetaEstadoExperiencia, etiquetaExperiencia } from '@/core/utils/etiquetas'
import { formatearMonedaCompacta } from '@/core/utils/format'
import { formatearFechaCorta } from '@/core/utils/fecha'
import { Avatar } from '@/ui'
import {
  COLOR_COLUMNA,
  HOY,
  valorDe,
  type ColumnaTablero,
} from '../services/experienciasService'

/** Tarjeta de una experiencia dentro del tablero. */
function TarjetaExperiencia({
  experiencia,
  onAbrir,
}: {
  experiencia: Experiencia
  onAbrir: (e: Experiencia) => void
}) {
  const responsable = equipoRepo.obtener(experiencia.comercialId)
  const vencido = Boolean(
    experiencia.proximoSeguimiento && experiencia.proximoSeguimiento < HOY,
  )

  return (
    <article
      draggable
      onDragStart={(ev) => {
        ev.dataTransfer.setData('text/plain', experiencia.id)
        ev.dataTransfer.effectAllowed = 'move'
      }}
      onClick={() => onAbrir(experiencia)}
      className="group cursor-pointer rounded-lg border border-crema-300 bg-white p-3 shadow-suave transition-shadow hover:shadow-elevada"
    >
      <div className="flex items-start gap-2">
        <GripVertical
          size={13}
          className="mt-0.5 shrink-0 text-crema-300 transition-colors group-hover:text-bosque-300"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-snug text-bosque-800">
            {experiencia.titulo}
          </p>
          <p className="mt-0.5 truncate text-[12.5px] text-carbon/50">
            {clientesRepo.nombreDe(experiencia.clienteId)}
          </p>
        </div>
      </div>

      <p className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-carbon/45">
        <span className="rounded-full bg-crema-100 px-2 py-0.5 text-bosque-600">
          {etiquetaExperiencia[experiencia.tipo]}
        </span>
        <span className="flex items-center gap-1">
          <Users2 size={10} />
          {experiencia.numeroPersonas}
        </span>
        {experiencia.fechaTentativa ? (
          <span>{formatearFechaCorta(experiencia.fechaTentativa)}</span>
        ) : null}
      </p>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-crema-200 pt-2">
        <span className="flex items-center gap-1.5">
          <Avatar
            iniciales={responsable?.iniciales ?? '—'}
            tamano="sm"
            tono={responsable?.rol === 'comercial_freelancer' ? 'laton' : 'bosque'}
          />
          {vencido ? (
            <span className="flex items-center gap-0.5 text-[11.5px] font-medium text-terracota">
              <CalendarClock size={10} />
              vencido
            </span>
          ) : null}
        </span>
        <span className="font-display text-sm text-bosque-800">
          {valorDe(experiencia) > 0 ? formatearMonedaCompacta(valorDe(experiencia)) : '—'}
        </span>
      </div>
    </article>
  )
}

/**
 * Tablero del pipeline. Las tarjetas se arrastran entre etapas; cuando el
 * destino es Confirmado o Perdido, el módulo pide los datos que exige el cierre
 * antes de mover nada.
 */
export function TableroKanban({
  columnas,
  onAbrir,
  onMover,
}: {
  columnas: ColumnaTablero[]
  onAbrir: (e: Experiencia) => void
  onMover: (experienciaId: string, estado: EstadoExperiencia) => void
}) {
  const [sobre, setSobre] = useState<EstadoExperiencia | null>(null)

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-3 px-5 py-4">
        {columnas.map((columna) => (
          <section
            key={columna.estado}
            onDragOver={(e) => {
              e.preventDefault()
              setSobre(columna.estado)
            }}
            onDragLeave={() => setSobre((s) => (s === columna.estado ? null : s))}
            onDrop={(e) => {
              e.preventDefault()
              setSobre(null)
              const id = e.dataTransfer.getData('text/plain')
              if (id) onMover(id, columna.estado)
            }}
            className={clsx(
              'flex w-64 shrink-0 flex-col rounded-xl border transition-colors',
              sobre === columna.estado
                ? 'border-bosque-400 bg-bosque-50/60'
                : 'border-crema-300/70 bg-crema-100/50',
            )}
          >
            <header className="rounded-t-xl bg-white/70 px-3 pb-2.5 pt-3">
              <span className={clsx('mb-2 block h-1 w-full rounded-full', COLOR_COLUMNA[columna.estado])} />
              <p className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] font-medium uppercase tracking-wider text-bosque-600">
                  {etiquetaEstadoExperiencia[columna.estado]}
                </span>
                <span className="font-display text-base text-bosque-800">
                  {columna.experiencias.length}
                </span>
              </p>
              <p className="mt-0.5 text-[11.5px] text-carbon/45">
                {columna.valor > 0 ? formatearMonedaCompacta(columna.valor) : '—'}
              </p>
            </header>

            <div className="flex flex-1 flex-col gap-2 p-2.5">
              {columna.experiencias.length === 0 ? (
                <p className="rounded-lg border border-dashed border-crema-300 px-3 py-6 text-center text-[12.5px] text-carbon/35">
                  Sin experiencias
                </p>
              ) : (
                columna.experiencias.map((e) => (
                  <TarjetaExperiencia key={e.id} experiencia={e} onAbrir={onAbrir} />
                ))
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
