import { useMemo, useState } from 'react'
import clsx from 'clsx'
import {
  CalendarCheck2,
  CalendarPlus,
  LayoutGrid,
  List,
  PartyPopper,
  Search,
  SlidersHorizontal,
  TrendingUp,
  X,
} from 'lucide-react'
import type { EstadoExperiencia, Experiencia, TipoExperiencia } from '@/core/types'
import { useSesion } from '@/core/auth/SesionContext'
import { useDatos } from '@/core/data/store'
import { clientesRepo, equipoRepo } from '@/core/data/repositories'
import { etiquetaEstadoExperiencia, etiquetaExperiencia } from '@/core/utils/etiquetas'
import { formatearMonedaCompacta, formatearNumero, formatearPorcentaje } from '@/core/utils/format'
import {
  Boton,
  CabeceraTarjeta,
  EncabezadoPagina,
  Etiqueta,
  Indicador,
  IndicadorCompacto,
  Seleccion,
  Tarjeta,
} from '@/ui'
import { TableroKanban } from '../components/TableroKanban'
import { ListaExperiencias } from '../components/ListaExperiencias'
import { FormularioExperiencia } from '../components/FormularioExperiencia'
import { PanelCambioEstado } from '../components/PanelCambioEstado'
import { DetalleExperiencia } from '../components/DetalleExperiencia'
import {
  agruparPorEstado,
  filtrarExperiencias,
  FILTROS_INICIALES,
  hayFiltros,
  resumenExperiencias,
  TIPOS_EXPERIENCIA,
  type FiltrosExperiencias,
} from '../services/experienciasService'

type Vista = 'kanban' | 'lista'

export default function ExperienciasPage() {
  const version = useDatos()
  const { usuario, esGerencia, alcance } = useSesion()

  /*
   * En pantalla pequeña el tablero obliga a desplazarse por ocho columnas.
   * Se abre en lista, que se lee de corrido; el botón sigue disponible.
   */
  const [vista, setVista] = useState<Vista>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'lista' : 'kanban',
  )
  const [filtros, setFiltros] = useState<FiltrosExperiencias>(FILTROS_INICIALES)
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState<Experiencia | null>(null)
  const [detalle, setDetalle] = useState<Experiencia | null>(null)
  const [movimiento, setMovimiento] = useState<{
    experiencia: Experiencia
    destino: EstadoExperiencia
  } | null>(null)

  const experiencias = useMemo(
    () => filtrarExperiencias(usuario, filtros, (id) => clientesRepo.nombreDe(id)),
    [usuario, filtros, version],
  )
  const columnas = useMemo(() => agruparPorEstado(experiencias), [experiencias])
  const resumen = useMemo(() => resumenExperiencias(experiencias), [experiencias])

  /** Al soltar una tarjeta: los cierres piden datos antes de moverse. */
  const alMover = (id: string, destino: EstadoExperiencia) => {
    const experiencia = experiencias.find((e) => e.id === id)
    if (!experiencia || experiencia.estado === destino) return
    setMovimiento({ experiencia, destino })
  }

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        antetitulo={esGerencia ? 'Celebraciones de la hacienda' : 'Sus experiencias'}
        titulo="Experiencias y eventos"
        descripcion="Cada solicitud entra al tablero y avanza hasta celebrarse. Para confirmar hay que anotar el valor final; para descartar, el motivo."
        acciones={
          <>
            <div className="flex overflow-hidden rounded-lg border border-crema-300 bg-white">
              <button
                onClick={() => setVista('kanban')}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-2 text-xs transition-colors',
                  vista === 'kanban'
                    ? 'bg-bosque-700 text-crema-50'
                    : 'text-carbon/60 hover:text-bosque-700',
                )}
              >
                <LayoutGrid size={14} />
                Tablero
              </button>
              <button
                onClick={() => setVista('lista')}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-2 text-xs transition-colors',
                  vista === 'lista'
                    ? 'bg-bosque-700 text-crema-50'
                    : 'text-carbon/60 hover:text-bosque-700',
                )}
              >
                <List size={14} />
                Lista
              </button>
            </div>
            <Boton variante="primario" icono={<CalendarPlus size={15} />} onClick={() => setCreando(true)}>
              Nueva experiencia
            </Boton>
          </>
        }
      />

      {/* Cifras del tablero */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          etiqueta="En proceso"
          valor={formatearNumero(resumen.abiertas)}
          detalle={`${formatearMonedaCompacta(resumen.valorAbierto)} en juego`}
          icono={<TrendingUp size={16} />}
        />
        <Indicador
          etiqueta="Confirmadas"
          valor={formatearNumero(resumen.confirmadas)}
          detalle={`${formatearMonedaCompacta(resumen.valorConfirmado)} cerrados`}
          icono={<CalendarCheck2 size={16} />}
        />
        <Indicador
          etiqueta="Comensales agendados"
          valor={formatearNumero(resumen.comensalesAgendados)}
          detalle="en experiencias por celebrar"
          icono={<PartyPopper size={16} />}
        />
        <Indicador
          etiqueta="Tasa de cierre"
          valor={formatearPorcentaje(resumen.tasaCierre)}
          detalle={`${resumen.realizadas} realizadas · ${resumen.perdidas} perdidas`}
        />
      </section>

      {resumen.seguimientosVencidos > 0 ? (
        <IndicadorCompacto
          etiqueta="Seguimientos atrasados"
          valor={formatearNumero(resumen.seguimientosVencidos)}
          detalle="experiencias abiertas sin gestionar a tiempo"
          tono="urgente"
          accion="Ver en lista"
          onAccion={() => {
            setVista('lista')
            setFiltros((f) => ({ ...f, soloAbiertas: true }))
          }}
        />
      ) : null}

      {/* Buscador y filtros */}
      <div className="space-y-3">
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-carbon/30"
          />
          <input
            value={filtros.texto}
            onChange={(e) => setFiltros({ ...filtros, texto: e.target.value })}
            placeholder="Buscar por experiencia, cliente o código…"
            className="h-12 w-full rounded-xl border border-crema-300 bg-white pl-12 pr-10 text-sm text-carbon shadow-suave placeholder:text-carbon/35 focus:border-bosque-300 focus:outline-none focus:ring-2 focus:ring-bosque-100"
          />
          {filtros.texto ? (
            <button
              onClick={() => setFiltros({ ...filtros, texto: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-carbon/35 transition-colors hover:bg-crema-100"
              aria-label="Limpiar búsqueda"
            >
              <X size={15} />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-crema-300/70 bg-white px-3 py-2.5 shadow-suave">
          <span className="flex items-center gap-1.5 pr-1 text-[11.5px] uppercase tracking-marca text-bosque-400">
            <SlidersHorizontal size={13} />
            Filtros
          </span>

          <div className="w-48">
            <Seleccion
              className="h-9 text-xs"
              value={filtros.tipo}
              onChange={(e) =>
                setFiltros({ ...filtros, tipo: e.target.value as TipoExperiencia | 'todos' })
              }
              opciones={[
                { valor: 'todos', texto: 'Todos los tipos' },
                ...TIPOS_EXPERIENCIA.map((t) => ({ valor: t, texto: etiquetaExperiencia[t] })),
              ]}
            />
          </div>

          {alcance === 'todos' ? (
            <div className="w-48">
              <Seleccion
                className="h-9 text-xs"
                value={filtros.comercialId}
                onChange={(e) => setFiltros({ ...filtros, comercialId: e.target.value })}
                opciones={[
                  { valor: 'todos', texto: 'Todos los comerciales' },
                  ...equipoRepo.comerciales().map((u) => ({ valor: u.id, texto: u.nombre })),
                ]}
              />
            </div>
          ) : null}

          {vista === 'lista' ? (
            <div className="w-44">
              <Seleccion
                className="h-9 text-xs"
                value={filtros.estado}
                onChange={(e) =>
                  setFiltros({ ...filtros, estado: e.target.value as EstadoExperiencia | 'todos' })
                }
                opciones={[
                  { valor: 'todos', texto: 'Todas las etapas' },
                  ...(
                    [
                      'nuevo',
                      'contactado',
                      'visita',
                      'cotizacion',
                      'negociacion',
                      'confirmado',
                      'realizado',
                      'perdido',
                    ] as EstadoExperiencia[]
                  ).map((x) => ({ valor: x, texto: etiquetaEstadoExperiencia[x] })),
                ]}
              />
            </div>
          ) : null}

          <button
            onClick={() => setFiltros({ ...filtros, soloAbiertas: !filtros.soloAbiertas })}
            className={clsx(
              'h-9 rounded-lg border px-3 text-xs transition-colors',
              filtros.soloAbiertas
                ? 'border-bosque-600 bg-bosque-50 text-bosque-700'
                : 'border-crema-300 bg-white text-carbon/60 hover:border-bosque-300',
            )}
          >
            Solo abiertas
          </button>

          <div className="ml-auto flex items-center gap-3">
            <Etiqueta tono="contorno">{experiencias.length} experiencias</Etiqueta>
            {hayFiltros(filtros) ? (
              <button
                onClick={() => setFiltros(FILTROS_INICIALES)}
                className="text-xs text-bosque-500 underline-offset-4 transition-colors hover:text-bosque-700 hover:underline"
              >
                Limpiar
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Tablero o lista */}
      <Tarjeta className="overflow-hidden">
        {vista === 'kanban' ? (
          <>
            <CabeceraTarjeta
              titulo="Tablero de experiencias"
              descripcion="Arrastre una tarjeta a otra columna para moverla. Al confirmar o descartar, el sistema pide los datos que faltan."
              icono={<LayoutGrid size={16} />}
            />
            <TableroKanban columnas={columnas} onAbrir={setDetalle} onMover={alMover} />
          </>
        ) : (
          <>
            <CabeceraTarjeta
              titulo="Experiencias"
              descripcion="Ordenadas por fecha tentativa, de la más próxima a la más lejana."
              icono={<List size={16} />}
            />
            <ListaExperiencias experiencias={experiencias} onAbrir={setDetalle} />
          </>
        )}
      </Tarjeta>

      {/* Paneles */}
      <FormularioExperiencia abierto={creando} onCerrar={() => setCreando(false)} />

      <FormularioExperiencia
        abierto={Boolean(editando)}
        onCerrar={() => setEditando(null)}
        experiencia={editando ?? undefined}
      />

      <DetalleExperiencia
        experiencia={detalle}
        onCerrar={() => setDetalle(null)}
        onEditar={(e) => {
          setDetalle(null)
          setEditando(e)
        }}
        onMover={(e, destino) => {
          setDetalle(null)
          setMovimiento({ experiencia: e, destino })
        }}
      />

      <PanelCambioEstado
        experiencia={movimiento?.experiencia ?? null}
        destino={movimiento?.destino ?? null}
        onCerrar={() => setMovimiento(null)}
      />
    </div>
  )
}
