import clsx from 'clsx'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import type { CategoriaCliente, Cliente, OrigenCliente } from '@/core/types'
import { equipoRepo } from '@/core/data/repositories'
import { etiquetaCategoria, etiquetaOrigen } from '@/core/utils/etiquetas'
import { useSesion } from '@/core/auth/SesionContext'
import { Seleccion } from '@/ui'
import {
  ciudadesDe,
  conteosPorCategoria,
  hayFiltrosActivos,
  ORDEN_CATEGORIAS,
  type FiltrosClientes as Filtros,
  type OrdenClientes,
} from '../services/clientesService'

interface Props {
  filtros: Filtros
  onCambiar: (filtros: Filtros) => void
  onLimpiar: () => void
  orden: OrdenClientes
  onOrdenar: (orden: OrdenClientes) => void
  universo: Cliente[]
}

const ORIGENES: (OrigenCliente | 'todos')[] = [
  'todos',
  'referido',
  'redes_sociales',
  'pagina_web',
  'visita_espontanea',
  'evento_previo',
  'alianza',
  'prensa',
  'gestion_comercial',
]

export function FiltrosClientes({
  filtros,
  onCambiar,
  onLimpiar,
  orden,
  onOrdenar,
  universo,
}: Props) {
  const { alcance } = useSesion()
  const conteos = conteosPorCategoria(universo)
  const ciudades = ciudadesDe(universo)
  const activos = hayFiltrosActivos(filtros)

  const categorias: (CategoriaCliente | 'todas')[] = ['todas', ...ORDEN_CATEGORIAS]

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-carbon/30"
        />
        <input
          value={filtros.texto}
          onChange={(e) => onCambiar({ ...filtros, texto: e.target.value })}
          placeholder="Buscar por nombre, empresa, teléfono, correo o código…"
          className="h-12 w-full rounded-xl border border-crema-300 bg-white pl-12 pr-10 text-sm text-carbon shadow-suave placeholder:text-carbon/35 focus:border-bosque-300 focus:outline-none focus:ring-2 focus:ring-bosque-100"
        />
        {filtros.texto ? (
          <button
            onClick={() => onCambiar({ ...filtros, texto: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-carbon/35 transition-colors hover:bg-crema-100 hover:text-carbon/60"
            aria-label="Limpiar búsqueda"
          >
            <X size={15} />
          </button>
        ) : null}
      </div>

      {/* Categorías */}
      <div className="flex flex-wrap gap-1.5">
        {categorias.map((cat) => {
          const cantidad = cat === 'todas' ? universo.length : (conteos[cat] ?? 0)
          const activa = filtros.categoria === cat
          return (
            <button
              key={cat}
              onClick={() => onCambiar({ ...filtros, categoria: cat })}
              className={clsx(
                'rounded-full border px-3.5 py-1.5 text-xs transition-colors',
                activa
                  ? 'border-bosque-700 bg-bosque-700 text-crema-50'
                  : 'border-crema-300 bg-white text-carbon/65 hover:border-bosque-300 hover:text-bosque-700',
              )}
            >
              {cat === 'todas' ? 'Toda la cartera' : etiquetaCategoria[cat]}
              <span className={clsx('ml-1.5', activa ? 'text-laton-300' : 'text-carbon/35')}>
                {cantidad}
              </span>
            </button>
          )
        })}
      </div>

      {/* Filtros finos */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-crema-300/70 bg-white px-3 py-2.5 shadow-suave">
        <span className="flex items-center gap-1.5 pr-1 text-[11.5px] uppercase tracking-marca text-bosque-400">
          <SlidersHorizontal size={13} />
          Filtros
        </span>

        {alcance === 'todos' ? (
          <div className="w-48">
            <Seleccion
              className="h-9 text-xs"
              value={filtros.comercialId}
              onChange={(e) => onCambiar({ ...filtros, comercialId: e.target.value })}
              opciones={[
                { valor: 'todos', texto: 'Todos los comerciales' },
                ...equipoRepo.comerciales().map((u) => ({ valor: u.id, texto: u.nombre })),
              ]}
            />
          </div>
        ) : null}

        <div className="w-44">
          <Seleccion
            className="h-9 text-xs"
            value={filtros.origen}
            onChange={(e) => onCambiar({ ...filtros, origen: e.target.value as OrigenCliente })}
            opciones={ORIGENES.map((o) => ({
              valor: o,
              texto: o === 'todos' ? 'Todos los orígenes' : etiquetaOrigen[o],
            }))}
          />
        </div>

        <div className="w-40">
          <Seleccion
            className="h-9 text-xs"
            value={filtros.ciudad}
            onChange={(e) => onCambiar({ ...filtros, ciudad: e.target.value })}
            opciones={[
              { valor: 'todas', texto: 'Todas las ciudades' },
              ...ciudades.map((c) => ({ valor: c, texto: c })),
            ]}
          />
        </div>

        <button
          onClick={() => onCambiar({ ...filtros, soloAutorizados: !filtros.soloAutorizados })}
          className={clsx(
            'h-9 rounded-lg border px-3 text-xs transition-colors',
            filtros.soloAutorizados
              ? 'border-bosque-600 bg-bosque-50 text-bosque-700'
              : 'border-crema-300 bg-white text-carbon/60 hover:border-bosque-300',
          )}
        >
          Autorizan comunicaciones
        </button>

        <div className="ml-auto flex items-center gap-2">
          <div className="w-48">
            <Seleccion
              className="h-9 text-xs"
              value={orden}
              onChange={(e) => onOrdenar(e.target.value as OrdenClientes)}
              opciones={[
                { valor: 'recientes', texto: 'Registro más reciente' },
                { valor: 'nombre', texto: 'Nombre A–Z' },
                { valor: 'valor', texto: 'Mayor valor histórico' },
                { valor: 'visita', texto: 'Última visita' },
              ]}
            />
          </div>
          {activos ? (
            <button
              onClick={onLimpiar}
              className="text-xs text-bosque-500 underline-offset-4 transition-colors hover:text-bosque-700 hover:underline"
            >
              Limpiar
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
