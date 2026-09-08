import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { CheckCheck } from 'lucide-react'
import type { ResultadoSeguimiento, Seguimiento, TipoSeguimiento } from '@/core/types'
import { clientesRepo, seguimientosRepo } from '@/core/data/repositories'
import { useSesion } from '@/core/auth/SesionContext'
import { etiquetaSeguimiento } from '@/core/utils/etiquetas'
import { formatearFechaCorta } from '@/core/utils/fecha'
import {
  AreaTexto,
  Boton,
  Campo,
  Entrada,
  Interruptor,
  PanelLateral,
  Seleccion,
} from '@/ui'
import {
  etiquetaResultado,
  HOY,
  RESULTADOS,
  sumarDias,
  TIPOS_SEGUIMIENTO,
} from '../services/seguimientosService'

/**
 * Cierre de una acción pendiente.
 * Obliga a decir cómo salió y ofrece encadenar el siguiente paso en el mismo
 * gesto: es lo que evita que un cliente quede sin próxima gestión.
 */
export function PanelCierre({
  seguimiento,
  onCerrar,
}: {
  seguimiento: Seguimiento | null
  onCerrar: () => void
}) {
  const { usuario } = useSesion()
  const [resultado, setResultado] = useState<ResultadoSeguimiento>('exitoso')
  const [nota, setNota] = useState('')
  const [encadenar, setEncadenar] = useState(true)
  const [tipo, setTipo] = useState<TipoSeguimiento>('llamada')
  const [proxima, setProxima] = useState('')
  const [fecha, setFecha] = useState(sumarDias(HOY, 7))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!seguimiento) return
    setResultado('exitoso')
    setNota('')
    setEncadenar(true)
    setTipo(seguimiento.tipo)
    setProxima('')
    setFecha(sumarDias(HOY, 7))
    setError('')
  }, [seguimiento])

  if (!seguimiento) return null

  const confirmar = () => {
    if (encadenar && !proxima.trim()) {
      setError('Describa el siguiente paso o desactive el encadenado.')
      return
    }

    seguimientosRepo.completar(seguimiento.id, usuario, {
      resultado,
      nota,
      siguiente: encadenar
        ? { tipo, proximaAccion: proxima.trim(), fechaProximaAccion: fecha }
        : undefined,
    })
    onCerrar()
  }

  return (
    <PanelLateral
      abierto={Boolean(seguimiento)}
      onCerrar={onCerrar}
      antetitulo={clientesRepo.nombreDe(seguimiento.clienteId)}
      titulo="Cerrar la acción"
      descripcion={seguimiento.proximaAccion ?? seguimiento.asunto}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton variante="primario" icono={<CheckCheck size={15} />} onClick={confirmar}>
            Registrar cierre
          </Boton>
        </>
      }
    >
      <div className="space-y-5 px-6 py-5">
        <div className="rounded-xl border border-crema-300 bg-white p-4">
          <p className="eyebrow mb-2">Acción comprometida</p>
          <p className="text-sm text-bosque-800">
            {seguimiento.proximaAccion ?? seguimiento.asunto}
          </p>
          <p className="mt-1 text-[12.5px] text-carbon/50">
            {etiquetaSeguimiento[seguimiento.tipo]} ·{' '}
            {seguimiento.fechaProximaAccion
              ? `comprometida para el ${formatearFechaCorta(seguimiento.fechaProximaAccion)}`
              : 'sin fecha'}
          </p>
        </div>

        <div>
          <span className="mb-2 block text-[12.5px] font-medium uppercase tracking-wider text-bosque-500">
            ¿Cómo salió?
          </span>
          <div className="flex flex-wrap gap-1.5">
            {RESULTADOS.map((r) => (
              <button
                key={r}
                onClick={() => setResultado(r)}
                className={clsx(
                  'rounded-full border px-3 py-1.5 text-xs transition-colors',
                  resultado === r
                    ? 'border-bosque-700 bg-bosque-700 text-crema-50'
                    : 'border-crema-300 bg-white text-carbon/60 hover:border-bosque-300',
                )}
              >
                {etiquetaResultado[r]}
              </button>
            ))}
          </div>
        </div>

        <Campo etiqueta="Nota del cierre" ancho="completo">
          <AreaTexto
            rows={3}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Qué respondió el cliente. Se agrega al detalle de la gestión."
          />
        </Campo>

        <Interruptor
          activo={encadenar}
          onCambiar={setEncadenar}
          titulo="Programar la siguiente gestión"
          descripcion="Recomendado: si no queda un próximo paso, el cliente sale de la agenda."
        />

        {encadenar ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Tipo">
              <Seleccion
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoSeguimiento)}
                opciones={TIPOS_SEGUIMIENTO.map((t) => ({
                  valor: t,
                  texto: etiquetaSeguimiento[t],
                }))}
              />
            </Campo>
            <Campo etiqueta="Fecha comprometida">
              <Entrada type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </Campo>
            <Campo etiqueta="Siguiente acción" ancho="completo">
              <Entrada
                value={proxima}
                onChange={(e) => {
                  setProxima(e.target.value)
                  setError('')
                }}
                placeholder="Confirmar aforo definitivo con el cliente"
              />
            </Campo>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-lg border border-terracota/30 bg-rose-50 px-3 py-2 text-xs text-terracota">
            {error}
          </p>
        ) : null}
      </div>
    </PanelLateral>
  )
}
