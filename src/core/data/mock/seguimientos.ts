import type { FechaEspecial, Seguimiento } from '@/core/types'

export const seguimientos: Seguimiento[] = [
  {
    id: 'seg-001', entidadTipo: 'experiencia', entidadId: 'exp-001', clienteId: 'cli-008', comercialId: 'u-004',
    tipo: 'correo', asunto: 'Envío de propuesta cena de fin de año', detalle: 'Se remitió propuesta con tres alternativas de montaje para 180 personas.',
    fecha: '2026-09-03', resultado: 'pendiente', proximaAccion: 'Llamar para confirmar recepción y agendar visita al jardín',
    fechaProximaAccion: '2026-09-05', creadoEn: '2026-09-03',
  },
  {
    id: 'seg-002', entidadTipo: 'experiencia', entidadId: 'exp-002', clienteId: 'cli-004', comercialId: 'u-006',
    tipo: 'visita', asunto: 'Recorrido por el Jardín del Bosque', detalle: 'La novia y su madre recorrieron el jardín. Solicitan cotización con carpa de contingencia.',
    fecha: '2026-09-01', resultado: 'exitoso', proximaAccion: 'Enviar cotización ajustada con carpa',
    fechaProximaAccion: '2026-09-06', creadoEn: '2026-09-01',
  },
  {
    id: 'seg-003', entidadTipo: 'experiencia', entidadId: 'exp-003', clienteId: 'cli-006', comercialId: 'u-003',
    tipo: 'llamada', asunto: 'Seguimiento a propuesta de cumpleaños', detalle: 'No contesta. Se deja mensaje de voz.',
    fecha: '2026-09-02', resultado: 'sin_respuesta', proximaAccion: 'Segundo intento de contacto telefónico',
    fechaProximaAccion: '2026-09-04', creadoEn: '2026-09-02',
  },
  {
    id: 'seg-004', entidadTipo: 'cliente', entidadId: 'cli-010', clienteId: 'cli-010', comercialId: 'u-003',
    tipo: 'llamada', asunto: 'Reactivación de cliente inactiva', detalle: 'Cliente sin visitas hace 11 meses. Interesada en almuerzo familiar de diciembre.',
    fecha: '2026-08-30', resultado: 'reprogramado', proximaAccion: 'Invitar al brunch dominical de septiembre',
    fechaProximaAccion: '2026-09-02', creadoEn: '2026-08-30',
  },
  {
    id: 'seg-005', entidadTipo: 'experiencia', entidadId: 'exp-006', clienteId: 'cli-014', comercialId: 'u-004',
    tipo: 'reunion', asunto: 'Reunión de producción jornada Comfandi', detalle: 'Se define cronograma, señalización y logística de transporte.',
    fecha: '2026-08-28', resultado: 'exitoso', proximaAccion: 'Confirmar número final de asistentes',
    fechaProximaAccion: '2026-09-16', creadoEn: '2026-08-28',
  },
  {
    id: 'seg-006', entidadTipo: 'experiencia', entidadId: 'exp-007', clienteId: 'cli-009', comercialId: 'u-005',
    tipo: 'correo', asunto: 'Propuesta de cata privada', detalle: 'Se envían seis referencias sugeridas y valor por persona.',
    fecha: '2026-08-29', resultado: 'pendiente', proximaAccion: 'Confirmar fecha del 3 de octubre',
    fechaProximaAccion: '2026-09-08', creadoEn: '2026-08-29',
  },
  {
    id: 'seg-007', entidadTipo: 'experiencia', entidadId: 'exp-004', clienteId: 'cli-002', comercialId: 'u-004',
    tipo: 'reunion', asunto: 'Negociación de tarifa corporativa anual', detalle: 'Solicitan descuento por volumen sobre tres eventos al año.',
    fecha: '2026-08-30', resultado: 'pendiente', proximaAccion: 'Presentar acuerdo marco a Gerencia',
    fechaProximaAccion: '2026-09-09', creadoEn: '2026-08-30',
  },
  {
    id: 'seg-008', entidadTipo: 'cliente', entidadId: 'cli-001', clienteId: 'cli-001', comercialId: 'u-003',
    tipo: 'degustacion', asunto: 'Degustación del nuevo menú de temporada', detalle: 'Excelente recepción. Publicará reseña en su columna.',
    fecha: '2026-08-22', resultado: 'exitoso', proximaAccion: 'Coordinar cena de aniversario editorial',
    fechaProximaAccion: '2026-09-10', creadoEn: '2026-08-22',
  },
  {
    id: 'seg-009', entidadTipo: 'experiencia', entidadId: 'exp-011', clienteId: 'cli-003', comercialId: 'u-005',
    tipo: 'llamada', asunto: 'Cierre de cumpleaños 40', detalle: 'Confirma 55 invitados y firma contrato el 5 de septiembre.',
    fecha: '2026-09-02', resultado: 'exitoso', proximaAccion: 'Recibir anticipo del 40 %',
    fechaProximaAccion: '2026-09-05', creadoEn: '2026-09-02',
  },
  {
    id: 'seg-010', entidadTipo: 'cliente', entidadId: 'cli-013', clienteId: 'cli-013', comercialId: 'u-003',
    tipo: 'nota', asunto: 'Cliente alcanzó nivel Samán', detalle: 'Novena visita del año. Corresponde beneficio de cena de cortesía.',
    fecha: '2026-08-29', resultado: 'cerrado', creadoEn: '2026-08-29',
  },
  {
    id: 'seg-011', entidadTipo: 'experiencia', entidadId: 'exp-010', clienteId: 'cli-005', comercialId: 'u-002',
    tipo: 'correo', asunto: 'Propuesta almuerzo de junta directiva', detalle: 'Pendiente aprobación del comité administrativo.',
    fecha: '2026-08-27', resultado: 'pendiente', proximaAccion: 'Seguimiento a la aprobación del comité',
    fechaProximaAccion: '2026-09-03', creadoEn: '2026-08-27',
  },
  {
    id: 'seg-012', entidadTipo: 'cliente', entidadId: 'cli-012', clienteId: 'cli-012', comercialId: 'u-006',
    tipo: 'llamada', asunto: 'Primer contacto solicitud web', detalle: 'Pareja interesada en boda íntima para febrero de 2027.',
    fecha: '2026-09-01', resultado: 'exitoso', proximaAccion: 'Agendar visita a la hacienda',
    fechaProximaAccion: '2026-09-07', creadoEn: '2026-09-01',
  },
]

/** Cumpleaños, aniversarios y fechas conmemorativas registradas. */
export const fechasEspeciales: FechaEspecial[] = [
  { id: 'fe-01', clienteId: 'cli-013', tipo: 'cumpleanos', descripcion: 'Cumpleaños de Ana Lucía Grajales', fecha: '09-02', recordatorioDias: 7, activa: true },
  { id: 'fe-02', clienteId: 'cli-003', tipo: 'cumpleanos', descripcion: 'Cumpleaños de Santiago Arboleda', fecha: '09-08', recordatorioDias: 7, activa: true },
  { id: 'fe-03', clienteId: 'cli-001', tipo: 'cumpleanos', descripcion: 'Cumpleaños de María Fernanda Caicedo', fecha: '09-12', recordatorioDias: 10, activa: true },
  { id: 'fe-04', clienteId: 'cli-007', tipo: 'aniversario', descripcion: 'Aniversario de bodas Ospina', fecha: '09-14', recordatorioDias: 15, activa: true },
  { id: 'fe-05', clienteId: 'cli-006', tipo: 'cumpleanos', descripcion: 'Cumpleaños de Alejandro Villegas', fecha: '09-19', recordatorioDias: 7, activa: true },
  { id: 'fe-06', clienteId: 'cli-009', tipo: 'cumpleanos', descripcion: 'Cumpleaños de Ricardo Peláez', fecha: '09-25', recordatorioDias: 7, activa: true },
  { id: 'fe-07', clienteId: 'cli-012', tipo: 'cumpleanos', descripcion: 'Cumpleaños de Juan Pablo Saavedra', fecha: '11-16', recordatorioDias: 7, activa: true },
  { id: 'fe-08', clienteId: 'cli-002', tipo: 'fecha_corporativa', descripcion: 'Aniversario corporativo Manuelita', fecha: '11-02', recordatorioDias: 30, activa: true },
]
