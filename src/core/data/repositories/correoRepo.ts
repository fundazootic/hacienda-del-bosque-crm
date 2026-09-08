import type {
  AlertaCorreo,
  DestinatarioEnvio,
  EnvioCorreo,
  Usuario,
} from '@/core/types'
import { alertasCorreo, enviosCorreo } from '@/core/data/mock/correo'
import { usuarios } from '@/core/data/mock/usuarios'
import { clientes } from '@/core/data/mock/clientes'
import { HOY_DEMO } from '@/core/utils/fecha'
import { notificarCambio } from '@/core/data/store'
import {
  agruparCumpleanos,
  asuntoCumpleanos,
  cuerpoCumpleanos,
  type GrupoCumpleanos,
} from '@/core/notificaciones/plantillas'
import { notificadorCorreo } from '@/core/notificaciones/notificador'
import { momentosRepo } from './momentosRepo'
import { auditoriaRepo } from './auditoriaRepo'

const ahora = () => `${HOY_DEMO}T${new Date().toTimeString().slice(0, 8)}`

const usuarioPorId = (id: string) => usuarios.find((u) => u.id === id)
const clientePorId = (id: string) => clientes.find((c) => c.id === id)

let secuencia = enviosCorreo.length

/**
 * Salvaguarda del sistema: un destinatario válido es siempre un usuario activo
 * del CRM. Aunque alguien manipulara la configuración, jamás se compondría un
 * correo dirigido a un cliente.
 */
function destinatariosValidos(alerta: AlertaCorreo): Usuario[] {
  return alerta.destinatarios
    .map(usuarioPorId)
    .filter((u): u is Usuario => Boolean(u && u.activo && u.email.includes('@')))
}

export interface ResumenCumpleanos {
  grupos: GrupoCumpleanos[]
  total: number
  hoy: number
}

export const correoRepo = {
  alertas: (): AlertaCorreo[] => alertasCorreo,

  alerta: (id: string) => alertasCorreo.find((a) => a.id === id),

  /** Usuarios que pueden recibir alertas: todo el equipo activo. */
  destinatariosPosibles: (): Usuario[] => usuarios.filter((u) => u.activo),

  actualizarAlerta: (id: string, cambios: Partial<AlertaCorreo>) => {
    const indice = alertasCorreo.findIndex((a) => a.id === id)
    if (indice < 0) return
    alertasCorreo[indice] = { ...alertasCorreo[indice], ...cambios }
    notificarCambio()
  },

  alternarDestinatario: (id: string, usuarioId: string) => {
    const alerta = alertasCorreo.find((a) => a.id === id)
    if (!alerta) return
    // Solo usuarios del CRM: la lista nunca admite un correo de cliente
    if (!usuarioPorId(usuarioId)) return

    alerta.destinatarios = alerta.destinatarios.includes(usuarioId)
      ? alerta.destinatarios.filter((d) => d !== usuarioId)
      : [...alerta.destinatarios, usuarioId]
    notificarCambio()
  },

  alternarVentana: (id: string, dias: number) => {
    const alerta = alertasCorreo.find((a) => a.id === id)
    if (!alerta) return
    alerta.ventanas = alerta.ventanas.includes(dias)
      ? alerta.ventanas.filter((v) => v !== dias)
      : [...alerta.ventanas, dias].sort((a, b) => a - b)
    notificarCambio()
  },

  /** Cumpleaños próximos que vería un destinatario según su alcance. */
  resumenCumpleanos: (alerta: AlertaCorreo, destinatario: Usuario): ResumenCumpleanos => {
    // Gerencia siempre ve la hacienda completa; un comercial, su cartera
    const alcanceCompleto = destinatario.rol === 'gerencia' || !alerta.soloCarteraPropia
    const referencia = alcanceCompleto
      ? (usuarios.find((u) => u.rol === 'gerencia') ?? destinatario)
      : destinatario

    const momentos = momentosRepo
      .momentos(referencia, 30)
      .filter((m) => m.tipo === 'cumpleanos')

    const grupos = agruparCumpleanos(momentos, alerta.ventanas, {
      cliente: clientePorId,
      comercial: usuarioPorId,
    })

    return {
      grupos,
      total: grupos.reduce((s, g) => s + g.filas.length, 0),
      hoy: grupos.find((g) => g.dias === 0)?.filas.length ?? 0,
    }
  },

  /** Cuerpo del correo tal como lo recibiría ese destinatario. */
  vistaPrevia: (alerta: AlertaCorreo, destinatario: Usuario) => {
    const resumen = correoRepo.resumenCumpleanos(alerta, destinatario)
    const alcance =
      destinatario.rol === 'gerencia' || !alerta.soloCarteraPropia ? 'hacienda' : 'cartera'

    return {
      asunto: asuntoCumpleanos(resumen.grupos, HOY_DEMO),
      cuerpoHtml: cuerpoCumpleanos({
        grupos: resumen.grupos,
        fecha: HOY_DEMO,
        destinatario,
        alcance,
      }),
      resumen,
    }
  },

  /**
   * Ejecuta la alerta: compone un correo por destinatario, lo entrega al canal
   * y registra el resultado. Devuelve el envío guardado.
   */
  ejecutar: async (
    alertaId: string,
    disparadoPor: 'manual' | 'programado',
    actor?: Usuario,
  ): Promise<EnvioCorreo | undefined> => {
    const alerta = alertasCorreo.find((a) => a.id === alertaId)
    if (!alerta) return undefined

    secuencia += 1
    const base = {
      id: `env-${String(secuencia).padStart(3, '0')}`,
      alertaId,
      fecha: ahora(),
      disparadoPor,
      actorId: actor?.id,
    }

    const equipo = destinatariosValidos(alerta)
    if (equipo.length === 0) {
      const envio: EnvioCorreo = {
        ...base,
        asunto: '(sin envío)',
        destinatarios: [],
        resultado: 'sin_destinatarios',
        detalle: 'La alerta no tiene destinatarios válidos configurados.',
      }
      enviosCorreo.unshift(envio)
      notificarCambio()
      return envio
    }

    const registros: DestinatarioEnvio[] = []
    let asunto = ''
    let cuerpoGuardado: string | undefined
    let totalGlobal = 0
    let hoyGlobal = 0

    for (const destinatario of equipo) {
      const { asunto: asuntoDestinatario, cuerpoHtml, resumen } = correoRepo.vistaPrevia(
        alerta,
        destinatario,
      )

      if (!asunto) {
        asunto = asuntoDestinatario
        cuerpoGuardado = cuerpoHtml
        totalGlobal = resumen.total
        hoyGlobal = resumen.hoy
      }

      const resultado = await notificadorCorreo.enviarCorreo({
        para: destinatario.email,
        nombreDestinatario: destinatario.nombre,
        asunto: asuntoDestinatario,
        cuerpoHtml,
      })

      registros.push({
        usuarioId: destinatario.id,
        nombre: destinatario.nombre,
        email: destinatario.email,
        entregado: resultado.entregada,
        motivo: resultado.motivo,
        registros: resumen.total,
      })
    }

    const algunoConContenido = registros.some((r) => r.registros > 0)
    const envio: EnvioCorreo = {
      ...base,
      asunto,
      destinatarios: registros,
      resultado: !algunoConContenido
        ? 'sin_contenido'
        : notificadorCorreo.modo === 'real'
          ? registros.every((r) => r.entregado)
            ? 'enviado'
            : 'error'
          : 'simulado',
      detalle: `${totalGlobal} ${totalGlobal === 1 ? 'cumpleaños' : 'cumpleaños'} en 30 días${hoyGlobal > 0 ? ` · ${hoyGlobal} el mismo día` : ''}`,
      cuerpoHtml: cuerpoGuardado,
    }

    enviosCorreo.unshift(envio)
    alerta.ultimoEnvio = envio.fecha

    if (actor) {
      auditoriaRepo.registrar({
        accion: 'alerta_ejecutada',
        actorId: actor.id,
        entidad: 'alerta',
        entidadId: alerta.id,
        descripcion: `${actor.nombre} ejecutó la alerta «${alerta.nombre}»`,
        detalle: {
          destinatarios: registros.length,
          resultado: envio.resultado,
          resumen: envio.detalle,
        },
      })
    }

    notificarCambio()
    return envio
  },

  envios: (): EnvioCorreo[] =>
    [...enviosCorreo].sort((a, b) => b.fecha.localeCompare(a.fecha)),

  enviosDe: (alertaId: string) => correoRepo.envios().filter((e) => e.alertaId === alertaId),
}
