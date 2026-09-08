import type { Experiencia } from '@/core/types'

type Base = Omit<Experiencia, 'requerimientos' | 'creadoPor'> & {
  requerimientos?: string[]
  creadoPor?: string
}

const exp = (e: Base): Experiencia => ({
  ...e,
  requerimientos: e.requerimientos ?? [],
  creadoPor: e.creadoPor ?? e.comercialId,
})

/**
 * Experiencias de la hacienda: la misma celebración desde la primera consulta
 * hasta el día del evento. Referencia temporal del prototipo: septiembre de 2026.
 */
export const experiencias: Experiencia[] = [
  // ── Nuevo ────────────────────────────────────────────────────────────────
  exp({
    id: 'exp-020', codigo: 'EXP-2609-20', clienteId: 'cli-012', comercialId: 'u-006',
    titulo: 'Boda íntima Saavedra', tipo: 'matrimonio', estado: 'nuevo',
    fechaTentativa: '2027-02-13', numeroPersonas: 60, presupuesto: 30000000,
    fuente: 'pagina_web', proximoSeguimiento: '2026-09-07',
    observaciones: 'Llegó por el formulario del sitio. Pareja joven, quiere algo íntimo en el jardín.',
    creadoEn: '2026-09-01', actualizadoEn: '2026-09-01',
  }),
  exp({
    id: 'exp-021', codigo: 'EXP-2609-21', clienteId: 'cli-009', comercialId: 'u-005',
    titulo: 'Cena romántica de aniversario', tipo: 'cena_romantica', estado: 'nuevo',
    fechaTentativa: '2026-10-17', numeroPersonas: 2, presupuesto: 1200000,
    fuente: 'redes_sociales', proximoSeguimiento: '2026-09-08',
    observaciones: 'Pide el comedor privado y maridaje completo.',
    creadoEn: '2026-09-03', actualizadoEn: '2026-09-03',
  }),

  // ── Contactado ───────────────────────────────────────────────────────────
  exp({
    id: 'exp-024', codigo: 'EXP-2608-24', clienteId: 'cli-014', comercialId: 'u-004',
    titulo: 'Integración de fin de año Comfandi', tipo: 'evento_empresarial', estado: 'contactado',
    fechaTentativa: '2026-12-04', numeroPersonas: 90, presupuesto: 40000000,
    fuente: 'gestion_comercial', proximoSeguimiento: '2026-09-09',
    observaciones: 'Primera llamada hecha. Esperan la aprobación del comité de bienestar.',
    creadoEn: '2026-08-24', actualizadoEn: '2026-09-02',
  }),
  exp({
    id: 'exp-027', codigo: 'EXP-2608-27', clienteId: 'cli-007', comercialId: 'u-006',
    titulo: 'Reserva de grupo · almuerzo familiar', tipo: 'reserva_grupo', estado: 'contactado',
    fechaTentativa: '2026-11-08', numeroPersonas: 22, presupuesto: 5500000,
    fuente: 'evento_previo', proximoSeguimiento: '2026-09-11',
    creadoEn: '2026-08-28', actualizadoEn: '2026-08-31',
  }),

  // ── Visita / Reunión ─────────────────────────────────────────────────────
  exp({
    id: 'exp-010', codigo: 'EXP-2608-10', clienteId: 'cli-005', comercialId: 'u-002',
    titulo: 'Almuerzo de junta directiva Cavasa', tipo: 'evento_empresarial', estado: 'visita',
    fechaTentativa: '2026-10-09', numeroPersonas: 28, presupuesto: 12000000,
    fuente: 'gestion_comercial', proximoSeguimiento: '2026-09-10',
    espacioId: 'esp-01',
    observaciones: 'Visitaron la Casona el 27 de agosto. Piden propuesta con dos opciones de menú.',
    creadoEn: '2026-08-08', actualizadoEn: '2026-08-27',
  }),
  exp({
    id: 'exp-028', codigo: 'EXP-2609-28', clienteId: 'cli-013', comercialId: 'u-003',
    titulo: 'Celebración familiar de diciembre', tipo: 'celebracion_familiar', estado: 'visita',
    fechaTentativa: '2026-12-19', numeroPersonas: 35, presupuesto: 15000000,
    fuente: 'referido', proximoSeguimiento: '2026-09-12',
    observaciones: 'Cliente VIP. Recorrió la terraza tras su almuerzo de agosto.',
    creadoEn: '2026-08-30', actualizadoEn: '2026-09-02',
  }),

  // ── Cotización ───────────────────────────────────────────────────────────
  exp({
    id: 'exp-003', codigo: 'EXP-2608-03', clienteId: 'cli-006', comercialId: 'u-003',
    titulo: 'Celebración 58 años Sr. Villegas', tipo: 'cumpleanos', estado: 'cotizacion',
    fechaTentativa: '2026-09-19', numeroPersonas: 45, presupuesto: 20000000,
    valorCotizado: 21800000, fuente: 'referido', proximoSeguimiento: '2026-09-08',
    espacioId: 'esp-05', menuId: 'men-03', horaInicio: '12:30', horaFin: '17:00',
    requerimientos: ['Barra de whisky', 'Sonido en vivo'],
    observaciones: 'No contestó el último intento telefónico.',
    creadoEn: '2026-08-11', actualizadoEn: '2026-09-02',
  }),
  exp({
    id: 'exp-009', codigo: 'EXP-2609-09', clienteId: 'cli-001', comercialId: 'u-003',
    titulo: 'Cena de aniversario editorial', tipo: 'evento_social', estado: 'cotizacion',
    fechaTentativa: '2026-09-27', numeroPersonas: 24, presupuesto: 13000000,
    valorCotizado: 14200000, fuente: 'gestion_comercial', proximoSeguimiento: '2026-09-10',
    espacioId: 'esp-04', menuId: 'men-02', horaInicio: '19:30', horaFin: '23:00',
    requerimientos: ['Sin mariscos', 'Presentación del chef'],
    creadoEn: '2026-08-28', actualizadoEn: '2026-09-03',
  }),
  exp({
    id: 'exp-007', codigo: 'EXP-2608-07', clienteId: 'cli-009', comercialId: 'u-005',
    titulo: 'Cata privada de vinos del Valle', tipo: 'otro', estado: 'cotizacion',
    fechaTentativa: '2026-10-03', numeroPersonas: 14, presupuesto: 9000000,
    valorCotizado: 9600000, fuente: 'redes_sociales', proximoSeguimiento: '2026-09-08',
    espacioId: 'esp-04', menuId: 'men-02', horaInicio: '18:00', horaFin: '21:00',
    requerimientos: ['Seis referencias de vino', 'Cartilla de cata impresa'],
    creadoEn: '2026-08-19', actualizadoEn: '2026-08-29',
  }),

  // ── Negociación ──────────────────────────────────────────────────────────
  exp({
    id: 'exp-001', codigo: 'EXP-2609-01', clienteId: 'cli-008', comercialId: 'u-004',
    titulo: 'Cena de fin de año Clínica Farallones', tipo: 'evento_empresarial',
    estado: 'negociacion',
    fechaTentativa: '2026-12-05', numeroPersonas: 180, presupuesto: 60000000,
    valorCotizado: 68400000, fuente: 'prensa', proximoSeguimiento: '2026-09-08',
    espacioId: 'esp-03', menuId: 'men-04',
    observaciones: 'Comparan con el Club Campestre. Piden ajuste por volumen.',
    creadoEn: '2026-08-25', actualizadoEn: '2026-09-03',
  }),

  // ── Confirmado ───────────────────────────────────────────────────────────
  exp({
    id: 'exp-002', codigo: 'EXP-2605-02', clienteId: 'cli-004', comercialId: 'u-006',
    titulo: 'Boda Domínguez · Vallejo', tipo: 'matrimonio', estado: 'confirmado',
    fechaTentativa: '2026-12-12', numeroPersonas: 220, presupuesto: 85000000,
    valorCotizado: 94500000, valorFinal: 94500000, anticipo: 28350000,
    fuente: 'pagina_web', proximoSeguimiento: '2026-09-09',
    espacioId: 'esp-03', menuId: 'men-01', horaInicio: '16:00', horaFin: '02:00',
    requerimientos: ['Ceremonia al atardecer', 'Carpa de contingencia', 'Menú celíaco'],
    responsableOperativo: 'Coordinador de eventos · Felipe Ríos',
    creadoEn: '2026-05-19', actualizadoEn: '2026-09-01',
  }),
  exp({
    id: 'exp-004', codigo: 'EXP-2608-04', clienteId: 'cli-002', comercialId: 'u-004',
    titulo: 'Encuentro anual de líderes Manuelita', tipo: 'evento_empresarial',
    estado: 'confirmado',
    fechaTentativa: '2026-10-24', numeroPersonas: 120, presupuesto: 50000000,
    valorCotizado: 52300000, valorFinal: 52300000, anticipo: 15690000,
    fuente: 'alianza', proximoSeguimiento: '2026-09-09',
    espacioId: 'esp-01', menuId: 'men-04', horaInicio: '07:30', horaFin: '18:00',
    requerimientos: ['Salas de trabajo', 'Almuerzo en dos turnos', 'Transporte desde Palmira'],
    creadoEn: '2026-08-04', actualizadoEn: '2026-08-31',
  }),
  exp({
    id: 'exp-006', codigo: 'EXP-2607-06', clienteId: 'cli-014', comercialId: 'u-004',
    titulo: 'Jornada de bienestar Comfandi', tipo: 'evento_empresarial', estado: 'confirmado',
    fechaTentativa: '2026-09-26', numeroPersonas: 150, presupuesto: 36000000,
    valorCotizado: 38900000, valorFinal: 38900000, anticipo: 19450000,
    fuente: 'gestion_comercial', proximoSeguimiento: '2026-09-16',
    espacioId: 'esp-02', menuId: 'men-04', horaInicio: '08:00', horaFin: '16:00',
    requerimientos: ['Sonido y videobeam', 'Dos coffee breaks', 'Señalización de marca'],
    responsableOperativo: 'Coordinador de eventos · Felipe Ríos',
    creadoEn: '2026-07-10', actualizadoEn: '2026-08-28',
  }),
  exp({
    id: 'exp-011', codigo: 'EXP-2608-11', clienteId: 'cli-003', comercialId: 'u-005',
    titulo: 'Cumpleaños 40 · Santiago Arboleda', tipo: 'cumpleanos', estado: 'confirmado',
    fechaTentativa: '2026-09-08', numeroPersonas: 55, presupuesto: 18000000,
    valorCotizado: 18700000, valorFinal: 18700000, anticipo: 7480000,
    fuente: 'redes_sociales',
    espacioId: 'esp-05', menuId: 'men-01', horaInicio: '19:00', horaFin: '23:30',
    requerimientos: ['Coctelería de bienvenida', 'DJ hasta las 23:00', 'Torta externa'],
    responsableOperativo: 'Jefe de salón · Óscar Medina',
    creadoEn: '2026-08-16', actualizadoEn: '2026-09-02',
  }),
  exp({
    id: 'exp-012', codigo: 'EXP-2608-12', clienteId: 'cli-007', comercialId: 'u-006',
    titulo: 'Aniversario de bodas Ospina', tipo: 'aniversario', estado: 'confirmado',
    fechaTentativa: '2026-09-14', numeroPersonas: 18, presupuesto: 8000000,
    valorCotizado: 8900000, valorFinal: 8900000, anticipo: 4450000,
    fuente: 'evento_previo',
    espacioId: 'esp-04', menuId: 'men-02', horaInicio: '13:00', horaFin: '16:30',
    requerimientos: ['Maridaje completo', 'Menú sin lactosa', 'Violinista 30 minutos'],
    responsableOperativo: 'Sommelier · Andrea Caldas',
    creadoEn: '2026-08-12', actualizadoEn: '2026-08-31',
  }),

  // ── Realizado ────────────────────────────────────────────────────────────
  exp({
    id: 'exp-016', codigo: 'EXP-2603-16', clienteId: 'cli-007', comercialId: 'u-006',
    titulo: 'Brunch dominical familiar Ospina', tipo: 'celebracion_familiar', estado: 'realizado',
    fechaTentativa: '2026-04-19', numeroPersonas: 14, valorCotizado: 3900000, valorFinal: 3900000,
    fuente: 'evento_previo', espacioId: 'esp-05', menuId: 'men-03',
    creadoEn: '2026-03-18', actualizadoEn: '2026-04-19',
  }),
  exp({
    id: 'exp-013', codigo: 'EXP-2604-13', clienteId: 'cli-013', comercialId: 'u-003',
    titulo: 'Celebración de grado Grajales', tipo: 'celebracion_familiar', estado: 'realizado',
    fechaTentativa: '2026-05-09', numeroPersonas: 48, valorCotizado: 21400000, valorFinal: 21400000,
    fuente: 'referido', espacioId: 'esp-01', menuId: 'men-03',
    creadoEn: '2026-03-30', actualizadoEn: '2026-05-09',
  }),
  exp({
    id: 'exp-018', codigo: 'EXP-2605-18', clienteId: 'cli-011', comercialId: 'u-004',
    titulo: 'Foro ambiental del Valle', tipo: 'evento_empresarial', estado: 'realizado',
    fechaTentativa: '2026-06-06', numeroPersonas: 85, valorCotizado: 15600000, valorFinal: 15600000,
    fuente: 'alianza', espacioId: 'esp-02', menuId: 'men-04',
    requerimientos: ['Montaje sin plásticos', 'Producto local'],
    creadoEn: '2026-05-04', actualizadoEn: '2026-06-06',
  }),
  exp({
    id: 'exp-022', codigo: 'EXP-2606-22', clienteId: 'cli-003', comercialId: 'u-005',
    titulo: 'Celebración empresarial Arboleda', tipo: 'evento_empresarial', estado: 'realizado',
    fechaTentativa: '2026-06-14', numeroPersonas: 70, valorCotizado: 22800000, valorFinal: 22800000,
    fuente: 'redes_sociales', espacioId: 'esp-02', menuId: 'men-03',
    creadoEn: '2026-05-07', actualizadoEn: '2026-06-14',
  }),
  exp({
    id: 'exp-014', codigo: 'EXP-2606-14', clienteId: 'cli-002', comercialId: 'u-004',
    titulo: 'Aniversario de fundación Manuelita', tipo: 'evento_empresarial', estado: 'realizado',
    fechaTentativa: '2026-07-11', numeroPersonas: 260, valorCotizado: 51200000, valorFinal: 51200000,
    fuente: 'alianza', espacioId: 'esp-03', menuId: 'men-04',
    creadoEn: '2026-05-28', actualizadoEn: '2026-07-11',
  }),
  exp({
    id: 'exp-019', codigo: 'EXP-2607-19', clienteId: 'cli-005', comercialId: 'u-002',
    titulo: 'Almuerzo de junta directiva · julio', tipo: 'evento_empresarial', estado: 'realizado',
    fechaTentativa: '2026-07-26', numeroPersonas: 30, valorCotizado: 12800000, valorFinal: 12800000,
    fuente: 'gestion_comercial', espacioId: 'esp-01', menuId: 'men-01',
    creadoEn: '2026-06-30', actualizadoEn: '2026-07-26',
  }),
  exp({
    id: 'exp-026', codigo: 'EXP-2607-26', clienteId: 'cli-005', comercialId: 'u-002',
    titulo: 'Almuerzo de junta Cavasa', tipo: 'evento_empresarial', estado: 'realizado',
    fechaTentativa: '2026-08-08', numeroPersonas: 16, valorCotizado: 6400000, valorFinal: 6400000,
    fuente: 'gestion_comercial', espacioId: 'esp-04', menuId: 'men-01',
    requerimientos: ['Sala privada'],
    creadoEn: '2026-07-18', actualizadoEn: '2026-08-08',
  }),
  exp({
    id: 'exp-025', codigo: 'EXP-2608-25', clienteId: 'cli-013', comercialId: 'u-003',
    titulo: 'Almuerzo familiar Grajales', tipo: 'celebracion_familiar', estado: 'realizado',
    fechaTentativa: '2026-08-29', numeroPersonas: 32, valorCotizado: 11800000, valorFinal: 11800000,
    fuente: 'referido', espacioId: 'esp-01', menuId: 'men-03',
    requerimientos: ['Postre sin azúcar'],
    creadoEn: '2026-08-05', actualizadoEn: '2026-08-29',
  }),

  // ── Perdido ──────────────────────────────────────────────────────────────
  exp({
    id: 'exp-015', codigo: 'EXP-2604-15', clienteId: 'cli-009', comercialId: 'u-005',
    titulo: 'Cena de temporada para coleccionistas', tipo: 'evento_social', estado: 'perdido',
    fechaTentativa: '2026-05-30', numeroPersonas: 12, presupuesto: 7000000,
    valorCotizado: 7200000, fuente: 'redes_sociales',
    motivoPerdida: 'El cliente aplazó el viaje a Cali',
    creadoEn: '2026-04-30', actualizadoEn: '2026-05-23',
  }),
  exp({
    id: 'exp-023', codigo: 'EXP-2606-23', clienteId: 'cli-007', comercialId: 'u-006',
    titulo: 'Bautizo familiar Ospina', tipo: 'celebracion_familiar', estado: 'perdido',
    fechaTentativa: '2026-07-25', numeroPersonas: 40, presupuesto: 8000000,
    valorCotizado: 9200000, fuente: 'evento_previo',
    motivoPerdida: 'Se realizó en casa de la familia',
    creadoEn: '2026-06-22', actualizadoEn: '2026-07-19',
  }),
  exp({
    id: 'exp-017', codigo: 'EXP-2606-17', clienteId: 'cli-005', comercialId: 'u-002',
    titulo: 'Cóctel de fin de trimestre Cavasa', tipo: 'evento_empresarial', estado: 'perdido',
    fechaTentativa: '2026-07-30', numeroPersonas: 70, presupuesto: 13000000,
    valorCotizado: 14300000, fuente: 'gestion_comercial',
    motivoPerdida: 'Realizado en sus propias instalaciones',
    creadoEn: '2026-06-26', actualizadoEn: '2026-07-25',
  }),
  exp({
    id: 'exp-008', codigo: 'EXP-2606-08', clienteId: 'cli-011', comercialId: 'u-002',
    titulo: 'Foro de sostenibilidad del Valle', tipo: 'evento_empresarial', estado: 'perdido',
    fechaTentativa: '2026-08-21', numeroPersonas: 90, presupuesto: 22000000,
    valorCotizado: 24500000, fuente: 'alianza',
    motivoPerdida: 'Presupuesto reasignado por el aliado principal',
    creadoEn: '2026-06-11', actualizadoEn: '2026-07-31',
  }),
  exp({
    id: 'exp-030', codigo: 'EXP-2607-30', clienteId: 'cli-014', comercialId: 'u-004',
    titulo: 'Convención regional Comfandi', tipo: 'evento_empresarial', estado: 'perdido',
    fechaTentativa: '2026-08-15', numeroPersonas: 200, presupuesto: 32000000,
    valorCotizado: 34500000, fuente: 'gestion_comercial',
    motivoPerdida: 'Adjudicada a otro proveedor por precio',
    creadoEn: '2026-07-06', actualizadoEn: '2026-08-08',
  }),
]
