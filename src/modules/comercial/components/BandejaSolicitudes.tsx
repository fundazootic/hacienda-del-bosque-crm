import { useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { ArrowRight, CheckCircle2, Clock, XCircle } from 'lucide-react'
import type { SolicitudReasignacion } from '@/core/types'
import { clientesRepo, comercialRepo, equipoRepo } from '@/core/data/repositories'
import { useSesion } from '@/core/auth/SesionContext'
import { formatearFechaCorta } from '@/core/utils/fecha'
import { Avatar, Boton, Entrada, EstadoVacio, Etiqueta, type TonoEtiqueta } from '@/ui'

const TONO: Record<SolicitudReasignacion['estado'], TonoEtiqueta> = {
  pendiente: 'alerta',
  aprobada: 'exito',
  rechazada: 'peligro',
}

const ETIQUETA: Record<SolicitudReasignacion['estado'], string> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
}

const ICONO = {
  pendiente: Clock,
  aprobada: CheckCircle2,
  rechazada: XCircle,
}

const ORIGEN: Record<SolicitudReasignacion['origen'], string> = {
  duplicado: 'Detectada al intentar registrar un duplicado',
  ficha_restringida: 'Solicitada desde una ficha ajena',
  manual: 'Solicitud directa',
}

const nombreComercial = (id: string) => equipoRepo.obtener(id)?.nombre ?? 'Sin asignar'

/**
 * Bandeja de solicitudes de reasignación.
 * Gerencia ve el botón de resolver; un comercial solo consulta el estado de
 * lo que pidió y de lo que le piden.
 */
export function BandejaSolicitudes({
  solicitudes,
  vacio,
}: {
  solicitudes: SolicitudReasignacion[]
  vacio: string
}) {
  const { usuario, esGerencia } = useSesion()
  const [resolviendo, setResolviendo] = useState<string | null>(null)
  const [comentario, setComentario] = useState('')

  if (solicitudes.length === 0) {
    return <EstadoVacio titulo="Sin solicitudes" mensaje={vacio} />
  }

  const cerrar = () => {
    setResolviendo(null)
    setComentario('')
  }

  return (
    <ul className="divide-y divide-crema-200">
      {solicitudes.map((s) => {
        const Icono = ICONO[s.estado]
        const solicitante = equipoRepo.obtener(s.solicitanteId)

        return (
          <li key={s.id} className="px-5 py-4">
            <div className="flex items-start gap-3.5">
              <span
                className={clsx(
                  'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                  s.estado === 'pendiente'
                    ? 'bg-amber-50 text-amber-600'
                    : s.estado === 'aprobada'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-terracota',
                )}
              >
                <Icono size={16} strokeWidth={1.8} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/clientes/${s.clienteId}`}
                    className="truncate text-sm font-medium text-bosque-800 underline-offset-4 hover:underline"
                  >
                    {clientesRepo.nombreDe(s.clienteId)}
                  </Link>
                  <Etiqueta tono={TONO[s.estado]}>{ETIQUETA[s.estado]}</Etiqueta>
                </div>

                {/* Traspaso solicitado */}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px] text-carbon/60">
                  <span className="flex items-center gap-1.5">
                    <Avatar
                      iniciales={equipoRepo.obtener(s.propietarioActualId)?.iniciales ?? '—'}
                      tamano="sm"
                      tono="claro"
                    />
                    {nombreComercial(s.propietarioActualId)}
                  </span>
                  <ArrowRight size={13} className="text-carbon/30" />
                  <span className="flex items-center gap-1.5">
                    <Avatar
                      iniciales={solicitante?.iniciales ?? '—'}
                      tamano="sm"
                      tono={solicitante?.rol === 'comercial_freelancer' ? 'laton' : 'bosque'}
                    />
                    {nombreComercial(s.solicitanteId)}
                  </span>
                </div>

                <p className="mt-2 border-l-2 border-crema-300 pl-2.5 text-xs italic leading-relaxed text-carbon/65">
                  {s.motivo}
                </p>

                <p className="mt-1.5 text-[11.5px] uppercase tracking-wider text-carbon/35">
                  {formatearFechaCorta(s.fecha.slice(0, 10))} · {ORIGEN[s.origen]}
                </p>

                {s.estado !== 'pendiente' ? (
                  <p className="mt-2 rounded-lg bg-crema-100 px-3 py-2 text-[12.5px] leading-relaxed text-carbon/60">
                    <span className="text-bosque-600">
                      {ETIQUETA[s.estado]} por {nombreComercial(s.resueltaPor ?? '')}
                      {s.fechaResolucion
                        ? ` el ${formatearFechaCorta(s.fechaResolucion.slice(0, 10))}`
                        : ''}
                    </span>
                    {s.comentarioResolucion ? ` · ${s.comentarioResolucion}` : ''}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Resolución: exclusiva de Gerencia */}
            {s.estado === 'pendiente' ? (
              esGerencia ? (
                resolviendo === s.id ? (
                  <div className="mt-3 space-y-2 rounded-lg border border-crema-300 bg-crema-50 p-3">
                    <Entrada
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      placeholder="Comentario de la decisión (queda en la auditoría)"
                    />
                    <div className="flex flex-wrap justify-end gap-2">
                      <Boton variante="fantasma" tamano="sm" onClick={cerrar}>
                        Cancelar
                      </Boton>
                      <Boton
                        variante="secundario"
                        tamano="sm"
                        onClick={() => {
                          comercialRepo.rechazar(s.id, usuario, comentario)
                          cerrar()
                        }}
                      >
                        Rechazar
                      </Boton>
                      <Boton
                        variante="primario"
                        tamano="sm"
                        onClick={() => {
                          comercialRepo.aprobar(s.id, usuario, comentario)
                          cerrar()
                        }}
                      >
                        Aprobar y reasignar
                      </Boton>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex justify-end">
                    <Boton variante="secundario" tamano="sm" onClick={() => setResolviendo(s.id)}>
                      Resolver solicitud
                    </Boton>
                  </div>
                )
              ) : (
                <p className="mt-2 text-right text-[12.5px] text-carbon/45">
                  {s.solicitanteId === usuario.id
                    ? 'En espera de la decisión de Gerencia'
                    : 'Gerencia decidirá sobre esta cuenta'}
                </p>
              )
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
