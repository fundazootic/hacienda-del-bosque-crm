import { Coins, Info } from 'lucide-react'
import { ventasRepo } from '@/core/data/repositories'
import { useSesion } from '@/core/auth/SesionContext'
import { etiquetaRol } from '@/core/utils/etiquetas'
import { formatearMoneda, formatearMonedaCompacta } from '@/core/utils/format'
import { Avatar, BarraProgreso, Boton, Etiqueta, EstadoVacio } from '@/ui'
import type { ComisionComercial } from '../services/ventasService'

/**
 * Comisiones de los comerciales freelancer.
 * Solo se liquida la comisión de ventas ya pagadas: la hacienda no paga sobre
 * dinero que todavía no ha entrado.
 */
export function PanelComisiones({ comisiones }: { comisiones: ComisionComercial[] }) {
  const { usuario, esGerencia } = useSesion()

  if (comisiones.length === 0) {
    return (
      <EstadoVacio
        titulo="Sin comisiones"
        mensaje="Ningún comercial con comisión variable tiene ventas registradas este año."
      />
    )
  }

  return (
    <div>
      <ul className="divide-y divide-crema-200">
        {comisiones.map((c) => {
          const retenida = c.pendiente - c.pendienteLiquidable
          const avance = c.pendiente > 0 ? (c.pendienteLiquidable / c.pendiente) * 100 : 0

          return (
            <li key={c.comercial?.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start gap-4">
                <Avatar iniciales={c.comercial?.iniciales ?? '—'} tamano="lg" tono="laton" />

                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-lg leading-tight text-bosque-800">
                      {c.comercial?.nombre}
                    </span>
                    <Etiqueta tono="laton">{c.porcentaje} % de comisión</Etiqueta>
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-carbon/50">
                    {c.comercial ? etiquetaRol[c.comercial.rol] : ''} ·{' '}
                    {formatearMonedaCompacta(c.totalVendido)} vendidos en 2026 ·{' '}
                    {c.operacionesPendientes}{' '}
                    {c.operacionesPendientes === 1 ? 'operación pendiente' : 'operaciones pendientes'}
                  </p>

                  {c.pendiente > 0 ? (
                    <div className="mt-2 flex items-center gap-3">
                      <BarraProgreso porcentaje={avance} tono="laton" className="max-w-xs flex-1" />
                      <span className="text-[12.5px] text-carbon/45">
                        {formatearMonedaCompacta(c.pendienteLiquidable)} liquidable
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="w-32 shrink-0 text-right">
                  <p className="font-display text-xl text-bosque-800">
                    {formatearMoneda(c.pendiente)}
                  </p>
                  <p className="text-[11.5px] uppercase tracking-wider text-carbon/40">
                    por liquidar
                  </p>
                  {c.liquidado > 0 ? (
                    <p className="mt-1 text-[11.5px] text-carbon/40">
                      {formatearMonedaCompacta(c.liquidado)} ya liquidados
                    </p>
                  ) : null}
                </div>

                {esGerencia ? (
                  <div className="shrink-0">
                    <Boton
                      variante="primario"
                      tamano="sm"
                      icono={<Coins size={14} />}
                      disabled={c.pendienteLiquidable <= 0}
                      onClick={() =>
                        c.comercial && ventasRepo.liquidarComisiones(c.comercial.id, usuario)
                      }
                    >
                      Liquidar
                    </Boton>
                  </div>
                ) : null}
              </div>

              {retenida > 0 ? (
                <p className="mt-2 flex items-start gap-2 rounded-lg bg-crema-50 px-3 py-2 text-[12.5px] leading-relaxed text-carbon/55">
                  <Info size={13} className="mt-px shrink-0 text-amber-600" />
                  {formatearMoneda(retenida)} quedan en espera: corresponden a ventas que aún no
                  están pagadas.
                </p>
              ) : null}
            </li>
          )
        })}
      </ul>

      <p className="border-t border-crema-200 bg-crema-50 px-5 py-3 text-[12.5px] leading-relaxed text-carbon/50">
        La comisión se calcula sobre el valor neto con el porcentaje pactado de cada comercial: no
        se digita a mano. Los comerciales internos no generan comisión variable en esta etapa.
        {!esGerencia ? ' Solo Gerencia liquida.' : ''}
      </p>
    </div>
  )
}
