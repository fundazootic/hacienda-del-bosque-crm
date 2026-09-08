import { useState } from 'react'
import { Mail } from 'lucide-react'
import type { AlertaCorreo, Usuario } from '@/core/types'
import { correoRepo } from '@/core/data/repositories'
import { canalEsReal } from '@/core/notificaciones/notificador'
import { Boton, PanelLateral, Seleccion } from '@/ui'

/**
 * Vista previa del correo tal como lo recibiría cada destinatario.
 * El cuerpo se renderiza en un iframe aislado: es el mismo HTML que saldría por
 * el canal, no una maqueta aparte.
 */
export function VistaPreviaCorreo({
  abierto,
  onCerrar,
  alerta,
  cuerpoFijo,
  asuntoFijo,
}: {
  abierto: boolean
  onCerrar: () => void
  alerta: AlertaCorreo
  /** Cuerpo ya generado (cuando se abre desde el historial). */
  cuerpoFijo?: string
  asuntoFijo?: string
}) {
  const equipo = correoRepo.destinatariosPosibles()
  const preferido =
    equipo.find((u) => alerta.destinatarios.includes(u.id)) ?? equipo[0]
  const [destinatarioId, setDestinatarioId] = useState(preferido?.id ?? '')

  const destinatario: Usuario | undefined =
    equipo.find((u) => u.id === destinatarioId) ?? preferido

  const previa =
    cuerpoFijo && asuntoFijo
      ? { asunto: asuntoFijo, cuerpoHtml: cuerpoFijo, resumen: null }
      : destinatario
        ? correoRepo.vistaPrevia(alerta, destinatario)
        : undefined

  return (
    <PanelLateral
      abierto={abierto}
      onCerrar={onCerrar}
      ancho="lg"
      antetitulo="Alerta por correo"
      titulo="Vista previa del resumen"
      descripcion="Así llega el correo al equipo interno."
      pie={
        <Boton variante="primario" onClick={onCerrar}>
          Cerrar
        </Boton>
      }
    >
      <div className="space-y-4 px-6 py-5">
        {!cuerpoFijo ? (
          <div>
            <span className="mb-1.5 block text-[12.5px] font-medium uppercase tracking-wider text-bosque-500">
              Ver como
            </span>
            <Seleccion
              value={destinatarioId}
              onChange={(e) => setDestinatarioId(e.target.value)}
              opciones={equipo.map((u) => ({
                valor: u.id,
                texto: `${u.nombre}${alerta.destinatarios.includes(u.id) ? ' · destinatario' : ''}`,
              }))}
            />
            <span className="mt-1 block text-[12.5px] text-carbon/45">
              Cada comercial ve su propia cartera si la alerta está configurada así.
            </span>
          </div>
        ) : null}

        {/* Cabecera del mensaje */}
        <div className="rounded-xl border border-crema-300 bg-white p-4">
          <dl className="space-y-2 text-xs">
            <div className="flex gap-2">
              <dt className="w-16 shrink-0 text-[11.5px] uppercase tracking-wider text-bosque-400">
                Para
              </dt>
              <dd className="min-w-0 text-carbon/75">
                {destinatario?.nombre} &lt;{destinatario?.email}&gt;
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-16 shrink-0 text-[11.5px] uppercase tracking-wider text-bosque-400">
                Asunto
              </dt>
              <dd className="min-w-0 font-medium text-bosque-800">{previa?.asunto}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-16 shrink-0 text-[11.5px] uppercase tracking-wider text-bosque-400">
                Canal
              </dt>
              <dd className="min-w-0 text-carbon/75">
                Correo · {canalEsReal('correo') ? 'conectado' : 'todavía en pruebas'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Cuerpo real */}
        <div className="overflow-hidden rounded-xl border border-crema-300 bg-crema-100">
          <p className="flex items-center gap-1.5 border-b border-crema-300 bg-white px-4 py-2 text-[11.5px] uppercase tracking-marca text-bosque-400">
            <Mail size={12} />
            Cuerpo del mensaje
          </p>
          {previa?.cuerpoHtml ? (
            <iframe
              title="Vista previa del correo"
              srcDoc={previa.cuerpoHtml}
              className="h-[560px] w-full border-0 bg-crema-100"
              sandbox=""
            />
          ) : (
            <p className="px-4 py-8 text-center text-xs text-carbon/45">
              Seleccione un destinatario para ver el mensaje.
            </p>
          )}
        </div>
      </div>
    </PanelLateral>
  )
}
