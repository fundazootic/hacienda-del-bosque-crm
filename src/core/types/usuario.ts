/** Roles iniciales del sistema. Ampliables sin tocar los módulos. */
export type Rol = 'gerencia' | 'comercial_interno' | 'comercial_freelancer'

export interface Usuario {
  id: string
  nombre: string
  email: string
  telefono: string
  rol: Rol
  cargo: string
  iniciales: string
  activo: boolean
  /** Solo aplica a freelancers: porcentaje de comisión pactado. */
  comisionPorcentaje?: number
  fechaIngreso: string
  metaMensual?: number
}
