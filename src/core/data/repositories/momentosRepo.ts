import type {
  Anticipacion,
  CanalNotificacion,
  Cliente,
  Momento,
  Notificacion,
  ReglaRecordatorio,
  TipoMomento,
  Usuario,
} from '@/core/types'
import { clientes } from '@/core/data/mock/clientes'
import { experiencias } from '@/core/data/mock/experiencias'
import { seguimientos, fechasEspeciales } from '@/core/data/mock/seguimientos'
import { ventas } from '@/core/data/mock/ventas'
import { notificaciones, reglasRecordatorio } from '@/core/data/mock/reglasRecordatorio'
import { nombreCompleto } from '@/core/utils/cliente'
import { HOY_DEMO } from '@/core/utils/fecha'
import { filtrarPorAlcance } from '@/core/permissions/permisos'
import { notificarCambio } from '@/core/data/store'
import { despachar } from '@/core/notificaciones/notificador'

const HOY = HOY_DEMO

/** Días sin visitar a partir de los cuales una cuenta entra en recuperación. */
const DIAS_PARA_RECUPERAR = 90

const diasEntre = (desde: string, hasta: string) =>
  Math.round(
    (new Date(hasta + 'T00:00:00').getTime() - new Date(desde + 'T00:00:00').getTime()) / 86400000,
  )

/** Próxima ocurrencia de una fecha anual (MM-DD). */
function proximaOcurrencia(mmdd: string) {
  const anio = Number(HOY.slice(0, 4))
  const candidata = `${anio}-${mmdd}`
  return candidata >= HOY ? candidata : `${anio + 1}-${mmdd}`
}

// ── Contexto del cliente ─────────────────────────────────────────────────────

function ultimaInteraccion(cliente: Cliente): string | undefined {
  const fechas = [
    cliente.ultimaVisita,
    ...seguimientos.filter((s) => s.clienteId === cliente.id).map((s) => s.fecha),
    ...experiencias.filter((e) => e.clienteId === cliente.id).map((e) => e.actualizadoEn),
  ].filter(Boolean) as string[]

  return fechas.sort((a, b) => b.localeCompare(a))[0]
}

function ultimaVentaOEvento(cliente: Cliente): Momento['ultimaVentaOEvento'] {
  const candidatos: { descripcion: string; fecha: string; valor?: number }[] = [
    ...ventas
      .filter((v) => v.clienteId === cliente.id)
      .map((v) => ({ descripcion: v.descripcion, fecha: v.fecha, valor: v.monto })),
    ...experiencias
      .filter((e) => e.clienteId === cliente.id && e.estado === 'realizado' && e.fechaTentativa)
      .map((e) => ({
        descripcion: e.titulo,
        fecha: e.fechaTentativa!,
        valor: e.valorFinal ?? e.valorCotizado,
      })),
  ]

  return candidatos.sort((a, b) => b.fecha.localeCompare(a.fecha))[0]
}

// ── Acción recomendada ───────────────────────────────────────────────────────

function accionCumpleanos(cliente: Cliente, dias: number) {
  if (!cliente.autorizaComunicaciones)
    return 'Saludar por teléfono: el cliente no autoriza comunicaciones escritas.'
  if (cliente.categoria === 'vip')
    return dias === 0
      ? 'Llamar personalmente y confirmar la cortesía de la casa.'
      : 'Ofrecer celebración con cortesía de la casa por ser cliente VIP.'
  if (cliente.categoria === 'por_recuperar')
    return 'Aprovechar la fecha para reactivar la cuenta con un beneficio de regreso.'
  if (dias === 0) return 'Enviar el saludo del día y dejar constancia en seguimientos.'
  return 'Proponer una celebración en la hacienda antes de que reserve en otro lugar.'
}

function accionEvento(dias: number) {
  if (dias === 0) return 'Acompañar la celebración y confirmar que todo salga según lo pactado.'
  if (dias <= 7) return 'Confirmar número final de asistentes y detalles de montaje.'
  if (dias <= 15) return 'Cerrar el menú y revisar requerimientos especiales.'
  return 'Verificar el anticipo y el cronograma con el cliente.'
}

// ── Cálculo de momentos ──────────────────────────────────────────────────────

/**
 * Los momentos no se almacenan: se derivan de las fechas del cliente y de su
 * comportamiento cada vez que se consultan. Así nunca quedan desactualizados.
 */
function calcularMomentos(usuario: Usuario | null, dias = 30): Momento[] {
  const visibles = filtrarPorAlcance(usuario, clientes)
  const idsVisibles = new Set(visibles.map((c) => c.id))
  const momentos: Momento[] = []
  const registradas = new Set<string>()

  const agregarFechaAnual = (
    cliente: Cliente,
    tipo: 'cumpleanos' | 'aniversario',
    mmdd: string,
    descripcion?: string,
  ) => {
    const clave = `${cliente.id}-${tipo}-${mmdd}`
    if (registradas.has(clave)) return
    registradas.add(clave)

    const fecha = proximaOcurrencia(mmdd)
    const distancia = diasEntre(HOY, fecha)
    if (distancia > dias) return

    momentos.push({
      id: `mom-${tipo}-${cliente.id}-${mmdd}`,
      tipo,
      clienteId: cliente.id,
      comercialId: cliente.comercialId,
      fecha,
      dias: distancia,
      titulo: nombreCompleto(cliente),
      detalle:
        descripcion ??
        (tipo === 'cumpleanos' ? 'Cumpleaños' : 'Aniversario'),
      valor: cliente.valorHistorico,
      ultimaInteraccion: ultimaInteraccion(cliente),
      ultimaVentaOEvento: ultimaVentaOEvento(cliente),
      accionRecomendada:
        tipo === 'cumpleanos'
          ? accionCumpleanos(cliente, distancia)
          : 'Ofrecer una cena de aniversario en el comedor privado.',
    })
  }

  for (const cliente of visibles) {
    if (cliente.fechaNacimiento) {
      agregarFechaAnual(cliente, 'cumpleanos', cliente.fechaNacimiento.slice(5))
    }
    if (cliente.aniversario) {
      agregarFechaAnual(cliente, 'aniversario', cliente.aniversario.slice(5))
    }
  }

  // Fechas especiales registradas aparte (corporativas u otras)
  for (const fe of fechasEspeciales) {
    if (!fe.activa || !idsVisibles.has(fe.clienteId)) continue
    const cliente = visibles.find((c) => c.id === fe.clienteId)!
    if (fe.tipo === 'cumpleanos' || fe.tipo === 'aniversario') {
      agregarFechaAnual(cliente, fe.tipo, fe.fecha, fe.descripcion)
      continue
    }

    const fecha = proximaOcurrencia(fe.fecha)
    const distancia = diasEntre(HOY, fecha)
    if (distancia > dias) continue

    momentos.push({
      id: `mom-aniversario-${fe.id}`,
      tipo: 'aniversario',
      clienteId: cliente.id,
      comercialId: cliente.comercialId,
      fecha,
      dias: distancia,
      titulo: nombreCompleto(cliente),
      detalle: fe.descripcion,
      valor: cliente.valorHistorico,
      ultimaInteraccion: ultimaInteraccion(cliente),
      ultimaVentaOEvento: ultimaVentaOEvento(cliente),
      accionRecomendada: 'Reconocer la fecha corporativa con una propuesta a la medida.',
    })
  }

  // Experiencias confirmadas por celebrar
  for (const experiencia of filtrarPorAlcance(usuario, experiencias)) {
    if (experiencia.estado !== 'confirmado' || !experiencia.fechaTentativa) continue
    const distancia = diasEntre(HOY, experiencia.fechaTentativa)
    if (distancia < 0 || distancia > dias) continue

    const cliente = clientes.find((c) => c.id === experiencia.clienteId)
    momentos.push({
      id: `mom-evento-${experiencia.id}`,
      tipo: 'evento',
      clienteId: experiencia.clienteId,
      comercialId: experiencia.comercialId,
      fecha: experiencia.fechaTentativa,
      dias: distancia,
      titulo: experiencia.titulo,
      detalle: `${experiencia.numeroPersonas} personas${experiencia.horaInicio ? ` · ${experiencia.horaInicio}` : ''}`,
      valor: experiencia.valorFinal ?? experiencia.valorCotizado,
      experienciaId: experiencia.id,
      ultimaInteraccion: cliente ? ultimaInteraccion(cliente) : undefined,
      ultimaVentaOEvento: cliente ? ultimaVentaOEvento(cliente) : undefined,
      accionRecomendada: accionEvento(distancia),
    })
  }

  // Clientes por recuperar: un momento permanente mientras no vuelvan
  const conExperienciaFutura = new Set(
    experiencias
      .filter((e) => (e.fechaTentativa ?? '') >= HOY && e.estado !== 'perdido')
      .map((e) => e.clienteId),
  )

  for (const cliente of visibles) {
    if (conExperienciaFutura.has(cliente.id)) continue
    if (cliente.categoria === 'nuevo') continue

    const sinVisitar = cliente.ultimaVisita ? diasEntre(cliente.ultimaVisita, HOY) : null
    const enRiesgo =
      cliente.categoria === 'por_recuperar' ||
      (sinVisitar !== null && sinVisitar > DIAS_PARA_RECUPERAR)
    if (!enRiesgo) continue

    momentos.push({
      id: `mom-recuperacion-${cliente.id}`,
      tipo: 'recuperacion',
      clienteId: cliente.id,
      comercialId: cliente.comercialId,
      fecha: HOY,
      dias: 0,
      titulo: nombreCompleto(cliente),
      detalle: sinVisitar ? `${sinVisitar} días sin visitar la hacienda` : 'Sin visitas registradas',
      valor: cliente.valorHistorico,
      ultimaInteraccion: ultimaInteraccion(cliente),
      ultimaVentaOEvento: ultimaVentaOEvento(cliente),
      accionRecomendada: cliente.autorizaComunicaciones
        ? 'Llamar con una invitación concreta: brunch dominical o cena de temporada.'
        : 'Llamar directamente: la cuenta no autoriza comunicaciones escritas.',
    })
  }

  return momentos.sort((a, b) => a.dias - b.dias || a.titulo.localeCompare(b.titulo))
}

// ── Repositorio ──────────────────────────────────────────────────────────────

export const momentosRepo = {
  momentos: (usuario: Usuario | null, dias = 30) => calcularMomentos(usuario, dias),

  reglas: (): ReglaRecordatorio[] => reglasRecordatorio,

  reglasDe: (tipo: TipoMomento) => reglasRecordatorio.filter((r) => r.tipo === tipo),

  reglaActiva: (tipo: TipoMomento, anticipacion: Anticipacion) =>
    reglasRecordatorio.find((r) => r.tipo === tipo && r.anticipacion === anticipacion && r.activa),

  alternarRegla: (id: string) => {
    const regla = reglasRecordatorio.find((r) => r.id === id)
    if (!regla) return
    regla.activa = !regla.activa
    notificarCambio()
  },

  /** Habilita o deshabilita un canal en una regla. */
  alternarCanal: (id: string, canal: CanalNotificacion) => {
    const regla = reglasRecordatorio.find((r) => r.id === id)
    if (!regla) return
    regla.canales = regla.canales.includes(canal)
      ? regla.canales.filter((c) => c !== canal)
      : [...regla.canales, canal]
    notificarCambio()
  },

  /**
   * Genera las notificaciones que corresponden según las reglas activas.
   *
   * Una regla de N días avisa cuando el momento **entra en su ventana**
   * (`dias <= N`), no solo el día exacto: así el recordatorio aparece aunque
   * nadie abra el CRM justo esa mañana. La regla del mismo día (`0`) sigue
   * disparando únicamente cuando el momento es hoy.
   *
   * Es idempotente: una misma regla no vuelve a avisar del mismo momento.
   */
  sincronizar: (usuario: Usuario | null) => {
    const momentos = calcularMomentos(usuario, 30)
    let nuevas = 0

    for (const momento of momentos) {
      for (const regla of reglasRecordatorio) {
        if (!regla.activa || regla.tipo !== momento.tipo) continue
        if (momento.dias > regla.anticipacion) continue

        const yaExiste = notificaciones.some(
          (n) => n.momentoId === momento.id && n.reglaId === regla.id,
        )
        if (yaExiste) continue

        const notificacion: Notificacion = {
          id: `not-${regla.id}-${momento.id}`,
          reglaId: regla.id,
          momentoId: momento.id,
          tipo: momento.tipo,
          clienteId: momento.clienteId,
          destinatarioId: momento.comercialId,
          titulo: tituloDe(momento, regla.anticipacion),
          mensaje: momento.detalle ?? '',
          accionRecomendada: momento.accionRecomendada,
          fechaMomento: momento.fecha,
          fechaGenerada: HOY,
          canal: 'crm',
          estado: 'pendiente',
          enviadaPorCorreo: false,
        }

        notificaciones.unshift(notificacion)
        nuevas += 1

        // El canal de correo está declarado pero apagado: queda la traza
        if (regla.canales.includes('correo')) {
          void despachar(notificacion, 'correo')
        }
      }
    }

    if (nuevas > 0) notificarCambio()
    return nuevas
  },

  notificaciones: (usuario: Usuario | null): Notificacion[] => {
    const todas = [...notificaciones].sort((a, b) =>
      a.fechaMomento.localeCompare(b.fechaMomento),
    )
    if (!usuario) return []
    // Gerencia ve las de toda la hacienda; un comercial, solo las suyas
    return usuario.rol === 'gerencia'
      ? todas
      : todas.filter((n) => n.destinatarioId === usuario.id)
  },

  pendientes: (usuario: Usuario | null) =>
    momentosRepo.notificaciones(usuario).filter((n) => n.estado === 'pendiente'),

  marcar: (id: string, estado: Notificacion['estado']) => {
    const notificacion = notificaciones.find((n) => n.id === id)
    if (!notificacion) return
    notificacion.estado = estado
    notificarCambio()
  },

  marcarTodasVistas: (usuario: Usuario | null) => {
    for (const n of momentosRepo.notificaciones(usuario)) {
      if (n.estado === 'pendiente') n.estado = 'vista'
    }
    notificarCambio()
  },
}

function tituloDe(momento: Momento, anticipacion: Anticipacion) {
  // El título habla de la cercanía real del momento, no de la regla que lo disparó
  const dias = momento.dias
  const cuando =
    dias === 0 ? 'hoy' : dias === 1 ? 'mañana' : `en ${dias} días`
  void anticipacion

  switch (momento.tipo) {
    case 'cumpleanos':
      return `Cumpleaños de ${momento.titulo} ${cuando}`
    case 'aniversario':
      return `Aniversario de ${momento.titulo} ${cuando}`
    case 'evento':
      return `«${momento.titulo}» se celebra ${cuando}`
    default:
      return `${momento.titulo} lleva tiempo sin volver`
  }
}
