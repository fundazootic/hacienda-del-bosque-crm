import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { AlertTriangle, PartyPopper } from 'lucide-react'
import type { EstadoExperiencia, Experiencia } from '@/core/types'
import { clientesRepo, experienciasRepo } from '@/core/data/repositories'
import { useSesion } from '@/core/auth/SesionContext'
import { etiquetaEstadoExperiencia } from '@/core/utils/etiquetas'
import { formatearMoneda } from '@/core/utils/format'
import { AreaTexto, Boton, Campo, CampoBloque, Entrada, PanelLateral } from '@/ui'
import { MOTIVOS_PERDIDA } from '../services/experienciasService'

/**
 * Cierre de una experiencia.
 * Perder obliga a decir por qué; confirmar obliga a registrar el valor final.
 * Sin esos datos el movimiento no se ejecuta.
 */
export function PanelCambioEstado({
  experiencia,
  destino,
  onCerrar,
  onHecho,
}: {
  experiencia: Experiencia | null
  destino: EstadoExperiencia | null
  onCerrar: () => void
  onHecho?: () => void
}) {
  const { usuario } = useSesion()
  const [motivo, setMotivo] = useState('')
  const [valorFinal, setValorFinal] = useState('')
  const [nota, setNota] = useState('')
  const [error, setError] = useState('')

  const abierto = Boolean(experiencia && destino)
  const esPerdida = destino === 'perdido'
  const esConfirmacion = destino === 'confirmado'

  useEffect(() => {
    if (!abierto || !experiencia) return
    setMotivo(experiencia.motivoPerdida ?? '')
    setValorFinal(String(experiencia.valorFinal ?? experiencia.valorCotizado ?? ''))
    setNota('')
    setError('')
  }, [abierto, experiencia])

  if (!experiencia || !destino) return null

  const confirmar = () => {
    const resultado = experienciasRepo.cambiarEstado(experiencia.id, destino, usuario, {
      motivoPerdida: esPerdida ? motivo : undefined,
      valorFinal: esConfirmacion ? Number(valorFinal.replace(/\D/g, '')) : undefined,
      nota,
    })

    if (!resultado.ok) {
      setError(resultado.motivoRechazo ?? 'No fue posible mover la experiencia.')
      return
    }
    onHecho?.()
    onCerrar()
  }

  const valorNumerico = Number(valorFinal.replace(/\D/g, '')) || 0

  return (
    <PanelLateral
      abierto={abierto}
      onCerrar={onCerrar}
      antetitulo={experiencia.codigo}
      titulo={
        esPerdida
          ? 'Marcar como perdida'
          : esConfirmacion
            ? 'Confirmar experiencia'
            : `Mover a ${etiquetaEstadoExperiencia[destino]}`
      }
      descripcion={experiencia.titulo}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton variante={esPerdida ? 'secundario' : 'primario'} onClick={confirmar}>
            {esPerdida ? 'Registrar pérdida' : esConfirmacion ? 'Confirmar' : 'Mover'}
          </Boton>
        </>
      }
    >
      <div className="space-y-5 px-6 py-5">
        <div
          className={clsx(
            'flex items-start gap-3 rounded-xl border p-4',
            esPerdida
              ? 'border-rose-200 bg-rose-50/60'
              : esConfirmacion
                ? 'border-emerald-200 bg-emerald-50/60'
                : 'border-crema-300 bg-white',
          )}
        >
          <span
            className={clsx(
              'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
              esPerdida ? 'bg-rose-100 text-terracota' : 'bg-emerald-100 text-emerald-700',
            )}
          >
            {esPerdida ? <AlertTriangle size={16} /> : <PartyPopper size={16} />}
          </span>
          <div className="min-w-0 text-xs leading-relaxed text-carbon/70">
            <p className="font-medium text-bosque-800">
              {clientesRepo.nombreDe(experiencia.clienteId)} · {experiencia.numeroPersonas} personas
            </p>
            <p className="mt-0.5">
              {esPerdida
                ? 'La experiencia sale del tablero. El motivo queda en el historial y alimenta los reportes de pérdida.'
                : esConfirmacion
                  ? 'Al confirmar se registra el valor final acordado; con él se calculan las ventas y las comisiones.'
                  : `Pasa de ${etiquetaEstadoExperiencia[experiencia.estado]} a ${etiquetaEstadoExperiencia[destino]}.`}
            </p>
          </div>
        </div>

        {esPerdida ? (
          <>
            <CampoBloque etiqueta="Motivo de la pérdida" ayuda="Obligatorio.">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {MOTIVOS_PERDIDA.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMotivo(m)
                      setError('')
                    }}
                    className={clsx(
                      'rounded-full border px-3 py-1 text-[12.5px] transition-colors',
                      motivo === m
                        ? 'border-terracota bg-rose-50 text-terracota'
                        : 'border-crema-300 bg-white text-carbon/60 hover:border-bosque-300',
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <AreaTexto
                rows={3}
                value={motivo}
                onChange={(e) => {
                  setMotivo(e.target.value)
                  setError('')
                }}
                placeholder="Escriba el motivo o elija uno de los frecuentes."
              />
            </CampoBloque>
          </>
        ) : null}

        {esConfirmacion ? (
          <Campo
            etiqueta="Valor final acordado"
            requerido
            ancho="completo"
            ayuda={
              experiencia.valorCotizado
                ? `Cotizado: ${formatearMoneda(experiencia.valorCotizado)}`
                : undefined
            }
          >
            <Entrada
              inputMode="numeric"
              value={valorFinal}
              onChange={(e) => {
                setValorFinal(e.target.value)
                setError('')
              }}
              placeholder="0"
            />
            {valorNumerico > 0 ? (
              <span className="mt-1 block font-display text-lg text-bosque-800">
                {formatearMoneda(valorNumerico)}
              </span>
            ) : null}
          </Campo>
        ) : null}

        <Campo etiqueta="Nota para el historial" ancho="completo">
          <AreaTexto
            rows={2}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Opcional: qué pasó en esta etapa."
          />
        </Campo>

        {error ? (
          <p className="rounded-lg border border-terracota/30 bg-rose-50 px-3 py-2 text-xs text-terracota">
            {error}
          </p>
        ) : null}
      </div>
    </PanelLateral>
  )
}
