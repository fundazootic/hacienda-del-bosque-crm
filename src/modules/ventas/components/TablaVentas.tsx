import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Banknote, Check, Coins } from 'lucide-react'
import type { EstadoPago, Venta } from '@/core/types'
import {
  clientesRepo,
  equipoRepo,
  experienciasRepo,
  ventasRepo,
  valorNeto,
} from '@/core/data/repositories'
import { useSesion } from '@/core/auth/SesionContext'
import { etiquetaEstadoPago } from '@/core/utils/etiquetas'
import { formatearMoneda, formatearMonedaCompacta } from '@/core/utils/format'
import { formatearFechaCorta } from '@/core/utils/fecha'
import { Avatar, Etiqueta, EstadoVacio, Seleccion } from '@/ui'
import { ESTADOS_PAGO, etiquetaCategoriaVenta, TONO_PAGO } from '../services/ventasService'

/**
 * Listado de ventas.
 * El estado de pago se cambia en la propia fila: es la operación más frecuente
 * y no merece abrir un formulario.
 */
export function TablaVentas({
  ventas,
  mostrarCliente = true,
}: {
  ventas: Venta[]
  mostrarCliente?: boolean
}) {
  const { usuario, puede } = useSesion()
  const puedeEditar = puede('ventas:crear')

  if (ventas.length === 0) {
    return (
      <EstadoVacio
        titulo="Sin ventas"
        mensaje="No hay operaciones que coincidan con la búsqueda."
      />
    )
  }

  return (
    <ul className="divide-y divide-crema-200">
      {ventas.map((v) => {
        const responsable = equipoRepo.obtener(v.comercialId)
        const experiencia = v.experienciaId ? experienciasRepo.obtener(v.experienciaId) : undefined

        return (
          <li
            key={v.id}
            className="flex flex-wrap items-center gap-4 px-5 py-4 transition-colors hover:bg-crema-50/60"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-crema-100 text-bosque-500">
              <Banknote size={16} strokeWidth={1.7} />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-bosque-800">{v.descripcion}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[12.5px] text-carbon/50">
                <span className="text-bosque-500">{v.codigo}</span>
                <span>{formatearFechaCorta(v.fecha)}</span>
                {mostrarCliente ? (
                  <Link
                    to={`/clientes/${v.clienteId}`}
                    className="text-bosque-600 underline-offset-4 hover:underline"
                  >
                    {clientesRepo.nombreDe(v.clienteId)}
                  </Link>
                ) : null}
                <span>{etiquetaCategoriaVenta[v.categoria]}</span>
                {experiencia ? <span className="truncate">· {experiencia.titulo}</span> : null}
              </p>
            </div>

            <div className="hidden w-32 shrink-0 items-center gap-2 lg:flex">
              <Avatar
                iniciales={responsable?.iniciales ?? '—'}
                tamano="sm"
                tono={responsable?.rol === 'comercial_freelancer' ? 'laton' : 'bosque'}
              />
              <span className="min-w-0">
                <span className="block truncate text-xs text-carbon/70">
                  {responsable?.nombre.split(' ')[0] ?? ''}
                </span>
                {v.comisionValor > 0 ? (
                  <span
                    className={clsx(
                      'flex items-center gap-1 text-[11.5px]',
                      v.comisionLiquidada ? 'text-carbon/35' : 'text-laton-600',
                    )}
                  >
                    <Coins size={9} />
                    {formatearMonedaCompacta(v.comisionValor)}
                    {v.comisionLiquidada ? ' ✓' : ''}
                  </span>
                ) : null}
              </span>
            </div>

            {/* Estado de pago editable */}
            <div className="w-36 shrink-0">
              {puedeEditar ? (
                <Seleccion
                  className="h-8 text-[12.5px]"
                  value={v.estadoPago}
                  onChange={(e) =>
                    ventasRepo.cambiarEstadoPago(v.id, e.target.value as EstadoPago, usuario)
                  }
                  opciones={ESTADOS_PAGO.map((e) => ({ valor: e, texto: etiquetaEstadoPago[e] }))}
                />
              ) : (
                <Etiqueta tono={TONO_PAGO[v.estadoPago]}>
                  {etiquetaEstadoPago[v.estadoPago]}
                </Etiqueta>
              )}
            </div>

            <div className="w-28 shrink-0 text-right">
              <p className="font-display text-base text-bosque-800">
                {formatearMoneda(valorNeto(v))}
              </p>
              {v.descuento > 0 ? (
                <p className="text-[11.5px] text-carbon/40">
                  desc. {formatearMonedaCompacta(v.descuento)}
                </p>
              ) : (
                <p className="flex items-center justify-end gap-1 text-[11.5px] text-carbon/40">
                  {v.estadoPago === 'pagado' ? (
                    <>
                      <Check size={9} /> cobrado
                    </>
                  ) : (
                    'por cobrar'
                  )}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
