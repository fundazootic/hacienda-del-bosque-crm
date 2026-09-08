import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { X } from 'lucide-react'
import { GRUPOS, MODULOS, type GrupoModulo } from '@/app/modulos'
import { useSesion } from '@/core/auth/SesionContext'
import { etiquetaRol } from '@/core/utils/etiquetas'
import { Avatar } from '@/ui'

const ORDEN_GRUPOS: GrupoModulo[] = ['operacion', 'crecimiento', 'sistema']

/** Escudo tipográfico de la hacienda. */
function Marca() {
  return (
    <div className="px-6 pb-6 pt-7">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-laton-400/50 font-display text-lg text-laton-300">
          HB
        </span>
        <div className="leading-none">
          <p className="font-display text-lg tracking-wide text-crema-50">Hacienda</p>
          <p className="font-display text-lg tracking-wide text-crema-50">del Bosque</p>
        </div>
      </div>
      <div className="mt-4 h-px w-full bg-gradient-to-r from-laton-400/60 via-laton-400/15 to-transparent" />
      <p className="mt-3 text-[11px] uppercase tracking-marca text-crema-200/45">
        Cali · Valle del Cauca
      </p>
    </div>
  )
}

interface SidebarProps {
  abierto: boolean
  onCerrar: () => void
}

export function Sidebar({ abierto, onCerrar }: SidebarProps) {
  const { usuario, puede } = useSesion()

  const modulosVisibles = MODULOS.filter((m) => puede(m.permiso))

  return (
    <>
      {/* Velo para móvil */}
      <div
        className={clsx(
          'fixed inset-0 z-30 bg-bosque-900/50 backdrop-blur-sm transition-opacity lg:hidden',
          abierto ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onCerrar}
        aria-hidden
      />

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col bg-bosque-800 bg-trama-hoja text-crema-100',
          'transition-transform duration-300 ease-out lg:translate-x-0',
          abierto ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-start justify-between">
          <Marca />
          <button
            onClick={onCerrar}
            className="mr-4 mt-6 rounded-lg p-2 text-crema-200/70 transition-colors hover:bg-bosque-700 lg:hidden"
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {ORDEN_GRUPOS.map((grupo) => {
            const items = modulosVisibles.filter((m) => m.grupo === grupo)
            if (items.length === 0) return null

            return (
              <div key={grupo} className="mb-6">
                <p className="px-3 pb-2 text-[11px] uppercase tracking-marca text-crema-200/40">
                  {GRUPOS[grupo]}
                </p>
                <ul className="space-y-0.5">
                  {items.map((modulo) => {
                    const Icono = modulo.icono
                    return (
                      <li key={modulo.id}>
                        <NavLink
                          to={modulo.ruta}
                          end={modulo.ruta === '/'}
                          onClick={onCerrar}
                          className={({ isActive }) =>
                            clsx(
                              'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                              isActive
                                ? 'bg-bosque-700/80 text-crema-50'
                                : 'text-crema-200/70 hover:bg-bosque-700/40 hover:text-crema-50',
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <span
                                className={clsx(
                                  'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full transition-all',
                                  isActive ? 'bg-laton-400 opacity-100' : 'opacity-0',
                                )}
                              />
                              <Icono
                                size={17}
                                strokeWidth={1.6}
                                className={clsx(
                                  'shrink-0 transition-colors',
                                  isActive ? 'text-laton-300' : 'text-crema-200/60',
                                )}
                              />
                              <span className="truncate">{modulo.etiqueta}</span>
                            </>
                          )}
                        </NavLink>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </nav>

        <div className="border-t border-bosque-700/70 px-4 py-4">
          <div className="flex items-center gap-3">
            <Avatar iniciales={usuario.iniciales} tono="laton" />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-crema-50">{usuario.nombre}</p>
              <p className="truncate text-[11.5px] uppercase tracking-wider text-laton-300/80">
                {etiquetaRol[usuario.rol]}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
