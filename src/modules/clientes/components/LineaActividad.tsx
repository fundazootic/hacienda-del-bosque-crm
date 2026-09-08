import clsx from 'clsx'
import {
  Banknote,
  CalendarHeart,
  PhoneCall,
  ShieldAlert,
  UserPlus,
  Repeat2,
} from 'lucide-react'
import { equipoRepo } from '@/core/data/repositories'
import { formatearFechaCorta } from '@/core/utils/fecha'
import { formatearMonedaCompacta } from '@/core/utils/format'
import type { Actividad, TipoActividad } from '../services/clientesService'

const ICONOS: Record<TipoActividad, typeof UserPlus> = {
  registro: UserPlus,
  experiencia: CalendarHeart,
  seguimiento: PhoneCall,
  venta: Banknote,
  asignacion: Repeat2,
  duplicado: ShieldAlert,
}

const TONOS: Record<TipoActividad, string> = {
  registro: 'bg-crema-200 text-carbon/60',
  experiencia: 'bg-laton-100 text-laton-700',
  seguimiento: 'bg-crema-100 text-bosque-500',
  venta: 'bg-emerald-50 text-emerald-700',
  asignacion: 'bg-crema-200 text-carbon/60',
  duplicado: 'bg-amber-50 text-amber-600',
}

/** Línea de tiempo del cliente: todo lo ocurrido, del hecho más reciente al primero. */
export function LineaActividad({
  actividades,
  limite = 8,
}: {
  actividades: Actividad[]
  limite?: number
}) {
  const visibles = actividades.slice(0, limite)

  return (
    <div className="px-5 py-4">
      <ol className="relative space-y-4 border-l border-crema-300 pl-6">
        {visibles.map((a) => {
          const Icono = ICONOS[a.tipo]
          return (
            <li key={a.id} className="relative">
              <span
                className={clsx(
                  'absolute -left-[34px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white',
                  TONOS[a.tipo],
                )}
              >
                <Icono size={12} strokeWidth={1.8} />
              </span>

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm leading-snug text-bosque-800">{a.titulo}</p>
                  {a.detalle ? (
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-carbon/50">{a.detalle}</p>
                  ) : null}
                  <p className="mt-0.5 text-[11.5px] uppercase tracking-wider text-carbon/35">
                    {formatearFechaCorta(a.fecha)}
                    {a.comercialId
                      ? ` · ${equipoRepo.obtener(a.comercialId)?.nombre.split(' ')[0] ?? ''}`
                      : ''}
                  </p>
                </div>
                {a.valor ? (
                  <span className="shrink-0 font-display text-sm text-bosque-700">
                    {formatearMonedaCompacta(a.valor)}
                  </span>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>

      {actividades.length > visibles.length ? (
        <p className="mt-4 border-t border-crema-200 pt-3 text-[12.5px] text-carbon/45">
          {actividades.length - visibles.length} registros anteriores en el historial completo
        </p>
      ) : null}
    </div>
  )
}
