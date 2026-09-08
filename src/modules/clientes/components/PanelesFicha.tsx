import { useState } from 'react'
import { Cake, Gift, Heart, Repeat2, ShieldAlert, Sparkles, UserCog } from 'lucide-react'
import type { Cliente, FechaEspecial } from '@/core/types'
import { clientesRepo, equipoRepo } from '@/core/data/repositories'
import { useSesion } from '@/core/auth/SesionContext'
import { etiquetaOrigen, etiquetaRol } from '@/core/utils/etiquetas'
import { formatearFecha, formatearFechaCorta } from '@/core/utils/fecha'
import { Avatar, Boton, CabeceraTarjeta, Etiqueta, Seleccion, Tarjeta, Entrada } from '@/ui'
import { diasSinVisitar, HOY } from '../services/clientesService'

/** Par etiqueta/valor de la ficha. */
function Dato({ etiqueta, valor }: { etiqueta: string; valor?: string | null }) {
  return (
    <div>
      <dt className="text-[11.5px] uppercase tracking-wider text-bosque-400">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm text-carbon/80">{valor || '—'}</dd>
    </div>
  )
}

export function InformacionPersonal({ cliente }: { cliente: Cliente }) {
  const dias = diasSinVisitar(cliente)

  return (
    <Tarjeta>
      <CabeceraTarjeta titulo="Información personal" icono={<UserCog size={16} />} />
      <dl className="grid gap-4 px-5 py-4 sm:grid-cols-2">
        <Dato etiqueta="Nombres" valor={cliente.nombres} />
        <Dato etiqueta="Apellidos" valor={cliente.apellidos} />
        <Dato etiqueta="Teléfono" valor={cliente.telefono} />
        <Dato etiqueta="Correo" valor={cliente.email} />
        <Dato
          etiqueta="Fecha de nacimiento"
          valor={cliente.fechaNacimiento ? formatearFecha(cliente.fechaNacimiento) : null}
        />
        <Dato etiqueta="Ciudad" valor={cliente.ciudad} />
        <Dato etiqueta="Empresa" valor={cliente.empresa} />
        <Dato etiqueta="Cargo" valor={cliente.cargo} />
        <Dato etiqueta="Origen" valor={etiquetaOrigen[cliente.origen]} />
        <Dato etiqueta="Fecha de registro" valor={formatearFecha(cliente.fechaRegistro)} />
        <Dato etiqueta="Dirección" valor={cliente.direccion} />
        <Dato
          etiqueta="Última visita"
          valor={
            cliente.ultimaVisita
              ? `${formatearFechaCorta(cliente.ultimaVisita)}${dias !== null ? ` · hace ${dias} días` : ''}`
              : 'Sin visitas registradas'
          }
        />
      </dl>
    </Tarjeta>
  )
}

export function PreferenciasMesa({ cliente }: { cliente: Cliente }) {
  return (
    <Tarjeta>
      <CabeceraTarjeta
        titulo="En la mesa"
        descripcion="Lo que hace que el cliente se sienta reconocido."
        icono={<Sparkles size={16} />}
      />
      <div className="space-y-4 px-5 py-4">
        <div>
          <p className="eyebrow mb-2">Preferencias</p>
          {cliente.preferencias.length ? (
            <ul className="flex flex-wrap gap-1.5">
              {cliente.preferencias.map((p) => (
                <li
                  key={p}
                  className="rounded-full border border-bosque-100 bg-bosque-50 px-2.5 py-1 text-[12.5px] text-bosque-700"
                >
                  {p}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-carbon/40">Sin preferencias registradas.</p>
          )}
        </div>

        <div>
          <p className="eyebrow mb-2">Restricciones y alergias</p>
          {cliente.restricciones.length ? (
            <ul className="flex flex-wrap gap-1.5">
              {cliente.restricciones.map((r) => (
                <li
                  key={r}
                  className="flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 text-[12.5px] text-terracota"
                >
                  <ShieldAlert size={11} />
                  {r}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-carbon/40">Ninguna registrada.</p>
          )}
        </div>

        {cliente.observaciones ? (
          <div>
            <p className="eyebrow mb-2">Observaciones</p>
            <p className="border-l-2 border-laton-300 pl-3 text-sm italic leading-relaxed text-carbon/70">
              {cliente.observaciones}
            </p>
          </div>
        ) : null}
      </div>
    </Tarjeta>
  )
}

/** Próxima ocurrencia de una fecha anual, con los días que faltan. */
function proxima(mmdd: string) {
  const anio = Number(HOY.slice(0, 4))
  const candidato = `${anio}-${mmdd}`
  const fecha = candidato >= HOY ? candidato : `${anio + 1}-${mmdd}`
  const dias = Math.round(
    (new Date(fecha + 'T00:00:00').getTime() - new Date(HOY + 'T00:00:00').getTime()) / 86400000,
  )
  return { fecha, dias }
}

export function MomentosEspeciales({
  cliente,
  fechas,
}: {
  cliente: Cliente
  fechas: FechaEspecial[]
}) {
  const momentos: { id: string; icono: typeof Cake; titulo: string; mmdd: string; anio?: string }[] = []

  if (cliente.fechaNacimiento) {
    momentos.push({
      id: 'nac',
      icono: Cake,
      titulo: 'Cumpleaños',
      mmdd: cliente.fechaNacimiento.slice(5),
      anio: cliente.fechaNacimiento.slice(0, 4),
    })
  }
  if (cliente.aniversario) {
    momentos.push({
      id: 'ani',
      icono: Heart,
      titulo: 'Aniversario',
      mmdd: cliente.aniversario.slice(5),
      anio: cliente.aniversario.slice(0, 4),
    })
  }
  for (const f of fechas.filter((f) => f.tipo === 'fecha_corporativa' || f.tipo === 'otra')) {
    momentos.push({ id: f.id, icono: Gift, titulo: f.descripcion, mmdd: f.fecha })
  }

  return (
    <Tarjeta>
      <CabeceraTarjeta
        titulo="Momentos especiales"
        descripcion="Las fechas que la hacienda no debería dejar pasar."
        icono={<Gift size={16} />}
      />
      {momentos.length === 0 ? (
        <p className="px-5 py-6 text-center text-xs text-carbon/45">
          Sin fechas registradas. Agregue la fecha de nacimiento para activar el saludo de
          cumpleaños.
        </p>
      ) : (
        <ul className="divide-y divide-crema-200">
          {momentos
            .map((m) => ({ ...m, ...proxima(m.mmdd) }))
            .sort((a, b) => a.dias - b.dias)
            .map((m) => {
              const Icono = m.icono
              return (
                <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-laton-100 text-laton-700">
                    <Icono size={15} strokeWidth={1.7} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-bosque-800">{m.titulo}</p>
                    <p className="text-[12.5px] text-carbon/50">
                      {formatearFecha(m.fecha, "d 'de' MMMM")}
                      {m.anio ? ` · desde ${m.anio}` : ''}
                    </p>
                  </div>
                  <Etiqueta tono={m.dias <= 15 ? 'laton' : 'neutro'}>
                    {m.dias === 0 ? 'hoy' : `en ${m.dias} días`}
                  </Etiqueta>
                </li>
              )
            })}
        </ul>
      )}
    </Tarjeta>
  )
}

/**
 * Comercial responsable y trazabilidad de la propiedad.
 * La reasignación es exclusiva de Gerencia y siempre deja registro.
 */
export function ComercialResponsable({ cliente }: { cliente: Cliente }) {
  const { usuario, esGerencia } = useSesion()
  const [reasignando, setReasignando] = useState(false)
  const [nuevoId, setNuevoId] = useState(cliente.comercialId)
  const [motivo, setMotivo] = useState('')

  const responsable = equipoRepo.obtener(cliente.comercialId)
  const historial = clientesRepo.historialDeCliente(cliente.id)

  const confirmar = () => {
    if (nuevoId === cliente.comercialId || !motivo.trim()) return
    clientesRepo.reasignar(cliente.id, nuevoId, motivo.trim(), usuario)
    setReasignando(false)
    setMotivo('')
  }

  return (
    <Tarjeta>
      <CabeceraTarjeta
        titulo="Comercial responsable"
        icono={<UserCog size={16} />}
        acciones={
          esGerencia && !reasignando ? (
            <Boton
              variante="secundario"
              tamano="sm"
              icono={<Repeat2 size={14} />}
              onClick={() => setReasignando(true)}
            >
              Reasignar
            </Boton>
          ) : null
        }
      />

      <div className="px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar
            iniciales={responsable?.iniciales ?? '—'}
            tamano="lg"
            tono={responsable?.rol === 'comercial_freelancer' ? 'laton' : 'bosque'}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-bosque-800">
              {responsable?.nombre ?? 'Sin asignar'}
            </p>
            <p className="truncate text-[12.5px] text-carbon/50">
              {responsable ? `${etiquetaRol[responsable.rol]} · ${responsable.cargo}` : ''}
            </p>
            <p className="mt-0.5 text-[12.5px] text-bosque-500">
              Responsable desde {formatearFechaCorta(cliente.fechaAsignacion)}
            </p>
          </div>
        </div>

        {reasignando ? (
          <div className="mt-4 space-y-2.5 rounded-lg border border-crema-300 bg-crema-50 p-3.5">
            <p className="text-[12.5px] leading-relaxed text-carbon/60">
              La reasignación cambia la propiedad comercial del cliente y queda registrada con su
              nombre y el motivo.
            </p>
            <Seleccion
              value={nuevoId}
              onChange={(e) => setNuevoId(e.target.value)}
              opciones={equipoRepo.comerciales().map((u) => ({ valor: u.id, texto: u.nombre }))}
            />
            <Entrada
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Motivo de la reasignación"
            />
            <div className="flex justify-end gap-2">
              <Boton variante="fantasma" tamano="sm" onClick={() => setReasignando(false)}>
                Cancelar
              </Boton>
              <Boton
                variante="primario"
                tamano="sm"
                onClick={confirmar}
                disabled={nuevoId === cliente.comercialId || !motivo.trim()}
              >
                Confirmar
              </Boton>
            </div>
          </div>
        ) : null}

        {historial.length > 0 ? (
          <div className="mt-4 border-t border-crema-200 pt-3">
            <p className="eyebrow mb-2">Historial de propietarios</p>
            <ol className="space-y-2.5">
              {historial.map((h) => (
                <li key={h.id} className="text-[12.5px] leading-relaxed text-carbon/55">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="text-carbon/75">{formatearFechaCorta(h.fecha)}</span>
                    <Etiqueta tono={h.origen === 'registro' ? 'neutro' : 'bosque'}>
                      {h.origen === 'registro'
                        ? 'Registro inicial'
                        : h.origen === 'solicitud_aprobada'
                          ? 'Solicitud aprobada'
                          : 'Reasignación'}
                    </Etiqueta>
                  </span>
                  <span className="mt-0.5 block text-carbon/70">
                    {h.comercialAnteriorId
                      ? `${equipoRepo.obtener(h.comercialAnteriorId)?.nombre} → `
                      : ''}
                    {equipoRepo.obtener(h.comercialNuevoId)?.nombre}
                  </span>
                  <span className="block italic text-carbon/45">{h.motivo}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-[11.5px] leading-relaxed text-carbon/35">
              El historial es permanente: cada traslado agrega una línea y ninguna se elimina.
            </p>
          </div>
        ) : null}
      </div>
    </Tarjeta>
  )
}
