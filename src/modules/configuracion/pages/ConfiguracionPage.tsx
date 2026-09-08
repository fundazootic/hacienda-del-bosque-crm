import { useMemo, useState } from 'react'
import { Bell, History, Mail, Settings, ShieldCheck } from 'lucide-react'
import type { EnvioCorreo } from '@/core/types'
import { useSesion } from '@/core/auth/SesionContext'
import { useDatos } from '@/core/data/store'
import { correoRepo, momentosRepo } from '@/core/data/repositories'
import { canalEsReal } from '@/core/notificaciones/notificador'
import {
  CabeceraTarjeta,
  EncabezadoPagina,
  Etiqueta,
  Indicador,
  Pestanas,
  Tarjeta,
  type Pestana,
} from '@/ui'
import { PanelReglas } from '@/modules/momentos'
import { PanelAlertaCorreo } from '../components/PanelAlertaCorreo'
import { HistorialEnvios } from '../components/HistorialEnvios'
import { VistaPreviaCorreo } from '../components/VistaPreviaCorreo'

export default function ConfiguracionPage() {
  const version = useDatos()
  const { usuario } = useSesion()

  const alertas = useMemo(() => correoRepo.alertas(), [version])
  const envios = useMemo(() => correoRepo.envios(), [version])
  const reglas = useMemo(() => momentosRepo.reglas(), [version])

  const alerta = alertas[0]

  const [pestana, setPestana] = useState('correo')
  const [previa, setPrevia] = useState(false)
  const [envioVisto, setEnvioVisto] = useState<EnvioCorreo | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [ultimo, setUltimo] = useState<EnvioCorreo | null>(null)

  const ejecutar = async () => {
    setEnviando(true)
    const envio = await correoRepo.ejecutar(alerta.id, 'manual', usuario)
    setUltimo(envio ?? null)
    setEnviando(false)
  }

  const pestanas: Pestana[] = [
    { clave: 'correo', etiqueta: 'Alertas por correo', contador: alertas.length },
    { clave: 'reglas', etiqueta: 'Recordatorios del CRM', contador: reglas.filter((r) => r.activa).length },
    { clave: 'historial', etiqueta: 'Historial de envíos', contador: envios.length },
  ]

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        antetitulo="Sistema"
        titulo="Configuración"
        descripcion="Parámetros del CRM. En esta etapa: las alertas por correo al equipo interno y las reglas de recordatorio."
      />

      {/* Estado del sistema de notificaciones */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          etiqueta="Canal de correo"
          valor={canalEsReal('correo') ? 'Conectado' : 'En pruebas'}
          detalle={canalEsReal('correo') ? 'los correos salen' : 'se arma y se guarda, no se envía'}
          icono={<Mail size={16} />}
        />
        <Indicador
          etiqueta="Alertas activas"
          valor={String(alertas.filter((a) => a.activa).length)}
          detalle={`de ${alertas.length} configuradas`}
          icono={<Settings size={16} />}
        />
        <Indicador
          etiqueta="Destinatarios"
          valor={String(alerta?.destinatarios.length ?? 0)}
          detalle="usuarios del equipo"
          icono={<Bell size={16} />}
        />
        <Indicador
          etiqueta="Envíos registrados"
          valor={String(envios.length)}
          detalle="con fecha y resultado"
          icono={<History size={16} />}
        />
      </section>

      {/* Resultado de la última ejecución manual */}
      {ultimo ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-bosque-200 bg-bosque-50/60 px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm text-bosque-800">
              Alerta ejecutada · {ultimo.detalle}
            </p>
            <p className="mt-0.5 text-[12.5px] text-carbon/55">
              {ultimo.destinatarios.length}{' '}
              {ultimo.destinatarios.length === 1 ? 'destinatario' : 'destinatarios'} ·{' '}
              {ultimo.resultado === 'simulado'
                ? 'el correo quedó armado y guardado, pero todavía no sale'
                : ultimo.resultado}
            </p>
          </div>
          <button
            onClick={() => {
              setEnvioVisto(ultimo)
              setPestana('historial')
            }}
            className="text-xs text-bosque-600 underline-offset-4 hover:underline"
          >
            Ver el correo generado
          </button>
        </div>
      ) : null}

      <Tarjeta>
        <Pestanas pestanas={pestanas} activa={pestana} onCambiar={setPestana} />

        {pestana === 'correo' && alerta ? (
          <PanelAlertaCorreo
            alerta={alerta}
            enviando={enviando}
            onVistaPrevia={() => setPrevia(true)}
            onEnviar={ejecutar}
          />
        ) : null}

        {pestana === 'reglas' ? (
          <>
            <div className="border-b border-crema-200 px-5 py-3">
              <p className="text-xs leading-relaxed text-carbon/55">
                Recordatorios que Momentos Hacienda genera dentro del CRM. Se pueden activar o
                desactivar aquí y también desde el propio módulo.
              </p>
            </div>
            <PanelReglas reglas={reglas} />
          </>
        ) : null}

        {pestana === 'historial' ? (
          <HistorialEnvios envios={envios} onVerCuerpo={setEnvioVisto} />
        ) : null}
      </Tarjeta>

      {/* Garantía sobre el cliente */}
      <Tarjeta>
        <CabeceraTarjeta
          titulo="Qué no hace el sistema"
          descripcion="Límites deliberados de esta etapa."
          icono={<ShieldCheck size={16} />}
        />
        <ul className="grid gap-2 px-5 py-4 sm:grid-cols-2">
          {[
            'No se envía ningún correo ni mensaje al cliente.',
            'Los destinatarios se eligen de la lista de usuarios: no se puede escribir una dirección suelta.',
            'Cada corrida queda registrada con su fecha, sus destinatarios y su resultado.',
            'Al conectar el servicio de mensajería, esta misma configuración empieza a enviar sin cambios.',
          ].map((texto) => (
            <li
              key={texto}
              className="flex items-start gap-2 rounded-lg border border-crema-200 bg-crema-50 px-3 py-2 text-xs leading-relaxed text-carbon/70"
            >
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-laton-400" />
              {texto}
            </li>
          ))}
        </ul>
      </Tarjeta>

      {/* Pendiente de configurar */}
      <Tarjeta>
        <CabeceraTarjeta
          titulo="Pendiente en Configuración"
          descripcion="Áreas ya previstas en la arquitectura."
          icono={<Settings size={16} />}
          acciones={<Etiqueta tono="contorno">Próxima etapa</Etiqueta>}
        />
        <ul className="grid gap-2 px-5 py-4 sm:grid-cols-2">
          {[
            'Usuarios, roles y permisos',
            'Espacios de la hacienda y capacidades',
            'Menús y experiencias disponibles',
            'Etiquetas, categorías y orígenes de cliente',
            'Parámetros del programa de fidelización',
            'Reglas de propiedad comercial y antiduplicados',
          ].map((texto) => (
            <li
              key={texto}
              className="flex items-start gap-2 px-1 text-xs text-carbon/55"
            >
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-crema-300" />
              {texto}
            </li>
          ))}
        </ul>
      </Tarjeta>

      {alerta ? (
        <VistaPreviaCorreo
          abierto={previa || Boolean(envioVisto)}
          onCerrar={() => {
            setPrevia(false)
            setEnvioVisto(null)
          }}
          alerta={alerta}
          cuerpoFijo={envioVisto?.cuerpoHtml}
          asuntoFijo={envioVisto?.asunto}
        />
      ) : null}
    </div>
  )
}
