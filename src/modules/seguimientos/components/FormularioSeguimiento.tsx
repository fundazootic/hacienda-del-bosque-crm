import { useEffect, useMemo, useState } from 'react'
import type { DatosSeguimiento, Seguimiento, TipoSeguimiento } from '@/core/types'
import { clientesRepo, experienciasRepo, seguimientosRepo } from '@/core/data/repositories'
import { useSesion } from '@/core/auth/SesionContext'
import { nombreCompleto } from '@/core/utils/cliente'
import { etiquetaSeguimiento } from '@/core/utils/etiquetas'
import {
  AreaTexto,
  Boton,
  Campo,
  Entrada,
  Interruptor,
  PanelLateral,
  SeccionFormulario,
  Seleccion,
} from '@/ui'
import { etiquetaResultado, HOY, RESULTADOS, TIPOS_SEGUIMIENTO } from '../services/seguimientosService'

const vacio = (comercialId: string, clienteId: string): DatosSeguimiento => ({
  entidadTipo: 'cliente',
  entidadId: clienteId,
  clienteId,
  comercialId,
  tipo: 'llamada',
  asunto: '',
  detalle: '',
  fecha: HOY,
  resultado: 'exitoso',
})

const desde = (s: Seguimiento): DatosSeguimiento => ({
  entidadTipo: s.entidadTipo,
  entidadId: s.entidadId,
  clienteId: s.clienteId,
  comercialId: s.comercialId,
  tipo: s.tipo,
  asunto: s.asunto,
  detalle: s.detalle,
  fecha: s.fecha,
  resultado: s.resultado,
  proximaAccion: s.proximaAccion,
  fechaProximaAccion: s.fechaProximaAccion,
})

/**
 * Registro de una gestión.
 * Lo que se hizo y, si queda algo por hacer, el compromiso con su fecha: es la
 * pieza que mantiene viva la agenda comercial.
 */
export function FormularioSeguimiento({
  abierto,
  onCerrar,
  seguimiento,
  clienteFijo,
  asuntoSugerido,
  onGuardado,
}: {
  abierto: boolean
  onCerrar: () => void
  seguimiento?: Seguimiento
  clienteFijo?: string
  asuntoSugerido?: string
  onGuardado?: (s: Seguimiento) => void
}) {
  const { usuario, esGerencia } = useSesion()
  const edicion = Boolean(seguimiento)

  const clientes = useMemo(
    () =>
      clientesRepo
        .listarVisibles(usuario)
        .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), 'es')),
    [usuario],
  )

  const [datos, setDatos] = useState<DatosSeguimiento>(
    vacio(usuario.id, clienteFijo ?? clientes[0]?.id ?? ''),
  )
  const [conProxima, setConProxima] = useState(false)
  const [errores, setErrores] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!abierto) return
    const base = seguimiento
      ? desde(seguimiento)
      : {
          ...vacio(usuario.id, clienteFijo ?? clientes[0]?.id ?? ''),
          asunto: asuntoSugerido ?? '',
        }
    setDatos(base)
    setConProxima(Boolean(base.proximaAccion))
    setErrores({})
  }, [abierto, seguimiento, clienteFijo, asuntoSugerido, usuario.id, clientes])

  const actualizar = <K extends keyof DatosSeguimiento>(campo: K, valor: DatosSeguimiento[K]) => {
    setDatos((d) => ({ ...d, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: '' }))
  }

  /** Experiencias del cliente elegido, para vincular la gestión. */
  const experiencias = useMemo(
    () => (datos.clienteId ? experienciasRepo.deCliente(datos.clienteId) : []),
    [datos.clienteId],
  )

  const guardar = () => {
    const nuevos: Record<string, string> = {}
    if (!datos.clienteId) nuevos.clienteId = 'Seleccione el cliente'
    if (!datos.asunto.trim()) nuevos.asunto = 'Escriba de qué se trató'
    if (conProxima && !datos.proximaAccion?.trim())
      nuevos.proximaAccion = 'Describa el siguiente paso'
    if (conProxima && !datos.fechaProximaAccion) nuevos.fechaProximaAccion = 'Indique la fecha'

    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    const limpio: DatosSeguimiento = {
      ...datos,
      asunto: datos.asunto.trim(),
      detalle: datos.detalle.trim(),
      proximaAccion: conProxima ? datos.proximaAccion?.trim() : undefined,
      fechaProximaAccion: conProxima ? datos.fechaProximaAccion : undefined,
      resultado: conProxima && datos.resultado === 'cerrado' ? 'pendiente' : datos.resultado,
    }

    const guardado = seguimiento
      ? seguimientosRepo.actualizar(seguimiento.id, limpio, usuario)
      : seguimientosRepo.crear(limpio, usuario)

    if (guardado) onGuardado?.(guardado)
    onCerrar()
  }

  return (
    <PanelLateral
      abierto={abierto}
      onCerrar={onCerrar}
      ancho="lg"
      antetitulo={edicion ? 'Gestión registrada' : 'Nueva gestión'}
      titulo={edicion ? 'Editar gestión' : 'Registrar gestión'}
      descripcion="Lo que se hizo con el cliente y qué queda pendiente."
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
      <SeccionFormulario titulo="La gestión" descripcion="Con quién y de qué se trató.">
        <Campo etiqueta="Cliente" requerido error={errores.clienteId}>
          <Seleccion
            value={datos.clienteId}
            disabled={Boolean(clienteFijo)}
            onChange={(e) => {
              actualizar('clienteId', e.target.value)
              actualizar('entidadTipo', 'cliente')
              actualizar('entidadId', e.target.value)
            }}
            opciones={clientes.map((c) => ({ valor: c.id, texto: nombreCompleto(c) }))}
          />
        </Campo>

        <Campo etiqueta="Tipo de gestión" requerido>
          <Seleccion
            value={datos.tipo}
            onChange={(e) => actualizar('tipo', e.target.value as TipoSeguimiento)}
            opciones={TIPOS_SEGUIMIENTO.map((t) => ({ valor: t, texto: etiquetaSeguimiento[t] }))}
          />
        </Campo>

        <Campo etiqueta="Asunto" requerido ancho="completo" error={errores.asunto}>
          <Entrada
            value={datos.asunto}
            onChange={(e) => actualizar('asunto', e.target.value)}
            placeholder="Llamada de seguimiento a la propuesta de fin de año"
            invalido={Boolean(errores.asunto)}
          />
        </Campo>

        <Campo etiqueta="Detalle" ancho="completo">
          <AreaTexto
            value={datos.detalle}
            onChange={(e) => actualizar('detalle', e.target.value)}
            placeholder="Qué dijo el cliente, qué se acordó, qué objeciones aparecieron."
          />
        </Campo>

        <Campo etiqueta="Fecha de la gestión" requerido>
          <Entrada
            type="date"
            value={datos.fecha}
            onChange={(e) => actualizar('fecha', e.target.value)}
          />
        </Campo>

        <Campo etiqueta="Resultado" requerido>
          <Seleccion
            value={datos.resultado}
            onChange={(e) =>
              actualizar('resultado', e.target.value as DatosSeguimiento['resultado'])
            }
            opciones={RESULTADOS.map((r) => ({ valor: r, texto: etiquetaResultado[r] }))}
          />
        </Campo>

        {experiencias.length > 0 ? (
          <Campo
            etiqueta="Vincular a una experiencia"
            ancho="completo"
            ayuda="Opcional: así la gestión aparece también en el expediente de esa celebración."
          >
            <Seleccion
              value={datos.entidadTipo === 'experiencia' ? datos.entidadId : ''}
              onChange={(e) => {
                if (e.target.value) {
                  actualizar('entidadTipo', 'experiencia')
                  actualizar('entidadId', e.target.value)
                } else {
                  actualizar('entidadTipo', 'cliente')
                  actualizar('entidadId', datos.clienteId)
                }
              }}
              opciones={[
                { valor: '', texto: 'Solo con el cliente' },
                ...experiencias.map((x) => ({ valor: x.id, texto: x.titulo })),
              ]}
            />
          </Campo>
        ) : null}

        {esGerencia ? (
          <Campo etiqueta="Registrada por" ancho="completo">
            <Seleccion
              value={datos.comercialId}
              onChange={(e) => actualizar('comercialId', e.target.value)}
              opciones={clientes
                .filter((c) => c.id === datos.clienteId)
                .map((c) => ({ valor: c.comercialId, texto: 'Comercial responsable del cliente' }))
                .concat([{ valor: usuario.id, texto: usuario.nombre }])}
            />
          </Campo>
        ) : null}
      </SeccionFormulario>

      <SeccionFormulario
        titulo="Siguiente paso"
        descripcion="Un cliente sin próxima acción se enfría: el sistema lo mostrará como cartera sin gestión."
      >
        <Interruptor
          activo={conProxima}
          onCambiar={setConProxima}
          titulo="Comprometer una próxima acción"
          descripcion="Aparecerá en la agenda del comercial responsable hasta que se cierre."
        />

        {conProxima ? (
          <>
            <Campo etiqueta="Próxima acción" requerido ancho="completo" error={errores.proximaAccion}>
              <Entrada
                value={datos.proximaAccion ?? ''}
                onChange={(e) => actualizar('proximaAccion', e.target.value)}
                placeholder="Enviar cotización ajustada con carpa"
                invalido={Boolean(errores.proximaAccion)}
              />
            </Campo>
            <Campo etiqueta="Fecha comprometida" requerido error={errores.fechaProximaAccion}>
              <Entrada
                type="date"
                value={datos.fechaProximaAccion ?? ''}
                onChange={(e) => actualizar('fechaProximaAccion', e.target.value)}
                invalido={Boolean(errores.fechaProximaAccion)}
              />
            </Campo>
          </>
        ) : null}
      </SeccionFormulario>
    </PanelLateral>
  )
}
