import { useState } from 'react'
import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'
import type { Usuario } from '@/core/types'
import { etiquetaRol } from '@/core/utils/etiquetas'
import {
  formatearMonedaCompacta,
  formatearNumero,
  formatearPorcentaje,
} from '@/core/utils/format'
import { Avatar, Etiqueta } from '@/ui'
import type { Canal, ResumenCanal } from '../services/metricas'

interface DetalleComercial {
  comercial: Usuario
  canal: Canal
  clientes: number
  oportunidades: number
  ventasCerradas: number
  valorVendido: number
  tasaConversion: number
}

const METRICAS: {
  clave: keyof ResumenCanal
  etiqueta: string
  formato: (v: number) => string
}[] = [
  { clave: 'clientesAsignados', etiqueta: 'Clientes asignados', formato: formatearNumero },
  { clave: 'oportunidades', etiqueta: 'Negocios trabajados', formato: formatearNumero },
  { clave: 'ventasCerradas', etiqueta: 'Ventas cerradas', formato: formatearNumero },
  { clave: 'valorVendido', etiqueta: 'Valor vendido', formato: formatearMonedaCompacta },
  { clave: 'tasaConversion', etiqueta: 'Cuántos cierran', formato: (v) => formatearPorcentaje(v) },
]

const BARRA: Record<Canal, string> = {
  interno: 'bg-bosque-500',
  freelancer: 'bg-laton-400',
}

const PUNTO: Record<Canal, string> = {
  interno: 'bg-bosque-500',
  freelancer: 'bg-laton-400',
}

/**
 * Comparativa del canal interno frente al canal freelancer.
 * Cada métrica se lee en paralelo: cifra y participación relativa.
 */
export function ActividadComercial({
  canales,
  detalle,
}: {
  canales: ResumenCanal[]
  detalle: DetalleComercial[]
}) {
  const [abierto, setAbierto] = useState(false)

  return (
    <div>
      {/* Cabecera de canales */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-crema-200 px-5 py-3">
        {canales.map((canal) => (
          <span key={canal.canal} className="flex items-center gap-2 text-xs text-carbon/65">
            <span className={clsx('h-2 w-2 rounded-full', PUNTO[canal.canal])} />
            {canal.nombre}
            <span className="text-carbon/40">
              · {canal.comerciales} {canal.comerciales === 1 ? 'asesor' : 'asesores'}
            </span>
          </span>
        ))}
        <span className="ml-auto text-[11.5px] uppercase tracking-marca text-bosque-400">
          Año 2026
        </span>
      </div>

      {/* Métricas comparadas */}
      <ul className="divide-y divide-crema-200">
        {METRICAS.map((metrica) => {
          const valores = canales.map((c) => Number(c[metrica.clave]))
          const maximo = Math.max(1, ...valores)

          return (
            <li key={String(metrica.clave)} className="px-5 py-3.5">
              <p className="mb-2 text-[11.5px] uppercase tracking-marca text-bosque-400">
                {metrica.etiqueta}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {canales.map((canal, i) => (
                  <div key={canal.canal} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 font-display text-xl leading-none text-bosque-800">
                      {metrica.formato(valores[i])}
                    </span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-crema-200">
                      <span
                        className={clsx(
                          'block h-full rounded-full transition-all duration-700',
                          BARRA[canal.canal],
                        )}
                        style={{ width: `${Math.max(3, (valores[i] / maximo) * 100)}%` }}
                      />
                    </span>
                  </div>
                ))}
              </div>
            </li>
          )
        })}
      </ul>

      {/* Detalle por asesor */}
      <div className="border-t border-crema-200">
        <button
          onClick={() => setAbierto((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3 text-xs font-medium text-bosque-600 transition-colors hover:bg-crema-50"
        >
          Detalle por asesor
          <ChevronDown
            size={15}
            className={clsx('transition-transform', abierto && 'rotate-180')}
          />
        </button>

        {abierto ? (
          <ul className="divide-y divide-crema-200 border-t border-crema-200">
            {detalle.map((fila) => (
              <li key={fila.comercial.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar
                  iniciales={fila.comercial.iniciales}
                  tamano="sm"
                  tono={fila.canal === 'freelancer' ? 'laton' : 'bosque'}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-bosque-800">{fila.comercial.nombre}</p>
                  <p className="truncate text-[12.5px] text-carbon/50">
                    {etiquetaRol[fila.comercial.rol]} · {fila.clientes} clientes ·{' '}
                    {fila.oportunidades} oportunidades
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-base text-bosque-800">
                    {formatearMonedaCompacta(fila.valorVendido)}
                  </p>
                  <p className="text-[11.5px] text-carbon/45">
                    {fila.ventasCerradas} {fila.ventasCerradas === 1 ? 'cerrada' : 'cerradas'} ·{' '}
                    {formatearPorcentaje(fila.tasaConversion)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}

/** Resumen de una sola línea con el canal más productivo del año. */
export function ResumenCanalDestacado({ canales }: { canales: ResumenCanal[] }) {
  const lider = [...canales].sort((a, b) => b.valorVendido - a.valorVendido)[0]
  if (!lider) return null

  return (
    <Etiqueta tono={lider.canal === 'interno' ? 'bosque' : 'laton'}>
      {lider.nombre} lidera con {formatearMonedaCompacta(lider.valorVendido)}
    </Etiqueta>
  )
}
