import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import type { Cliente, SolicitudReasignacion } from '@/core/types'
import { comercialRepo, equipoRepo } from '@/core/data/repositories'
import { useSesion } from '@/core/auth/SesionContext'
import { inicialesDe, nombreCompleto } from '@/core/utils/cliente'
import { formatearFecha } from '@/core/utils/fecha'
import { Avatar, AreaTexto, Boton, CampoBloque, PanelLateral } from '@/ui'

/**
 * Solicitar reasignación.
 * El comercial explica por qué debería atender la cuenta; la decisión no es
 * suya: la solicitud nace en estado pendiente y la resuelve Gerencia.
 */
export function PanelSolicitud({
  abierto,
  onCerrar,
  cliente,
  origen,
  intentoDuplicadoId,
}: {
  abierto: boolean
  onCerrar: () => void
  cliente: Cliente
  origen: SolicitudReasignacion['origen']
  intentoDuplicadoId?: string
}) {
  const { usuario } = useSesion()
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [enviada, setEnviada] = useState(false)

  useEffect(() => {
    if (!abierto) return
    setMotivo('')
    setError('')
    setEnviada(false)
  }, [abierto])

  const responsable = equipoRepo.obtener(cliente.comercialId)

  const enviar = () => {
    if (motivo.trim().length < 15) {
      setError('Explique el motivo con al menos una frase: Gerencia decide con esto.')
      return
    }

    const resultado = comercialRepo.solicitar(
      { clienteId: cliente.id, motivo, origen, intentoDuplicadoId },
      usuario,
    )

    if (!resultado.creada) {
      setError(resultado.motivoRechazo ?? 'No fue posible registrar la solicitud.')
      return
    }
    setEnviada(true)
  }

  return (
    <PanelLateral
      abierto={abierto}
      onCerrar={onCerrar}
      antetitulo="Propiedad comercial"
      titulo="Solicitar reasignación"
      descripcion="La solicitud queda registrada y la resuelve Gerencia."
      pie={
        enviada ? (
          <Boton variante="primario" onClick={onCerrar}>
            Entendido
          </Boton>
        ) : (
          <>
            <Boton variante="secundario" onClick={onCerrar}>
              Cancelar
            </Boton>
            <Boton variante="primario" onClick={enviar}>
              Enviar solicitud
            </Boton>
          </>
        )
      }
    >
      <div className="space-y-5 px-6 py-5">
        {/* Cuenta solicitada */}
        <div className="rounded-xl border border-crema-300 bg-white p-4">
          <p className="eyebrow mb-3">Cuenta solicitada</p>
          <div className="flex items-center gap-3">
            <Avatar
              iniciales={inicialesDe(cliente)}
              tamano="md"
              tono={cliente.categoria === 'vip' ? 'laton' : 'claro'}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-bosque-800">
                {nombreCompleto(cliente)}
              </p>
              <p className="truncate text-[12.5px] text-carbon/50">
                {cliente.codigo}
                {cliente.empresa ? ` · ${cliente.empresa}` : ''}
              </p>
            </div>
          </div>
          <dl className="mt-3 grid gap-2 border-t border-crema-200 pt-3 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-[11.5px] uppercase tracking-wider text-bosque-400">
                Responsable actual
              </dt>
              <dd className="mt-0.5 text-carbon/75">{responsable?.nombre ?? 'Sin asignar'}</dd>
            </div>
            <div>
              <dt className="text-[11.5px] uppercase tracking-wider text-bosque-400">
                Responsable desde
              </dt>
              <dd className="mt-0.5 text-carbon/75">{formatearFecha(cliente.fechaAsignacion)}</dd>
            </div>
          </dl>
        </div>

        {enviada ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="font-display text-lg leading-tight text-bosque-800">
              Solicitud enviada a Gerencia.
            </p>
            <p className="mt-1 text-xs leading-relaxed text-carbon/65">
              Quedó registrada en el historial del sistema. Mientras Gerencia no la apruebe, la
              cuenta sigue siendo de {responsable?.nombre ?? 'su responsable actual'} y usted no
              puede gestionarla.
            </p>
          </div>
        ) : (
          <>
            <CampoBloque
              etiqueta="Motivo de la solicitud"
              ayuda="Gerencia lee esto para decidir. Sea concreto: quién lo contactó, qué gestión ha hecho."
            >
              <AreaTexto
                rows={5}
                value={motivo}
                onChange={(e) => {
                  setMotivo(e.target.value)
                  setError('')
                }}
                placeholder="El cliente me contactó directamente y venimos trabajando la celebración desde julio…"
              />
            </CampoBloque>

            {error ? (
              <p className="rounded-lg border border-terracota/30 bg-rose-50 px-3 py-2 text-xs text-terracota">
                {error}
              </p>
            ) : null}

            <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-carbon/55">
              <Info size={14} className="mt-px shrink-0 text-bosque-400" />
              Usted puede solicitar la cuenta, pero no aprobarla. La decisión y su motivo quedan
              en la auditoría, y el historial del cliente conserva a todos sus responsables
              anteriores.
            </p>
          </>
        )}
      </div>
    </PanelLateral>
  )
}
