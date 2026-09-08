import { Link } from 'react-router-dom'
import { BellOff, Building2, ChevronRight, MapPin } from 'lucide-react'
import type { Cliente } from '@/core/types'
import { equipoRepo } from '@/core/data/repositories'
import { inicialesDe, nombreCompleto } from '@/core/utils/cliente'
import { etiquetaCategoria } from '@/core/utils/etiquetas'
import { formatearMonedaCompacta } from '@/core/utils/format'
import { formatearFechaCorta } from '@/core/utils/fecha'
import { Avatar, Etiqueta, EstadoVacio } from '@/ui'
import { diasSinVisitar, TONO_CATEGORIA } from '../services/clientesService'

/**
 * Listado de la cartera. Se prefiere una lista respirada a una tabla densa:
 * cada renglón es una ficha en miniatura, no una fila de hoja de cálculo.
 */
export function ListaClientes({ clientes }: { clientes: Cliente[] }) {
  if (clientes.length === 0) {
    return (
      <EstadoVacio
        titulo="Ningún cliente coincide"
        mensaje="Ajuste la búsqueda o los filtros para encontrar a quien busca."
      />
    )
  }

  return (
    <ul className="divide-y divide-crema-200">
      {clientes.map((cliente) => {
        const responsable = equipoRepo.obtener(cliente.comercialId)
        const dias = diasSinVisitar(cliente)

        return (
          <li key={cliente.id}>
            <Link
              to={`/clientes/${cliente.id}`}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-crema-50"
            >
              <Avatar
                iniciales={inicialesDe(cliente)}
                tamano="lg"
                tono={cliente.categoria === 'vip' ? 'laton' : 'claro'}
              />

              {/* Identidad */}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate">
                  <span className="truncate font-display text-lg leading-tight text-bosque-800">
                    {nombreCompleto(cliente)}
                  </span>
                  {!cliente.autorizaComunicaciones ? (
                    <BellOff
                      size={13}
                      className="shrink-0 text-carbon/30"
                      aria-label="No autoriza comunicaciones"
                    />
                  ) : null}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12.5px] text-carbon/50">
                  <span className="text-bosque-500">{cliente.codigo}</span>
                  {cliente.empresa ? (
                    <span className="flex items-center gap-1 truncate">
                      <Building2 size={11} />
                      {cliente.empresa}
                      {cliente.cargo ? ` · ${cliente.cargo}` : ''}
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1">
                    <MapPin size={11} />
                    {cliente.ciudad}
                  </span>
                </p>
              </div>

              {/* Categoría */}
              <div className="hidden w-28 shrink-0 sm:block">
                <Etiqueta tono={TONO_CATEGORIA[cliente.categoria]}>
                  {etiquetaCategoria[cliente.categoria]}
                </Etiqueta>
              </div>

              {/* Responsable comercial */}
              <div className="hidden w-40 shrink-0 items-center gap-2 lg:flex">
                <Avatar
                  iniciales={responsable?.iniciales ?? '—'}
                  tamano="sm"
                  tono={responsable?.rol === 'comercial_freelancer' ? 'laton' : 'bosque'}
                />
                <span className="min-w-0">
                  <span className="block truncate text-xs text-carbon/70">
                    {responsable?.nombre.split(' ').slice(0, 2).join(' ') ?? 'Sin asignar'}
                  </span>
                  <span className="block text-[11.5px] uppercase tracking-wider text-carbon/35">
                    Responsable
                  </span>
                </span>
              </div>

              {/* Valor y recencia */}
              <div className="hidden w-28 shrink-0 text-right md:block">
                <p className="font-display text-base text-bosque-800">
                  {cliente.valorHistorico > 0
                    ? formatearMonedaCompacta(cliente.valorHistorico)
                    : '—'}
                </p>
                <p className="text-[11.5px] text-carbon/45">
                  {cliente.ultimaVisita
                    ? dias !== null && dias > 90
                      ? `hace ${Math.round(dias / 30)} meses`
                      : formatearFechaCorta(cliente.ultimaVisita)
                    : 'sin visitas'}
                </p>
              </div>

              <ChevronRight size={16} className="shrink-0 text-carbon/25" />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
