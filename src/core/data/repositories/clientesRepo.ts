import type {
  AsignacionHistorial,
  Cliente,
  DatosCliente,
  IntentoDuplicado,
  OrigenAsignacion,
  Usuario,
} from '@/core/types'
import {
  clientes,
  construirCliente,
  historialAsignaciones,
  intentosDuplicados,
} from '@/core/data/mock/clientes'
import { normalizarEmail, normalizarTelefono, normalizarTexto } from '@/core/utils/normalizar'
import { nombreCompleto } from '@/core/utils/cliente'
import { HOY_DEMO } from '@/core/utils/fecha'
import { filtrarPorAlcance } from '@/core/permissions/permisos'
import { notificarCambio } from '@/core/data/store'
import { usuarios } from '@/core/data/mock/usuarios'
import { auditoriaRepo } from './auditoriaRepo'

const nombreUsuario = (id: string) => usuarios.find((u) => u.id === id)?.nombre ?? 'Sin asignar'

export interface ResultadoDuplicado {
  existe: boolean
  criterio?: 'telefono' | 'email'
  cliente?: Cliente
}

const hoy = () => HOY_DEMO
const ahora = () => `${HOY_DEMO}T${new Date().toTimeString().slice(0, 8)}`

function siguienteCodigo() {
  const numeros = clientes
    .map((c) => Number(c.codigo.replace(/\D/g, '')))
    .filter((n) => !Number.isNaN(n))
  const siguiente = (numeros.length ? Math.max(...numeros) : 0) + 1
  return `HDB-${String(siguiente).padStart(4, '0')}`
}

/**
 * Capa de acceso a datos de Clientes.
 * Hoy resuelve contra datos ficticios en memoria; mañana contra la API real
 * sin que los módulos que la consumen cambien una sola línea.
 */
export const clientesRepo = {
  listar: (): Cliente[] => clientes,

  /** Lista respetando el alcance del rol: Gerencia ve todo, un comercial solo lo suyo. */
  listarVisibles: (usuario: Usuario | null): Cliente[] => filtrarPorAlcance(usuario, clientes),

  obtener: (id: string) => clientes.find((c) => c.id === id),

  nombreDe: (id: string) => {
    const cliente = clientes.find((c) => c.id === id)
    return cliente ? nombreCompleto(cliente) : 'Cliente sin registro'
  },

  /** Búsqueda por nombre, empresa, código, teléfono o correo. */
  buscar: (termino: string, base: Cliente[] = clientes): Cliente[] => {
    const t = normalizarTexto(termino)
    if (!t) return base

    /*
     * El teléfono se busca con la misma normalización con que se guarda: así
     * "+57 315 220 8844", "3152208844" y "315 220" encuentran al mismo cliente.
     */
    const digitos = termino.replace(/\D/g, '')
    const telefono = digitos.length >= 10 ? normalizarTelefono(termino) : digitos

    return base.filter(
      (c) =>
        normalizarTexto(nombreCompleto(c)).includes(t) ||
        normalizarTexto(c.empresa ?? '').includes(t) ||
        normalizarTexto(c.codigo).includes(t) ||
        c.emailNormalizado.includes(normalizarEmail(termino)) ||
        (telefono.length >= 3 && c.telefonoNormalizado.includes(telefono)),
    )
  },

  /**
   * REGLA FUNDAMENTAL: un cliente no puede duplicarse por teléfono ni por correo.
   * Se consulta antes de crear cualquier registro; si devuelve `existe`, la
   * interfaz muestra quién es el comercial responsable y no se crea nada.
   */
  detectarDuplicado: (
    datos: { telefono?: string; email?: string },
    excluirId?: string,
  ): ResultadoDuplicado => {
    const candidatos = clientes.filter((c) => c.id !== excluirId)
    const tel = datos.telefono ? normalizarTelefono(datos.telefono) : ''
    const mail = datos.email ? normalizarEmail(datos.email) : ''

    if (tel.length >= 7) {
      const hallado = candidatos.find((c) => c.telefonoNormalizado === tel)
      if (hallado) return { existe: true, criterio: 'telefono', cliente: hallado }
    }
    if (mail) {
      const hallado = candidatos.find((c) => c.emailNormalizado === mail)
      if (hallado) return { existe: true, criterio: 'email', cliente: hallado }
    }
    return { existe: false }
  },

  /** Alta de cliente. Nunca crea si hay duplicado: devuelve el conflicto. */
  crear: (
    datos: DatosCliente,
    autor: Usuario,
  ):
    | { creado: true; cliente: Cliente }
    | { creado: false; duplicado: ResultadoDuplicado; intento?: IntentoDuplicado } => {
    const duplicado = clientesRepo.detectarDuplicado({
      telefono: datos.telefono,
      email: datos.email,
    })

    if (duplicado.existe) {
      const intento = clientesRepo.registrarIntento(datos, duplicado, autor)
      return { creado: false, duplicado, intento }
    }

    const cliente = construirCliente({
      ...datos,
      id: `cli-${String(clientes.length + 1).padStart(3, '0')}-${Date.now().toString(36)}`,
      codigo: siguienteCodigo(),
      fechaRegistro: hoy(),
      fechaAsignacion: hoy(),
      valorHistorico: 0,
      numeroEventos: 0,
      creadoPor: autor.id,
      actualizadoEn: hoy(),
    })

    clientes.unshift(cliente)

    auditoriaRepo.registrar({
      accion: 'cliente_creado',
      actorId: autor.id,
      entidad: 'cliente',
      entidadId: cliente.id,
      descripcion: `${autor.nombre} registró a ${cliente.nombres} ${cliente.apellidos}`,
      detalle: {
        codigo: cliente.codigo,
        responsable: nombreUsuario(cliente.comercialId),
        origen: cliente.origen,
      },
    })

    notificarCambio()
    return { creado: true, cliente }
  },

  /** Edición. Conserva la propiedad comercial salvo que Gerencia la cambie. */
  actualizar: (
    id: string,
    datos: DatosCliente,
    autor?: Usuario,
  ): { actualizado: true; cliente: Cliente } | { actualizado: false; duplicado: ResultadoDuplicado } => {
    const indice = clientes.findIndex((c) => c.id === id)
    if (indice < 0) throw new Error(`Cliente ${id} no encontrado`)

    const duplicado = clientesRepo.detectarDuplicado(
      { telefono: datos.telefono, email: datos.email },
      id,
    )
    if (duplicado.existe) return { actualizado: false, duplicado }

    const anterior = clientes[indice]
    const actualizado = construirCliente({
      ...anterior,
      ...datos,
      actualizadoEn: hoy(),
    })

    clientes[indice] = actualizado

    if (autor) {
      auditoriaRepo.registrar({
        accion: 'cliente_editado',
        actorId: autor.id,
        entidad: 'cliente',
        entidadId: actualizado.id,
        descripcion: `${autor.nombre} editó la ficha de ${actualizado.nombres} ${actualizado.apellidos}`,
        detalle: { codigo: actualizado.codigo },
      })
    }

    notificarCambio()
    return { actualizado: true, cliente: actualizado }
  },

  /**
   * Cambio de propietario comercial. Solo Gerencia.
   * Agrega una línea al historial: jamás modifica ni borra las anteriores.
   */
  reasignar: (
    clienteId: string,
    comercialNuevoId: string,
    motivo: string,
    autor: Usuario,
    origen: OrigenAsignacion = 'reasignacion_gerencia',
    solicitudId?: string,
  ) => {
    const indice = clientes.findIndex((c) => c.id === clienteId)
    if (indice < 0) return

    const cliente = clientes[indice]
    const anterior = cliente.comercialId
    if (anterior === comercialNuevoId) return

    clientes[indice] = {
      ...cliente,
      comercialId: comercialNuevoId,
      fechaAsignacion: hoy(),
      actualizadoEn: hoy(),
    }

    historialAsignaciones.unshift({
      id: `asg-${Date.now().toString(36)}`,
      clienteId,
      comercialAnteriorId: anterior,
      comercialNuevoId,
      origen,
      motivo,
      autorizadoPor: autor.id,
      fecha: hoy(),
      solicitudId,
    })

    auditoriaRepo.registrar({
      accion: 'cliente_reasignado',
      actorId: autor.id,
      entidad: 'cliente',
      entidadId: clienteId,
      descripcion: `${cliente.nombres} ${cliente.apellidos} pasó de ${nombreUsuario(anterior)} a ${nombreUsuario(comercialNuevoId)}`,
      detalle: { motivo, solicitud: solicitudId },
    })

    notificarCambio()
  },

  /**
   * Auditoría: guarda el intento de creación duplicada aunque nadie pida el
   * traslado. Es la evidencia con la que Gerencia resuelve los conflictos.
   */
  registrarIntento: (
    datos: Pick<DatosCliente, 'nombres' | 'apellidos' | 'telefono' | 'email'>,
    duplicado: ResultadoDuplicado,
    autor: Usuario,
  ): IntentoDuplicado | undefined => {
    if (!duplicado.cliente || !duplicado.criterio) return undefined

    const intento: IntentoDuplicado = {
      id: `int-${Date.now().toString(36)}`,
      clienteId: duplicado.cliente.id,
      comercialSolicitanteId: autor.id,
      comercialResponsableId: duplicado.cliente.comercialId,
      criterio: duplicado.criterio,
      valorDetectado:
        duplicado.criterio === 'telefono'
          ? normalizarTelefono(datos.telefono)
          : normalizarEmail(datos.email),
      datosIntento: {
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        telefono: datos.telefono,
        email: datos.email,
      },
      fecha: ahora(),
    }

    intentosDuplicados.unshift(intento)

    auditoriaRepo.registrar({
      accion: 'duplicado_bloqueado',
      actorId: autor.id,
      entidad: 'cliente',
      entidadId: duplicado.cliente.id,
      descripcion: `${autor.nombre} intentó registrar a ${duplicado.cliente.nombres} ${duplicado.cliente.apellidos}`,
      detalle: {
        criterio: duplicado.criterio === 'telefono' ? 'teléfono' : 'correo',
        responsable: nombreUsuario(duplicado.cliente.comercialId),
      },
    })

    notificarCambio()
    return intento
  },

  intentos: (): IntentoDuplicado[] => intentosDuplicados,

  intentosDeCliente: (clienteId: string): IntentoDuplicado[] =>
    intentosDuplicados.filter((i) => i.clienteId === clienteId),

  historialAsignaciones: (): AsignacionHistorial[] => historialAsignaciones,

  /**
   * Historial completo de propietarios, del más reciente al primero.
   * La asignación inicial se deriva de quién registró al cliente, de modo que
   * ninguna ficha aparezca sin origen aunque nunca la hayan reasignado.
   */
  historialDeCliente: (clienteId: string): AsignacionHistorial[] => {
    const cliente = clientes.find((c) => c.id === clienteId)
    const movimientos = historialAsignaciones
      .filter((a) => a.clienteId === clienteId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))

    if (!cliente) return movimientos

    const primerPropietario =
      movimientos.length > 0
        ? (movimientos[movimientos.length - 1].comercialAnteriorId ?? cliente.creadoPor)
        : cliente.comercialId

    return [
      ...movimientos,
      {
        id: `asg-ini-${cliente.id}`,
        clienteId: cliente.id,
        comercialNuevoId: primerPropietario,
        origen: 'registro',
        motivo: 'Asignación inicial al registrar el cliente',
        autorizadoPor: cliente.creadoPor,
        fecha: cliente.fechaRegistro,
      },
    ]
  },
}
