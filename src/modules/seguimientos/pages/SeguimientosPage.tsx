import { useMemo, useState } from 'react'
import clsx from 'clsx'
import {
  CalendarClock,
  ClipboardList,
  History,
  Plus,
  Search,
  SlidersHorizontal,
  UserRoundX,
  X,
} from 'lucide-react'
import type { ResultadoSeguimiento, Seguimiento, TipoSeguimiento } from '@/core/types'
import { useSesion } from '@/core/auth/SesionContext'
import { useDatos } from '@/core/data/store'
import { equipoRepo, seguimientosRepo } from '@/core/data/repositories'
import { etiquetaSeguimiento } from '@/core/utils/etiquetas'
import { formatearNumero } from '@/core/utils/format'
import {
  Boton,
  CabeceraTarjeta,
  EncabezadoPagina,
  Etiqueta,
  Indicador,
  IndicadorCompacto,
  Pestanas,
  Seleccion,
  Tarjeta,
  type Pestana,
} from '@/ui'
import { AgendaSeguimientos } from '../components/AgendaSeguimientos'
import { HistorialSeguimientos } from '../components/HistorialSeguimientos'
import { FormularioSeguimiento } from '../components/FormularioSeguimiento'
import { PanelCierre } from '../components/PanelCierre'
import {
  etiquetaResultado,
  filtrarSeguimientos,
  FILTROS_INICIALES,
  hayFiltros,
  RESULTADOS,
  resumenSeguimientos,
  TIPOS_SEGUIMIENTO,
  type FiltrosSeguimientos,
} from '../services/seguimientosService'

export default function SeguimientosPage() {
  const version = useDatos()
  const { usuario, esGerencia, alcance } = useSesion()

  const [pestana, setPestana] = useState('agenda')
  const [filtros, setFiltros] = useState<FiltrosSeguimientos>(FILTROS_INICIALES)
  const [registrando, setRegistrando] = useState(false)
  const [editando, setEditando] = useState<Seguimiento | null>(null)
  const [cerrando, setCerrando] = useState<Seguimiento | null>(null)

  const pendientes = useMemo(() => seguimientosRepo.pendientes(usuario), [usuario, version])
  const historial = useMemo(
    () => filtrarSeguimientos(usuario, filtros),
    [usuario, filtros, version],
  )
  const resumen = useMemo(() => resumenSeguimientos(usuario), [usuario, version])

  const pestanas: Pestana[] = [
    { clave: 'agenda', etiqueta: 'Agenda', contador: pendientes.length },
    { clave: 'historial', etiqueta: 'Historial', contador: historial.length },
  ]

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        antetitulo={esGerencia ? 'Gestión de la hacienda' : 'Su agenda comercial'}
        titulo="Seguimientos"
        descripcion="Cada llamada, visita y degustación queda registrada, y cada gestión deja comprometido el siguiente paso."
        acciones={
          <Boton variante="primario" icono={<Plus size={15} />} onClick={() => setRegistrando(true)}>
            Registrar gestión
          </Boton>
        }
      />

      {/* Cifras */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          destacado={resumen.vencidos > 0}
          etiqueta="Acciones vencidas"
          valor={formatearNumero(resumen.vencidos)}
          detalle="pasaron de la fecha comprometida"
          icono={<CalendarClock size={16} />}
        />
        <Indicador
          etiqueta="Para hoy"
          valor={formatearNumero(resumen.hoy)}
          detalle={`${resumen.semana} en los próximos 7 días`}
          icono={<ClipboardList size={16} />}
        />
        <Indicador
          etiqueta="Gestiones abiertas"
          valor={formatearNumero(resumen.pendientes)}
          detalle={`${resumen.total} registradas en total`}
          icono={<History size={16} />}
        />
        <Indicador
          etiqueta="Cartera sin gestión"
          valor={formatearNumero(resumen.sinGestion)}
          detalle="clientes sin próxima acción"
          icono={<UserRoundX size={16} />}
        />
      </section>

      {resumen.vencidos > 0 ? (
        <IndicadorCompacto
          etiqueta="Acciones vencidas en la agenda"
          valor={formatearNumero(resumen.vencidos)}
          detalle="cerrarlas o reprogramarlas es lo primero del día"
          tono="urgente"
          icono={<CalendarClock size={16} />}
          accion="Ver agenda"
          onAccion={() => setPestana('agenda')}
        />
      ) : null}

      <Tarjeta>
        <CabeceraTarjeta
          titulo={pestana === 'agenda' ? 'Próximas acciones' : 'Historial de gestiones'}
          descripcion={
            pestana === 'agenda'
              ? 'Lo comprometido con el cliente, de lo más urgente en adelante.'
              : 'Todo lo registrado, de la gestión más reciente hacia atrás.'
          }
          icono={pestana === 'agenda' ? <CalendarClock size={16} /> : <History size={16} />}
        />

        <Pestanas pestanas={pestanas} activa={pestana} onCambiar={setPestana} />

        {pestana === 'agenda' ? (
          <AgendaSeguimientos
            pendientes={pendientes}
            onCerrar={setCerrando}
            onEditar={setEditando}
          />
        ) : (
          <>
            {/* Buscador y filtros */}
            <div className="space-y-3 border-b border-crema-200 px-5 py-4">
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-carbon/30"
                />
                <input
                  value={filtros.texto}
                  onChange={(e) => setFiltros({ ...filtros, texto: e.target.value })}
                  placeholder="Buscar por asunto, detalle o cliente…"
                  className="h-10 w-full rounded-lg border border-crema-300 bg-white pl-10 pr-9 text-sm text-carbon placeholder:text-carbon/35 focus:border-bosque-300 focus:outline-none focus:ring-2 focus:ring-bosque-100"
                />
                {filtros.texto ? (
                  <button
                    onClick={() => setFiltros({ ...filtros, texto: '' })}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-carbon/35 hover:bg-crema-100"
                    aria-label="Limpiar"
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 pr-1 text-[11.5px] uppercase tracking-marca text-bosque-400">
                  <SlidersHorizontal size={13} />
                  Filtros
                </span>

                <div className="w-40">
                  <Seleccion
                    className="h-9 text-xs"
                    value={filtros.tipo}
                    onChange={(e) =>
                      setFiltros({ ...filtros, tipo: e.target.value as TipoSeguimiento | 'todos' })
                    }
                    opciones={[
                      { valor: 'todos', texto: 'Todos los tipos' },
                      ...TIPOS_SEGUIMIENTO.map((t) => ({
                        valor: t,
                        texto: etiquetaSeguimiento[t],
                      })),
                    ]}
                  />
                </div>

                <div className="w-40">
                  <Seleccion
                    className="h-9 text-xs"
                    value={filtros.resultado}
                    onChange={(e) =>
                      setFiltros({
                        ...filtros,
                        resultado: e.target.value as ResultadoSeguimiento | 'todos',
                      })
                    }
                    opciones={[
                      { valor: 'todos', texto: 'Todos los resultados' },
                      ...RESULTADOS.map((r) => ({ valor: r, texto: etiquetaResultado[r] })),
                      { valor: 'pendiente', texto: 'Pendiente' },
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

                <div className="ml-auto flex items-center gap-3">
                  <Etiqueta tono="contorno">{historial.length} gestiones</Etiqueta>
                  {hayFiltros(filtros) ? (
                    <button
                      onClick={() => setFiltros(FILTROS_INICIALES)}
                      className={clsx(
                        'text-xs text-bosque-500 underline-offset-4',
                        'transition-colors hover:text-bosque-700 hover:underline',
                      )}
                    >
                      Limpiar
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <HistorialSeguimientos
              seguimientos={historial}
              onEditar={setEditando}
              onCerrar={setCerrando}
            />
          </>
        )}
      </Tarjeta>

      {/* Paneles */}
      <FormularioSeguimiento abierto={registrando} onCerrar={() => setRegistrando(false)} />

      <FormularioSeguimiento
        abierto={Boolean(editando)}
        onCerrar={() => setEditando(null)}
        seguimiento={editando ?? undefined}
      />

      <PanelCierre seguimiento={cerrando} onCerrar={() => setCerrando(null)} />
    </div>
  )
}
