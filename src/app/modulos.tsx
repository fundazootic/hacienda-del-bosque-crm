import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import {
  BarChart3,
  CalendarHeart,
  Users,
  Handshake,
  LayoutDashboard,
  ListChecks,
  Settings,
  Sparkles,
  Wallet,
  CalendarClock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Permiso } from '@/core/permissions/permisos'

export type GrupoModulo = 'operacion' | 'crecimiento' | 'sistema'

export interface ModuloCRM {
  id: string
  etiqueta: string
  ruta: string
  icono: LucideIcon
  grupo: GrupoModulo
  /** Permiso mínimo para ver el módulo en el menú y entrar a su ruta. */
  permiso: Permiso
  descripcion: string
  componente: LazyExoticComponent<ComponentType>
  /** Rutas internas del módulo (detalle, edición). Heredan su permiso. */
  subRutas?: { ruta: string; componente: LazyExoticComponent<ComponentType> }[]
}

export const GRUPOS: Record<GrupoModulo, string> = {
  operacion: 'Operación',
  crecimiento: 'Crecimiento',
  sistema: 'Sistema',
}

/**
 * Registro único de módulos.
 * El menú lateral y el enrutador se construyen desde aquí: agregar, quitar o
 * reordenar un módulo es una sola línea, sin tocar el layout ni los demás módulos.
 */
export const MODULOS: ModuloCRM[] = [
  {
    id: 'dashboard',
    etiqueta: 'Dashboard',
    ruta: '/',
    icono: LayoutDashboard,
    grupo: 'operacion',
    permiso: 'dashboard:ver',
    descripcion: 'Panorama del día',
    componente: lazy(() => import('@/modules/dashboard/pages/DashboardPage')),
  },
  {
    id: 'clientes',
    etiqueta: 'Clientes',
    ruta: '/clientes',
    icono: Users,
    grupo: 'operacion',
    permiso: 'clientes:ver',
    descripcion: 'Directorio y fichas',
    componente: lazy(() => import('@/modules/clientes/pages/ClientesPage')),
    subRutas: [
      {
        ruta: ':id',
        componente: lazy(() => import('@/modules/clientes/pages/ClienteDetallePage')),
      },
    ],
  },
  {
    id: 'comercial',
    etiqueta: 'Comercial',
    ruta: '/comercial',
    icono: Handshake,
    grupo: 'operacion',
    permiso: 'oportunidades:ver',
    descripcion: 'Embudo y cartera',
    componente: lazy(() => import('@/modules/comercial/pages/ComercialPage')),
  },
  {
    id: 'experiencias',
    etiqueta: 'Experiencias',
    ruta: '/experiencias',
    icono: CalendarHeart,
    grupo: 'operacion',
    permiso: 'eventos:ver',
    descripcion: 'Eventos y celebraciones',
    componente: lazy(() => import('@/modules/experiencias/pages/ExperienciasPage')),
  },
  {
    id: 'seguimientos',
    etiqueta: 'Seguimientos',
    ruta: '/seguimientos',
    icono: ListChecks,
    grupo: 'operacion',
    permiso: 'seguimientos:ver',
    descripcion: 'Agenda y fechas especiales',
    componente: lazy(() => import('@/modules/seguimientos/pages/SeguimientosPage')),
  },
  {
    id: 'momentos',
    etiqueta: 'Momentos',
    ruta: '/momentos',
    icono: CalendarClock,
    grupo: 'crecimiento',
    permiso: 'momentos:ver',
    descripcion: 'Fechas y oportunidades',
    componente: lazy(() => import('@/modules/momentos/pages/MomentosPage')),
  },
  {
    id: 'fidelizacion',
    etiqueta: 'Fidelización',
    ruta: '/fidelizacion',
    icono: Sparkles,
    grupo: 'crecimiento',
    permiso: 'fidelizacion:ver',
    descripcion: 'Huéspedes frecuentes',
    componente: lazy(() => import('@/modules/fidelizacion/pages/FidelizacionPage')),
  },
  {
    id: 'ventas',
    etiqueta: 'Ventas',
    ruta: '/ventas',
    icono: Wallet,
    grupo: 'crecimiento',
    permiso: 'ventas:ver',
    descripcion: 'Ingresos y comisiones',
    componente: lazy(() => import('@/modules/ventas/pages/VentasPage')),
  },
  {
    id: 'reportes',
    etiqueta: 'Reportes',
    ruta: '/reportes',
    icono: BarChart3,
    grupo: 'crecimiento',
    permiso: 'reportes:ver',
    descripcion: 'Lectura gerencial',
    componente: lazy(() => import('@/modules/reportes/pages/ReportesPage')),
  },
  {
    id: 'configuracion',
    etiqueta: 'Configuración',
    ruta: '/configuracion',
    icono: Settings,
    grupo: 'sistema',
    permiso: 'configuracion:ver',
    descripcion: 'Parámetros y catálogos',
    componente: lazy(() => import('@/modules/configuracion/pages/ConfiguracionPage')),
  },
]

export const moduloPorRuta = (ruta: string) =>
  MODULOS.find((m) => (m.ruta === '/' ? ruta === '/' : ruta.startsWith(m.ruta)))
