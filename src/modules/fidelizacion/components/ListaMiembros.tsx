import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { ArrowUp, Gift } from 'lucide-react'
import { fidelizacionRepo } from '@/core/data/repositories'
import { useSesion } from '@/core/auth/SesionContext'
import { formatearMonedaCompacta, formatearNumero } from '@/core/utils/format'
import { BarraProgreso, Boton, EstadoVacio } from '@/ui'
import { COLOR_NIVEL, nombreNivel, type MiembroPrograma } from '../services/fidelizacionService'

/**
 * Clientes del programa.
 * Cada fila responde tres preguntas: en qué nivel está, cuántos puntos tiene y
 * qué le falta para subir.
 */
export function ListaMiembros({
  miembros,
  onEntregar,
}: {
  miembros: MiembroPrograma[]
  onEntregar: (m: MiembroPrograma) => void
}) {
  const { usuario, esGerencia } = useSesion()

  if (miembros.length === 0) {
    return (
      <EstadoVacio
        titulo="Todavía no hay clientes en el programa"
        mensaje="Los clientes entran al programa con su primera visita registrada."
      />
    )
  }

  return (
    <ul className="divide-y divide-crema-200">
      {miembros.map((m) => {
        const color = COLOR_NIVEL[m.nivelActual]

        return (
          <li key={m.membresia.id} className="px-5 py-4 transition-colors hover:bg-crema-50/60">
            <div className="flex flex-wrap items-center gap-4">
              {/* Nivel */}
              <span
                className={clsx(
                  'flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl',
                  color.fondo,
                  color.texto,
                )}
              >
                <span className="font-display text-sm leading-none">
                  {nombreNivel(m.nivelActual)}
                </span>
                <span className="mt-0.5 text-[11.5px] uppercase tracking-wider opacity-60">nivel</span>
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/clientes/${m.membresia.clienteId}`}
                    className="truncate font-display text-lg leading-tight text-bosque-800 underline-offset-4 hover:underline"
                  >
                    {m.nombre}
                  </Link>
                  {m.listoParaSubir ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      <ArrowUp size={12} />
                      Ya puede subir a {nombreNivel(m.nivelQueLeCorresponde)}
                    </span>
                  ) : null}
                </p>

                <p className="mt-0.5 text-xs text-carbon/55">
                  {m.membresia.visitasAno}{' '}
                  {m.membresia.visitasAno === 1 ? 'visita este año' : 'visitas este año'} ·{' '}
                  {formatearMonedaCompacta(m.membresia.ingresoAcumulado)} gastados en total
                </p>

                {m.siguiente ? (
                  <div className="mt-2 flex items-center gap-3">
                    <BarraProgreso
                      porcentaje={m.avance}
                      tono={m.listoParaSubir ? 'laton' : 'bosque'}
                      className="max-w-xs flex-1"
                    />
                    <span className="text-xs text-carbon/50">{m.falta}</span>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-laton-600">
                    Está en el nivel más alto del programa.
                  </p>
                )}
              </div>

              {/* Puntos */}
              <div className="w-28 shrink-0 text-right">
                <p className="font-display text-2xl leading-none text-bosque-800">
                  {formatearNumero(m.membresia.puntos)}
                </p>
                <p className="text-xs text-carbon/45">puntos por usar</p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {m.listoParaSubir && esGerencia ? (
                  <Boton
                    variante="secundario"
                    tamano="sm"
                    icono={<ArrowUp size={14} />}
                    onClick={() =>
                      fidelizacionRepo.actualizarNivel(m.membresia.clienteId, usuario)
                    }
                  >
                    Subir de nivel
                  </Boton>
                ) : null}
                <Boton
                  variante="primario"
                  tamano="sm"
                  icono={<Gift size={14} />}
                  onClick={() => onEntregar(m)}
                >
                  Dar un beneficio
                </Boton>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
