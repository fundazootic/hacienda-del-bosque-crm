import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Usuario } from '@/core/types'
import { usuarios } from '@/core/data/mock/usuarios'
import { puede, type Permiso, alcanceDe, type Alcance } from '@/core/permissions/permisos'

interface SesionContextValor {
  usuario: Usuario
  usuariosDisponibles: Usuario[]
  cambiarUsuario: (id: string) => void
  puede: (permiso: Permiso) => boolean
  alcance: Alcance
  esGerencia: boolean
}

const SesionContext = createContext<SesionContextValor | null>(null)

/**
 * Sesión del prototipo: no hay autenticación real todavía.
 * El cambio de usuario permite demostrar el sistema de roles ante Gerencia
 * y se reemplazará por el login real sin tocar los módulos.
 */
export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuarioId, setUsuarioId] = useState(usuarios[0].id)

  const usuario = useMemo(
    () => usuarios.find((u) => u.id === usuarioId) ?? usuarios[0],
    [usuarioId],
  )

  const cambiarUsuario = useCallback((id: string) => setUsuarioId(id), [])

  const valor = useMemo<SesionContextValor>(
    () => ({
      usuario,
      usuariosDisponibles: usuarios.filter((u) => u.activo),
      cambiarUsuario,
      puede: (permiso: Permiso) => puede(usuario, permiso),
      alcance: alcanceDe(usuario),
      esGerencia: usuario.rol === 'gerencia',
    }),
    [usuario, cambiarUsuario],
  )

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>
}

export function useSesion() {
  const ctx = useContext(SesionContext)
  if (!ctx) throw new Error('useSesion debe usarse dentro de <SesionProvider>')
  return ctx
}
