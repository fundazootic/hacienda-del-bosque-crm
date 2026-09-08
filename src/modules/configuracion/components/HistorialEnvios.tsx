import { useState } from 'react'
import clsx from 'clsx'
import { AlertTriangle, CheckCircle2, ChevronDown, Eye, Inbox, MailCheck } from 'lucide-react'
import type { EnvioCorreo, ResultadoEnvio } from '@/core/types'
import { Boton, Etiqueta, EstadoVacio, type TonoEtiqueta } from '@/ui'

const TONO: Record<ResultadoEnvio, TonoEtiqueta> = {
  enviado: 'exito',
  simulado: 'bosque',
  error: 'peligro',
  sin_destinatarios: 'alerta',
  sin_contenido: 'neutro',
}

const ETIQUETA: Record<ResultadoEnvio, string> = {
  enviado: 'Enviado',
  simulado: 'En pruebas',
  error: 'Con errores',
  sin_destinatarios: 'Sin destinatarios',
  sin_contenido: 'Sin contenido',
}

const ICONO: Record<ResultadoEnvio, typeof MailCheck> = {
  enviado: MailCheck,
  simulado: Inbox,
  error: AlertTriangle,
  sin_destinatarios: AlertTriangle,
  sin_contenido: CheckCircle2,
}

const fechaHora = (iso: string) => {
  const [fecha, hora] = iso.split('T')
  const [a, m, d] = fecha.split('-')
  return `${d}/${m}/${a} · ${hora?.slice(0, 5) ?? ''}`
}

/**
 * Bitácora de envíos: cada corrida de una alerta deja su fecha, sus
 * destinatarios y el resultado. No se edita ni se borra.
 */
export function HistorialEnvios({
  envios,
  onVerCuerpo,
}: {
  envios: EnvioCorreo[]
  onVerCuerpo?: (envio: EnvioCorreo) => void
}) {
  const [abierto, setAbierto] = useState<string | null>(null)

  if (envios.length === 0) {
    return (
      <EstadoVacio
        titulo="Sin envíos registrados"
        mensaje="Cuando la alerta se ejecute, la corrida quedará aquí con su resultado."
      />
    )
  }

  return (
    <ul className="divide-y divide-crema-200">
      {envios.map((envio) => {
        const Icono = ICONO[envio.resultado]
        const desplegado = abierto === envio.id
        const entregados = envio.destinatarios.filter((d) => d.entregado).length

        return (
          <li key={envio.id}>
            <button
              onClick={() => setAbierto(desplegado ? null : envio.id)}
              className="flex w-full items-start gap-3.5 px-5 py-4 text-left transition-colors hover:bg-crema-50"
            >
              <span
                className={clsx(
                  'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                  envio.resultado === 'enviado'
                    ? 'bg-emerald-50 text-emerald-700'
                    : envio.resultado === 'error' || envio.resultado === 'sin_destinatarios'
                      ? 'bg-rose-50 text-terracota'
                      : 'bg-crema-100 text-bosque-500',
                )}
              >
                <Icono size={16} strokeWidth={1.7} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm text-bosque-800">{envio.asunto}</span>
                  <Etiqueta tono={TONO[envio.resultado]}>{ETIQUETA[envio.resultado]}</Etiqueta>
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[12.5px] text-carbon/50">
                  <span>{fechaHora(envio.fecha)}</span>
                  <span>
                    {envio.destinatarios.length}{' '}
                    {envio.destinatarios.length === 1 ? 'destinatario' : 'destinatarios'}
                  </span>
                  <span>{envio.detalle}</span>
                  <span className="text-bosque-500">
                    {envio.disparadoPor === 'manual' ? 'ejecución manual' : 'programado'}
                  </span>
                </p>
              </div>

              <ChevronDown
                size={16}
                className={clsx(
                  'mt-1 shrink-0 text-carbon/30 transition-transform',
                  desplegado && 'rotate-180',
                )}
              />
            </button>

            {desplegado ? (
              <div className="border-t border-crema-200 bg-crema-50/70 px-5 py-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="eyebrow">
                    Destinatarios · {entregados} de {envio.destinatarios.length} entregados
                  </p>
                  {envio.cuerpoHtml && onVerCuerpo ? (
                    <Boton
                      variante="secundario"
                      tamano="sm"
                      icono={<Eye size={14} />}
                      onClick={() => onVerCuerpo(envio)}
                    >
                      Ver el correo
                    </Boton>
                  ) : null}
                </div>

                {envio.destinatarios.length === 0 ? (
                  <p className="text-xs text-carbon/50">
                    No había destinatarios válidos configurados.
                  </p>
                ) : (
                  <ul className="overflow-hidden rounded-lg border border-crema-300 bg-white">
                    {envio.destinatarios.map((d) => (
                      <li
                        key={d.usuarioId}
                        className="flex flex-wrap items-center justify-between gap-2 border-b border-crema-200 px-4 py-2.5 last:border-b-0"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-bosque-800">{d.nombre}</span>
                          <span className="block truncate text-[12.5px] text-carbon/50">
                            {d.email} · {d.registros}{' '}
                            {d.registros === 1 ? 'registro' : 'registros'}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <Etiqueta tono={d.entregado ? 'exito' : 'neutro'}>
                            {d.entregado ? 'Entregado' : 'Compuesto'}
                          </Etiqueta>
                          {d.motivo ? (
                            <span className="mt-0.5 block max-w-xs text-[11.5px] text-carbon/40">
                              {d.motivo}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
