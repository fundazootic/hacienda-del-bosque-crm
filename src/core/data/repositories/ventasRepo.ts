import type { DatosVenta, EstadoPago, Usuario, Venta } from '@/core/types'
import { ventas } from '@/core/data/mock/ventas'
import { clientes } from '@/core/data/mock/clientes'
import { usuarios } from '@/core/data/mock/usuarios'
import { formatearMoneda } from '@/core/utils/format'
import { HOY_DEMO } from '@/core/utils/fecha'
import { filtrarPorAlcance } from '@/core/permissions/permisos'
import { notificarCambio } from '@/core/data/store'
import { auditoriaRepo } from './auditoriaRepo'

const nombreCliente = (id: string) => {
  const c = clientes.find((x) => x.id === id)
  return c ? `${c.nombres} ${c.apellidos}` : 'Cliente sin registro'
}

const comisionDe = (comercialId: string) =>
  usuarios.find((u) => u.id === comercialId)?.comisionPorcentaje ?? 0

function siguienteCodigo() {
  const numeros = ventas
    .map((v) => Number(v.codigo.replace(/\D/g, '')))
    .filter((n) => !Number.isNaN(n))
  return `VTA-${String((numeros.length ? Math.max(...numeros) : 0) + 1).padStart(4, '0')}`
}

/** Una venta está por cobrar mientras no esté pagada. */
export const estaPorCobrar = (v: Venta) => v.estadoPago !== 'pagado'

export const valorNeto = (v: Venta) => v.monto - v.descuento

/**
 * Ventas y comisiones.
 *
 * La comisión se calcula siempre desde el porcentaje pactado del comercial y
 * sobre el valor neto: no se digita a mano, para que nadie pueda alterarla.
 */
export const ventasRepo = {
  listar: () => ventas,

  listarVisibles: (u: Usuario | null) => filtrarPorAlcance(u, ventas),

  obtener: (id: string) => ventas.find((v) => v.id === id),

  delPeriodo: (u: Usuario | null, anioMes: string) =>
    filtrarPorAlcance(u, ventas).filter((v) => v.fecha.startsWith(anioMes)),

  deExperiencia: (experienciaId: string) =>
    ventas.filter((v) => v.experienciaId === experienciaId),

  deCliente: (clienteId: string) =>
    ventas
      .filter((v) => v.clienteId === clienteId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha)),

  registrar: (datos: DatosVenta, autor: Usuario): Venta => {
    const porcentaje = comisionDe(datos.comercialId)
    const neto = datos.monto - (datos.descuento ?? 0)

    const venta: Venta = {
      ...datos,
      id: `vta-${Date.now().toString(36)}`,
      codigo: siguienteCodigo(),
      descuento: datos.descuento ?? 0,
      comisionPorcentaje: porcentaje,
      comisionValor: Math.round((neto * porcentaje) / 100),
      comisionLiquidada: false,
    }

    ventas.unshift(venta)

    auditoriaRepo.registrar({
      accion: 'venta_registrada',
      actorId: autor.id,
      entidad: 'venta',
      entidadId: venta.id,
      descripcion: `${autor.nombre} registró ${formatearMoneda(neto)} de ${nombreCliente(venta.clienteId)}`,
      detalle: {
        codigo: venta.codigo,
        concepto: venta.descripcion,
        comision: venta.comisionValor > 0 ? formatearMoneda(venta.comisionValor) : undefined,
      },
    })

    notificarCambio()
    return venta
  },

  /** Cambio del estado de pago. Deja constancia de quién lo movió. */
  cambiarEstadoPago: (id: string, estado: EstadoPago, autor: Usuario) => {
    const indice = ventas.findIndex((v) => v.id === id)
    if (indice < 0) return

    const anterior = ventas[indice]
    if (anterior.estadoPago === estado) return

    ventas[indice] = { ...anterior, estadoPago: estado }

    auditoriaRepo.registrar({
      accion: 'venta_pago',
      actorId: autor.id,
      entidad: 'venta',
      entidadId: id,
      descripcion: `${anterior.codigo} pasó a «${estado}» · ${nombreCliente(anterior.clienteId)}`,
      detalle: { monto: formatearMoneda(valorNeto(anterior)) },
    })

    notificarCambio()
  },

  /**
   * Liquidación de comisiones de un comercial. Solo Gerencia.
   * Marca como liquidadas todas las comisiones pendientes de ventas pagadas:
   * no se liquida lo que la hacienda todavía no ha cobrado.
   */
  liquidarComisiones: (comercialId: string, autor: Usuario) => {
    const pendientes = ventas.filter(
      (v) =>
        v.comercialId === comercialId &&
        v.comisionValor > 0 &&
        !v.comisionLiquidada &&
        v.estadoPago === 'pagado',
    )
    if (pendientes.length === 0) return { liquidadas: 0, valor: 0 }

    let valor = 0
    for (const venta of pendientes) {
      const indice = ventas.findIndex((v) => v.id === venta.id)
      ventas[indice] = { ...venta, comisionLiquidada: true }
      valor += venta.comisionValor
    }

    const comercial = usuarios.find((u) => u.id === comercialId)

    auditoriaRepo.registrar({
      accion: 'comision_liquidada',
      actorId: autor.id,
      entidad: 'venta',
      entidadId: comercialId,
      descripcion: `${autor.nombre} liquidó comisiones de ${comercial?.nombre ?? 'un comercial'}`,
      detalle: {
        operaciones: pendientes.length,
        valor: formatearMoneda(valor),
        fecha: HOY_DEMO,
      },
    })

    notificarCambio()
    return { liquidadas: pendientes.length, valor }
  },
}
