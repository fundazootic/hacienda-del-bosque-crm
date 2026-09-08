import type { Cliente, Momento, Usuario } from '@/core/types'
import { etiquetaCategoria } from '@/core/utils/etiquetas'
import { formatearFecha, formatearFechaCorta } from '@/core/utils/fecha'

export interface FilaCumpleanos {
  nombre: string
  fecha: string
  categoria: string
  comercial: string
  telefono: string
  ultimaInteraccion: string
  dias: number
}

export interface GrupoCumpleanos {
  etiqueta: string
  dias: number
  filas: FilaCumpleanos[]
}

export const VENTANAS_RESUMEN: { dias: number; etiqueta: string }[] = [
  { dias: 0, etiqueta: 'Hoy' },
  { dias: 7, etiqueta: 'Próximos 7 días' },
  { dias: 15, etiqueta: 'Próximos 15 días' },
  { dias: 30, etiqueta: 'Próximos 30 días' },
]

/**
 * Reparte los cumpleaños en las ventanas del resumen sin repetirlos: cada
 * cliente aparece una sola vez, en la ventana más cercana que le corresponde.
 */
export function agruparCumpleanos(
  momentos: Momento[],
  ventanas: number[],
  datos: {
    cliente: (id: string) => Cliente | undefined
    comercial: (id: string) => Usuario | undefined
  },
): GrupoCumpleanos[] {
  const activas = VENTANAS_RESUMEN.filter((v) => ventanas.includes(v.dias))
  const usados = new Set<string>()

  return activas
    .map((ventana, indice) => {
      const anterior = indice === 0 ? -1 : activas[indice - 1].dias

      const filas = momentos
        .filter((m) => {
          if (usados.has(m.id)) return false
          if (m.dias > ventana.dias || m.dias <= anterior) return false
          usados.add(m.id)
          return true
        })
        .sort((a, b) => a.dias - b.dias)
        .map<FilaCumpleanos>((m) => {
          const cliente = datos.cliente(m.clienteId)
          const comercial = datos.comercial(m.comercialId)
          return {
            nombre: m.titulo,
            fecha: formatearFecha(m.fecha, "d 'de' MMMM"),
            categoria: cliente ? etiquetaCategoria[cliente.categoria] : '—',
            comercial: comercial?.nombre ?? 'Sin asignar',
            telefono: cliente?.telefono ?? '—',
            ultimaInteraccion: m.ultimaInteraccion
              ? formatearFechaCorta(m.ultimaInteraccion)
              : 'Sin registro',
            dias: m.dias,
          }
        })

      return { etiqueta: ventana.etiqueta, dias: ventana.dias, filas }
    })
    .filter((g) => g.filas.length > 0)
}

export const asuntoCumpleanos = (grupos: GrupoCumpleanos[], fecha: string) => {
  const hoy = grupos.find((g) => g.dias === 0)?.filas.length ?? 0
  const total = grupos.reduce((s, g) => s + g.filas.length, 0)
  const inicio = hoy > 0 ? `${hoy} cumpleaños hoy` : 'Sin cumpleaños hoy'
  return `Hacienda del Bosque · ${inicio} · ${total} en los próximos 30 días (${formatearFechaCorta(fecha)})`
}

const escapar = (texto: string) =>
  texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Cuerpo del resumen diario de cumpleaños.
 *
 * Es un correo **interno**: se escribe para el equipo comercial, con el dato de
 * contacto del cliente para que puedan llamarlo. Nunca se envía al cliente.
 */
export function cuerpoCumpleanos(opciones: {
  grupos: GrupoCumpleanos[]
  fecha: string
  destinatario: Usuario
  alcance: 'hacienda' | 'cartera'
}): string {
  const { grupos, fecha, destinatario, alcance } = opciones
  const total = grupos.reduce((s, g) => s + g.filas.length, 0)

  const secciones = grupos
    .map(
      (g) => `
      <tr><td style="padding:22px 28px 8px 28px;">
        <p style="margin:0;font:600 11px/1.4 Inter,Arial,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#4E8567;">
          ${escapar(g.etiqueta)} · ${g.filas.length}
        </p>
      </td></tr>
      <tr><td style="padding:0 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            ${['Cliente', 'Cumpleaños', 'Categoría', 'Responsable', 'Teléfono', 'Última interacción']
              .map(
                (h) =>
                  `<th align="left" style="padding:8px 10px;border-bottom:1px solid #EBE4D4;font:500 10px/1.4 Inter,Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#8FA396;">${h}</th>`,
              )
              .join('')}
          </tr>
          ${g.filas
            .map(
              (f, i) => `
          <tr style="background:${i % 2 ? '#FBF9F4' : '#FFFFFF'};">
            <td style="padding:10px;border-bottom:1px solid #F5F1E7;font:500 13px/1.4 Inter,Arial,sans-serif;color:#16281F;">${escapar(f.nombre)}</td>
            <td style="padding:10px;border-bottom:1px solid #F5F1E7;font:400 13px/1.4 Inter,Arial,sans-serif;color:#23231F;">${escapar(f.fecha)}</td>
            <td style="padding:10px;border-bottom:1px solid #F5F1E7;font:400 12px/1.4 Inter,Arial,sans-serif;color:#26503C;">${escapar(f.categoria)}</td>
            <td style="padding:10px;border-bottom:1px solid #F5F1E7;font:400 12px/1.4 Inter,Arial,sans-serif;color:#23231F;">${escapar(f.comercial)}</td>
            <td style="padding:10px;border-bottom:1px solid #F5F1E7;font:400 13px/1.4 Inter,Arial,sans-serif;color:#23231F;">${escapar(f.telefono)}</td>
            <td style="padding:10px;border-bottom:1px solid #F5F1E7;font:400 12px/1.4 Inter,Arial,sans-serif;color:#6B6B63;">${escapar(f.ultimaInteraccion)}</td>
          </tr>`,
            )
            .join('')}
        </table>
      </td></tr>`,
    )
    .join('')

  const vacio = `
      <tr><td style="padding:28px;">
        <p style="margin:0;font:400 14px/1.6 Inter,Arial,sans-serif;color:#6B6B63;">
          No hay cumpleaños en las ventanas configuradas. Nada que gestionar hoy por este frente.
        </p>
      </td></tr>`

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Próximos cumpleaños</title></head>
<body style="margin:0;background:#F5F1E7;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F1E7;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="680" cellpadding="0" cellspacing="0" style="width:680px;max-width:100%;background:#FFFFFF;border:1px solid #DCD3BE;border-radius:12px;overflow:hidden;">

        <tr><td style="background:#16281F;padding:26px 28px;">
          <p style="margin:0;font:400 11px/1.4 Inter,Arial,sans-serif;letter-spacing:.28em;text-transform:uppercase;color:#DCC48D;">
            Hacienda del Bosque · CRM
          </p>
          <p style="margin:8px 0 0 0;font:300 26px/1.2 Georgia,'Times New Roman',serif;color:#FBF9F4;">
            Próximos cumpleaños
          </p>
          <p style="margin:6px 0 0 0;font:400 12px/1.5 Inter,Arial,sans-serif;color:#AFC7B6;">
            Resumen del ${escapar(formatearFecha(fecha))} · ${total} ${total === 1 ? 'cliente' : 'clientes'}
          </p>
        </td></tr>

        <tr><td style="padding:20px 28px 0 28px;">
          <p style="margin:0;font:400 14px/1.6 Inter,Arial,sans-serif;color:#23231F;">
            ${escapar(destinatario.nombre.split(' ')[0])}, estas son las fechas que vienen
            ${alcance === 'cartera' ? 'en su cartera' : 'en la cartera de la hacienda'}.
          </p>
        </td></tr>

        ${total > 0 ? secciones : vacio}

        <tr><td style="padding:24px 28px 28px 28px;">
          <p style="margin:0;padding:14px 16px;background:#FBF9F4;border-left:3px solid #C9A961;font:400 12px/1.6 Inter,Arial,sans-serif;color:#6B6B63;">
            Correo interno del equipo comercial. <strong style="color:#26503C;">No se envía ninguna
            comunicación al cliente desde este resumen</strong>: cada saludo o invitación lo hace su
            comercial responsable y queda registrado en el CRM.
          </p>
        </td></tr>

        <tr><td style="background:#FBF9F4;border-top:1px solid #EBE4D4;padding:16px 28px;">
          <p style="margin:0;font:400 10px/1.5 Inter,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#8FA396;">
            Hacienda del Bosque · Cali, Valle del Cauca
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`
}
