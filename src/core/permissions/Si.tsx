import type { ReactNode } from 'react'
import { useSesion } from '@/core/auth/SesionContext'
import type { Permiso } from './permisos'

/** Renderiza su contenido solo si la sesión actual tiene el permiso indicado. */
export function Si({
  permiso,
  children,
  alterno = null,
}: {
  permiso: Permiso
  children: ReactNode
  alterno?: ReactNode
}) {
  const { puede } = useSesion()
  return <>{puede(permiso) ? children : alterno}</>
}
