import type { Venta } from '@/core/types'
import { equipoRepo } from '@/core/data/repositories'
import { etiquetaEstadoPago } from '@/core/utils/etiquetas'
import { formatearMoneda, formatearMonedaCompacta } from '@/core/utils/format'
import { formatearFechaCorta } from '@/core/utils/fecha'
import { Etiqueta, EstadoVacio } from '@/ui'

const nombreCorto = (id?: string) =>
  id ? (equipoRepo.obtener(id)?.nombre.split(' ').slice(0, 2).join(' ') ?? '') : ''

function Vacio({ mensaje }: { mensaje: string }) {
  return <EstadoVacio titulo="Sin registros" mensaje={mensaje} />
}

export function ListaVentas({ items, total }: { items: Venta[]; total: number }) {
  if (!items.length) return <Vacio mensaje="No hay ventas registradas para este cliente." />

  return (
    <>
      <ul className="divide-y divide-crema-200">
        {items.map((v) => (
          <li
            key={v.id}
            className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-crema-50"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-bosque-800">{v.descripcion}</p>
              <p className="text-[12.5px] text-carbon/50">
                {v.codigo} · {formatearFechaCorta(v.fecha)} · {nombreCorto(v.comercialId)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Etiqueta tono={v.estadoPago === 'pagado' ? 'exito' : 'alerta'}>
                {etiquetaEstadoPago[v.estadoPago]}
              </Etiqueta>
              <span className="w-24 text-right font-display text-base text-bosque-800">
                {formatearMonedaCompacta(v.monto)}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-crema-200 bg-crema-50 px-5 py-3">
        <span className="text-xs text-carbon/60">Total registrado en el sistema</span>
        <span className="font-display text-lg text-bosque-800">{formatearMoneda(total)}</span>
      </div>
    </>
  )
}
