import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { ArrowRight, History, Pencil, Users2 } from 'lucide-react'
import type { EstadoExperiencia, Experiencia } from '@/core/types'
import { ETAPAS_EXPERIENCIA } from '@/core/types'
import { catalogosRepo, clientesRepo, equipoRepo, experienciasRepo } from '@/core/data/repositories'
import {
  etiquetaEstadoExperiencia,
  etiquetaExperiencia,
  etiquetaOrigen,
} from '@/core/utils/etiquetas'
import { formatearMoneda, formatearNumero } from '@/core/utils/format'
import { formatearFecha, formatearFechaCorta } from '@/core/utils/fecha'
import { Avatar, Boton, Etiqueta, PanelLateral } from '@/ui'
import { HOY, TONO_ESTADO } from '../services/experienciasService'

function Dato({ etiqueta, valor }: { etiqueta: string; valor?: string | null }) {
  return (
    <div>
      <dt className="text-[11.5px] uppercase tracking-wider text-bosque-400">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm text-carbon/80">{valor || '—'}</dd>
    </div>
  )
}

/**
 * Ficha de la experiencia: datos, siguiente paso posible e historial completo
 * de lo que le ha ocurrido.
 */
export function DetalleExperiencia({
  experiencia,
  onCerrar,
  onEditar,
  onMover,
}: {
  experiencia: Experiencia | null
  onCerrar: () => void
  onEditar: (e: Experiencia) => void
  onMover: (e: Experiencia, destino: EstadoExperiencia) => void
}) {
  if (!experiencia) return null

  const responsable = equipoRepo.obtener(experiencia.comercialId)
  const historial = experienciasRepo.historialDe(experiencia.id)
  const espacio = experiencia.espacioId ? catalogosRepo.espacio(experiencia.espacioId) : undefined
  const menu = experiencia.menuId ? catalogosRepo.menu(experiencia.menuId) : undefined

  const indiceActual = ETAPAS_EXPERIENCIA.indexOf(experiencia.estado)
  const siguientes = ETAPAS_EXPERIENCIA.filter((e, i) => {
    if (e === experiencia.estado) return false
    if (e === 'perdido') return experiencia.estado !== 'realizado'
    if (e === 'realizado') return experiencia.estado === 'confirmado'
    return i > indiceActual && i <= indiceActual + 2
  })

  return (
    <PanelLateral
      abierto={Boolean(experiencia)}
      onCerrar={onCerrar}
      ancho="lg"
      antetitulo={`${experiencia.codigo} · ${etiquetaExperiencia[experiencia.tipo]}`}
      titulo={experiencia.titulo}
      descripcion={clientesRepo.nombreDe(experiencia.clienteId)}
      pie={
        <>
          <Boton variante="secundario" icono={<Pencil size={15} />} onClick={() => onEditar(experiencia)}>
            Editar
          </Boton>
          <Link to={`/clientes/${experiencia.clienteId}`} onClick={onCerrar}>
            <Boton variante="primario">Ver ficha del cliente</Boton>
          </Link>
        </>
      }
    >
      <div className="space-y-5 px-6 py-5">
        {/* Estado y siguiente paso */}
        <div className="rounded-xl border border-crema-300 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Etiqueta tono={TONO_ESTADO[experiencia.estado]}>
              {etiquetaEstadoExperiencia[experiencia.estado]}
            </Etiqueta>
            <span className="font-display text-xl text-bosque-800">
              {formatearMoneda(
                experiencia.valorFinal ?? experiencia.valorCotizado ?? experiencia.presupuesto ?? 0,
              )}
            </span>
          </div>

          {experiencia.estado === 'perdido' && experiencia.motivoPerdida ? (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs italic text-terracota">
              {experiencia.motivoPerdida}
            </p>
          ) : null}

          {siguientes.length > 0 ? (
            <div className="mt-3 border-t border-crema-200 pt-3">
              <p className="eyebrow mb-2">Mover a</p>
              <div className="flex flex-wrap gap-1.5">
                {siguientes.map((destino) => (
                  <button
                    key={destino}
                    onClick={() => onMover(experiencia, destino)}
                    className={clsx(
                      'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[12.5px] transition-colors',
                      destino === 'perdido'
                        ? 'border-crema-300 bg-white text-terracota hover:border-terracota'
                        : 'border-crema-300 bg-white text-bosque-700 hover:border-bosque-400 hover:bg-bosque-50',
                    )}
                  >
                    {etiquetaEstadoExperiencia[destino]}
                    <ArrowRight size={11} />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Datos */}
        <dl className="grid gap-4 rounded-xl border border-crema-300 bg-white p-4 sm:grid-cols-2">
          <Dato
            etiqueta="Fecha tentativa"
            valor={experiencia.fechaTentativa ? formatearFecha(experiencia.fechaTentativa) : null}
          />
          <Dato etiqueta="Personas" valor={formatearNumero(experiencia.numeroPersonas)} />
          <Dato
            etiqueta="Presupuesto del cliente"
            valor={experiencia.presupuesto ? formatearMoneda(experiencia.presupuesto) : null}
          />
          <Dato
            etiqueta="Valor cotizado"
            valor={experiencia.valorCotizado ? formatearMoneda(experiencia.valorCotizado) : null}
          />
          <Dato
            etiqueta="Valor final"
            valor={experiencia.valorFinal ? formatearMoneda(experiencia.valorFinal) : null}
          />
          <Dato
            etiqueta="Anticipo"
            valor={experiencia.anticipo ? formatearMoneda(experiencia.anticipo) : null}
          />
          <Dato etiqueta="Fuente" valor={etiquetaOrigen[experiencia.fuente]} />
          <Dato
            etiqueta="Próximo seguimiento"
            valor={
              experiencia.proximoSeguimiento
                ? `${formatearFechaCorta(experiencia.proximoSeguimiento)}${
                    experiencia.proximoSeguimiento < HOY ? ' · vencido' : ''
                  }`
                : null
            }
          />
          <Dato etiqueta="Espacio" valor={espacio?.nombre} />
          <Dato etiqueta="Menú" valor={menu?.nombre} />
          <Dato
            etiqueta="Horario"
            valor={
              experiencia.horaInicio ? `${experiencia.horaInicio} – ${experiencia.horaFin ?? ''}` : null
            }
          />
          <Dato etiqueta="Responsable operativo" valor={experiencia.responsableOperativo} />
        </dl>

        {/* Comercial */}
        <div className="flex items-center gap-3 rounded-xl border border-crema-300 bg-white p-4">
          <Avatar
            iniciales={responsable?.iniciales ?? '—'}
            tamano="lg"
            tono={responsable?.rol === 'comercial_freelancer' ? 'laton' : 'bosque'}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-bosque-800">
              {responsable?.nombre ?? 'Sin asignar'}
            </p>
            <p className="truncate text-[12.5px] text-carbon/50">
              Comercial responsable · registrada el {formatearFechaCorta(experiencia.creadoEn)}
            </p>
          </div>
          <span className="ml-auto flex items-center gap-1 text-[12.5px] text-carbon/45">
            <Users2 size={12} />
            {experiencia.numeroPersonas}
          </span>
        </div>

        {experiencia.requerimientos.length > 0 ? (
          <div className="rounded-xl border border-crema-300 bg-white p-4">
            <p className="eyebrow mb-2">Requerimientos</p>
            <ul className="flex flex-wrap gap-1.5">
              {experiencia.requerimientos.map((r) => (
                <li
                  key={r}
                  className="rounded-full border border-bosque-100 bg-bosque-50 px-2.5 py-1 text-[12.5px] text-bosque-700"
                >
                  {r}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {experiencia.observaciones ? (
          <div className="rounded-xl border border-crema-300 bg-white p-4">
            <p className="eyebrow mb-2">Observaciones</p>
            <p className="border-l-2 border-laton-300 pl-3 text-sm italic leading-relaxed text-carbon/70">
              {experiencia.observaciones}
            </p>
          </div>
        ) : null}

        {/* Historial */}
        <div className="rounded-xl border border-crema-300 bg-white p-4">
          <p className="eyebrow mb-3 flex items-center gap-1.5">
            <History size={12} />
            Historial de la experiencia
          </p>

          {historial.length === 0 ? (
            <p className="text-xs text-carbon/45">
              Sin movimientos registrados en esta sesión. Los cambios de etapa, valores y fechas se
              anotan aquí.
            </p>
          ) : (
            <ol className="relative space-y-3 border-l border-crema-300 pl-5">
              {historial.map((r) => (
                <li key={r.id} className="relative">
                  <span className="absolute -left-[23px] top-1.5 h-2 w-2 rounded-full bg-laton-400 ring-4 ring-white" />
                  <p className="text-sm leading-snug text-bosque-800">{r.descripcion}</p>
                  {r.detalle ? (
                    <p className="mt-0.5 text-[12.5px] text-carbon/50">
                      {Object.entries(r.detalle)
                        .filter(([, v]) => v !== undefined && v !== '')
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' · ')}
                    </p>
                  ) : null}
                  <p className="mt-0.5 text-[11.5px] uppercase tracking-wider text-carbon/35">
                    {equipoRepo.obtener(r.actorId)?.nombre ?? 'Sistema'} ·{' '}
                    {r.fecha.slice(0, 10).split('-').reverse().join('/')} ·{' '}
                    {r.fecha.slice(11, 16)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </PanelLateral>
  )
}
