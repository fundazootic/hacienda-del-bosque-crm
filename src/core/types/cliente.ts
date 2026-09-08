/**
 * Categoría comercial del cliente. Es la clasificación que usa la hacienda
 * para decidir cómo atenderlo y con qué frecuencia buscarlo.
 */
export type CategoriaCliente = 'nuevo' | 'frecuente' | 'vip' | 'ocasional' | 'por_recuperar'

export type OrigenCliente =
  | 'referido'
  | 'redes_sociales'
  | 'pagina_web'
  | 'visita_espontanea'
  | 'evento_previo'
  | 'alianza'
  | 'prensa'
  | 'gestion_comercial'

export interface Cliente {
  id: string
  codigo: string

  // Identidad
  nombres: string
  apellidos: string
  fechaNacimiento?: string
  /** Aniversario de bodas u otra fecha memorable del cliente. */
  aniversario?: string

  // Contacto
  telefono: string
  email: string
  /** Claves normalizadas: base del control de duplicados. Nunca se digitan. */
  telefonoNormalizado: string
  emailNormalizado: string
  ciudad: string
  direccion?: string

  // Vínculo empresarial (opcional: el cliente siempre es una persona)
  empresa?: string
  cargo?: string

  // Relación comercial
  origen: OrigenCliente
  fechaRegistro: string
  /** Comercial responsable — regla de propiedad única. */
  comercialId: string
  /** Desde cuándo el propietario actual tiene la cuenta. */
  fechaAsignacion: string
  categoria: CategoriaCliente

  // Experiencia en la hacienda
  preferencias: string[]
  restricciones: string[]
  observaciones?: string
  /** Habeas data: autorización para invitaciones y comunicaciones. */
  autorizaComunicaciones: boolean

  // Métricas históricas
  valorHistorico: number
  numeroEventos: number
  ultimaVisita?: string

  // Auditoría
  creadoPor: string
  actualizadoEn: string
}

/** Datos que llegan del formulario, antes de normalizar y asignar código. */
export type DatosCliente = Omit<
  Cliente,
  | 'id'
  | 'codigo'
  | 'telefonoNormalizado'
  | 'emailNormalizado'
  | 'valorHistorico'
  | 'numeroEventos'
  | 'ultimaVisita'
  | 'actualizadoEn'
  | 'creadoPor'
  | 'fechaRegistro'
  | 'fechaAsignacion'
>

/**
 * Evidencia de que alguien intentó crear un cliente que ya existe.
 * Se archiva siempre, pida o no el traslado quien lo intentó.
 */
export interface IntentoDuplicado {
  id: string
  /** Cliente ya registrado con el que chocó el intento. */
  clienteId: string
  comercialSolicitanteId: string
  comercialResponsableId: string
  criterio: 'telefono' | 'email'
  valorDetectado: string
  /** Lo que el comercial alcanzó a digitar, tal cual. */
  datosIntento: {
    nombres: string
    apellidos: string
    telefono: string
    email: string
  }
  fecha: string
  /** Solicitud de reasignación derivada de este intento, si la hubo. */
  solicitudId?: string
  observacion?: string
}

/** Por qué un cliente quedó en manos de un comercial. */
export type OrigenAsignacion =
  | 'registro'
  | 'reasignacion_gerencia'
  | 'solicitud_aprobada'

/**
 * Trazabilidad de la propiedad comercial. Es un registro append-only:
 * cuando un cliente cambia de responsable NUNCA se borra lo anterior.
 */
export interface AsignacionHistorial {
  id: string
  clienteId: string
  comercialAnteriorId?: string
  comercialNuevoId: string
  origen: OrigenAsignacion
  motivo: string
  /** Gerencia que autorizó (o el propio comercial en la asignación inicial). */
  autorizadoPor: string
  fecha: string
  solicitudId?: string
}

/**
 * Solicitud de reasignación.
 * Un comercial puede pedir la cuenta; solo Gerencia aprueba o rechaza.
 */
export interface SolicitudReasignacion {
  id: string
  clienteId: string
  solicitanteId: string
  propietarioActualId: string
  motivo: string
  /** De dónde nació la solicitud. */
  origen: 'duplicado' | 'ficha_restringida' | 'manual'
  intentoDuplicadoId?: string
  fecha: string
  estado: 'pendiente' | 'aprobada' | 'rechazada'
  resueltaPor?: string
  fechaResolucion?: string
  comentarioResolucion?: string
}
