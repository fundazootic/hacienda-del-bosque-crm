import { ChevronRight } from 'lucide-react'
import type { EstadoExperiencia } from '@/core/types'
import { etiquetaEstadoExperiencia } from '@/core/utils/etiquetas'
import { formatearMonedaCompacta, formatearPorcentaje } from '@/core/utils/format'

interface EtapaPipeline {
  etapa: EstadoExperiencia
  cantidad: number
  valor: number
  proporcionValor: number
}

interface PipelineProps {
  etapas: EtapaPipeline[]
  valorTotal: number
  valorPonderado: number
  tasaCierre: number
  ganadas: number
  perdidas: number
}

const COLORES: Record<string, string> = {
  nuevo: 'bg-bosque-200',
  contactado: 'bg-bosque-300',
  visita: 'bg-bosque-400',
  cotizacion: 'bg-bosque-500',
  negociacion: 'bg-laton-400',
}

/**
 * Pipeline comercial en una sola franja: cuántas oportunidades hay en cada
 * etapa, cuánto valen y cómo se reparte el valor total en negociación.
 */
export function PipelineComercial({
  etapas,
  valorTotal,
  valorPonderado,
  tasaCierre,
  ganadas,
  perdidas,
}: PipelineProps) {
  return (
    <div>
      {/* Etapas */}
      <div className="grid grid-cols-2 lg:grid-cols-5">
        {etapas.map((etapa, indice) => (
          <div
            key={etapa.etapa}
            className="relative border-b border-crema-200 px-4 py-4 odd:border-r lg:border-b-0 lg:border-r lg:last:border-r-0"
          >
            <p className="truncate text-[11.5px] uppercase tracking-marca text-bosque-400">
              {etiquetaEstadoExperiencia[etapa.etapa]}
            </p>
            <p className="mt-1.5 flex items-baseline gap-1.5">
              <span className="font-display text-3xl leading-none text-bosque-800">
                {etapa.cantidad}
              </span>
              <span className="text-[12.5px] text-carbon/45">
                {etapa.cantidad === 1 ? 'experiencia' : 'experiencias'}
              </span>
            </p>
            <p className="mt-1 text-xs text-bosque-600">{formatearMonedaCompacta(etapa.valor)}</p>
            <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-crema-200">
              <div
                className={`h-full rounded-full ${COLORES[etapa.etapa]} transition-all duration-700`}
                style={{ width: `${Math.max(3, etapa.proporcionValor)}%` }}
              />
            </div>

            {/* Flecha de avance entre etapas */}
            {indice < etapas.length - 1 ? (
              <ChevronRight
                size={14}
                className="absolute -right-[7px] top-1/2 hidden -translate-y-1/2 text-crema-300 lg:block"
              />
            ) : null}
          </div>
        ))}
      </div>

      {/* Cierre del embudo */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-crema-200 bg-crema-50 px-5 py-3 lg:border-t">
        <p className="text-xs text-carbon/60">
          Valor en negociación{' '}
          <span className="ml-1 font-display text-lg text-bosque-800">
            {formatearMonedaCompacta(valorTotal)}
          </span>
        </p>
        <p className="text-xs text-carbon/60">
          Cierre probable{' '}
          <span className="ml-1 font-display text-lg text-bosque-700">
            {formatearMonedaCompacta(valorPonderado)}
          </span>
        </p>
        <p className="text-xs text-carbon/60">
          Negocios que terminan en venta{' '}
          <span className="ml-1 font-display text-lg text-bosque-800">
            {formatearPorcentaje(tasaCierre)}
          </span>
          <span className="ml-1.5 text-[12.5px] text-carbon/40">
            ({ganadas} ganadas · {perdidas} perdidas)
          </span>
        </p>
      </div>
    </div>
  )
}
