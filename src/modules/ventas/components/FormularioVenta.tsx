import { useEffect, useMemo, useState } from 'react'
import type { CategoriaVenta, DatosVenta, EstadoPago, Experiencia } from '@/core/types'
import { esGanada } from '@/core/types'
import { clientesRepo, equipoRepo, experienciasRepo, ventasRepo } from '@/core/data/repositories'
import { useSesion } from '@/core/auth/SesionContext'
import { nombreCompleto } from '@/core/utils/cliente'
import { etiquetaEstadoPago } from '@/core/utils/etiquetas'
import { formatearMoneda } from '@/core/utils/format'
import {
  Boton,
  Campo,
  Entrada,
  PanelLateral,
  SeccionFormulario,
  Seleccion,
} from '@/ui'
import {
  CATEGORIAS,
  ESTADOS_PAGO,
  etiquetaCategoriaVenta,
  HOY,
} from '../services/ventasService'

const numero = (valor: string) => Number(valor.replace(/\D/g, '')) || 0

const vacio = (comercialId: string, clienteId: string): DatosVenta => ({
  clienteId,
  comercialId,
  categoria: 'evento',
  descripcion: '',
  fecha: HOY,
  monto: 0,
  descuento: 0,
  estadoPago: 'pagado',
})

/**
 * Registro de una venta.
 * Si se vincula a una experiencia cerrada, el formulario propone su valor final
 * y lo que falta por registrar: así la facturación no se separa del pipeline.
 */
export function FormularioVenta({
  abierto,
  onCerrar,
  clienteFijo,
  experienciaFija,
}: {
  abierto: boolean
  onCerrar: () => void
  clienteFijo?: string
  experienciaFija?: Experiencia
}) {
  const { usuario, esGerencia } = useSesion()

  const clientes = useMemo(
    () =>
      clientesRepo
        .listarVisibles(usuario)
        .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), 'es')),
    [usuario],
  )

  const [datos, setDatos] = useState<DatosVenta>(
    vacio(usuario.id, clienteFijo ?? clientes[0]?.id ?? ''),
  )
  const [errores, setErrores] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!abierto) return

    if (experienciaFija) {
      const registrado = ventasRepo
        .deExperiencia(experienciaFija.id)
        .reduce((s, v) => s + v.monto - v.descuento, 0)
      const pendiente = Math.max(0, (experienciaFija.valorFinal ?? 0) - registrado)

      setDatos({
        clienteId: experienciaFija.clienteId,
        comercialId: experienciaFija.comercialId,
        experienciaId: experienciaFija.id,
        categoria: 'evento',
        descripcion: experienciaFija.titulo,
        fecha: HOY,
        monto: pendiente,
        descuento: 0,
        estadoPago: 'pagado',
      })
    } else {
      setDatos(vacio(usuario.id, clienteFijo ?? clientes[0]?.id ?? ''))
    }
    setErrores({})
  }, [abierto, experienciaFija, clienteFijo, usuario.id, clientes])

  const actualizar = <K extends keyof DatosVenta>(campo: K, valor: DatosVenta[K]) => {
    setDatos((d) => ({ ...d, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: '' }))
  }

  /** Experiencias cerradas del cliente, para vincular la venta. */
  const experiencias = useMemo(
    () =>
      datos.clienteId
        ? experienciasRepo.deCliente(datos.clienteId).filter((e) => esGanada(e.estado))
        : [],
    [datos.clienteId],
  )

  const comercial = equipoRepo.obtener(datos.comercialId)
  const comisionPrevista = Math.round(
    ((datos.monto - (datos.descuento ?? 0)) * (comercial?.comisionPorcentaje ?? 0)) / 100,
  )

  const guardar = () => {
    const nuevos: Record<string, string> = {}
    if (!datos.clienteId) nuevos.clienteId = 'Seleccione el cliente'
    if (!datos.descripcion.trim()) nuevos.descripcion = 'Describa el concepto'
    if (datos.monto <= 0) nuevos.monto = 'Indique el valor de la venta'
    if ((datos.descuento ?? 0) > datos.monto)
      nuevos.descuento = 'El descuento no puede superar el valor'

    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    ventasRepo.registrar({ ...datos, descripcion: datos.descripcion.trim() }, usuario)
    onCerrar()
  }

  return (
    <PanelLateral
      abierto={abierto}
      onCerrar={onCerrar}
      antetitulo="Nueva venta"
      titulo="Registrar venta"
      descripcion="El ingreso que entra a la hacienda y la comisión que genera."
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton variante="primario" onClick={guardar}>
            Registrar
          </Boton>
        </>
      }
    >
      <SeccionFormulario titulo="La operación" descripcion="De quién viene y por qué concepto.">
        <Campo etiqueta="Cliente" requerido error={errores.clienteId}>
          <Seleccion
            value={datos.clienteId}
            disabled={Boolean(clienteFijo || experienciaFija)}
            onChange={(e) => {
              actualizar('clienteId', e.target.value)
              actualizar('experienciaId', undefined)
            }}
            opciones={clientes.map((c) => ({ valor: c.id, texto: nombreCompleto(c) }))}
          />
        </Campo>

        <Campo etiqueta="Categoría" requerido>
          <Seleccion
            value={datos.categoria}
            onChange={(e) => actualizar('categoria', e.target.value as CategoriaVenta)}
            opciones={CATEGORIAS.map((c) => ({ valor: c, texto: etiquetaCategoriaVenta[c] }))}
          />
        </Campo>

        <Campo etiqueta="Concepto" requerido ancho="completo" error={errores.descripcion}>
          <Entrada
            value={datos.descripcion}
            onChange={(e) => actualizar('descripcion', e.target.value)}
            placeholder="Anticipo boda Domínguez · Vallejo"
            invalido={Boolean(errores.descripcion)}
          />
        </Campo>

        {experiencias.length > 0 && !experienciaFija ? (
          <Campo
            etiqueta="Experiencia asociada"
            ancho="completo"
            ayuda="Vincularla permite comparar lo cerrado con lo facturado."
          >
            <Seleccion
              value={datos.experienciaId ?? ''}
              onChange={(e) => actualizar('experienciaId', e.target.value || undefined)}
              opciones={[
                { valor: '', texto: 'Sin experiencia asociada' },
                ...experiencias.map((x) => ({
                  valor: x.id,
                  texto: `${x.titulo} · ${formatearMoneda(x.valorFinal ?? 0)}`,
                })),
              ]}
            />
          </Campo>
        ) : null}

        <Campo etiqueta="Fecha" requerido>
          <Entrada
            type="date"
            value={datos.fecha}
            onChange={(e) => actualizar('fecha', e.target.value)}
          />
        </Campo>

        <Campo etiqueta="Estado de pago" requerido>
          <Seleccion
            value={datos.estadoPago}
            onChange={(e) => actualizar('estadoPago', e.target.value as EstadoPago)}
            opciones={ESTADOS_PAGO.map((e) => ({ valor: e, texto: etiquetaEstadoPago[e] }))}
          />
        </Campo>
      </SeccionFormulario>

      <SeccionFormulario titulo="Valores" descripcion="La comisión se calcula sola.">
        <Campo etiqueta="Valor" requerido error={errores.monto}>
          <Entrada
            inputMode="numeric"
            value={datos.monto ? String(datos.monto) : ''}
            onChange={(e) => actualizar('monto', numero(e.target.value))}
            invalido={Boolean(errores.monto)}
            placeholder="0"
          />
        </Campo>

        <Campo etiqueta="Descuento" error={errores.descuento}>
          <Entrada
            inputMode="numeric"
            value={datos.descuento ? String(datos.descuento) : ''}
            onChange={(e) => actualizar('descuento', numero(e.target.value))}
            invalido={Boolean(errores.descuento)}
            placeholder="0"
          />
        </Campo>

        {esGerencia ? (
          <Campo etiqueta="Comercial" requerido ancho="completo">
            <Seleccion
              value={datos.comercialId}
              onChange={(e) => actualizar('comercialId', e.target.value)}
              opciones={equipoRepo.comerciales().map((u) => ({ valor: u.id, texto: u.nombre }))}
            />
          </Campo>
        ) : null}

        <div className="rounded-lg border border-crema-300 bg-crema-50 px-4 py-3 sm:col-span-2">
          <p className="flex items-center justify-between text-sm">
            <span className="text-carbon/60">Valor neto</span>
            <span className="font-display text-lg text-bosque-800">
              {formatearMoneda(datos.monto - (datos.descuento ?? 0))}
            </span>
          </p>
          <p className="mt-1 flex items-center justify-between text-xs">
            <span className="text-carbon/50">
              Comisión {comercial?.comisionPorcentaje ? `(${comercial.comisionPorcentaje} %)` : ''}
            </span>
            <span className="text-laton-600">
              {comercial?.comisionPorcentaje
                ? formatearMoneda(comisionPrevista)
                : 'Sin comisión variable'}
            </span>
          </p>
        </div>
      </SeccionFormulario>
    </PanelLateral>
  )
}
