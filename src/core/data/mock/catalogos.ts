import type { Espacio, MenuExperiencia } from '@/core/types'

export const espacios: Espacio[] = [
  { id: 'esp-01', nombre: 'Casona Principal', descripcion: 'Salón histórico con techos en teja de barro y chimenea.', capacidadMinima: 40, capacidadMaxima: 120, tipo: 'salon', activo: true },
  { id: 'esp-02', nombre: 'Terraza de los Samanes', descripcion: 'Terraza abierta bajo samanes centenarios.', capacidadMinima: 60, capacidadMaxima: 180, tipo: 'terraza', activo: true },
  { id: 'esp-03', nombre: 'Jardín del Bosque', descripcion: 'Jardín ceremonial con espejo de agua.', capacidadMinima: 80, capacidadMaxima: 300, tipo: 'jardin', activo: true },
  { id: 'esp-04', nombre: 'Comedor Privado La Bodega', descripcion: 'Mesa única entre la colección de vinos.', capacidadMinima: 8, capacidadMaxima: 16, tipo: 'privado', activo: true },
  { id: 'esp-05', nombre: 'Mirador del Guadual', descripcion: 'Deck en guadua con vista al valle.', capacidadMinima: 20, capacidadMaxima: 50, tipo: 'terraza', activo: true },
]

export const espacioPorId = (id: string) => espacios.find((e) => e.id === id)

export const menus: MenuExperiencia[] = [
  { id: 'men-01', nombre: 'Menú Raíces', descripcion: 'Cinco tiempos de cocina vallecaucana contemporánea.', precioPorPersona: 210000, tiempos: 5, activo: true },
  { id: 'men-02', nombre: 'Menú del Bosque', descripcion: 'Siete tiempos de degustación con maridaje.', precioPorPersona: 320000, tiempos: 7, activo: true },
  { id: 'men-03', nombre: 'Menú Hacienda', descripcion: 'Cuatro tiempos, ideal para celebraciones amplias.', precioPorPersona: 165000, tiempos: 4, activo: true },
  { id: 'men-04', nombre: 'Estación Corporativa', descripcion: 'Formato de estaciones para eventos empresariales.', precioPorPersona: 128000, tiempos: 3, activo: true },
]
