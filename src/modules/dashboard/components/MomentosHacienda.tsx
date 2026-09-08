import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Cake, CalendarHeart, Gift, PhoneCall, Star } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { clientesRepo, equipoRepo } from '@/core/data/repositories'
import { formatearMonedaCompacta } from '@/core/utils/format'
import { EstadoVacio } from '@/ui'
import { diasEntre, HOY, type Momento, type TipoMomento } from '../services/metricas'

const ICONOS: Record<TipoMomento, typeof Cake> = {
  cumpleanos: Cake,
  aniversario: Gift,
  evento: CalendarHeart,
  seguimiento: PhoneCall,
}

const TONOS: Record<TipoMomento, string> = {
  cumpleanos: 'bg-laton-100 text-laton-700',
  aniversario: 'bg-rose-50 text-terracota',
  evento: 'bg-bosque-50 text-bosque-600',
  seguimiento: 'bg-crema-200 text-carbon/60',
}

const FILTROS: { clave: TipoMomento | 'todos'; etiqueta: string }[] = [
  { clave: 'todos', etiqueta: 'Todos' },
  { clave: 'cumpleanos', etiqueta: 'Cumpleaños' },
  { clave: 'aniversario', etiqueta: 'Aniversarios' },
  { clave: 'evento', etiqueta: 'Eventos' },
  { clave: 'seguimiento', etiqueta: 'Seguimientos' },
]

function textoRelativo(fecha: string) {
  const dias = diasEntre(HOY, fecha)
  if (dias < 0) return `hace ${Math.abs(dias)} d`
  if (dias === 0) return 'hoy'
  if (dias === 1) return 'mañana'
  if (dias <= 7) return `en ${dias} días`
  return format(parseISO(fecha), "d 'de' MMM", { locale: es })
}

/**
 * Momentos Hacienda: cumpleaños, aniversarios, experiencias y seguimientos
 * importantes reunidos en una sola línea de tiempo accionable.
 */
export function MomentosHacienda({
  momentos,
  limite = 8,
}: {
  momentos: Momento[]
  limite?: number
}) {
  const [filtro, setFiltro] = useState<TipoMomento | 'todos'>('todos')

  const conteos = useMemo(() => {
    const base: Record<string, number> = { todos: momentos.length }
    for (const m of momentos) base[m.tipo] = (base[m.tipo] ?? 0) + 1
    return base
  }, [momentos])

  const visibles = useMemo(
    () => (filtro === 'todos' ? momentos : momentos.filter((m) => m.tipo === filtro)),
    [momentos, filtro],
  )

  const mostrados = visibles.slice(0, limite)
  const restantes = visibles.length - mostrados.length

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap gap-1.5 border-b border-crema-200 px-5 py-3">
        {FILTROS.map((f) => {
          const cantidad = conteos[f.clave] ?? 0
          const activo = filtro === f.clave
          return (
            <button
              key={f.clave}
              onClick={() => setFiltro(f.clave)}
              disabled={cantidad === 0}
              className={clsx(
                'rounded-full border px-3 py-1 text-[12.5px] transition-colors',
                activo
                  ? 'border-bosque-700 bg-bosque-700 text-crema-50'
                  : 'border-crema-300 bg-white text-carbon/60 hover:border-bosque-300 hover:text-bosque-700',
                cantidad === 0 && 'cursor-not-allowed opacity-40 hover:border-crema-300',
              )}
            >
              {f.etiqueta}
              <span className={clsx('ml-1.5', activo ? 'text-laton-300' : 'text-carbon/35')}>
                {cantidad}
              </span>
            </button>
          )
        })}
      </div>

      {mostrados.length === 0 ? (
        <EstadoVacio
          titulo="Sin momentos próximos"
          mensaje="No hay celebraciones ni compromisos en las próximas semanas."
        />
      ) : (
        <ul className="divide-y divide-crema-200">
          {mostrados.map((m) => {
            const Icono = ICONOS[m.tipo]
            const fecha = parseISO(m.fecha)

            return (
              <li
                key={m.id}
                className="flex items-center gap-3.5 px-5 py-3 transition-colors hover:bg-crema-50"
              >
                {/* Tarjetón de fecha */}
                <div className="flex w-11 shrink-0 flex-col items-center rounded-lg border border-crema-300 bg-crema-50 py-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-bosque-400">
                    {format(fecha, 'MMM', { locale: es })}
                  </span>
                  <span className="font-display text-xl leading-none text-bosque-800">
                    {format(fecha, 'd')}
                  </span>
                </div>

                <span
                  className={clsx(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    TONOS[m.tipo],
                  )}
                >
                  <Icono size={15} strokeWidth={1.7} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm text-bosque-800">
                    <span className="truncate">{m.titulo}</span>
                    {m.destacado && m.tipo !== 'evento' ? (
                      <Star size={12} className="shrink-0 fill-laton-300 text-laton-400" />
                    ) : null}
                  </p>
                  <p className="truncate text-[12.5px] text-carbon/50">
                    {m.tipo === 'evento' || m.tipo === 'seguimiento'
                      ? `${clientesRepo.nombreDe(m.clienteId)} · ${m.detalle}`
                      : m.detalle}
                    {m.comercialId ? ` · ${(equipoRepo.obtener(m.comercialId)?.nombre ?? '').split(' ')[0]}` : ''}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  {m.valor ? (
                    <p className="font-display text-sm text-bosque-800">
                      {formatearMonedaCompacta(m.valor)}
                    </p>
                  ) : null}
                  <p
                    className={clsx(
                      'text-[12.5px]',
                      m.vencido
                        ? 'font-medium text-terracota'
                        : diasEntre(HOY, m.fecha) === 0
                          ? 'font-medium text-laton-600'
                          : 'text-carbon/45',
                    )}
                  >
                    {m.vencido ? 'vencido' : textoRelativo(m.fecha)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {restantes > 0 ? (
        <p className="border-t border-crema-200 px-5 py-2.5 text-[12.5px] text-carbon/45">
          {restantes} {restantes === 1 ? 'momento más' : 'momentos más'} en los próximos 30 días
        </p>
      ) : null}
    </div>
  )
}
