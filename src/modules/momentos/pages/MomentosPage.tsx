import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { Bell, CalendarClock, Cake, Sparkles, SlidersHorizontal, UserRoundX } from 'lucide-react'
import type { Momento, TipoMomento } from '@/core/types'
import { useSesion } from '@/core/auth/SesionContext'
import { useDatos } from '@/core/data/store'
import { momentosRepo } from '@/core/data/repositories'
import { formatearMonedaCompacta, formatearNumero } from '@/core/utils/format'
import {
  Boton,
  CabeceraTarjeta,
  EncabezadoPagina,
  Etiqueta,
  Indicador,
  Pestanas,
  Tarjeta,
  type Pestana,
} from '@/ui'
import { FormularioSeguimiento } from '@/modules/seguimientos'
import { CronologiaMomentos } from '../components/CronologiaMomentos'
import { PanelReglas } from '../components/PanelReglas'
import { BandejaNotificaciones } from '../components/BandejaNotificaciones'
import {
  conteosPorTipo,
  conteosPorVentana,
  enVentana,
  ETIQUETA_TIPO,
  ORDEN_TIPOS,
  resumenMomentos,
  TONO_TIPO,
  VENTANAS,
  type Ventana,
} from '../services/momentosService'

export default function MomentosPage() {
  const version = useDatos()
  const { usuario, esGerencia } = useSesion()

  const [ventana, setVentana] = useState<Ventana>(7)
  const [tipo, setTipo] = useState<TipoMomento | 'todos'>('todos')
  /** Momento que se está atendiendo: abre el registro de la gestión. */
  const [atendiendo, setAtendiendo] = useState<Momento | null>(null)

  const momentos = useMemo(() => momentosRepo.momentos(usuario, 30), [usuario, version])
  const notificaciones = useMemo(() => momentosRepo.notificaciones(usuario), [usuario, version])
  const reglas = useMemo(() => momentosRepo.reglas(), [version])

  /*
   * Al abrir el módulo se evalúan las reglas activas contra los momentos de hoy.
   * Es idempotente: no genera dos veces el mismo aviso.
   */
  useEffect(() => {
    momentosRepo.sincronizar(usuario)
  }, [usuario, version])

  const resumen = resumenMomentos(momentos)
  const porVentana = conteosPorVentana(momentos)

  const enRango = enVentana(momentos, ventana)
  const conteosTipo = conteosPorTipo(enRango)
  const visibles = tipo === 'todos' ? enRango : enRango.filter((m) => m.tipo === tipo)

  const pendientes = notificaciones.filter((n) => n.estado === 'pendiente')

  const pestanas: Pestana[] = VENTANAS.map((v) => ({
    clave: String(v.valor),
    etiqueta: v.etiqueta,
    contador: porVentana[v.valor] ?? 0,
  }))

  /*
   * Atender un momento es registrar la gestión que dispara: se abre el
   * formulario de Seguimientos y, al guardarlo, el aviso queda atendido.
   */
  const atender = (momento: Momento) => setAtendiendo(momento)

  const alRegistrarGestion = () => {
    if (!atendiendo) return
    const notificacion = notificaciones.find(
      (n) => n.momentoId === atendiendo.id && n.estado !== 'atendida',
    )
    if (notificacion) momentosRepo.marcar(notificacion.id, 'atendida')
    setAtendiendo(null)
  }

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        antetitulo="Fidelización · Momentos Hacienda"
        titulo="Momentos Hacienda"
        descripcion="Las ocasiones para volver a hablarle a un cliente: sus fechas, sus celebraciones y las cuentas que llevan tiempo sin volver."
        acciones={
          pendientes.length > 0 ? (
            <Boton
              variante="secundario"
              icono={<Bell size={15} />}
              onClick={() => momentosRepo.marcarTodasVistas(usuario)}
            >
              Marcar avisos como vistos
            </Boton>
          ) : null
        }
      />

      {/* Cifras */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          destacado={resumen.hoy > 0}
          etiqueta="Momentos de hoy"
          valor={formatearNumero(resumen.hoy)}
          detalle={`${resumen.semana} en los próximos 7 días`}
          icono={<CalendarClock size={16} />}
        />
        <Indicador
          etiqueta="Cumpleaños del mes"
          valor={formatearNumero(resumen.cumpleanos)}
          detalle={`${resumen.aniversarios} aniversarios`}
          icono={<Cake size={16} />}
        />
        <Indicador
          etiqueta="Experiencias por celebrar"
          valor={formatearNumero(resumen.eventos)}
          detalle="confirmadas en los próximos 30 días"
          icono={<Sparkles size={16} />}
        />
        <Indicador
          etiqueta="Clientes por recuperar"
          valor={formatearNumero(resumen.recuperacion)}
          detalle={`${formatearMonedaCompacta(resumen.valorEnRiesgo)} histórico`}
          icono={<UserRoundX size={16} />}
        />
      </section>

      {/* Línea de tiempo */}
      <Tarjeta>
        <CabeceraTarjeta
          titulo="Línea de tiempo"
          descripcion="Lo que viene, del día de hoy hacia adelante."
          icono={<CalendarClock size={16} />}
          acciones={<Etiqueta tono="contorno">{visibles.length} en la vista</Etiqueta>}
        />

        <Pestanas
          pestanas={pestanas}
          activa={String(ventana)}
          onCambiar={(clave) => setVentana(Number(clave) as Ventana)}
        />

        {/* Filtro por tipo */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-crema-200 px-5 py-3">
          <span className="flex items-center gap-1.5 pr-1 text-[11.5px] uppercase tracking-marca text-bosque-400">
            <SlidersHorizontal size={13} />
            Tipo
          </span>
          {(['todos', ...ORDEN_TIPOS] as const).map((clave) => {
            const cantidad = clave === 'todos' ? enRango.length : (conteosTipo[clave] ?? 0)
            const activo = tipo === clave
            return (
              <button
                key={clave}
                onClick={() => setTipo(clave)}
                disabled={cantidad === 0 && clave !== 'todos'}
                className={clsx(
                  'rounded-full border px-3 py-1 text-[12.5px] transition-colors',
                  activo
                    ? 'border-bosque-700 bg-bosque-700 text-crema-50'
                    : 'border-crema-300 bg-white text-carbon/60 hover:border-bosque-300 hover:text-bosque-700',
                  cantidad === 0 && clave !== 'todos' && 'cursor-not-allowed opacity-40',
                )}
              >
                {clave === 'todos' ? 'Todos' : ETIQUETA_TIPO[clave]}
                <span className={clsx('ml-1.5', activo ? 'text-laton-300' : 'text-carbon/35')}>
                  {cantidad}
                </span>
              </button>
            )
          })}
        </div>

        <CronologiaMomentos momentos={visibles} onRegistrar={atender} />
      </Tarjeta>

      {/* Recordatorios y reglas */}
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Tarjeta>
          <CabeceraTarjeta
            titulo="Recordatorios en el CRM"
            descripcion={
              esGerencia
                ? 'Avisos generados para el equipo comercial. No se envía nada al cliente.'
                : 'Sus avisos pendientes. No se envía nada al cliente.'
            }
            icono={<Bell size={16} />}
            acciones={
              pendientes.length > 0 ? (
                <Etiqueta tono="alerta">{pendientes.length} sin ver</Etiqueta>
              ) : (
                <Etiqueta tono="exito">al día</Etiqueta>
              )
            }
          />
          <BandejaNotificaciones
            notificaciones={notificaciones}
            mostrarDestinatario={esGerencia}
          />
        </Tarjeta>

        <Tarjeta>
          <CabeceraTarjeta
            titulo="Reglas de recordatorio"
            descripcion="Cuánto antes avisa el sistema de cada tipo de momento."
            icono={<SlidersHorizontal size={16} />}
            acciones={
              <Etiqueta tono="contorno">
                {reglas.filter((r) => r.activa).length} de {reglas.length}
              </Etiqueta>
            }
          />
          <PanelReglas reglas={reglas} />
        </Tarjeta>
      </div>

      <FormularioSeguimiento
        abierto={Boolean(atendiendo)}
        onCerrar={() => setAtendiendo(null)}
        clienteFijo={atendiendo?.clienteId}
        asuntoSugerido={atendiendo ? tituloGestion(atendiendo) : undefined}
        onGuardado={alRegistrarGestion}
      />
    </div>
  )
}

/** Asunto sugerido según el tipo de momento que se está atendiendo. */
function tituloGestion(momento: Momento) {
  switch (momento.tipo) {
    case 'cumpleanos':
      return `Saludo de cumpleaños · ${momento.titulo}`
    case 'aniversario':
      return `Saludo de aniversario · ${momento.titulo}`
    case 'evento':
      return `Coordinación de «${momento.titulo}»`
    default:
      return `Reactivación · ${momento.titulo}`
  }
}

export { TONO_TIPO }
