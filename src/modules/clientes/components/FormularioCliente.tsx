import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import type { CategoriaCliente, Cliente, DatosCliente, OrigenCliente } from '@/core/types'
import { clientesRepo, equipoRepo, type ResultadoDuplicado } from '@/core/data/repositories'
import { useSesion } from '@/core/auth/SesionContext'
import { descripcionCategoria, etiquetaCategoria, etiquetaOrigen } from '@/core/utils/etiquetas'
import { formatearFecha } from '@/core/utils/fecha'
import {
  AreaTexto,
  Boton,
  Campo,
  CampoBloque,
  Entrada,
  Interruptor,
  ListaEditable,
  PanelLateral,
  SeccionFormulario,
  Seleccion,
} from '@/ui'
import { AvisoDuplicado } from './AvisoDuplicado'
import { ORDEN_CATEGORIAS } from '../services/clientesService'

const ORIGENES: OrigenCliente[] = [
  'referido',
  'redes_sociales',
  'pagina_web',
  'visita_espontanea',
  'evento_previo',
  'alianza',
  'prensa',
  'gestion_comercial',
]

type Formulario = DatosCliente

const vacio = (comercialId: string): Formulario => ({
  nombres: '',
  apellidos: '',
  fechaNacimiento: '',
  aniversario: '',
  telefono: '',
  email: '',
  ciudad: 'Cali',
  direccion: '',
  empresa: '',
  cargo: '',
  origen: 'referido',
  comercialId,
  categoria: 'nuevo',
  preferencias: [],
  restricciones: [],
  observaciones: '',
  autorizaComunicaciones: true,
})

const desdeCliente = (c: Cliente): Formulario => ({
  nombres: c.nombres,
  apellidos: c.apellidos,
  fechaNacimiento: c.fechaNacimiento ?? '',
  aniversario: c.aniversario ?? '',
  telefono: c.telefono,
  email: c.email,
  ciudad: c.ciudad,
  direccion: c.direccion ?? '',
  empresa: c.empresa ?? '',
  cargo: c.cargo ?? '',
  origen: c.origen,
  comercialId: c.comercialId,
  categoria: c.categoria,
  preferencias: [...c.preferencias],
  restricciones: [...c.restricciones],
  observaciones: c.observaciones ?? '',
  autorizaComunicaciones: c.autorizaComunicaciones,
})

interface Props {
  abierto: boolean
  onCerrar: () => void
  /** Presente en modo edición. */
  cliente?: Cliente
  onGuardado?: (cliente: Cliente) => void
}

export function FormularioCliente({ abierto, onCerrar, cliente, onGuardado }: Props) {
  const { usuario, esGerencia } = useSesion()
  const edicion = Boolean(cliente)

  /*
   * Gerencia no lleva cartera propia: al registrar, el responsable por defecto
   * es el primer comercial de la lista, nunca la propia gerente.
   */
  const responsablePorDefecto = esGerencia
    ? (equipoRepo.comerciales()[0]?.id ?? usuario.id)
    : usuario.id

  const [datos, setDatos] = useState<Formulario>(vacio(responsablePorDefecto))
  const [errores, setErrores] = useState<Record<string, string>>({})
  /** Aviso preventivo mientras digita (aún no es un intento de creación). */
  const [posible, setPosible] = useState<ResultadoDuplicado | null>(null)
  /** Bloqueo definitivo tras intentar guardar: el intento ya quedó auditado. */
  const [bloqueo, setBloqueo] = useState<ResultadoDuplicado | null>(null)
  const [intentoId, setIntentoId] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!abierto) return
    setDatos(cliente ? desdeCliente(cliente) : vacio(responsablePorDefecto))
    setErrores({})
    setPosible(null)
    setBloqueo(null)
  }, [abierto, cliente, responsablePorDefecto])

  const actualizar = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) => {
    setDatos((d) => ({ ...d, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: '' }))
    setBloqueo(null)
  }

  /** Verificación preventiva al salir de teléfono o correo. */
  const verificarDuplicado = () => {
    if (!datos.telefono && !datos.email) return setPosible(null)
    const resultado = clientesRepo.detectarDuplicado(
      { telefono: datos.telefono, email: datos.email },
      cliente?.id,
    )
    setPosible(resultado.existe ? resultado : null)
  }

  const validar = () => {
    const nuevos: Record<string, string> = {}
    if (!datos.nombres.trim()) nuevos.nombres = 'Indique el nombre'
    if (!datos.apellidos.trim()) nuevos.apellidos = 'Indique los apellidos'
    if (!datos.telefono.trim()) nuevos.telefono = 'El teléfono es obligatorio'
    else if (datos.telefono.replace(/\D/g, '').length < 7) nuevos.telefono = 'Teléfono incompleto'
    if (!datos.email.trim()) nuevos.email = 'El correo es obligatorio'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim()))
      nuevos.email = 'Correo no válido'
    if (!datos.ciudad.trim()) nuevos.ciudad = 'Indique la ciudad'
    setErrores(nuevos)
    return Object.keys(nuevos).length === 0
  }

  const guardar = () => {
    if (!validar()) return

    const limpio: Formulario = {
      ...datos,
      nombres: datos.nombres.trim(),
      apellidos: datos.apellidos.trim(),
      telefono: datos.telefono.trim(),
      email: datos.email.trim(),
      empresa: datos.empresa?.trim() || undefined,
      cargo: datos.cargo?.trim() || undefined,
      direccion: datos.direccion?.trim() || undefined,
      observaciones: datos.observaciones?.trim() || undefined,
      fechaNacimiento: datos.fechaNacimiento || undefined,
      aniversario: datos.aniversario || undefined,
    }

    if (cliente) {
      const resultado = clientesRepo.actualizar(cliente.id, limpio, usuario)
      if (!resultado.actualizado) return setBloqueo(resultado.duplicado)
      onGuardado?.(resultado.cliente)
      onCerrar()
      return
    }

    const resultado = clientesRepo.crear(limpio, usuario)
    if (!resultado.creado) {
      setIntentoId(resultado.intento?.id)
      return setBloqueo(resultado.duplicado)
    }
    onGuardado?.(resultado.cliente)
    onCerrar()
  }

  const comerciales = useMemo(() => equipoRepo.comerciales(), [])
  const responsable = equipoRepo.obtener(datos.comercialId)

  return (
    <PanelLateral
      abierto={abierto}
      onCerrar={onCerrar}
      ancho="lg"
      antetitulo={edicion ? `Ficha ${cliente?.codigo}` : 'Nueva ficha'}
      titulo={edicion ? 'Editar cliente' : 'Registrar cliente'}
      descripcion={
        edicion
          ? 'Los cambios quedan registrados en la actividad del cliente.'
          : 'Antes de guardar, el sistema verifica que el teléfono y el correo no existan en la cartera.'
      }
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton variante="primario" onClick={guardar}>
            {edicion ? 'Guardar cambios' : 'Registrar cliente'}
          </Boton>
        </>
      }
    >
      {/* Bloqueo por duplicado */}
      {bloqueo?.cliente && bloqueo.criterio ? (
        <div className="px-6 pt-5">
          <AvisoDuplicado
            cliente={bloqueo.cliente}
            criterio={bloqueo.criterio}
            registrado={!edicion}
            intentoDuplicadoId={intentoId}
            onCerrarPanel={onCerrar}
          />
        </div>
      ) : null}

      {/* Aviso preventivo */}
      {!bloqueo && posible?.cliente ? (
        <div className="mx-6 mt-5 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/60 px-3.5 py-3">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed text-carbon/70">
            Ese {posible.criterio === 'telefono' ? 'teléfono' : 'correo'} ya figura en la ficha de{' '}
            <span className="font-medium text-bosque-700">
              {posible.cliente.nombres} {posible.cliente.apellidos}
            </span>
            . Si continúa, el sistema no creará un duplicado.
          </p>
        </div>
      ) : null}

      <SeccionFormulario titulo="Identidad" descripcion="Cómo se dirige la hacienda al cliente.">
        <Campo etiqueta="Nombres" requerido error={errores.nombres}>
          <Entrada
            value={datos.nombres}
            onChange={(e) => actualizar('nombres', e.target.value)}
            placeholder="María Fernanda"
            invalido={Boolean(errores.nombres)}
          />
        </Campo>
        <Campo etiqueta="Apellidos" requerido error={errores.apellidos}>
          <Entrada
            value={datos.apellidos}
            onChange={(e) => actualizar('apellidos', e.target.value)}
            placeholder="Caicedo Restrepo"
            invalido={Boolean(errores.apellidos)}
          />
        </Campo>
        <Campo etiqueta="Fecha de nacimiento" ayuda="Habilita el saludo de cumpleaños.">
          <Entrada
            type="date"
            value={datos.fechaNacimiento ?? ''}
            onChange={(e) => actualizar('fechaNacimiento', e.target.value)}
          />
        </Campo>
        <Campo etiqueta="Aniversario" ayuda="Boda u otra fecha memorable.">
          <Entrada
            type="date"
            value={datos.aniversario ?? ''}
            onChange={(e) => actualizar('aniversario', e.target.value)}
          />
        </Campo>
      </SeccionFormulario>

      <SeccionFormulario
        titulo="Contacto"
        descripcion="Teléfono y correo identifican al cliente: no pueden repetirse en la cartera."
      >
        <Campo etiqueta="Teléfono" requerido error={errores.telefono}>
          <Entrada
            value={datos.telefono}
            onChange={(e) => actualizar('telefono', e.target.value)}
            onBlur={verificarDuplicado}
            placeholder="+57 315 220 8844"
            invalido={Boolean(errores.telefono)}
          />
        </Campo>
        <Campo etiqueta="Correo electrónico" requerido error={errores.email}>
          <Entrada
            type="email"
            value={datos.email}
            onChange={(e) => actualizar('email', e.target.value)}
            onBlur={verificarDuplicado}
            placeholder="nombre@correo.com"
            invalido={Boolean(errores.email)}
          />
        </Campo>
        <Campo etiqueta="Ciudad" requerido error={errores.ciudad}>
          <Entrada
            value={datos.ciudad}
            onChange={(e) => actualizar('ciudad', e.target.value)}
            placeholder="Cali"
            invalido={Boolean(errores.ciudad)}
          />
        </Campo>
        <Campo etiqueta="Dirección">
          <Entrada
            value={datos.direccion ?? ''}
            onChange={(e) => actualizar('direccion', e.target.value)}
            placeholder="Opcional"
          />
        </Campo>
      </SeccionFormulario>

      <SeccionFormulario
        titulo="Vínculo empresarial"
        descripcion="Solo si el cliente llega representando a una empresa."
      >
        <Campo etiqueta="Empresa">
          <Entrada
            value={datos.empresa ?? ''}
            onChange={(e) => actualizar('empresa', e.target.value)}
            placeholder="Ingenio Manuelita S.A."
          />
        </Campo>
        <Campo etiqueta="Cargo">
          <Entrada
            value={datos.cargo ?? ''}
            onChange={(e) => actualizar('cargo', e.target.value)}
            placeholder="Director de Comunicaciones"
          />
        </Campo>
      </SeccionFormulario>

      <SeccionFormulario
        titulo="Relación comercial"
        descripcion={descripcionCategoria[datos.categoria]}
      >
        <Campo etiqueta="Origen" requerido>
          <Seleccion
            value={datos.origen}
            onChange={(e) => actualizar('origen', e.target.value as OrigenCliente)}
            opciones={ORIGENES.map((o) => ({ valor: o, texto: etiquetaOrigen[o] }))}
          />
        </Campo>
        <Campo etiqueta="Categoría" requerido>
          <Seleccion
            value={datos.categoria}
            onChange={(e) => actualizar('categoria', e.target.value as CategoriaCliente)}
            opciones={ORDEN_CATEGORIAS.map((c) => ({ valor: c, texto: etiquetaCategoria[c] }))}
          />
        </Campo>
        <Campo
          etiqueta="Comercial responsable"
          requerido
          ayuda={
            esGerencia
              ? 'Solo Gerencia puede cambiar la propiedad comercial.'
              : 'La propiedad se asigna a quien registra. Un traslado lo autoriza Gerencia.'
          }
        >
          {esGerencia ? (
            <Seleccion
              value={datos.comercialId}
              onChange={(e) => actualizar('comercialId', e.target.value)}
              opciones={comerciales.map((u) => ({ valor: u.id, texto: u.nombre }))}
            />
          ) : (
            <Entrada value={responsable?.nombre ?? usuario.nombre} disabled readOnly />
          )}
        </Campo>
        <Campo etiqueta="Fecha de registro">
          <Entrada
            value={
              cliente ? formatearFecha(cliente.fechaRegistro) : 'Se asigna al guardar (hoy)'
            }
            disabled
            readOnly
          />
        </Campo>
      </SeccionFormulario>

      <SeccionFormulario
        titulo="En la mesa"
        descripcion="Lo que hace que el cliente se sienta reconocido cuando vuelve."
      >
        <CampoBloque etiqueta="Preferencias" ayuda="Escriba y presione Enter para agregar.">
          <ListaEditable
            valores={datos.preferencias}
            onCambiar={(v) => actualizar('preferencias', v)}
            marcador="Mesa junto al jardín, vino tinto…"
          />
        </CampoBloque>
        <CampoBloque etiqueta="Restricciones y alergias">
          <ListaEditable
            valores={datos.restricciones}
            onCambiar={(v) => actualizar('restricciones', v)}
            marcador="Alergia a mariscos, intolerancia…"
            tono="terracota"
          />
        </CampoBloque>
        <Campo etiqueta="Observaciones" ancho="completo">
          <AreaTexto
            value={datos.observaciones ?? ''}
            onChange={(e) => actualizar('observaciones', e.target.value)}
            placeholder="Notas internas del equipo comercial sobre este cliente."
          />
        </Campo>
      </SeccionFormulario>

      <SeccionFormulario
        titulo="Autorizaciones"
        descripcion="Tratamiento de datos y contacto con el cliente."
      >
        <Interruptor
          activo={datos.autorizaComunicaciones}
          onCambiar={(v) => actualizar('autorizaComunicaciones', v)}
          titulo="Autoriza recibir comunicaciones de la hacienda"
          descripcion="Invitaciones a experiencias, saludos de cumpleaños y novedades de temporada. Sin esta autorización el cliente no entra en ninguna campaña."
        />
      </SeccionFormulario>
    </PanelLateral>
  )
}
