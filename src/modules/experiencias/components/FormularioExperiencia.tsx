import { useEffect, useMemo, useState } from 'react'
import type {
  DatosExperiencia,
  EstadoExperiencia,
  Experiencia,
  OrigenCliente,
  TipoExperiencia,
} from '@/core/types'
import { ETAPAS_EXPERIENCIA } from '@/core/types'
import { catalogosRepo, clientesRepo, equipoRepo, experienciasRepo } from '@/core/data/repositories'
import { useSesion } from '@/core/auth/SesionContext'
import { nombreCompleto } from '@/core/utils/cliente'
import {
  etiquetaEstadoExperiencia,
  etiquetaExperiencia,
  etiquetaOrigen,
} from '@/core/utils/etiquetas'
import {
  AreaTexto,
  Boton,
  Campo,
  CampoBloque,
  Entrada,
  ListaEditable,
  PanelLateral,
  SeccionFormulario,
  Seleccion,
} from '@/ui'
import { HOY, TIPOS_EXPERIENCIA } from '../services/experienciasService'

const FUENTES: OrigenCliente[] = [
  'referido',
  'redes_sociales',
  'pagina_web',
  'visita_espontanea',
  'evento_previo',
  'alianza',
  'prensa',
  'gestion_comercial',
]

const vacio = (comercialId: string, clienteId: string): DatosExperiencia => ({
  clienteId,
  comercialId,
  titulo: '',
  tipo: 'cumpleanos',
  estado: 'nuevo',
  fechaTentativa: '',
  numeroPersonas: 20,
  presupuesto: undefined,
  valorCotizado: undefined,
  valorFinal: undefined,
  fuente: 'referido',
  observaciones: '',
  proximoSeguimiento: '',
  requerimientos: [],
})

const desde = (e: Experiencia): DatosExperiencia => ({
  clienteId: e.clienteId,
  comercialId: e.comercialId,
  titulo: e.titulo,
  tipo: e.tipo,
  estado: e.estado,
  fechaTentativa: e.fechaTentativa ?? '',
  numeroPersonas: e.numeroPersonas,
  presupuesto: e.presupuesto,
  valorCotizado: e.valorCotizado,
  valorFinal: e.valorFinal,
  fuente: e.fuente,
  observaciones: e.observaciones ?? '',
  proximoSeguimiento: e.proximoSeguimiento ?? '',
  motivoPerdida: e.motivoPerdida,
  espacioId: e.espacioId,
  horaInicio: e.horaInicio,
  horaFin: e.horaFin,
  menuId: e.menuId,
  requerimientos: [...e.requerimientos],
  anticipo: e.anticipo,
  responsableOperativo: e.responsableOperativo,
})

const numero = (valor: string) => {
  const limpio = Number(valor.replace(/\D/g, ''))
  return Number.isNaN(limpio) || limpio === 0 ? undefined : limpio
}

/**
 * Alta y edición de la experiencia.
 * El estado no se cambia aquí salvo en el alta: mover el pipeline pasa por
 * `PanelCambioEstado`, que es quien exige motivo o valor final.
 */
export function FormularioExperiencia({
  abierto,
  onCerrar,
  experiencia,
  clienteFijo,
  onGuardado,
}: {
  abierto: boolean
  onCerrar: () => void
  experiencia?: Experiencia
  clienteFijo?: string
  onGuardado?: (e: Experiencia) => void
}) {
  const { usuario, esGerencia } = useSesion()
  const edicion = Boolean(experiencia)

  const clientes = useMemo(
    () =>
      clientesRepo
        .listarVisibles(usuario)
        .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), 'es')),
    [usuario],
  )

  const responsablePorDefecto = esGerencia
    ? (equipoRepo.comerciales()[0]?.id ?? usuario.id)
    : usuario.id

  const [datos, setDatos] = useState<DatosExperiencia>(
    vacio(responsablePorDefecto, clienteFijo ?? clientes[0]?.id ?? ''),
  )
  const [errores, setErrores] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!abierto) return
    setDatos(
      experiencia
        ? desde(experiencia)
        : vacio(responsablePorDefecto, clienteFijo ?? clientes[0]?.id ?? ''),
    )
    setErrores({})
  }, [abierto, experiencia, clienteFijo, responsablePorDefecto, clientes])

  const actualizar = <K extends keyof DatosExperiencia>(campo: K, valor: DatosExperiencia[K]) => {
    setDatos((d) => ({ ...d, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: '' }))
  }

  const guardar = () => {
    const nuevos: Record<string, string> = {}
    if (!datos.clienteId) nuevos.clienteId = 'Seleccione el cliente'
    if (!datos.titulo.trim()) nuevos.titulo = 'Dele un nombre a la experiencia'
    if (!datos.numeroPersonas || datos.numeroPersonas < 1)
      nuevos.numeroPersonas = 'Indique cuántas personas'
    if (datos.estado === 'confirmado' && !datos.valorFinal)
      nuevos.valorFinal = 'Una experiencia confirmada necesita valor final'
    if (datos.estado === 'perdido' && !datos.motivoPerdida?.trim())
      nuevos.motivoPerdida = 'Indique el motivo de la pérdida'

    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    const limpio: DatosExperiencia = {
      ...datos,
      titulo: datos.titulo.trim(),
      observaciones: datos.observaciones?.trim() || undefined,
      fechaTentativa: datos.fechaTentativa || undefined,
      proximoSeguimiento: datos.proximoSeguimiento || undefined,
    }

    const guardada = experiencia
      ? experienciasRepo.actualizar(experiencia.id, limpio, usuario)
      : experienciasRepo.crear(limpio, usuario)

    if (guardada) onGuardado?.(guardada)
    onCerrar()
  }

  return (
    <PanelLateral
      abierto={abierto}
      onCerrar={onCerrar}
      ancho="lg"
      antetitulo={edicion ? experiencia?.codigo : 'Nueva experiencia'}
      titulo={edicion ? 'Editar experiencia' : 'Registrar experiencia'}
      descripcion={
        edicion
          ? 'Los cambios de valor, fecha o responsable quedan en el historial.'
          : 'Toda solicitud entra al tablero: así ninguna consulta se pierde.'
      }
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton variante="primario" onClick={guardar}>
            {edicion ? 'Guardar cambios' : 'Registrar'}
          </Boton>
        </>
      }
    >
      <SeccionFormulario titulo="La celebración" descripcion="Qué se celebra y para cuántos.">
        <Campo etiqueta="Cliente" requerido error={errores.clienteId}>
          <Seleccion
            value={datos.clienteId}
            disabled={Boolean(clienteFijo)}
            onChange={(e) => actualizar('clienteId', e.target.value)}
            opciones={clientes.map((c) => ({ valor: c.id, texto: nombreCompleto(c) }))}
          />
        </Campo>
        <Campo etiqueta="Tipo de experiencia" requerido>
          <Seleccion
            value={datos.tipo}
            onChange={(e) => actualizar('tipo', e.target.value as TipoExperiencia)}
            opciones={TIPOS_EXPERIENCIA.map((t) => ({ valor: t, texto: etiquetaExperiencia[t] }))}
          />
        </Campo>
        <Campo etiqueta="Nombre de la experiencia" requerido ancho="completo" error={errores.titulo}>
          <Entrada
            value={datos.titulo}
            onChange={(e) => actualizar('titulo', e.target.value)}
            placeholder="Cumpleaños 40 · Santiago Arboleda"
            invalido={Boolean(errores.titulo)}
          />
        </Campo>
        <Campo etiqueta="Fecha tentativa">
          <Entrada
            type="date"
            value={datos.fechaTentativa ?? ''}
            onChange={(e) => actualizar('fechaTentativa', e.target.value)}
          />
        </Campo>
        <Campo etiqueta="Número de personas" requerido error={errores.numeroPersonas}>
          <Entrada
            inputMode="numeric"
            value={String(datos.numeroPersonas ?? '')}
            onChange={(e) => actualizar('numeroPersonas', Number(e.target.value.replace(/\D/g, '')))}
            invalido={Boolean(errores.numeroPersonas)}
          />
        </Campo>
      </SeccionFormulario>

      <SeccionFormulario titulo="Cifras" descripcion="Lo que el cliente tiene y lo que cotizamos.">
        <Campo etiqueta="Presupuesto del cliente">
          <Entrada
            inputMode="numeric"
            value={datos.presupuesto ? String(datos.presupuesto) : ''}
            onChange={(e) => actualizar('presupuesto', numero(e.target.value))}
            placeholder="0"
          />
        </Campo>
        <Campo etiqueta="Valor cotizado">
          <Entrada
            inputMode="numeric"
            value={datos.valorCotizado ? String(datos.valorCotizado) : ''}
            onChange={(e) => actualizar('valorCotizado', numero(e.target.value))}
            placeholder="0"
          />
        </Campo>
        {datos.estado === 'confirmado' || datos.estado === 'realizado' ? (
          <>
            <Campo etiqueta="Valor final" error={errores.valorFinal}>
              <Entrada
                inputMode="numeric"
                value={datos.valorFinal ? String(datos.valorFinal) : ''}
                onChange={(e) => actualizar('valorFinal', numero(e.target.value))}
                invalido={Boolean(errores.valorFinal)}
              />
            </Campo>
            <Campo etiqueta="Anticipo recibido">
              <Entrada
                inputMode="numeric"
                value={datos.anticipo ? String(datos.anticipo) : ''}
                onChange={(e) => actualizar('anticipo', numero(e.target.value))}
              />
            </Campo>
          </>
        ) : null}
      </SeccionFormulario>

      <SeccionFormulario titulo="Gestión" descripcion="Quién la atiende y cómo llegó.">
        <Campo
          etiqueta="Comercial responsable"
          requerido
          ayuda={esGerencia ? undefined : 'Las experiencias que registra quedan a su nombre.'}
        >
          {esGerencia ? (
            <Seleccion
              value={datos.comercialId}
              onChange={(e) => actualizar('comercialId', e.target.value)}
              opciones={equipoRepo.comerciales().map((u) => ({ valor: u.id, texto: u.nombre }))}
            />
          ) : (
            <Entrada value={usuario.nombre} disabled readOnly />
          )}
        </Campo>
        <Campo etiqueta="Fuente" requerido>
          <Seleccion
            value={datos.fuente}
            onChange={(e) => actualizar('fuente', e.target.value as OrigenCliente)}
            opciones={FUENTES.map((f) => ({ valor: f, texto: etiquetaOrigen[f] }))}
          />
        </Campo>
        <Campo etiqueta="Próximo seguimiento" ayuda={`Hoy es ${HOY}.`}>
          <Entrada
            type="date"
            value={datos.proximoSeguimiento ?? ''}
            onChange={(e) => actualizar('proximoSeguimiento', e.target.value)}
          />
        </Campo>
        {!edicion ? (
          <Campo etiqueta="Estado inicial">
            <Seleccion
              value={datos.estado}
              onChange={(e) => actualizar('estado', e.target.value as EstadoExperiencia)}
              opciones={ETAPAS_EXPERIENCIA.filter((x) => x !== 'realizado').map((x) => ({
                valor: x,
                texto: etiquetaEstadoExperiencia[x],
              }))}
            />
          </Campo>
        ) : (
          <Campo etiqueta="Estado actual" ayuda="Se cambia moviendo la tarjeta en el tablero.">
            <Entrada value={etiquetaEstadoExperiencia[datos.estado]} disabled readOnly />
          </Campo>
        )}
        {datos.estado === 'perdido' ? (
          <Campo etiqueta="Motivo de la pérdida" ancho="completo" error={errores.motivoPerdida}>
            <Entrada
              value={datos.motivoPerdida ?? ''}
              onChange={(e) => actualizar('motivoPerdida', e.target.value)}
              invalido={Boolean(errores.motivoPerdida)}
            />
          </Campo>
        ) : null}
        <Campo etiqueta="Observaciones" ancho="completo">
          <AreaTexto
            value={datos.observaciones ?? ''}
            onChange={(e) => actualizar('observaciones', e.target.value)}
            placeholder="Contexto de la solicitud, exigencias del cliente, competencia…"
          />
        </Campo>
      </SeccionFormulario>

      <SeccionFormulario
        titulo="Montaje"
        descripcion="Se completa cuando la experiencia avanza hacia el cierre."
      >
        <Campo etiqueta="Espacio">
          <Seleccion
            value={datos.espacioId ?? ''}
            onChange={(e) => actualizar('espacioId', e.target.value || undefined)}
            opciones={[
              { valor: '', texto: 'Por definir' },
              ...catalogosRepo.espacios().map((s) => ({ valor: s.id, texto: s.nombre })),
            ]}
          />
        </Campo>
        <Campo etiqueta="Menú">
          <Seleccion
            value={datos.menuId ?? ''}
            onChange={(e) => actualizar('menuId', e.target.value || undefined)}
            opciones={[
              { valor: '', texto: 'Por definir' },
              ...catalogosRepo.menus().map((m) => ({ valor: m.id, texto: m.nombre })),
            ]}
          />
        </Campo>
        <Campo etiqueta="Hora de inicio">
          <Entrada
            type="time"
            value={datos.horaInicio ?? ''}
            onChange={(e) => actualizar('horaInicio', e.target.value || undefined)}
          />
        </Campo>
        <Campo etiqueta="Hora de cierre">
          <Entrada
            type="time"
            value={datos.horaFin ?? ''}
            onChange={(e) => actualizar('horaFin', e.target.value || undefined)}
          />
        </Campo>
        <CampoBloque etiqueta="Requerimientos" ayuda="Escriba y presione Enter para agregar.">
          <ListaEditable
            valores={datos.requerimientos}
            onCambiar={(v) => actualizar('requerimientos', v)}
            marcador="Carpa de contingencia, menú celíaco…"
          />
        </CampoBloque>
      </SeccionFormulario>
    </PanelLateral>
  )
}
