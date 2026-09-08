import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  BellOff,
  BellRing,
  Building2,
  MapPin,
  Pencil,
  Phone,
  Mail,
} from 'lucide-react'
import type { Cliente } from '@/core/types'
import { inicialesDe, nombreCompleto } from '@/core/utils/cliente'
import { etiquetaCategoria, etiquetaOrigen } from '@/core/utils/etiquetas'
import { formatearFecha } from '@/core/utils/fecha'
import { Boton, Etiqueta } from '@/ui'
import { TONO_CATEGORIA } from '../services/clientesService'

/**
 * Encabezado de la ficha: se lee como la portada del expediente de un huésped,
 * no como la cabecera de un formulario.
 */
export function FichaEncabezado({
  cliente,
  onEditar,
}: {
  cliente: Cliente
  onEditar: () => void
}) {
  return (
    <div className="space-y-5">
      <Link
        to="/clientes"
        className="inline-flex items-center gap-1.5 text-xs text-carbon/50 transition-colors hover:text-bosque-600"
      >
        <ArrowLeft size={14} />
        Volver a la cartera
      </Link>

      <div className="overflow-hidden rounded-xl border border-bosque-700 bg-bosque-800 bg-trama-hoja shadow-suave">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:justify-between lg:p-7">
          <div className="flex items-start gap-5">
            {/* Monograma */}
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-laton-400/50 font-display text-2xl text-laton-300">
              {inicialesDe(cliente)}
            </span>

            <div className="min-w-0">
              <p className="text-[11.5px] uppercase tracking-marca text-laton-300">
                {cliente.codigo} · Cliente desde {formatearFecha(cliente.fechaRegistro, 'MMMM yyyy')}
              </p>
              <h1 className="mt-1.5 font-display text-3xl font-light leading-tight text-crema-50">
                {nombreCompleto(cliente)}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-crema-200/70">
                {cliente.empresa ? (
                  <span className="flex items-center gap-1.5">
                    <Building2 size={13} className="text-laton-300/70" />
                    {cliente.empresa}
                    {cliente.cargo ? ` · ${cliente.cargo}` : ''}
                  </span>
                ) : null}
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-laton-300/70" />
                  {cliente.ciudad}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone size={13} className="text-laton-300/70" />
                  {cliente.telefono}
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail size={13} className="text-laton-300/70" />
                  {cliente.email}
                </span>
              </div>

              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12.5px] font-medium ${
                    cliente.categoria === 'vip'
                      ? 'bg-laton-400 text-bosque-800'
                      : 'bg-bosque-700 text-crema-100'
                  }`}
                >
                  {etiquetaCategoria[cliente.categoria]}
                </span>
                <span className="rounded-full border border-bosque-600 px-2.5 py-0.5 text-[12.5px] text-crema-200/70">
                  Origen: {etiquetaOrigen[cliente.origen]}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12.5px] ${
                    cliente.autorizaComunicaciones
                      ? 'bg-emerald-400/15 text-emerald-300'
                      : 'bg-rose-400/15 text-rose-300'
                  }`}
                >
                  {cliente.autorizaComunicaciones ? (
                    <BellRing size={11} />
                  ) : (
                    <BellOff size={11} />
                  )}
                  {cliente.autorizaComunicaciones
                    ? 'Autoriza comunicaciones'
                    : 'No autoriza comunicaciones'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <Boton variante="laton" icono={<Pencil size={15} />} onClick={onEditar}>
              Editar ficha
            </Boton>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Cinta de cifras del cliente, bajo el encabezado. */
export function CintaIndicadores({
  items,
}: {
  items: { etiqueta: string; valor: string; detalle?: string }[]
}) {
  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-crema-200 overflow-hidden rounded-xl border border-crema-300/70 bg-white shadow-suave sm:grid-cols-4 sm:divide-y-0">
      {items.map((item) => (
        <div key={item.etiqueta} className="px-5 py-4">
          <p className="text-[11.5px] uppercase tracking-marca text-bosque-400">{item.etiqueta}</p>
          <p className="mt-1.5 font-display text-2xl leading-none text-bosque-800">{item.valor}</p>
          {item.detalle ? (
            <p className="mt-1 text-[12.5px] text-carbon/45">{item.detalle}</p>
          ) : null}
        </div>
      ))}
    </div>
  )
}
