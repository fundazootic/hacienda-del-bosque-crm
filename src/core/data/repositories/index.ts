import type { Usuario } from '@/core/types'
import { filtrarPorAlcance } from '@/core/permissions/permisos'
import { usuarios } from '@/core/data/mock/usuarios'
import { espacios, menus } from '@/core/data/mock/catalogos'

export { clientesRepo } from './clientesRepo'
export type { ResultadoDuplicado } from './clientesRepo'
export { auditoriaRepo } from './auditoriaRepo'
export { comercialRepo } from './comercialRepo'
export type { ResultadoSolicitud } from './comercialRepo'
export { experienciasRepo } from './experienciasRepo'
export { momentosRepo } from './momentosRepo'
export { correoRepo } from './correoRepo'
export { seguimientosRepo, estaAbierto, estaVencido } from './seguimientosRepo'
export { ventasRepo, estaPorCobrar, valorNeto } from './ventasRepo'
export {
  fidelizacionRepo,
  NIVELES,
  PESOS_POR_PUNTO,
  nivelPorClave,
  nivelQueCorresponde,
} from './fidelizacionRepo'
export type { ResultadoEstado } from './experienciasRepo'

export const equipoRepo = {
  listar: () => usuarios,
  comerciales: () => usuarios.filter((u) => u.rol !== 'gerencia'),
  obtener: (id: string) => usuarios.find((u) => u.id === id),
}

export const catalogosRepo = {
  espacios: () => espacios,
  menus: () => menus,
  espacio: (id: string) => espacios.find((e) => e.id === id),
  menu: (id: string) => menus.find((m) => m.id === id),
}
