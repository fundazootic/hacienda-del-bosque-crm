import { Link } from 'react-router-dom'
import clsx from 'clsx'
import {
  CheckCheck,
  Mail,
  MessageSquare,
  Pencil,
  PhoneCall,
  StickyNote,
  UtensilsCrossed,
  Users,
} from 'lucide-react'
import type { Seguimiento, TipoSeguimiento } from '@/core/types'
import { clientesRepo, equipoRepo, experienciasRepo, estaAbierto } from '@/core/data/repositories'
import { etiquetaSeguimiento } from '@/core/utils/etiquetas'
import { formatearFechaCorta } from '@/core/utils/fecha'
import { Avatar, Etiqueta, EstadoVacio } from '@/ui'
import { etiquetaResultado, HOY, TONO_RESULTADO } from '../services/seguimientosService'

const ICONOS: Record<TipoSeguimiento, typeof PhoneCall> = {
  llamada: PhoneCall,
  correo: Mail,
  visita: Users,
  reunion: MessageSquare,
  degustacion: UtensilsCrossed,
  nota: StickyNote,
}

/** Bitácora completa de gestiones, de la más reciente hacia atrás. */
export function HistorialSeguimientos({
  seguimientos,
  onEditar,
  onCerrar,
  mostrarCliente = true,
}: {
  seguimientos: Seguimiento[]
  onEditar?: (s: Seguimiento) => void
  onCerrar?: (s: Seguimiento) => void
  mostrarCliente?: boolean
}) {
  if (seguimientos.length === 0) {
    return (
      <EstadoVacio
        titulo="Sin gestiones"
        mensaje="No hay registros que coincidan con la búsqueda."
      />
    )
  }

  return (
    <ul className="divide-y divide-crema-200">
      {seguimientos.map((s) => {
        const Icono = ICONOS[s.tipo]
        const responsable = equipoRepo.obtener(s.comercialId)
        const experiencia =
          s.entidadTipo === 'experiencia' ? experienciasRepo.obtener(s.entidadId) : undefined
        const abierto = estaAbierto(s)
        const vencido = abierto && (s.fechaProximaAccion ?? '') < HOY

        return (
          <li key={s.id} className="px-5 py-4 transition-colors hover:bg-crema-50/60">
            <div className="flex items-start gap-3.5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-crema-100 text-bosque-500">
                <Icono size={16} strokeWidth={1.7} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-bosque-800">{s.asunto}</span>
                  <Etiqueta tono={TONO_RESULTADO[s.resultado]}>
                    {etiquetaResultado[s.resultado]}
                  </Etiqueta>
                </p>

                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[12.5px] text-carbon/50">
                  <span>{formatearFechaCorta(s.fecha)}</span>
                  <span>{etiquetaSeguimiento[s.tipo]}</span>
                  {mostrarCliente ? (
                    <Link
                      to={`/clientes/${s.clienteId}`}
                      className="text-bosque-600 underline-offset-4 hover:underline"
                    >
                      {clientesRepo.nombreDe(s.clienteId)}
                    </Link>
                  ) : null}
                  {experiencia ? <span className="truncate">· {experiencia.titulo}</span> : null}
                </p>

                <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-carbon/65">
                  {s.detalle}
                </p>

                {s.proximaAccion ? (
                  <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[12.5px]">
                    <span className="text-bosque-500">Próxima acción:</span>
                    <span className="text-carbon/70">{s.proximaAccion}</span>
                    {s.fechaProximaAccion ? (
                      <span
                        className={clsx(
                          'rounded-full px-2 py-0.5',
                          vencido ? 'bg-rose-50 text-terracota' : 'bg-crema-200 text-carbon/60',
                        )}
                      >
                        {formatearFechaCorta(s.fechaProximaAccion)}
                        {vencido ? ' · vencida' : ''}
                      </span>
                    ) : null}
                  </p>
                ) : null}
              </div>

              <div className="hidden w-32 shrink-0 items-center gap-2 lg:flex">
                <Avatar
                  iniciales={responsable?.iniciales ?? '—'}
                  tamano="sm"
                  tono={responsable?.rol === 'comercial_freelancer' ? 'laton' : 'bosque'}
                />
                <span className="truncate text-xs text-carbon/70">
                  {responsable?.nombre.split(' ')[0] ?? ''}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {onEditar ? (
                  <button
                    onClick={() => onEditar(s)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-crema-300 bg-white text-carbon/45 transition-colors hover:border-bosque-300 hover:text-bosque-600"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                ) : null}
                {abierto && onCerrar ? (
                  <button
                    onClick={() => onCerrar(s)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-crema-300 bg-white text-bosque-600 transition-colors hover:border-bosque-400"
                    title="Cerrar la acción"
                  >
                    <CheckCheck size={14} />
                  </button>
                ) : null}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
