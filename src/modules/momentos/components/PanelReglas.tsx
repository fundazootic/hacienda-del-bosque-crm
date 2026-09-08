import clsx from 'clsx'
import { Check, Mail, Monitor } from 'lucide-react'
import type { ReglaRecordatorio } from '@/core/types'
import { momentosRepo } from '@/core/data/repositories'
import { canalEsReal } from '@/core/notificaciones/notificador'
import { useSesion } from '@/core/auth/SesionContext'
import { Etiqueta } from '@/ui'
import {
  ANTICIPACIONES,
  ETIQUETA_ANTICIPACION,
  ETIQUETA_TIPO,
  ORDEN_TIPOS,
  TONO_TIPO,
} from '../services/momentosService'

/**
 * Reglas de recordatorio.
 * Una matriz de tipo × anticipación: Gerencia decide cuánto antes avisa el
 * sistema. El canal de correo aparece declarado pero deshabilitado hasta que
 * exista el servicio de envío.
 */
export function PanelReglas({ reglas }: { reglas: ReglaRecordatorio[] }) {
  const { esGerencia } = useSesion()
  const correoReal = canalEsReal('correo')

  return (
    <div>
      <div className="space-y-4 px-5 py-4">
        {ORDEN_TIPOS.map((tipo) => {
          const delTipo = reglas.filter((r) => r.tipo === tipo)
          if (delTipo.length === 0) return null

          return (
            <section key={tipo}>
              <div className="mb-2 flex items-center gap-2">
                <Etiqueta tono={TONO_TIPO[tipo]}>{ETIQUETA_TIPO[tipo]}</Etiqueta>
                <span className="text-[12.5px] text-carbon/45">
                  {delTipo.filter((r) => r.activa).length} de {delTipo.length} activas
                </span>
              </div>

              <ul className="space-y-1.5">
                {ANTICIPACIONES.filter((a) => delTipo.some((r) => r.anticipacion === a)).map((a) => {
                  const regla = delTipo.find((r) => r.anticipacion === a)!
                  return (
                    <li key={regla.id}>
                      <button
                        onClick={() => esGerencia && momentosRepo.alternarRegla(regla.id)}
                        disabled={!esGerencia}
                        className={clsx(
                          'flex w-full items-start gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors',
                          regla.activa
                            ? 'border-bosque-200 bg-bosque-50/60'
                            : 'border-crema-300 bg-white',
                          esGerencia
                            ? 'hover:border-bosque-300'
                            : 'cursor-default opacity-80',
                        )}
                      >
                        <span
                          className={clsx(
                            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                            regla.activa
                              ? 'border-bosque-600 bg-bosque-600 text-crema-50'
                              : 'border-crema-300 bg-white',
                          )}
                        >
                          {regla.activa ? <Check size={11} strokeWidth={3} /> : null}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-bosque-800">
                            {ETIQUETA_ANTICIPACION[regla.anticipacion]}
                          </span>
                          <span className="mt-0.5 block text-[12.5px] leading-relaxed text-carbon/50">
                            {regla.descripcion}
                          </span>
                        </span>

                        <span className="flex shrink-0 items-center gap-1.5">
                          <span
                            className={clsx(
                              'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px]',
                              regla.canales.includes('crm')
                                ? 'border-bosque-200 bg-white text-bosque-600'
                                : 'border-crema-300 text-carbon/35',
                            )}
                          >
                            <Monitor size={10} />
                            CRM
                          </span>
                          <span
                            className="flex items-center gap-1 rounded-full border border-crema-300 px-2 py-0.5 text-[11.5px] text-carbon/30"
                            title="El canal de correo está preparado pero no habilitado"
                          >
                            <Mail size={10} />
                            Correo
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>

      <p className="border-t border-crema-200 bg-crema-50 px-5 py-3 text-[12.5px] leading-relaxed text-carbon/50">
        {correoReal
          ? 'El canal de correo está conectado: los resúmenes del equipo salen de verdad.'
          : 'Estos recordatorios viven en la bandeja del CRM. El resumen diario por correo se configura en Configuración › Alertas por correo, y hoy funciona en modo de pruebas. Ningún mensaje sale hacia el cliente.'}
        {!esGerencia ? ' Solo Gerencia modifica estas reglas.' : ''}
      </p>
    </div>
  )
}
