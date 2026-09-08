import clsx from 'clsx'
import { Avatar, BarraProgreso, Etiqueta, EstadoVacio } from '@/ui'
import { formatearMoneda, formatearNumero, formatearPorcentaje } from '@/core/utils/format'
import type { FilaEquipo } from '../services/reportesService'

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="min-w-[92px]">
      <p className="text-[11.5px] uppercase tracking-marca text-bosque-400">{etiqueta}</p>
      <p className="mt-0.5 font-display text-lg leading-none text-bosque-800">{valor}</p>
    </div>
  )
}

/**
 * Comparativa de comerciales.
 * Se ordena por lo vendido, pero se muestra al lado cuántos negocios cierra
 * cada uno: vender mucho trabajando el doble no es lo mismo.
 */
export function InformeEquipo({ filas }: { filas: FilaEquipo[] }) {
  if (filas.length === 0) {
    return <EstadoVacio titulo="Sin datos" mensaje="No hay actividad del equipo en este período." />
  }

  const mayor = Math.max(...filas.map((f) => f.vendido), 1)

  return (
    <ul className="divide-y divide-crema-200">
      {filas.map((f, indice) => (
        <li key={f.id} className="px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex min-w-[190px] flex-1 items-center gap-3">
              <Avatar
                iniciales={f.iniciales}
                tono={indice === 0 ? 'laton' : 'claro'}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-bosque-800">{f.nombre}</p>
                <p className="mt-0.5 flex items-center gap-2 text-[12.5px] text-carbon/50">
                  <Etiqueta tono={f.canal === 'Interno' ? 'bosque' : 'neutro'}>{f.canal}</Etiqueta>
                  {formatearNumero(f.clientes)} {f.clientes === 1 ? 'cliente' : 'clientes'}
                </p>
              </div>
            </div>

            <Dato etiqueta="Vendido" valor={formatearMoneda(f.vendido)} />
            <Dato etiqueta="Ticket promedio" valor={formatearMoneda(f.ticket)} />
            <Dato etiqueta="Trabajados" valor={formatearNumero(f.trabajadas)} />
            <Dato
              etiqueta="Cierra"
              valor={f.ganadas + f.perdidas > 0 ? formatearPorcentaje(f.cierre) : '—'}
            />
          </div>

          <div className="mt-3 flex items-center gap-3">
            <BarraProgreso
              porcentaje={(f.vendido / mayor) * 100}
              tono={indice === 0 ? 'laton' : 'bosque'}
              className="flex-1"
            />
            <p
              className={clsx(
                'shrink-0 text-[12.5px]',
                f.ganadas + f.perdidas === 0 ? 'text-carbon/40' : 'text-carbon/55',
              )}
            >
              {f.ganadas + f.perdidas === 0
                ? 'sin cierres en el período'
                : `${f.ganadas} ${f.ganadas === 1 ? 'ganado' : 'ganados'} · ${f.perdidas} ${
                    f.perdidas === 1 ? 'perdido' : 'perdidos'
                  }`}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
