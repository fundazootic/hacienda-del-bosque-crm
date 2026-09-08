import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Check, Gift, Plus } from 'lucide-react'
import { fidelizacionRepo, NIVELES } from '@/core/data/repositories'
import { useSesion } from '@/core/auth/SesionContext'
import { formatearNumero } from '@/core/utils/format'
import { AreaTexto, Boton, Campo, Entrada, PanelLateral } from '@/ui'
import { nombreNivel, type MiembroPrograma } from '../services/fidelizacionService'

/**
 * Entregar un beneficio o ajustar puntos.
 * Todo lo que no se puede hacer aparece explicado, no solo bloqueado.
 */
export function PanelBeneficio({
  miembro,
  onCerrar,
}: {
  miembro: MiembroPrograma | null
  onCerrar: () => void
}) {
  const { usuario, esGerencia } = useSesion()
  const [elegido, setElegido] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [puntosManuales, setPuntosManuales] = useState('')
  const [concepto, setConcepto] = useState('')

  useEffect(() => {
    if (!miembro) return
    setElegido(null)
    setMensaje('')
    setError('')
    setPuntosManuales('')
    setConcepto('')
  }, [miembro])

  if (!miembro) return null

  const beneficios = fidelizacionRepo.beneficios()
  const ordenCliente = NIVELES.findIndex((n) => n.nivel === miembro.nivelActual)

  const entregar = () => {
    if (!elegido) {
      setError('Elija primero un beneficio de la lista.')
      return
    }
    const resultado = fidelizacionRepo.entregarBeneficio(
      miembro.membresia.clienteId,
      elegido,
      usuario,
    )
    if (!resultado.ok) {
      setError(resultado.motivo ?? 'No fue posible entregar el beneficio.')
      return
    }
    setMensaje('Beneficio entregado y puntos descontados.')
    setError('')
    setElegido(null)
  }

  const sumarPuntos = () => {
    const puntos = Number(puntosManuales.replace(/[^\d-]/g, ''))
    const resultado = fidelizacionRepo.registrarPuntos(
      miembro.membresia.clienteId,
      puntos,
      concepto,
      usuario,
    )
    if (!resultado.ok) {
      setError(resultado.motivo ?? 'No fue posible registrar los puntos.')
      return
    }
    setMensaje('Puntos registrados.')
    setError('')
    setPuntosManuales('')
    setConcepto('')
  }

  return (
    <PanelLateral
      abierto={Boolean(miembro)}
      onCerrar={onCerrar}
      antetitulo={`Nivel ${nombreNivel(miembro.nivelActual)}`}
      titulo={miembro.nombre}
      descripcion={`Tiene ${formatearNumero(miembro.membresia.puntos)} puntos para usar.`}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            Cerrar
          </Boton>
          <Boton variante="primario" icono={<Gift size={15} />} onClick={entregar}>
            Entregar beneficio
          </Boton>
        </>
      }
    >
      <div className="space-y-5 px-6 py-5">
        {mensaje ? (
          <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">
            <Check size={16} />
            {mensaje}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-lg border border-terracota/30 bg-rose-50 px-3.5 py-3 text-sm text-terracota">
            {error}
          </p>
        ) : null}

        <div>
          <p className="mb-1 text-sm font-medium text-bosque-800">Elija qué le vamos a dar</p>
          <p className="mb-3 text-xs text-carbon/55">
            Los beneficios que no puede recibir aparecen apagados, con el motivo.
          </p>

          <ul className="space-y-2">
            {beneficios.map((b) => {
              const ordenBeneficio = NIVELES.findIndex((n) => n.nivel === b.nivelMinimo)
              const nivelInsuficiente = ordenCliente < ordenBeneficio
              const puntosInsuficientes = miembro.membresia.puntos < b.costoPuntos
              const bloqueado = nivelInsuficiente || puntosInsuficientes
              const activo = elegido === b.id

              return (
                <li key={b.id}>
                  <button
                    onClick={() => {
                      if (bloqueado) return
                      setElegido(b.id)
                      setError('')
                    }}
                    disabled={bloqueado}
                    className={clsx(
                      'flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
                      activo
                        ? 'border-bosque-600 bg-bosque-50'
                        : 'border-crema-300 bg-white hover:border-bosque-300',
                      bloqueado && 'cursor-not-allowed opacity-55 hover:border-crema-300',
                    )}
                  >
                    <span
                      className={clsx(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                        activo
                          ? 'border-bosque-600 bg-bosque-600 text-crema-50'
                          : 'border-crema-300 bg-white',
                      )}
                    >
                      {activo ? <Check size={12} strokeWidth={3} /> : null}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-bosque-800">{b.nombre}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-carbon/60">
                        {b.descripcion}
                      </span>
                      {bloqueado ? (
                        <span className="mt-1 block text-xs text-terracota">
                          {nivelInsuficiente
                            ? `Es para clientes ${nombreNivel(b.nivelMinimo)} o superior.`
                            : `Le faltan ${formatearNumero(b.costoPuntos - miembro.membresia.puntos)} puntos.`}
                        </span>
                      ) : null}
                    </span>

                    <span className="shrink-0 text-right">
                      <span className="block font-display text-lg text-bosque-800">
                        {b.costoPuntos === 0 ? 'Gratis' : formatearNumero(b.costoPuntos)}
                      </span>
                      <span className="block text-xs text-carbon/45">
                        {b.costoPuntos === 0 ? 'sin costo' : 'puntos'}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Ajuste manual de puntos */}
        {esGerencia ? (
          <div className="rounded-xl border border-crema-300 bg-crema-50 p-4">
            <p className="mb-1 text-sm font-medium text-bosque-800">
              Sumar o quitar puntos a mano
            </p>
            <p className="mb-3 text-xs leading-relaxed text-carbon/55">
              Para cortesías o correcciones. Escriba un número negativo para descontar.
            </p>

            <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
              <Campo etiqueta="Puntos">
                <Entrada
                  value={puntosManuales}
                  onChange={(e) => setPuntosManuales(e.target.value)}
                  placeholder="500"
                />
              </Campo>
              <Campo etiqueta="Motivo">
                <Entrada
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  placeholder="Cortesía por referir a un amigo"
                />
              </Campo>
              <Boton variante="secundario" icono={<Plus size={14} />} onClick={sumarPuntos}>
                Registrar
              </Boton>
            </div>
          </div>
        ) : null}

        {/* Historial de puntos del cliente */}
        <div>
          <p className="mb-2 text-sm font-medium text-bosque-800">
            Movimientos de puntos de este cliente
          </p>
          <ul className="overflow-hidden rounded-lg border border-crema-300 bg-white">
            {fidelizacionRepo.movimientosDe(miembro.membresia.clienteId).length === 0 ? (
              <li className="px-4 py-5 text-center text-xs text-carbon/45">
                Todavía no tiene movimientos.
              </li>
            ) : (
              fidelizacionRepo.movimientosDe(miembro.membresia.clienteId).map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 border-b border-crema-200 px-4 py-2.5 last:border-b-0"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-carbon/75">{m.concepto}</span>
                    <span className="block text-xs text-carbon/45">
                      {m.fecha.split('-').reverse().join('/')}
                    </span>
                  </span>
                  <span
                    className={clsx(
                      'shrink-0 font-display text-base',
                      m.puntos >= 0 ? 'text-emerald-700' : 'text-terracota',
                    )}
                  >
                    {m.puntos >= 0 ? '+' : ''}
                    {formatearNumero(m.puntos)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        <AreaTexto className="hidden" readOnly value="" />
      </div>
    </PanelLateral>
  )
}
