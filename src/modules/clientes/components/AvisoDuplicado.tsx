import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Repeat2, ShieldCheck } from 'lucide-react'
import type { Cliente } from '@/core/types'
import { comercialRepo, equipoRepo } from '@/core/data/repositories'
import { useSesion } from '@/core/auth/SesionContext'
import { inicialesDe, nombreCompleto } from '@/core/utils/cliente'
import { formatearFecha } from '@/core/utils/fecha'
import { Avatar, Boton } from '@/ui'
import { PanelSolicitud } from '@/modules/comercial'

/**
 * Aviso de cliente ya registrado.
 * No es un error del comercial: es el sistema protegiendo la propiedad de la
 * cartera. Por eso muestra con claridad quién es el responsable y ofrece la
 * salida natural, que es abrir la ficha existente.
 */
export function AvisoDuplicado({
  cliente,
  criterio,
  registrado = false,
  intentoDuplicadoId,
  onCerrarPanel,
}: {
  cliente: Cliente
  criterio: 'telefono' | 'email'
  /** true cuando el intento ya quedó guardado en la auditoría. */
  registrado?: boolean
  intentoDuplicadoId?: string
  onCerrarPanel?: () => void
}) {
  const { usuario } = useSesion()
  const [solicitando, setSolicitando] = useState(false)

  const responsable = equipoRepo.obtener(cliente.comercialId)
  const esSuyo = cliente.comercialId === usuario.id
  const yaSolicitado = comercialRepo.tieneSolicitudAbierta(cliente.id, usuario.id)

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
      <p className="font-display text-lg leading-tight text-bosque-800">
        Este cliente ya se encuentra registrado.
      </p>
      <p className="mt-1 text-xs text-carbon/60">
        Coincide el {criterio === 'telefono' ? 'número de teléfono' : 'correo electrónico'} con un
        registro existente en la cartera de la hacienda.
      </p>

      <div className="mt-3.5 rounded-lg border border-crema-300 bg-white p-3.5">
        <div className="flex items-center gap-3">
          <Avatar
            iniciales={inicialesDe(cliente)}
            tamano="md"
            tono={cliente.categoria === 'vip' ? 'laton' : 'claro'}
          />
          <div className="min-w-0 flex-1">
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
              Comercial responsable
            </dt>
            <dd className="mt-0.5 text-carbon/75">{responsable?.nombre ?? 'Sin asignar'}</dd>
          </div>
          <div>
            <dt className="text-[11.5px] uppercase tracking-wider text-bosque-400">
              Fecha de creación
            </dt>
            <dd className="mt-0.5 text-carbon/75">{formatearFecha(cliente.fechaRegistro)}</dd>
          </div>
        </dl>
      </div>

      {registrado ? (
        <p className="mt-3 flex items-start gap-2 text-[12.5px] leading-relaxed text-carbon/55">
          <ShieldCheck size={14} className="mt-px shrink-0 text-bosque-400" />
          El intento de creación quedó registrado en la auditoría del sistema. Si considera que el
          cliente le corresponde, solicite el traslado a Gerencia.
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/clientes/${cliente.id}`}
          onClick={onCerrarPanel}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-bosque-600 underline-offset-4 transition-colors hover:text-bosque-800 hover:underline"
        >
          Ver la ficha del cliente
          <ArrowRight size={13} />
        </Link>

        {!esSuyo ? (
          yaSolicitado ? (
            <span className="text-[12.5px] text-carbon/50">
              Ya tiene una solicitud pendiente sobre esta cuenta
            </span>
          ) : (
            <Boton
              variante="secundario"
              tamano="sm"
              icono={<Repeat2 size={14} />}
              onClick={() => setSolicitando(true)}
            >
              Solicitar reasignación
            </Boton>
          )
        ) : null}
      </div>

      <PanelSolicitud
        abierto={solicitando}
        onCerrar={() => setSolicitando(false)}
        cliente={cliente}
        origen="duplicado"
        intentoDuplicadoId={intentoDuplicadoId}
      />
    </div>
  )
}
