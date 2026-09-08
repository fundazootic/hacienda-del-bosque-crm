import { useMemo, useState } from 'react'
import clsx from 'clsx'
import {
  CalendarHeart,
  CalendarPlus,
  Award,
  Banknote,
  Coins,
  Gift,
  Mail,
  PhoneCall,
  CheckCheck,
  Settings2,
  FilePlus2,
  FileSignature,
  Repeat2,
  ShieldAlert,
  ThumbsDown,
  ThumbsUp,
  Send,
} from 'lucide-react'
import type { AccionAuditoria, RegistroAuditoria } from '@/core/types'
import { equipoRepo } from '@/core/data/repositories'
import { Avatar, EstadoVacio } from '@/ui'

const ICONOS: Record<AccionAuditoria, typeof Repeat2> = {
  cliente_creado: FilePlus2,
  cliente_editado: FileSignature,
  cliente_reasignado: Repeat2,
  duplicado_bloqueado: ShieldAlert,
  solicitud_creada: Send,
  solicitud_aprobada: ThumbsUp,
  solicitud_rechazada: ThumbsDown,
  experiencia_creada: CalendarPlus,
  experiencia_editada: FileSignature,
  experiencia_estado: CalendarHeart,
  alerta_ejecutada: Mail,
  alerta_configurada: Settings2,
  seguimiento_registrado: PhoneCall,
  seguimiento_cerrado: CheckCheck,
  venta_registrada: Banknote,
  venta_pago: Banknote,
  comision_liquidada: Coins,
  beneficio_entregado: Gift,
  puntos_registrados: Coins,
  nivel_actualizado: Award,
}

const TONOS: Record<AccionAuditoria, string> = {
  cliente_creado: 'bg-bosque-50 text-bosque-600',
  cliente_editado: 'bg-crema-200 text-carbon/60',
  cliente_reasignado: 'bg-laton-100 text-laton-700',
  duplicado_bloqueado: 'bg-amber-50 text-amber-600',
  solicitud_creada: 'bg-crema-100 text-bosque-500',
  solicitud_aprobada: 'bg-emerald-50 text-emerald-700',
  solicitud_rechazada: 'bg-rose-50 text-terracota',
  experiencia_creada: 'bg-bosque-50 text-bosque-600',
  experiencia_editada: 'bg-crema-200 text-carbon/60',
  experiencia_estado: 'bg-laton-100 text-laton-700',
  alerta_ejecutada: 'bg-crema-100 text-bosque-500',
  alerta_configurada: 'bg-crema-200 text-carbon/60',
  seguimiento_registrado: 'bg-crema-100 text-bosque-500',
  seguimiento_cerrado: 'bg-emerald-50 text-emerald-700',
  venta_registrada: 'bg-emerald-50 text-emerald-700',
  venta_pago: 'bg-crema-100 text-bosque-500',
  comision_liquidada: 'bg-laton-100 text-laton-700',
  beneficio_entregado: 'bg-laton-100 text-laton-700',
  puntos_registrados: 'bg-crema-100 text-bosque-500',
  nivel_actualizado: 'bg-emerald-50 text-emerald-700',
}

const FILTROS: { clave: AccionAuditoria | 'todas'; etiqueta: string }[] = [
  { clave: 'todas', etiqueta: 'Todo' },
  { clave: 'cliente_reasignado', etiqueta: 'Reasignaciones' },
  { clave: 'solicitud_creada', etiqueta: 'Solicitudes' },
  { clave: 'solicitud_aprobada', etiqueta: 'Aprobadas' },
  { clave: 'solicitud_rechazada', etiqueta: 'Rechazadas' },
  { clave: 'duplicado_bloqueado', etiqueta: 'Duplicados' },
  { clave: 'experiencia_estado', etiqueta: 'Etapas de experiencias' },
  { clave: 'experiencia_creada', etiqueta: 'Nuevas experiencias' },
  { clave: 'seguimiento_registrado', etiqueta: 'Gestiones' },
  { clave: 'seguimiento_cerrado', etiqueta: 'Cierres' },
  { clave: 'venta_registrada', etiqueta: 'Ventas' },
  { clave: 'beneficio_entregado', etiqueta: 'Beneficios' },
  { clave: 'comision_liquidada', etiqueta: 'Comisiones' },
  { clave: 'alerta_ejecutada', etiqueta: 'Correos' },
  { clave: 'cliente_creado', etiqueta: 'Altas' },
  { clave: 'cliente_editado', etiqueta: 'Ediciones' },
]

function fechaHora(iso: string) {
  const [fecha, hora] = iso.split('T')
  const [a, m, d] = fecha.split('-')
  return `${d}/${m}/${a}${hora ? ` · ${hora.slice(0, 5)}` : ''}`
}

/**
 * Bitácora de auditoría. Solo lectura: el sistema agrega, nadie edita ni borra.
 */
export function BitacoraAuditoria({ registros }: { registros: RegistroAuditoria[] }) {
  const [filtro, setFiltro] = useState<AccionAuditoria | 'todas'>('todas')

  const conteos = useMemo(() => {
    const base: Record<string, number> = { todas: registros.length }
    for (const r of registros) base[r.accion] = (base[r.accion] ?? 0) + 1
    return base
  }, [registros])

  const visibles = filtro === 'todas' ? registros : registros.filter((r) => r.accion === filtro)

  return (
    <div>
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

      {visibles.length === 0 ? (
        <EstadoVacio titulo="Sin registros" mensaje="No hay movimientos de este tipo." />
      ) : (
        <ul className="divide-y divide-crema-200">
          {visibles.map((r) => {
            const Icono = ICONOS[r.accion]
            const actor = equipoRepo.obtener(r.actorId)

            return (
              <li key={r.id} className="flex items-start gap-3.5 px-5 py-3.5">
                <span
                  className={clsx(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    TONOS[r.accion],
                  )}
                >
                  <Icono size={14} strokeWidth={1.8} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-bosque-800">{r.descripcion}</p>
                  {r.detalle ? (
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-carbon/50">
                      {Object.entries(r.detalle)
                        .filter(([, valor]) => valor !== undefined && valor !== '')
                        .map(([clave, valor]) => `${clave}: ${valor}`)
                        .join(' · ')}
                    </p>
                  ) : null}
                  <p className="mt-1 flex items-center gap-1.5 text-[11.5px] uppercase tracking-wider text-carbon/35">
                    <Avatar iniciales={actor?.iniciales ?? '—'} tamano="sm" tono="claro" />
                    {actor?.nombre ?? 'Sistema'} · {fechaHora(r.fecha)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <p className="border-t border-crema-200 bg-crema-50 px-5 py-2.5 text-[12.5px] text-carbon/45">
        Registro permanente: el sistema solo agrega entradas. Ni Gerencia puede editarlas o
        borrarlas.
      </p>
    </div>
  )
}
