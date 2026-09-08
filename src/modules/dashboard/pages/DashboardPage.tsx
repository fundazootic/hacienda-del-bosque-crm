import { useMemo } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Cake,
  CalendarClock,
  CalendarHeart,
  ClipboardList,
  Filter,
  GitBranch,
  Handshake,
  HeartHandshake,
  ShieldAlert,
  Sparkles,
  UserPlus,
  UserRoundX,
  Users,
} from 'lucide-react'
import { useSesion } from '@/core/auth/SesionContext'
import { useDatos } from '@/core/data/store'
import {
  Boton,
  CabeceraTarjeta,
  EncabezadoPagina,
  Etiqueta,
  Indicador,
  IndicadorCompacto,
  Tarjeta,
} from '@/ui'
import {
  formatearMonedaCompacta,
  formatearNumero,
  formatearPorcentaje,
} from '@/core/utils/format'
import {
  actividadPorCanal,
  conflictosPendientes,
  detallePorComercial,
  momentosHacienda,
  panoramaGerencial,
  pipelineComercial,
  tendenciaVentas,
} from '../services/metricas'
import { TendenciaVentas } from '../components/TendenciaVentas'
import { PipelineComercial } from '../components/PipelineComercial'
import { ActividadComercial, ResumenCanalDestacado } from '../components/ActividadComercial'
import { MomentosHacienda } from '../components/MomentosHacienda'
import { AlertasPropiedad } from '../components/AlertasPropiedad'

export default function DashboardPage() {
  // La versión de los datos entra en las dependencias: una reasignación o una
  // solicitud resuelta en otro módulo se refleja aquí sin recargar.
  const version = useDatos()
  const { usuario, esGerencia } = useSesion()

  const panorama = useMemo(() => panoramaGerencial(usuario), [usuario, version])
  const tendencia = useMemo(() => tendenciaVentas(usuario), [usuario, version])
  const pipeline = useMemo(() => pipelineComercial(usuario), [usuario, version])
  const momentos = useMemo(() => momentosHacienda(usuario), [usuario, version])
  const canales = useMemo(() => (esGerencia ? actividadPorCanal() : []), [esGerencia, version])
  const detalle = useMemo(() => (esGerencia ? detallePorComercial() : []), [esGerencia, version])
  const conflictos = useMemo(
    () => (esGerencia ? conflictosPendientes() : []),
    [esGerencia, version],
  )

  const nombreCorto = usuario.nombre.split(' ')[0]
  const ventasPositivas = panorama.variacionVentas >= 0

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        antetitulo="Viernes, 4 de septiembre de 2026"
        titulo={`Buen día, ${nombreCorto}`}
        descripcion={
          esGerencia
            ? 'Estado comercial de la hacienda: cartera, negociaciones en curso, actividad del equipo y los momentos que vienen.'
            : 'Su cartera, sus negociaciones y los momentos próximos de sus clientes.'
        }
        acciones={
          <>
            <Boton variante="secundario" icono={<Filter size={15} />}>
              Septiembre
            </Boton>
            <Boton variante="primario" icono={<UserPlus size={15} />}>
              Nuevo cliente
            </Boton>
          </>
        }
      />

      {/* ── Ventas del mes: la cifra que abre la lectura ─────────────────── */}
      <Tarjeta tono="oscura" className="overflow-hidden">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.15fr_1fr] lg:gap-10 lg:p-7">
          <div>
            <p className="text-[11.5px] uppercase tracking-marca text-laton-300">
              Ventas comerciales de septiembre
            </p>

            <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
              <p className="font-display text-5xl leading-none text-crema-50">
                {formatearMonedaCompacta(panorama.totalMes)}
              </p>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  ventasPositivas
                    ? 'bg-emerald-400/15 text-emerald-300'
                    : 'bg-rose-400/15 text-rose-300'
                }`}
              >
                {ventasPositivas ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {formatearPorcentaje(Math.abs(panorama.variacionVentas), 1)}
              </span>
              <span className="text-xs text-crema-200/60">
                frente a agosto · {panorama.operacionesMes}{' '}
                {panorama.operacionesMes === 1 ? 'operación' : 'operaciones'}
              </span>
            </div>

            <div className="mt-6 max-w-md">
              <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
                <span className="text-crema-200/60">
                  Meta {esGerencia ? 'de la hacienda' : 'personal'}:{' '}
                  {formatearMonedaCompacta(panorama.meta)}
                </span>
                <span className="font-medium text-laton-300">
                  {formatearPorcentaje(panorama.avanceMeta, 1)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-bosque-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-laton-500 to-laton-300 transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(2, panorama.avanceMeta))}%` }}
                />
              </div>
              <p className="mt-2 text-[12.5px] text-crema-200/50">
                Si se cierra lo que está en negociación, el mes llegaría a{' '}
                <span className="text-laton-300">
                  {formatearMonedaCompacta(panorama.totalMes + panorama.valorPonderado)}
                </span>
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-bosque-700 bg-bosque-900/40 p-4">
            <p className="mb-1 text-[11.5px] uppercase tracking-marca text-crema-200/50">
              Tendencia · últimos 6 meses
            </p>
            <TendenciaVentas datos={tendencia} oscuro />
          </div>
        </div>
      </Tarjeta>

      {/* ── Cartera y negocio en curso ───────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          etiqueta="Total de clientes"
          valor={formatearNumero(panorama.clientesTotales)}
          detalle="en la cartera de la hacienda"
          icono={<Users size={16} />}
        />
        <Indicador
          etiqueta="Clientes nuevos del mes"
          valor={formatearNumero(panorama.clientesNuevos)}
          variacion={panorama.variacionClientes}
          detalle="frente a agosto"
          icono={<Sparkles size={16} />}
        />
        <Indicador
          etiqueta="Negocios abiertos"
          valor={formatearNumero(panorama.oportunidadesActivas)}
          detalle={`${formatearMonedaCompacta(panorama.valorActivas)} en juego`}
          icono={<Handshake size={16} />}
        />
        <Indicador
          etiqueta="Eventos por confirmar"
          valor={formatearNumero(panorama.eventosEnNegociacion)}
          detalle={`${formatearMonedaCompacta(panorama.valorNegociacion)} por confirmar`}
          icono={<CalendarHeart size={16} />}
        />
      </section>

      {/* ── Señales que piden acción ─────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <IndicadorCompacto
          etiqueta="Seguimientos pendientes"
          valor={formatearNumero(panorama.seguimientosPendientes)}
          detalle={
            panorama.seguimientosVencidos > 0
              ? `${panorama.seguimientosVencidos} vencidos`
              : 'todos al día'
          }
          tono={panorama.seguimientosVencidos > 0 ? 'urgente' : 'neutro'}
          icono={<ClipboardList size={16} />}
          accion="Ver agenda"
        />
        <IndicadorCompacto
          etiqueta="Cumpleaños próximos"
          valor={formatearNumero(panorama.cumpleanosProximos)}
          detalle={
            panorama.diasProximoCumpleanos === null
              ? 'próximos 30 días'
              : panorama.diasProximoCumpleanos === 0
                ? 'uno es hoy'
                : `el más cercano en ${panorama.diasProximoCumpleanos} días`
          }
          tono="laton"
          icono={<Cake size={16} />}
          accion="Ver momentos"
        />
        <IndicadorCompacto
          etiqueta="Clientes por recuperar"
          valor={formatearNumero(panorama.clientesPorRecuperar)}
          detalle={`${formatearMonedaCompacta(panorama.valorEnRiesgo)} histórico`}
          tono={panorama.clientesPorRecuperar > 0 ? 'atencion' : 'neutro'}
          icono={<UserRoundX size={16} />}
          accion="Reactivar"
        />
      </section>

      {/* ── Solicitudes de reasignación (solo Gerencia) ──────────────────── */}
      {esGerencia && conflictos.length > 0 ? (
        <Tarjeta className="border-amber-200/80">
          <CabeceraTarjeta
            titulo="Solicitudes de reasignación"
            descripcion="Cuentas que otro comercial pide atender. Solo Gerencia aprueba o rechaza."
            icono={<ShieldAlert size={16} />}
            acciones={
              <Etiqueta tono="alerta">
                {conflictos.length === 1 ? '1 pendiente' : `${conflictos.length} pendientes`}
              </Etiqueta>
            }
          />
          <AlertasPropiedad conflictos={conflictos} />
        </Tarjeta>
      ) : null}

      {/* ── Embudo de ventas ───────────────────────────────────────────── */}
      <Tarjeta>
        <CabeceraTarjeta
          titulo="Embudo de ventas"
          descripcion="En qué paso va cada experiencia abierta y cuánto dinero representa."
          icono={<GitBranch size={16} />}
          acciones={
            <Boton variante="secundario" tamano="sm">
              Abrir tablero
            </Boton>
          }
        />
        <PipelineComercial
          etapas={pipeline.etapas}
          valorTotal={pipeline.valorTotal}
          valorPonderado={pipeline.valorPonderado}
          tasaCierre={pipeline.tasaCierre}
          ganadas={pipeline.ganadas}
          perdidas={pipeline.perdidas}
        />
      </Tarjeta>

      {/* ── Actividad comercial y Momentos Hacienda ──────────────────────── */}
      <div className={esGerencia ? 'grid items-start gap-6 xl:grid-cols-2' : ''}>
        {esGerencia ? (
          <Tarjeta>
            <CabeceraTarjeta
              titulo="Actividad comercial"
              descripcion="Canal interno frente a canal freelancer en el año en curso."
              icono={<HeartHandshake size={16} />}
              acciones={<ResumenCanalDestacado canales={canales} />}
            />
            <ActividadComercial canales={canales} detalle={detalle} />
          </Tarjeta>
        ) : null}

        <Tarjeta>
          <CabeceraTarjeta
            titulo="Momentos Hacienda"
            descripcion="Cumpleaños, aniversarios, experiencias y seguimientos de los próximos 30 días."
            icono={<CalendarClock size={16} />}
            acciones={<Etiqueta tono="contorno">{momentos.length} momentos</Etiqueta>}
          />
          <MomentosHacienda momentos={momentos} limite={esGerencia ? 8 : 10} />
        </Tarjeta>
      </div>
    </div>
  )
}
