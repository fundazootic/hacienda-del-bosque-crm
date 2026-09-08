import { useState } from 'react'
import clsx from 'clsx'
import { Check, Clock, Eye, Mail, Send, Users2 } from 'lucide-react'
import type { AlertaCorreo } from '@/core/types'
import { correoRepo } from '@/core/data/repositories'
import { canalEsReal } from '@/core/notificaciones/notificador'
import { useSesion } from '@/core/auth/SesionContext'
import { etiquetaRol } from '@/core/utils/etiquetas'
import { formatearFechaCorta } from '@/core/utils/fecha'
import { Avatar, Boton, Entrada, Etiqueta, Interruptor } from '@/ui'
import { VENTANAS_RESUMEN } from '@/core/notificaciones/plantillas'

/**
 * Configuración de una alerta por correo.
 * Los destinatarios se eligen de la lista de usuarios del CRM: no existe forma
 * de escribir una dirección suelta, y por tanto de escribirle a un cliente.
 */
export function PanelAlertaCorreo({
  alerta,
  onVistaPrevia,
  onEnviar,
  enviando,
}: {
  alerta: AlertaCorreo
  onVistaPrevia: () => void
  onEnviar: () => void
  enviando: boolean
}) {
  const { usuario } = useSesion()
  const equipo = correoRepo.destinatariosPosibles()
  const [hora, setHora] = useState(alerta.horaEnvio)

  const real = canalEsReal('correo')

  return (
    <div className="divide-y divide-crema-200">
      {/* Estado de la alerta */}
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-display text-xl text-bosque-800">{alerta.nombre}</span>
            <Etiqueta tono={alerta.activa ? 'exito' : 'neutro'}>
              {alerta.activa ? 'Activa' : 'Inactiva'}
            </Etiqueta>
            <Etiqueta tono="contorno">Diaria</Etiqueta>
          </p>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-carbon/55">
            {alerta.descripcion}
          </p>
          {alerta.ultimoEnvio ? (
            <p className="mt-1.5 text-[12.5px] text-carbon/45">
              Última corrida: {formatearFechaCorta(alerta.ultimoEnvio.slice(0, 10))} ·{' '}
              {alerta.ultimoEnvio.slice(11, 16)}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Boton variante="secundario" icono={<Eye size={15} />} onClick={onVistaPrevia}>
            Vista previa
          </Boton>
          <Boton
            variante="primario"
            icono={<Send size={15} />}
            onClick={onEnviar}
            disabled={!alerta.activa || enviando}
          >
            {enviando ? 'Generando…' : 'Ejecutar ahora'}
          </Boton>
        </div>
      </div>

      {/* Interruptores y hora */}
      <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
        <Interruptor
          activo={alerta.activa}
          onCambiar={(v) => correoRepo.actualizarAlerta(alerta.id, { activa: v })}
          titulo="Enviar el resumen diario"
          descripcion="Mientras esté apagada, la alerta no se ejecuta ni manual ni automáticamente."
        />

        <div>
          <span className="mb-1.5 block text-[12.5px] font-medium uppercase tracking-wider text-bosque-500">
            <Clock size={11} className="mr-1 inline" />
            Hora de envío
          </span>
          <Entrada
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            onBlur={() => correoRepo.actualizarAlerta(alerta.id, { horaEnvio: hora })}
          />
          <span className="mt-1 block text-[12.5px] text-carbon/45">
            El disparo automático a esta hora lo hará el servidor cuando exista el backend; hoy la
            alerta se ejecuta desde el botón.
          </span>
        </div>

        <div className="sm:col-span-2">
          <Interruptor
            activo={alerta.soloCarteraPropia}
            onCambiar={(v) => correoRepo.actualizarAlerta(alerta.id, { soloCarteraPropia: v })}
            titulo="Cada comercial recibe solo su cartera"
            descripcion="Gerencia recibe siempre el resumen completo de la hacienda."
          />
        </div>
      </div>

      {/* Ventanas incluidas */}
      <div className="px-5 py-4">
        <p className="eyebrow mb-2">Agrupaciones incluidas</p>
        <div className="flex flex-wrap gap-1.5">
          {VENTANAS_RESUMEN.map((v) => {
            const incluida = alerta.ventanas.includes(v.dias)
            return (
              <button
                key={v.dias}
                onClick={() => correoRepo.alternarVentana(alerta.id, v.dias)}
                className={clsx(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors',
                  incluida
                    ? 'border-bosque-700 bg-bosque-700 text-crema-50'
                    : 'border-crema-300 bg-white text-carbon/60 hover:border-bosque-300',
                )}
              >
                {incluida ? <Check size={12} /> : null}
                {v.etiqueta}
              </button>
            )
          })}
        </div>
      </div>

      {/* Destinatarios */}
      <div className="px-5 py-4">
        <p className="eyebrow mb-1 flex items-center gap-1.5">
          <Users2 size={12} />
          Quién recibe la alerta
        </p>
        <p className="mb-3 text-[12.5px] text-carbon/50">
          Solo usuarios del CRM. {alerta.destinatarios.length} de {equipo.length} seleccionados.
        </p>

        <ul className="grid gap-1.5 sm:grid-cols-2">
          {equipo.map((u) => {
            const activo = alerta.destinatarios.includes(u.id)
            return (
              <li key={u.id}>
                <button
                  onClick={() => correoRepo.alternarDestinatario(alerta.id, u.id)}
                  className={clsx(
                    'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                    activo
                      ? 'border-bosque-200 bg-bosque-50/60'
                      : 'border-crema-300 bg-white hover:border-bosque-300',
                  )}
                >
                  <span
                    className={clsx(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                      activo
                        ? 'border-bosque-600 bg-bosque-600 text-crema-50'
                        : 'border-crema-300 bg-white',
                    )}
                  >
                    {activo ? <Check size={11} strokeWidth={3} /> : null}
                  </span>
                  <Avatar
                    iniciales={u.iniciales}
                    tamano="sm"
                    tono={u.rol === 'gerencia' ? 'laton' : 'claro'}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-bosque-800">
                      {u.nombre}
                      {u.id === usuario.id ? (
                        <span className="ml-1.5 text-[11.5px] text-carbon/40">(usted)</span>
                      ) : null}
                    </span>
                    <span className="block truncate text-[12.5px] text-carbon/50">{u.email}</span>
                  </span>
                  <span className="hidden shrink-0 text-[11.5px] uppercase tracking-wider text-carbon/35 sm:block">
                    {etiquetaRol[u.rol].replace('Comercial ', '')}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Estado del canal */}
      <div className="flex items-start gap-2.5 bg-crema-50 px-5 py-3.5">
        <Mail size={15} className="mt-0.5 shrink-0 text-bosque-400" />
        <p className="text-[12.5px] leading-relaxed text-carbon/60">
          {real ? (
            <>El canal de correo está conectado: los envíos salen de verdad.</>
          ) : (
            <>
              <span className="font-medium text-bosque-700">Todavía en pruebas.</span> El sistema arma
              el correo completo, lo dirige a las personas elegidas y guarda la fecha y el
              resultado, pero aún no está conectado el servicio que lo entrega. Cuando se conecte,
              esta misma configuración empezará a enviarlo sin cambiar nada.
            </>
          )}{' '}
          Ninguna alerta escribe al cliente: los destinatarios son siempre usuarios del CRM.
        </p>
      </div>
    </div>
  )
}
