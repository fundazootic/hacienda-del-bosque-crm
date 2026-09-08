import type {
  CategoriaCliente,
  EstadoExperiencia,
  EstadoPago,
  NivelFidelidad,
  OrigenCliente,
  Rol,
  TipoExperiencia,
  TipoSeguimiento,
} from '@/core/types'

export const etiquetaRol: Record<Rol, string> = {
  gerencia: 'Gerencia',
  comercial_interno: 'Comercial interno',
  comercial_freelancer: 'Comercial freelancer',
}

export const etiquetaCategoria: Record<CategoriaCliente, string> = {
  nuevo: 'Nuevo',
  frecuente: 'Frecuente',
  vip: 'VIP',
  ocasional: 'Ocasional',
  por_recuperar: 'Por recuperar',
}

/** Descripción de cada categoría, para el formulario y la ficha. */
export const descripcionCategoria: Record<CategoriaCliente, string> = {
  nuevo: 'Registrado hace poco, aún sin historia en la hacienda',
  frecuente: 'Vuelve varias veces al año y responde a las invitaciones',
  vip: 'Cliente distinguido: atención personalizada y prioridad de reserva',
  ocasional: 'Visita esporádica, generalmente por una ocasión puntual',
  por_recuperar: 'Sin visitas recientes; requiere una gestión de reactivación',
}

export const etiquetaOrigen: Record<OrigenCliente, string> = {
  referido: 'Referido',
  redes_sociales: 'Redes sociales',
  pagina_web: 'Página web',
  visita_espontanea: 'Visita espontánea',
  evento_previo: 'Evento previo',
  alianza: 'Alianza',
  prensa: 'Prensa',
  gestion_comercial: 'Gestión comercial',
}

export const etiquetaExperiencia: Record<TipoExperiencia, string> = {
  cumpleanos: 'Cumpleaños',
  aniversario: 'Aniversario',
  matrimonio: 'Matrimonio',
  cena_romantica: 'Cena romántica',
  evento_empresarial: 'Evento empresarial',
  evento_social: 'Evento social',
  celebracion_familiar: 'Celebración familiar',
  reserva_grupo: 'Reserva de grupo',
  otro: 'Otro',
}

/** Etapas del pipeline de experiencias, en orden de recorrido. */
export const etiquetaEstadoExperiencia: Record<EstadoExperiencia, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  visita: 'Visita / Reunión',
  cotizacion: 'Cotización',
  negociacion: 'Negociación',
  confirmado: 'Confirmado',
  realizado: 'Realizado',
  perdido: 'Perdido',
}

export const etiquetaEstadoPago: Record<EstadoPago, string> = {
  anticipo: 'Con anticipo',
  parcial: 'Pago parcial',
  pagado: 'Pagado',
  vencido: 'Vencido',
}

export const etiquetaSeguimiento: Record<TipoSeguimiento, string> = {
  llamada: 'Llamada',
  correo: 'Correo',
  visita: 'Visita',
  reunion: 'Reunión',
  degustacion: 'Degustación',
  nota: 'Nota',
}

export const etiquetaNivel: Record<NivelFidelidad, string> = {
  semilla: 'Semilla',
  guadua: 'Guadua',
  ceiba: 'Ceiba',
  saman: 'Samán',
}
