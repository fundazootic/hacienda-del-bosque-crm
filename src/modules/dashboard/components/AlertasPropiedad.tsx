import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import type { SolicitudReasignacion } from '@/core/types'
import { clientesRepo, comercialRepo, equipoRepo } from '@/core/data/repositories'
import { useSesion } from '@/core/auth/SesionContext'
import { formatearFechaCorta } from '@/core/utils/fecha'
import { Boton, Entrada } from '@/ui'

const nombreComercial = (id: string) => equipoRepo.obtener(id)?.nombre ?? 'Sin asignar'

/**
 * Solicitudes de reasignación pendientes.
 * El comercial pide la cuenta; aquí Gerencia —y solo Gerencia— decide.
 */
export function AlertasPropiedad({ conflictos }: { conflictos: SolicitudReasignacion[] }) {
  const { usuario, esGerencia } = useSesion()
  const [resolviendo, setResolviendo] = useState<string | null>(null)
  const [comentario, setComentario] = useState('')

  if (conflictos.length === 0) {
    return (
      <div className="px-5 py-6 text-center text-sm text-carbon/50">
        No hay solicitudes de traslado pendientes.
      </div>
    )
  }

  const cerrar = () => {
    setResolviendo(null)
    setComentario('')
  }

  return (
    <ul className="divide-y divide-crema-200">
      {conflictos.map((s) => (
        <li key={s.id} className="px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <ShieldAlert size={15} strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-bosque-800">
                <span className="font-medium">{nombreComercial(s.solicitanteId)}</span> solicita la
                cuenta de{' '}
                <Link
                  to={`/clientes/${s.clienteId}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {clientesRepo.nombreDe(s.clienteId)}
                </Link>
              </p>
              <p className="mt-0.5 text-xs text-carbon/60">
                Responsable actual:{' '}
                <span className="text-bosque-600">{nombreComercial(s.propietarioActualId)}</span>
                {s.origen === 'duplicado' ? ' · detectado al intentar registrarlo de nuevo' : ''}
              </p>
              <p className="mt-1 border-l-2 border-crema-300 pl-2 text-[12.5px] italic text-carbon/55">
                {s.motivo}
              </p>
              <p className="mt-1 text-[11.5px] uppercase tracking-wider text-carbon/35">
                {formatearFechaCorta(s.fecha.slice(0, 10))}
              </p>
            </div>
          </div>

          {esGerencia ? (
            resolviendo === s.id ? (
              <div className="mt-3 space-y-2 rounded-lg border border-crema-300 bg-crema-50 p-3">
                <Entrada
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Comentario de la decisión (queda en la auditoría)"
                />
                <div className="flex justify-end gap-2">
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
              Pendiente de decisión de Gerencia
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}
