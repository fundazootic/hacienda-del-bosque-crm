import { useMemo, useState } from 'react'
import { ArrowUp, Coins, Gift, HelpCircle, Users2 } from 'lucide-react'
import { useSesion } from '@/core/auth/SesionContext'
import { useDatos } from '@/core/data/store'
import { clientesRepo, fidelizacionRepo, nivelPorClave } from '@/core/data/repositories'
import { formatearNumero } from '@/core/utils/format'
import { CabeceraTarjeta, EncabezadoPagina, Etiqueta, Indicador, Tarjeta } from '@/ui'
import { ComoFunciona } from '../components/ComoFunciona'
import { ListaMiembros } from '../components/ListaMiembros'
import { PanelBeneficio } from '../components/PanelBeneficio'
import { miembros as calcularMiembros, resumenPrograma, type MiembroPrograma } from '../services/fidelizacionService'

export default function FidelizacionPage() {
  const version = useDatos()
  const { alcance, usuario } = useSesion()

  const [elegido, setElegido] = useState<MiembroPrograma | null>(null)

  const todos = useMemo(() => calcularMiembros(), [version])
  const resumen = useMemo(() => resumenPrograma(), [version])
  const movimientos = useMemo(() => fidelizacionRepo.movimientos().slice(0, 8), [version])

  // Un comercial ve solo a los clientes de su cartera
  const visibles = useMemo(() => {
    if (alcance === 'todos') return todos
    const mios = new Set(clientesRepo.listarVisibles(usuario).map((c) => c.id))
    return todos.filter((m) => mios.has(m.membresia.clienteId))
  }, [todos, alcance, usuario])

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        antetitulo="Crecimiento"
        titulo="Fidelización"
        descripcion="El programa con el que la hacienda reconoce a los clientes que más vuelven."
      />

      {/* Cifras, en palabras sencillas */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          etiqueta="Clientes en el programa"
          valor={formatearNumero(visibles.length)}
          detalle="con nivel y puntos acumulados"
          icono={<Users2 size={16} />}
        />
        <Indicador
          etiqueta="Puntos sin usar"
          valor={formatearNumero(visibles.reduce((s, m) => s + m.membresia.puntos, 0))}
          detalle="los clientes pueden pedirlos cuando quieran"
          icono={<Coins size={16} />}
        />
        <Indicador
          destacado={visibles.filter((m) => m.listoParaSubir).length > 0}
          etiqueta="Listos para subir de nivel"
          valor={formatearNumero(visibles.filter((m) => m.listoParaSubir).length)}
          detalle="ya cumplieron los requisitos"
          icono={<ArrowUp size={16} />}
        />
        <Indicador
          etiqueta="Beneficios de la casa"
          valor={formatearNumero(resumen.beneficiosDisponibles)}
          detalle="disponibles para entregar"
          icono={<Gift size={16} />}
        />
      </section>

      {/* Explicación del programa */}
      <Tarjeta>
        <CabeceraTarjeta
          titulo="Cómo funciona el programa"
          descripcion="Los cuatro niveles, con el nombre de los árboles de la hacienda."
          icono={<HelpCircle size={16} />}
        />
        <ComoFunciona porNivel={resumen.porNivel} />
      </Tarjeta>

      {/* Clientes */}
      <Tarjeta>
        <CabeceraTarjeta
          titulo="Clientes del programa"
          descripcion="Del que más puntos tiene al que menos. Toque «Dar un beneficio» para entregarle algo."
          icono={<Users2 size={16} />}
          acciones={<Etiqueta tono="contorno">{visibles.length} clientes</Etiqueta>}
        />
        <ListaMiembros miembros={visibles} onEntregar={setElegido} />
      </Tarjeta>

      {/* Beneficios disponibles */}
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Tarjeta>
          <CabeceraTarjeta
            titulo="Qué puede pedir un cliente"
            descripcion="Beneficios de la casa y cuántos puntos cuesta cada uno."
            icono={<Gift size={16} />}
          />
          <ul className="divide-y divide-crema-200">
            {fidelizacionRepo.beneficios().map((b) => (
              <li key={b.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-bosque-800">{b.nombre}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-carbon/60">{b.descripcion}</p>
                  <p className="mt-1 text-xs text-bosque-500">
                    {b.nivelMinimo === 'semilla'
                      ? 'Para todos los clientes del programa'
                      : `Solo para clientes ${nivelPorClave(b.nivelMinimo).nombre} o superior`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-xl text-bosque-800">
                    {b.costoPuntos === 0 ? 'Gratis' : formatearNumero(b.costoPuntos)}
                  </p>
                  <p className="text-xs text-carbon/45">
                    {b.costoPuntos === 0 ? 'sin costo' : 'puntos'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Tarjeta>

        <Tarjeta>
          <CabeceraTarjeta
            titulo="Últimos movimientos de puntos"
            descripcion="Qué ganaron y qué usaron los clientes."
            icono={<Coins size={16} />}
          />
          <ul className="divide-y divide-crema-200">
            {movimientos.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-bosque-800">
                    {clientesRepo.nombreDe(m.clienteId)}
                  </p>
                  <p className="truncate text-xs text-carbon/55">
                    {m.concepto} · {m.fecha.split('-').reverse().join('/')}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-display text-lg ${
                    m.puntos >= 0 ? 'text-emerald-700' : 'text-terracota'
                  }`}
                >
                  {m.puntos >= 0 ? '+' : ''}
                  {formatearNumero(m.puntos)}
                </span>
              </li>
            ))}
          </ul>
        </Tarjeta>
      </div>

      <PanelBeneficio miembro={elegido} onCerrar={() => setElegido(null)} />
    </div>
  )
}
