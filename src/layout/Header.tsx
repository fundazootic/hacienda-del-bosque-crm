import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { Bell, Cake, CalendarHeart, ChevronDown, Gift, Menu, Plus, Search, UserRoundX } from 'lucide-react'
import { useSesion } from '@/core/auth/SesionContext'
import { moduloPorRuta } from '@/app/modulos'
import { etiquetaRol } from '@/core/utils/etiquetas'
import { Avatar, Boton } from '@/ui'
import { momentosRepo } from '@/core/data/repositories'
import { useDatos } from '@/core/data/store'
import { formatearFechaCorta } from '@/core/utils/fecha'
import type { TipoMomento } from '@/core/types'

const HOY = new Date('2026-09-04T09:00:00')

const fechaLarga = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}).format(HOY)

/** Selector de sesión: permite demostrar los roles ante Gerencia. */
function SelectorUsuario() {
  const { usuario, usuariosDisponibles, cambiarUsuario } = useSesion()
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const alClic = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('mousedown', alClic)
    return () => document.removeEventListener('mousedown', alClic)
  }, [])

  return (
    <div className="relative" ref={contenedor}>
      <button
        onClick={() => setAbierto((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-crema-300 bg-white py-1 pl-1 pr-2.5 transition-colors hover:border-bosque-300"
      >
        <Avatar iniciales={usuario.iniciales} tamano="sm" />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-xs font-medium text-bosque-800">
            {usuario.nombre.split(' ')[0]} {usuario.nombre.split(' ')[1]}
          </span>
          <span className="block text-[11.5px] text-carbon/50">{etiquetaRol[usuario.rol]}</span>
        </span>
        <ChevronDown size={14} className="text-carbon/40" />
      </button>

      {abierto ? (
        <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-crema-300 bg-white shadow-elevada">
          <p className="border-b border-crema-200 px-4 py-3 text-[11.5px] uppercase tracking-marca text-bosque-400">
            Ver el CRM como
          </p>
          <ul className="max-h-80 overflow-y-auto py-1">
            {usuariosDisponibles.map((u) => (
              <li key={u.id}>
                <button
                  onClick={() => {
                    cambiarUsuario(u.id)
                    setAbierto(false)
                  }}
                  className={clsx(
                    'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-crema-100',
                    u.id === usuario.id && 'bg-crema-100',
                  )}
                >
                  <Avatar
                    iniciales={u.iniciales}
                    tamano="sm"
                    tono={u.rol === 'gerencia' ? 'laton' : 'claro'}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-bosque-800">
                      {u.nombre}
                    </span>
                    <span className="block truncate text-[11.5px] text-carbon/50">{u.cargo}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="border-t border-crema-200 px-4 py-2.5 text-[11.5px] leading-relaxed text-carbon/45">
            En el prototipo el cambio de usuario reemplaza al inicio de sesión y demuestra el
            sistema de permisos.
          </p>
        </div>
      ) : null}
    </div>
  )
}

const ICONOS_MOMENTO: Record<TipoMomento, typeof Cake> = {
  cumpleanos: Cake,
  aniversario: Gift,
  evento: CalendarHeart,
  recuperacion: UserRoundX,
}

/**
 * Campana de recordatorios.
 * Muestra los avisos que Momentos Hacienda generó para el usuario en sesión.
 * Son notificaciones internas: nunca salen hacia el cliente.
 */
function CampanaNotificaciones() {
  const { usuario } = useSesion()
  const [abierta, setAbierta] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const alClic = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierta(false)
    }
    document.addEventListener('mousedown', alClic)
    return () => document.removeEventListener('mousedown', alClic)
  }, [])

  const version = useDatos()

  // Evalúa las reglas al entrar y cada vez que cambian los datos o las reglas
  useEffect(() => {
    momentosRepo.sincronizar(usuario)
  }, [usuario, version])

  const notificaciones = momentosRepo.notificaciones(usuario)
  const pendientes = notificaciones.filter((n) => n.estado === 'pendiente')
  const visibles = notificaciones.filter((n) => n.estado !== 'descartada').slice(0, 6)

  return (
    <div className="relative" ref={contenedor}>
      <button
        onClick={() => setAbierta((v) => !v)}
        className="relative rounded-full border border-crema-300 bg-white p-2 text-bosque-600 transition-colors hover:border-bosque-300"
        aria-label="Recordatorios"
      >
        <Bell size={16} />
        {pendientes.length > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-terracota px-1 text-[11px] font-medium text-white">
            {pendientes.length}
          </span>
        ) : null}
      </button>

      {abierta ? (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-crema-300 bg-white shadow-elevada">
          <div className="flex items-center justify-between border-b border-crema-200 px-4 py-3">
            <p className="text-[11.5px] uppercase tracking-marca text-bosque-400">
              Momentos Hacienda
            </p>
            {pendientes.length > 0 ? (
              <button
                onClick={() => momentosRepo.marcarTodasVistas(usuario)}
                className="text-[12.5px] text-bosque-500 hover:underline"
              >
                Marcar vistos
              </button>
            ) : null}
          </div>

          {visibles.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-carbon/45">
              Sin recordatorios por ahora.
            </p>
          ) : (
            <ul className="max-h-96 divide-y divide-crema-200 overflow-y-auto">
              {visibles.map((n) => {
                const Icono = ICONOS_MOMENTO[n.tipo]
                return (
                  <li key={n.id}>
                    <Link
                      to={`/clientes/${n.clienteId}`}
                      onClick={() => {
                        momentosRepo.marcar(n.id, 'vista')
                        setAbierta(false)
                      }}
                      className={clsx(
                        'flex items-start gap-2.5 px-4 py-3 transition-colors hover:bg-crema-50',
                        n.estado === 'pendiente' && 'bg-crema-50/70',
                      )}
                    >
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-laton-100 text-laton-700">
                        <Icono size={13} strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs leading-snug text-bosque-800">
                          {n.titulo}
                        </span>
                        <span className="mt-0.5 block truncate text-[12.5px] text-carbon/50">
                          {n.accionRecomendada}
                        </span>
                        <span className="mt-0.5 block text-[11.5px] uppercase tracking-wider text-carbon/35">
                          {formatearFechaCorta(n.fechaMomento)}
                        </span>
                      </span>
                      {n.estado === 'pendiente' ? (
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-terracota" />
                      ) : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}

          <Link
            to="/momentos"
            onClick={() => setAbierta(false)}
            className="block border-t border-crema-200 px-4 py-2.5 text-center text-[12.5px] text-bosque-600 transition-colors hover:bg-crema-50"
          >
            Ver todos los momentos
          </Link>
        </div>
      ) : null}
    </div>
  )
}

export function Header({ onAbrirMenu }: { onAbrirMenu: () => void }) {
  useDatos()
  const { pathname } = useLocation()
  const modulo = moduloPorRuta(pathname)

  return (
    <header className="sticky top-0 z-20 border-b border-crema-300/70 bg-crema-50/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onAbrirMenu}
          className="rounded-lg p-2 text-bosque-700 transition-colors hover:bg-crema-200 lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>

        <div className="hidden min-w-0 lg:block">
          <p className="text-[11.5px] uppercase tracking-marca text-bosque-400">
            {modulo?.descripcion ?? 'Hacienda del Bosque'}
          </p>
          <p className="truncate font-display text-lg leading-tight text-bosque-800">
            {modulo?.etiqueta ?? 'CRM'}
          </p>
        </div>

        <div className="relative ml-auto hidden max-w-sm flex-1 md:block">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-carbon/35"
          />
          <input
            type="search"
            placeholder="Buscar cliente, evento u oportunidad…"
            className="h-10 w-full rounded-full border border-crema-300 bg-white pl-9 pr-4 text-sm text-carbon placeholder:text-carbon/35 focus:border-bosque-300 focus:outline-none focus:ring-2 focus:ring-bosque-100"
          />
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <span className="mr-1 hidden text-xs capitalize text-carbon/45 xl:block">
            {fechaLarga}
          </span>

          <Boton variante="secundario" tamano="sm" icono={<Plus size={15} />} className="hidden sm:inline-flex">
            Registrar
          </Boton>

          <CampanaNotificaciones />

          <SelectorUsuario />
        </div>
      </div>
    </header>
  )
}
