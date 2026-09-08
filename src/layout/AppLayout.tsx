import { Suspense, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { LimiteDeError } from '@/ui'
import { moduloPorRuta } from '@/app/modulos'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

function Cargando() {
  return (
    <div className="flex h-64 items-center justify-center">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-bosque-200 border-t-laton-400" />
    </div>
  )
}

/**
 * Estructura general del CRM: menú lateral fijo, encabezado y lienzo de módulo.
 * Los módulos se renderizan dentro del <Outlet> y no conocen el layout.
 */
export function AppLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const { pathname } = useLocation()
  const modulo = moduloPorRuta(pathname)

  return (
    <div className="min-h-screen bg-crema-100">
      <Sidebar abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />

      <div className="lg:pl-[264px]">
        <Header onAbrirMenu={() => setMenuAbierto(true)} />

        <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
          {/*
            * `key={pathname}`: el límite se rearma al cambiar de módulo, así un
            * fallo en una pantalla no deja bloqueadas a las demás.
            */}
          <LimiteDeError key={pathname} donde={modulo?.etiqueta}>
            <Suspense fallback={<Cargando />}>
              <div className="animate-fade-up">
                <Outlet />
              </div>
            </Suspense>
          </LimiteDeError>
        </main>

        <footer className="mx-auto w-full max-w-[1400px] px-4 pb-8 sm:px-6 lg:px-8">
          <div className="filete mb-3" />
          <p className="text-[11.5px] uppercase tracking-marca text-bosque-400/70">
            Hacienda del Bosque · CRM · Prototipo interno
          </p>
        </footer>
      </div>
    </div>
  )
}
