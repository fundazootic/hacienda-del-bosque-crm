import type { Rol, Usuario } from '@/core/types'

/** Recursos protegidos del CRM (uno por módulo o entidad relevante). */
export type Recurso =
  | 'dashboard'
  | 'clientes'
  | 'oportunidades'
  | 'eventos'
  | 'seguimientos'
  | 'momentos'
  | 'fidelizacion'
  | 'ventas'
  | 'comisiones'
  | 'comerciales'
  | 'reportes'
  | 'configuracion'

export type Accion =
  | 'ver'
  | 'crear'
  | 'editar'
  | 'eliminar'
  | 'reasignar'
  | 'exportar'
  | 'ver_margenes'
  | 'liquidar'

export type Permiso = `${Recurso}:${Accion}`

/** Determina qué registros ve un rol: todos los de la hacienda o solo los propios. */
export type Alcance = 'todos' | 'propios'

interface PerfilRol {
  alcance: Alcance
  /** '*' concede todos los permisos (Gerencia). */
  permisos: Permiso[] | '*'
}

/**
 * Matriz de permisos. Es el único lugar donde se decide quién puede qué:
 * los módulos nunca consultan el rol directamente, siempre preguntan por permiso.
 */
export const MATRIZ_PERMISOS: Record<Rol, PerfilRol> = {
  gerencia: {
    alcance: 'todos',
    permisos: '*',
  },
  comercial_interno: {
    alcance: 'propios',
    permisos: [
      'dashboard:ver',
      'clientes:ver',
      'clientes:crear',
      'clientes:editar',
      'oportunidades:ver',
      'oportunidades:crear',
      'oportunidades:editar',
      'eventos:ver',
      'eventos:crear',
      'eventos:editar',
      'seguimientos:ver',
      'seguimientos:crear',
      'seguimientos:editar',
      'momentos:ver',
      'fidelizacion:ver',
      'ventas:ver',
      'ventas:crear',
      'comisiones:ver',
      'reportes:ver',
      'reportes:exportar',
      'comerciales:ver',
    ],
  },
  comercial_freelancer: {
    alcance: 'propios',
    permisos: [
      'dashboard:ver',
      'clientes:ver',
      'clientes:crear',
      'clientes:editar',
      'oportunidades:ver',
      'oportunidades:crear',
      'oportunidades:editar',
      'eventos:ver',
      'seguimientos:ver',
      'seguimientos:crear',
      'momentos:ver',
      'ventas:ver',
      'comisiones:ver',
      'reportes:ver',
    ],
  },
}

export function puede(usuario: Usuario | null, permiso: Permiso): boolean {
  if (!usuario || !usuario.activo) return false
  const perfil = MATRIZ_PERMISOS[usuario.rol]
  if (perfil.permisos === '*') return true
  return perfil.permisos.includes(permiso)
}

export const alcanceDe = (usuario: Usuario | null): Alcance =>
  usuario ? MATRIZ_PERMISOS[usuario.rol].alcance : 'propios'

export const esGerencia = (usuario: Usuario | null) => usuario?.rol === 'gerencia'

/** Solo Gerencia puede reasignar la propiedad comercial de un cliente. */
export const puedeReasignar = (usuario: Usuario | null) => puede(usuario, 'clientes:reasignar')

/**
 * Filtra cualquier colección que tenga comercial responsable según el alcance del rol.
 * Los módulos la usan para no repetir la lógica de visibilidad.
 */
export function filtrarPorAlcance<T extends { comercialId: string }>(
  usuario: Usuario | null,
  registros: T[],
): T[] {
  if (!usuario) return []
  if (alcanceDe(usuario) === 'todos') return registros
  return registros.filter((r) => r.comercialId === usuario.id)
}

/** Los freelancers no ven cifras internas de rentabilidad. */
export const puedeVerMargenes = (usuario: Usuario | null) =>
  puede(usuario, 'reportes:ver_margenes')
