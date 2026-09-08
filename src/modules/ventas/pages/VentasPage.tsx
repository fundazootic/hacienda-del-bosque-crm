import { useMemo, useState } from 'react'
import clsx from 'clsx'
import {
  AlertTriangle,
  Banknote,
  Coins,
  FileWarning,
  Plus,
  Receipt,
  Search,
  SlidersHorizontal,
  TrendingUp,
  X,
} from 'lucide-react'
import type { CategoriaVenta, EstadoPago, Experiencia } from '@/core/types'
import { useSesion } from '@/core/auth/SesionContext'
import { useDatos } from '@/core/data/store'
import { clientesRepo, equipoRepo } from '@/core/data/repositories'
import { etiquetaEstadoPago } from '@/core/utils/etiquetas'
import { formatearMoneda, formatearMonedaCompacta, formatearNumero } from '@/core/utils/format'
import { formatearFechaCorta } from '@/core/utils/fecha'
import {
  Boton,
  CabeceraTarjeta,
  EncabezadoPagina,
  Etiqueta,
  Indicador,
  Pestanas,
  Seleccion,
  Tarjeta,
  type Pestana,
} from '@/ui'
import { TablaVentas } from '../components/TablaVentas'
import { FormularioVenta } from '../components/FormularioVenta'
import { PanelComisiones } from '../components/PanelComisiones'
import {
  CATEGORIAS,
  comisionesPorComercial,
  ESTADOS_PAGO,
  etiquetaCategoriaVenta,
  experienciasPorFacturar,
  filtrarVentas,
  FILTROS_INICIALES,
  hayFiltros,
  periodosDisponibles,
  porCategoria,
  resumenVentas,
  type FiltrosVentas,
} from '../services/ventasService'

export default function VentasPage() {
  const version = useDatos()
  const { usuario, esGerencia, alcance } = useSesion()

  const [pestana, setPestana] = useState('ventas')
  const [filtros, setFiltros] = useState<FiltrosVentas>(FILTROS_INICIALES)
  const [registrando, setRegistrando] = useState(false)
  const [experienciaFija, setExperienciaFija] = useState<Experiencia | undefined>()

  const ventas = useMemo(() => filtrarVentas(usuario, filtros), [usuario, filtros, version])
  const resumen = useMemo(() => resumenVentas(usuario), [usuario, version])
  const categorias = useMemo(() => porCategoria(usuario), [usuario, version])
  const comisiones = useMemo(() => (esGerencia ? comisionesPorComercial() : []), [esGerencia, version])
  const porFacturar = useMemo(() => experienciasPorFacturar(usuario), [usuario, version])
  const periodos = useMemo(() => periodosDisponibles(usuario), [usuario, version])

  const pestanas: Pestana[] = [
    { clave: 'ventas', etiqueta: 'Ventas', contador: ventas.length },
    { clave: 'facturar', etiqueta: 'Por registrar', contador: porFacturar.length },
    ...(esGerencia
      ? [{ clave: 'comisiones', etiqueta: 'Comisiones', contador: comisiones.length }]
      : []),
  ]

  const abrirRegistro = (experiencia?: Experiencia) => {
    setExperienciaFija(experiencia)
    setRegistrando(true)
  }

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        antetitulo={esGerencia ? 'Ingresos de la hacienda' : 'Sus ventas'}
        titulo="Ventas y comisiones"
        descripcion="Lo que entra por eventos, restaurante y experiencias, con su estado de cobro y la comisión que genera."
        acciones={
          <Boton variante="primario" icono={<Plus size={15} />} onClick={() => abrirRegistro()}>
            Registrar venta
          </Boton>
        }
      />

      {/* Cifras */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          destacado
          etiqueta="Ventas de septiembre"
          valor={formatearMonedaCompacta(resumen.totalMes)}
          detalle={`${resumen.operacionesMes} operaciones · ${formatearMonedaCompacta(resumen.totalAnio)} en el año`}
          icono={<TrendingUp size={16} />}
        />
        <Indicador
          etiqueta="Por cobrar"
          valor={formatearMonedaCompacta(resumen.porCobrar)}
          detalle={`${resumen.operacionesPorCobrar} operaciones sin cerrar`}
          icono={<Receipt size={16} />}
        />
        <Indicador
          etiqueta="Ticket promedio"
          valor={formatearMonedaCompacta(resumen.ticketPromedio)}
          detalle="por operación en 2026"
          icono={<Banknote size={16} />}
        />
        <Indicador
          etiqueta="Comisiones pendientes"
          valor={formatearMonedaCompacta(resumen.comisionesPendientes)}
          detalle={`${resumen.operacionesConComision} operaciones con comisión`}
          icono={<Coins size={16} />}
        />
      </section>

      {/* Reparto del mes */}
      {categorias.length > 0 ? (
        <Tarjeta>
          <CabeceraTarjeta
            titulo="De dónde viene el ingreso"
            descripcion="Reparto de las ventas de septiembre por categoría."
            icono={<TrendingUp size={16} />}
          />
          <div className="px-5 py-4">
            <div className="mb-3 flex h-2 w-full overflow-hidden rounded-full bg-crema-200">
              {categorias.map((c, i) => (
                <span
                  key={c.categoria}
                  className={
                    ['bg-bosque-700', 'bg-bosque-500', 'bg-laton-400', 'bg-bosque-300', 'bg-crema-300'][i % 5]
                  }
                  style={{ width: `${c.proporcion}%` }}
                />
              ))}
            </div>
            <ul className="grid gap-2 sm:grid-cols-3 xl:grid-cols-5">
              {categorias.map((c, i) => (
                <li key={c.categoria} className="flex items-center gap-2">
                  <span
                    className={clsx(
                      'h-2 w-2 shrink-0 rounded-full',
                      ['bg-bosque-700', 'bg-bosque-500', 'bg-laton-400', 'bg-bosque-300', 'bg-crema-300'][i % 5],
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-xs text-carbon/70">
                      {etiquetaCategoriaVenta[c.categoria]}
                    </span>
                    <span className="block text-[12.5px] text-carbon/45">
                      {formatearMonedaCompacta(c.valor)} · {c.cantidad}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Tarjeta>
      ) : null}

      <Tarjeta>
        <Pestanas pestanas={pestanas} activa={pestana} onCambiar={setPestana} />

        {pestana === 'ventas' ? (
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
                  placeholder="Buscar por concepto, código o cliente…"
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

                <div className="w-36">
                  <Seleccion
                    className="h-9 text-xs"
                    value={filtros.periodo}
                    onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}
                    opciones={[
                      { valor: 'todos', texto: 'Todo el año' },
                      ...periodos.map((p) => ({ valor: p, texto: p })),
                    ]}
                  />
                </div>

                <div className="w-40">
                  <Seleccion
                    className="h-9 text-xs"
                    value={filtros.categoria}
                    onChange={(e) =>
                      setFiltros({ ...filtros, categoria: e.target.value as CategoriaVenta | 'todas' })
                    }
                    opciones={[
                      { valor: 'todas', texto: 'Todas las categorías' },
                      ...CATEGORIAS.map((c) => ({ valor: c, texto: etiquetaCategoriaVenta[c] })),
                    ]}
                  />
                </div>

                <div className="w-40">
                  <Seleccion
                    className="h-9 text-xs"
                    value={filtros.estadoPago}
                    onChange={(e) =>
                      setFiltros({ ...filtros, estadoPago: e.target.value as EstadoPago | 'todos' })
                    }
                    opciones={[
                      { valor: 'todos', texto: 'Todos los estados' },
                      ...ESTADOS_PAGO.map((e) => ({ valor: e, texto: etiquetaEstadoPago[e] })),
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
                  <Etiqueta tono="contorno">
                    {formatearMonedaCompacta(
                      ventas.reduce((s, v) => s + v.monto - v.descuento, 0),
                    )}
                  </Etiqueta>
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

            <TablaVentas ventas={ventas} />
          </>
        ) : null}

        {pestana === 'facturar' ? (
          <>
            <div className="border-b border-crema-200 px-5 py-3">
              <p className="text-xs leading-relaxed text-carbon/55">
                Experiencias cerradas cuyo valor final todavía no está registrado como venta. Es el
                hueco entre lo que se vendió y lo que entró.
              </p>
            </div>

            {porFacturar.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-carbon/50">
                Todo lo cerrado está registrado. No hay diferencias entre el tablero de experiencias y las ventas.
              </p>
            ) : (
              <ul className="divide-y divide-crema-200">
                {porFacturar.map(({ experiencia, registrado }) => {
                  const pendiente = (experiencia.valorFinal ?? 0) - registrado
                  return (
                    <li
                      key={experiencia.id}
                      className="flex flex-wrap items-center gap-4 px-5 py-4 transition-colors hover:bg-crema-50/60"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                        <FileWarning size={16} strokeWidth={1.7} />
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-bosque-800">
                          {experiencia.titulo}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[12.5px] text-carbon/50">
                          <span>{clientesRepo.nombreDe(experiencia.clienteId)}</span>
                          <span>{experiencia.codigo}</span>
                          {experiencia.fechaTentativa ? (
                            <span>{formatearFechaCorta(experiencia.fechaTentativa)}</span>
                          ) : null}
                        </p>
                      </div>

                      <div className="w-32 shrink-0 text-right">
                        <p className="font-display text-base text-bosque-800">
                          {formatearMoneda(pendiente)}
                        </p>
                        <p className="text-[11.5px] text-carbon/40">
                          {registrado > 0
                            ? `${formatearMonedaCompacta(registrado)} ya registrados`
                            : 'nada registrado'}
                        </p>
                      </div>

                      <Boton
                        variante="secundario"
                        tamano="sm"
                        onClick={() => abrirRegistro(experiencia)}
                      >
                        Registrar venta
                      </Boton>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        ) : null}

        {pestana === 'comisiones' && esGerencia ? (
          <PanelComisiones comisiones={comisiones} />
        ) : null}
      </Tarjeta>

      {/* Cartera vencida */}
      {resumen.vencidas > 0 ? (
        <Tarjeta className="border-amber-200/80">
          <CabeceraTarjeta
            titulo="Cartera vencida"
            descripcion="Operaciones cuyo pago pasó de la fecha acordada."
            icono={<AlertTriangle size={16} />}
            acciones={
              <Etiqueta tono="alerta">{formatearMonedaCompacta(resumen.valorVencido)}</Etiqueta>
            }
          />
          <TablaVentas
            ventas={filtrarVentas(usuario, { ...FILTROS_INICIALES, estadoPago: 'vencido' })}
          />
        </Tarjeta>
      ) : null}

      <FormularioVenta
        abierto={registrando}
        onCerrar={() => {
          setRegistrando(false)
          setExperienciaFija(undefined)
        }}
        experienciaFija={experienciaFija}
      />
    </div>
  )
}
