/** Espacios físicos de la hacienda — administrados desde Configuración. */
export interface Espacio {
  id: string
  nombre: string
  descripcion: string
  capacidadMinima: number
  capacidadMaxima: number
  tipo: 'salon' | 'terraza' | 'jardin' | 'privado' | 'bodega'
  activo: boolean
}

export interface MenuExperiencia {
  id: string
  nombre: string
  descripcion: string
  precioPorPersona: number
  tiempos: number
  activo: boolean
}

export interface Etiqueta {
  id: string
  nombre: string
  color: string
}
