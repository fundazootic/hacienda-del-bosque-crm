import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Cake, CalendarHeart, Check, Gift, UserRoundX, X } from 'lucide-react'
import type { Notificacion, TipoMomento } from '@/core/types'
import { equipoRepo, momentosRepo } from '@/core/data/repositories'
import { formatearFechaCorta } from '@/core/utils/fecha'
import { Boton, Etiqueta, EstadoVacio } from '@/ui'

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
 * Bandeja de recordatorios dentro del CRM.
 * Son avisos para el comercial responsable, nunca mensajes al cliente.
 */
export function BandejaNotificaciones({
  notificaciones,
  mostrarDestinatario = false,
}: {
  notificaciones: Notificacion[]
  mostrarDestinatario?: boolean
}) {
  if (notificaciones.length === 0) {
    return (
      <EstadoVacio
        titulo="Sin recordatorios"
        mensaje="Cuando una regla se cumpla, el aviso aparecerá aquí."
      />
    )
  }

  return (
    <ul className="divide-y divide-crema-200">
      {notificaciones.map((n) => {
        const Icono = ICONOS[n.tipo]
        const destinatario = equipoRepo.obtener(n.destinatarioId)
        const atendida = n.estado === 'atendida'
        const descartada = n.estado === 'descartada'

        return (
          <li
            key={n.id}
            className={clsx(
              'px-5 py-4 transition-colors',
              n.estado === 'pendiente' && 'bg-crema-50/60',
              descartada && 'opacity-50',
            )}
          >
            <div className="flex items-start gap-3.5">
              <span
                className={clsx(
                  'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                  FONDOS[n.tipo],
                )}
              >
                <Icono size={16} strokeWidth={1.7} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span
                    className={clsx(
                      'text-sm leading-snug',
                      atendida ? 'text-carbon/50 line-through' : 'text-bosque-800',
                    )}
                  >
                    {n.titulo}
                  </span>
                  {n.estado === 'pendiente' ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-terracota" />
                  ) : null}
                  {atendida ? <Etiqueta tono="exito">Atendida</Etiqueta> : null}
                  {descartada ? <Etiqueta tono="neutro">Descartada</Etiqueta> : null}
                </p>

                <p className="mt-1 text-xs leading-relaxed text-carbon/65">
                  {n.accionRecomendada}
                </p>

                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 text-[11.5px] uppercase tracking-wider text-carbon/35">
                  <span>{formatearFechaCorta(n.fechaMomento)}</span>
                  <span>canal {n.canal}</span>
                  {mostrarDestinatario ? (
                    <span className="text-bosque-500">
                      {destinatario?.nombre.split(' ').slice(0, 2).join(' ')}
                    </span>
                  ) : null}
                  {n.enviadaPorCorreo ? <span>correo enviado</span> : null}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <Link to={`/clientes/${n.clienteId}`}>
                  <Boton variante="secundario" tamano="sm">
                    Ver ficha
                  </Boton>
                </Link>
                {n.estado !== 'atendida' && n.estado !== 'descartada' ? (
                  <>
                    <button
                      onClick={() => momentosRepo.marcar(n.id, 'atendida')}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-crema-300 bg-white text-bosque-600 transition-colors hover:border-bosque-400"
                      title="Marcar como atendida"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => momentosRepo.marcar(n.id, 'descartada')}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-crema-300 bg-white text-carbon/40 transition-colors hover:border-terracota hover:text-terracota"
                      title="Descartar"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
