import { useMemo, useState } from 'react'
import {
  Banknote,
  CalendarCheck2,
  HeartHandshake,
  Printer,
  Sparkles,
  TrendingDown,
  UsersRound,
  Utensils,
} from 'lucide-react'
import { useSesion } from '@/core/auth/SesionContext'
import { useDatos } from '@/core/data/store'
import { formatearMonedaCompacta, formatearNumero } from '@/core/utils/format'
import {
  Boton,
  CabeceraTarjeta,
  EncabezadoPagina,
  Indicador,
  Pestanas,
  Seleccion,
  Tarjeta,
  type Pestana,
} from '@/ui'
import { TendenciaVentas } from '@/modules/dashboard'
import { FilasInforme, Lectura } from '../components/FilasInforme'
import { InformeEquipo } from '../components/InformeEquipo'
import { InformePerdidas } from '../components/InformePerdidas'
import {
  clientesPorCategoria,
  clientesPorOrigen,
  desempenoEquipo,
  ingresosPorCategoria,
  ingresosPorTipoDeExperiencia,
  lecturaClientes,
  lecturaEquipo,
  lecturaIngresos,
  lecturaPerdidas,
  motivosDePerdida,
  periodoPorClave,
  periodos,
  resumenPeriodo,
  solicitudesPorTipo,
  ventasPorMes,
  type ClavePeriodo,
} from '../services/reportesService'

/**
 * Reportes gerenciales.
 *
 * Un informe solo sirve si quien lo lee saca una conclusión. Por eso cada
 * bloque trae su frase escrita arriba («lo que más deja es…») y la tabla queda
 * debajo como respaldo, no al revés.
 */
export default function ReportesPage() {
  const version = useDatos()
  const { usuario, esGerencia } = useSesion()

  const [clave, setClave] = useState<ClavePeriodo>('trimestre')
  const [pestana, setPestana] = useState('ingresos')

  const periodo = periodoPorClave(clave)

  const resumen = useMemo(() => resumenPeriodo(usuario, periodo), [usuario, periodo, version])
  const porCategoria = useMemo(
    () => ingresosPorCategoria(usuario, periodo),
    [usuario, periodo, version],
  )
  const porTipo = useMemo(
    () => ingresosPorTipoDeExperiencia(usuario, periodo),
    [usuario, periodo, version],
  )
  const meses = useMemo(() => ventasPorMes(usuario, periodo), [usuario, periodo, version])
  const equipo = useMemo(
    () => (esGerencia ? desempenoEquipo(periodo) : []),
    [esGerencia, periodo, version],
  )
  const categorias = useMemo(() => clientesPorCategoria(usuario), [usuario, version])
  const origenes = useMemo(() => clientesPorOrigen(usuario), [usuario, version])
  const solicitudes = useMemo(
    () => solicitudesPorTipo(usuario, periodo),
    [usuario, periodo, version],
  )
  const perdidas = useMemo(() => motivosDePerdida(usuario, periodo), [usuario, periodo, version])

  const pestanas: Pestana[] = [
    { clave: 'ingresos', etiqueta: 'De dónde viene el dinero' },
    ...(esGerencia ? [{ clave: 'equipo', etiqueta: 'Equipo comercial', contador: equipo.length }] : []),
    { clave: 'clientes', etiqueta: 'Clientes' },
    { clave: 'perdidas', etiqueta: 'Por qué se pierde', contador: perdidas.length },
  ]

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        antetitulo={esGerencia ? 'Lectura gerencial' : 'Sus resultados'}
        titulo="Reportes"
        descripcion="El estado del negocio en cuatro lecturas: de dónde viene el dinero, cómo va el equipo, quiénes son los clientes y por qué se pierden negocios."
        acciones={
          <>
            <Seleccion
              value={clave}
              onChange={(e) => setClave(e.target.value as ClavePeriodo)}
              opciones={periodos().map((p) => ({ valor: p.clave, texto: p.etiqueta }))}
              aria-label="Período del informe"
              className="w-full sm:w-56"
            />
            <Boton
              variante="secundario"
              icono={<Printer size={15} />}
              onClick={() => window.print()}
              className="no-imprimir"
            >
              Imprimir
            </Boton>
          </>
        }
      />

      {/* ── Resumen del período ──────────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          destacado
          etiqueta="Vendido en el período"
          valor={formatearMonedaCompacta(resumen.total)}
          detalle={`${resumen.operaciones} ${
            resumen.operaciones === 1 ? 'operación' : 'operaciones'
          } · ${periodo.etiqueta.toLowerCase()}`}
          icono={<Banknote size={16} />}
        />
        <Indicador
          etiqueta="Ticket promedio"
          valor={formatearMonedaCompacta(resumen.ticket)}
          detalle="por operación registrada"
          icono={<Utensils size={16} />}
        />
        <Indicador
          etiqueta="Celebraciones cerradas"
          valor={formatearNumero(resumen.celebraciones)}
          detalle={`${formatearNumero(resumen.comensales)} comensales atendidos`}
          icono={<CalendarCheck2 size={16} />}
        />
        <Indicador
          etiqueta="Clientes nuevos"
          valor={formatearNumero(resumen.clientesNuevos)}
          detalle="registrados en el período"
          icono={<Sparkles size={16} />}
        />
      </section>

      {/* ── Evolución mes a mes ──────────────────────────────────────────── */}
      <Tarjeta>
        <CabeceraTarjeta
          titulo="Cómo van los meses"
          descripcion="Total vendido en cada mes. La barra dorada es el mes en curso, todavía sin terminar."
          icono={<TrendingDown size={16} className="rotate-180" />}
        />
        <div className="px-4 pb-5 pt-4 sm:px-5">
          <TendenciaVentas datos={meses} className="h-44" />
        </div>
      </Tarjeta>

      {/* ── Informes ─────────────────────────────────────────────────────── */}
      <Tarjeta className="overflow-hidden">
        <Pestanas pestanas={pestanas} activa={pestana} onCambiar={setPestana} />

        {pestana === 'ingresos' ? (
          <div className="grid items-start gap-px bg-crema-200 lg:grid-cols-2">
            <div className="bg-white">
              <CabeceraTarjeta
                titulo="Por tipo de ingreso"
                descripcion="Eventos, restaurante, bar y experiencias sueltas."
                icono={<Banknote size={16} />}
              />
              <Lectura>{lecturaIngresos(porCategoria, periodo)}</Lectura>
              <FilasInforme filas={porCategoria} />
            </div>

            <div className="bg-white">
              <CabeceraTarjeta
                titulo="Por tipo de celebración"
                descripcion="Solo las ventas ligadas a una experiencia de la hacienda."
                icono={<HeartHandshake size={16} />}
              />
              <Lectura>{lecturaIngresos(porTipo, periodo)}</Lectura>
              <FilasInforme filas={porTipo} />
            </div>
          </div>
        ) : null}

        {pestana === 'equipo' ? (
          <div>
            <CabeceraTarjeta
              titulo="Cómo va cada comercial"
              descripcion="Ordenados por lo vendido en el período. «Cierra» es cuántos de sus negocios cerrados terminaron en venta."
              icono={<UsersRound size={16} />}
            />
            <Lectura>{lecturaEquipo(equipo, periodo)}</Lectura>
            <InformeEquipo filas={equipo} />
          </div>
        ) : null}

        {pestana === 'clientes' ? (
          <div>
            <Lectura>{lecturaClientes(categorias, origenes)}</Lectura>
            <div className="grid items-start gap-px bg-crema-200 lg:grid-cols-2">
              <div className="bg-white">
                <CabeceraTarjeta
                  titulo="Por dónde llegan"
                  descripcion="Canal de origen y valor que ha dejado cada uno desde siempre."
                  icono={<Sparkles size={16} />}
                />
                <FilasInforme filas={origenes} unidad={['cliente', 'clientes']} />
              </div>
              <div className="bg-white">
                <CabeceraTarjeta
                  titulo="Cómo están clasificados"
                  descripcion="Categoría comercial de la cartera y su valor histórico."
                  icono={<UsersRound size={16} />}
                />
                <FilasInforme filas={categorias} unidad={['cliente', 'clientes']} />
              </div>
              <div className="bg-white lg:col-span-2">
                <CabeceraTarjeta
                  titulo="Qué nos piden"
                  descripcion="Solicitudes recibidas en el período, se hayan cerrado o no."
                  icono={<HeartHandshake size={16} />}
                />
                <FilasInforme
                  filas={solicitudes}
                  unidad={['solicitud', 'solicitudes']}
                  vacio="No se registraron solicitudes nuevas en este período."
                />
              </div>
            </div>
          </div>
        ) : null}

        {pestana === 'perdidas' ? (
          <div>
            <CabeceraTarjeta
              titulo="Por qué se pierden los negocios"
              descripcion="Agrupado por el motivo que anotó el comercial al cerrar la experiencia."
              icono={<TrendingDown size={16} />}
            />
            <Lectura>{lecturaPerdidas(perdidas, periodo)}</Lectura>
            <InformePerdidas filas={perdidas} />
          </div>
        ) : null}
      </Tarjeta>

      <p className="text-[12.5px] leading-relaxed text-carbon/45">
        Los informes salen de lo que el equipo registra en el CRM: ventas, experiencias y clientes.
        {esGerencia
          ? ' Gerencia ve la hacienda completa.'
          : ' Usted ve únicamente sus clientes y sus ventas.'}{' '}
        El botón «Imprimir» genera una copia en papel o en PDF para el comité.
      </p>
    </div>
  )
}
