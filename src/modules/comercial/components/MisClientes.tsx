import { Link } from 'react-router-dom'
import { Repeat2, UserCheck } from 'lucide-react'
import type { Cliente } from '@/core/types'
import { inicialesDe, nombreCompleto } from '@/core/utils/cliente'
import { etiquetaCategoria } from '@/core/utils/etiquetas'
import { formatearMonedaCompacta } from '@/core/utils/format'
import { formatearFechaCorta } from '@/core/utils/fecha'
import { Avatar, Etiqueta, EstadoVacio } from '@/ui'
import { TONO_CATEGORIA } from '@/modules/clientes'

/**
 * «Mis clientes»: la cartera propia del comercial, ordenada por lo más
 * reciente que le asignaron. Cada fila dice desde cuándo la cuenta es suya y
 * si llegó por registro propio o por un traslado.
 */
export function MisClientes({ clientes, usuarioId }: { clientes: Cliente[]; usuarioId: string }) {
  if (clientes.length === 0) {
    return (
      <EstadoVacio
        titulo="Aún no tiene clientes asignados"
        mensaje="Registre un cliente nuevo o solicite a Gerencia el traslado de una cuenta."
      />
    )
  }

  return (
    <ul className="divide-y divide-crema-200">
      {clientes.map((cliente) => {
        const recibido = cliente.fechaAsignacion !== cliente.fechaRegistro
        const registradoPorMi = cliente.creadoPor === usuarioId

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

              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg leading-tight text-bosque-800">
                  {nombreCompleto(cliente)}
                </p>
                <p className="mt-0.5 truncate text-[12.5px] text-carbon/50">
                  {cliente.codigo}
                  {cliente.empresa ? ` · ${cliente.empresa}` : ''} · {cliente.ciudad}
                </p>
              </div>

              <div className="hidden w-28 shrink-0 sm:block">
                <Etiqueta tono={TONO_CATEGORIA[cliente.categoria]}>
                  {etiquetaCategoria[cliente.categoria]}
                </Etiqueta>
              </div>

              {/* Origen de la propiedad */}
              <div className="hidden w-44 shrink-0 md:block">
                <p className="flex items-center gap-1.5 text-[12.5px] text-bosque-600">
                  {recibido ? <Repeat2 size={12} /> : <UserCheck size={12} />}
                  {recibido
                    ? 'Recibido por traslado'
                    : registradoPorMi
                      ? 'Registrado por usted'
                      : 'Asignación inicial'}
                </p>
                <p className="text-[11.5px] uppercase tracking-wider text-carbon/35">
                  desde {formatearFechaCorta(cliente.fechaAsignacion)}
                </p>
              </div>

              <div className="w-24 shrink-0 text-right">
                <p className="font-display text-base text-bosque-800">
                  {cliente.valorHistorico > 0
                    ? formatearMonedaCompacta(cliente.valorHistorico)
                    : '—'}
                </p>
                <p className="text-[11.5px] text-carbon/45">
                  {cliente.ultimaVisita
                    ? formatearFechaCorta(cliente.ultimaVisita)
                    : 'sin visitas'}
                </p>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
