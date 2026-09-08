import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { SesionProvider, useSesion } from '@/core/auth/SesionContext'
import { MODULOS } from './modulos'
import { AppLayout } from '@/layout/AppLayout'
import { LimiteDeError, Tarjeta } from '@/ui'
import type { Permiso } from '@/core/permissions/permisos'
import type { ReactNode } from 'react'

function SinAcceso() {
  return (
    <Tarjeta className="mx-auto max-w-lg">
      <div className="flex flex-col items-center gap-3 px-8 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-crema-100 text-bosque-400">
          <Lock size={20} />
        </span>
        <h1 className="font-display text-2xl text-bosque-800">Acceso restringido</h1>
        <p className="max-w-sm text-sm text-carbon/60">
          Su perfil no tiene permisos sobre este módulo. Solicite el acceso a Gerencia.
        </p>
      </div>
    </Tarjeta>
  )
}

/** Guarda de ruta: la misma matriz de permisos que usa el menú lateral. */
function RutaProtegida({ permiso, children }: { permiso: Permiso; children: ReactNode }) {
  const { puede } = useSesion()
  return <>{puede(permiso) ? children : <SinAcceso />}</>
}

function Rutas() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {MODULOS.flatMap((modulo) => {
          const Pagina = modulo.componente
          const rutas = [
            <Route
              key={modulo.id}
              path={modulo.ruta}
              element={
                <RutaProtegida permiso={modulo.permiso}>
                  <Pagina />
                </RutaProtegida>
              }
            />,
          ]

          for (const sub of modulo.subRutas ?? []) {
            const SubPagina = sub.componente
            rutas.push(
              <Route
                key={`${modulo.id}-${sub.ruta}`}
                path={`${modulo.ruta}/${sub.ruta}`}
                element={
                  <RutaProtegida permiso={modulo.permiso}>
                    <SubPagina />
                  </RutaProtegida>
                }
              />,
            )
          }
          return rutas
        })}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

/**
 * Raíz de la aplicación.
 *
 * `HashRouter` en lugar de `BrowserRouter`: el prototipo se publica como
 * archivos estáticos (GitHub Pages, una carpeta compartida, un visor). Con
 * rutas de historial, entrar directo a /reportes o recargar la página devuelve
 * un 404 del servidor; con almohadilla —/#/reportes— funciona en cualquier
 * sitio sin configurar nada.
 */
export function App() {
  return (
    <LimiteDeError>
      <SesionProvider>
        <HashRouter>
          <Rutas />
        </HashRouter>
      </SesionProvider>
    </LimiteDeError>
  )
}
