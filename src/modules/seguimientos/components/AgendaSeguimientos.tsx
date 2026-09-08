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
import { clientesRepo, equipoRepo, experienciasRepo } from '@/core/data/repositories'
import { etiquetaSeguimiento } from '@/core/utils/etiquetas'
import { formatearFechaCorta } from '@/core/utils/fecha'
import { Avatar, Boton, Etiqueta, EstadoVacio } from '@/ui'
import { agruparAgenda, diasHasta } from '../services/seguimientosService'

const ICONOS: Record<TipoSeguimiento, typeof PhoneCall> = {
  llamada: PhoneCall,
  correo: Mail,
  visita: Users,
  reunion: MessageSquare,
  degustacion: UtensilsCrossed,
  nota: StickyNote,
}

function cercania(dias: number) {
  if (dias < 0) return `hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'día' : 'días'}`
  if (dias === 0) return 'hoy'
  if (dias === 1) return 'mañana'
  return `en ${dias} días`
}

/**
 * Agenda de próximas acciones, agrupada por urgencia.
 * Es la pantalla con la que un comercial arranca el día.
 */
export function AgendaSeguimientos({
  pendientes,
  onCerrar,
  onEditar,
}: {
  pendientes: Seguimiento[]
  onCerrar: (s: Seguimiento) => void
  onEditar: (s: Seguimiento) => void
}) {
  if (pendientes.length === 0) {
    return (
      <EstadoVacio
        titulo="Agenda al día"
        mensaje="No hay acciones comprometidas pendientes. Registre una gestión para agendar el siguiente paso."
      />
    )
  }

  const grupos = agruparAgenda(pendientes)

  return (
    <div className="divide-y divide-crema-200">
      {grupos.map((grupo) => (
        <section key={grupo.clave}>
          <p
            className={clsx(
              'flex items-center justify-between px-5 py-2',
              grupo.clave === 'vencidos' ? 'bg-rose-50/70' : 'bg-crema-50',
            )}
          >
            <span
              className={clsx(
                'text-[11.5px] uppercase tracking-marca',
                grupo.clave === 'vencidos' ? 'text-terracota' : 'text-bosque-500',
              )}
            >
              {grupo.etiqueta}
            </span>
            <span className="text-[12.5px] text-carbon/45">
              {grupo.descripcion} · {grupo.seguimientos.length}
            </span>
          </p>

          <ul className="divide-y divide-crema-200">
            {grupo.seguimientos.map((s) => {
              const Icono = ICONOS[s.tipo]
              const responsable = equipoRepo.obtener(s.comercialId)
              const dias = diasHasta(s.fechaProximaAccion ?? '')
              const experiencia =
                s.entidadTipo === 'experiencia' ? experienciasRepo.obtener(s.entidadId) : undefined

              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-start gap-4 px-5 py-4 transition-colors hover:bg-crema-50/60"
                >
                  <span
                    className={clsx(
                      'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                      dias < 0
                        ? 'bg-rose-50 text-terracota'
                        : dias === 0
                          ? 'bg-laton-100 text-laton-700'
                          : 'bg-crema-100 text-bosque-500',
                    )}
                  >
                    <Icono size={16} strokeWidth={1.7} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-bosque-800">
                      {s.proximaAccion ?? s.asunto}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[12.5px] text-carbon/55">
                      <Link
                        to={`/clientes/${s.clienteId}`}
                        className="text-bosque-600 underline-offset-4 hover:underline"
                      >
                        {clientesRepo.nombreDe(s.clienteId)}
                      </Link>
                      <span>{etiquetaSeguimiento[s.tipo]}</span>
                      {experiencia ? (
                        <span className="truncate">· {experiencia.titulo}</span>
                      ) : null}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-carbon/45">
                      Origen: {s.asunto}
                    </p>
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
                    <Etiqueta tono={dias < 0 ? 'peligro' : dias === 0 ? 'laton' : 'neutro'}>
                      {cercania(dias)}
                    </Etiqueta>
                    <p className="mt-1 text-[11.5px] uppercase tracking-wider text-carbon/35">
                      {s.fechaProximaAccion ? formatearFechaCorta(s.fechaProximaAccion) : ''}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => onEditar(s)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-crema-300 bg-white text-carbon/45 transition-colors hover:border-bosque-300 hover:text-bosque-600"
                      title="Editar la gestión"
                    >
                      <Pencil size={14} />
                    </button>
                    <Boton
                      variante="secundario"
                      tamano="sm"
                      icono={<CheckCheck size={14} />}
                      onClick={() => onCerrar(s)}
                    >
                      Cerrar
                    </Boton>
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
