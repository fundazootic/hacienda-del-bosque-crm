import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Activity, CalendarPlus, FolderOpen, PhoneCall, Repeat2 } from 'lucide-react'
import { useSesion } from '@/core/auth/SesionContext'
import { useDatos } from '@/core/data/store'
import { clientesRepo } from '@/core/data/repositories'
import { formatearMonedaCompacta, formatearNumero } from '@/core/utils/format'
import { formatearFechaCorta } from '@/core/utils/fecha'
import { Boton, CabeceraTarjeta, Pestanas, Tarjeta, type Pestana } from '@/ui'
import { CintaIndicadores, FichaEncabezado } from '../components/FichaEncabezado'
import {
  ComercialResponsable,
  InformacionPersonal,
  MomentosEspeciales,
  PreferenciasMesa,
} from '../components/PanelesFicha'
import { ListaVentas } from '../components/ListasExpediente'
import { HistorialSeguimientos } from '@/modules/seguimientos'
import { ListaExperiencias } from '@/modules/experiencias'
import { LineaActividad } from '../components/LineaActividad'
import { FormularioCliente } from '../components/FormularioCliente'
import { FormularioExperiencia } from '@/modules/experiencias'
import { FormularioSeguimiento } from '@/modules/seguimientos'
import { PanelSolicitud } from '@/modules/comercial'
import { comercialRepo, equipoRepo } from '@/core/data/repositories'
import { diasSinVisitar, expediente } from '../services/clientesService'

export default function ClienteDetallePage() {
  // La versión entra en las dependencias para reflejar ediciones y reasignaciones.
  const version = useDatos()
  const { id = '' } = useParams()
  const { usuario, alcance } = useSesion()

  const [pestana, setPestana] = useState('experiencias')
  const [editando, setEditando] = useState(false)
  const [solicitando, setSolicitando] = useState(false)
  const [nuevaExperiencia, setNuevaExperiencia] = useState(false)
  const [nuevaGestion, setNuevaGestion] = useState(false)

  const cliente = clientesRepo.obtener(id)
  const datos = useMemo(() => (cliente ? expediente(cliente.id) : null), [cliente, id, version])

  if (!cliente) {
    return (
      <Tarjeta className="mx-auto max-w-lg">
        <div className="px-8 py-12 text-center">
          <h1 className="font-display text-2xl text-bosque-800">Cliente no encontrado</h1>
          <p className="mt-2 text-sm text-carbon/55">
            El registro no existe o fue retirado de la cartera.
          </p>
          <Link
            to="/clientes"
            className="mt-4 inline-block text-sm text-bosque-600 underline-offset-4 hover:underline"
          >
            Volver al directorio
          </Link>
        </div>
      </Tarjeta>
    )
  }

  // Un comercial solo abre las fichas de su propia cartera.
  if (alcance === 'propios' && cliente.comercialId !== usuario.id) {
    const responsable = equipoRepo.obtener(cliente.comercialId)
    const yaSolicitado = comercialRepo.tieneSolicitudAbierta(cliente.id, usuario.id)

    return (
      <>
        <Tarjeta className="mx-auto max-w-lg">
          <div className="px-8 py-12 text-center">
            <h1 className="font-display text-2xl text-bosque-800">Ficha restringida</h1>
            <p className="mt-2 text-sm text-carbon/55">
              Esta cuenta es de{' '}
              <span className="text-bosque-700">{responsable?.nombre ?? 'otro comercial'}</span>.
              Puede solicitar el traslado, pero la decisión es de Gerencia.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <Link
                to="/clientes"
                className="text-sm text-bosque-600 underline-offset-4 hover:underline"
              >
                Volver al directorio
              </Link>
              {yaSolicitado ? (
                <span className="rounded-full border border-crema-300 px-3 py-1 text-xs text-carbon/55">
                  Solicitud pendiente de Gerencia
                </span>
              ) : (
                <Boton
                  variante="primario"
                  tamano="sm"
                  icono={<Repeat2 size={14} />}
                  onClick={() => setSolicitando(true)}
                >
                  Solicitar reasignación
                </Boton>
              )}
            </div>
          </div>
        </Tarjeta>

        <PanelSolicitud
          abierto={solicitando}
          onCerrar={() => setSolicitando(false)}
          cliente={cliente}
          origen="ficha_restringida"
        />
      </>
    )
  }

  const exp = datos!
  const dias = diasSinVisitar(cliente)

  const pestanas: Pestana[] = [
    { clave: 'experiencias', etiqueta: 'Experiencias', contador: exp.experiencias.length },
    { clave: 'seguimientos', etiqueta: 'Seguimientos', contador: exp.seguimientos.length },
    { clave: 'ventas', etiqueta: 'Ventas', contador: exp.ventas.length },
  ]

  return (
    <div className="space-y-6">
      <FichaEncabezado cliente={cliente} onEditar={() => setEditando(true)} />

      <CintaIndicadores
        items={[
          {
            etiqueta: 'Valor histórico',
            valor:
              cliente.valorHistorico > 0
                ? formatearMonedaCompacta(cliente.valorHistorico)
                : '—',
            detalle: `${formatearMonedaCompacta(exp.totalVentas)} registrado en el sistema`,
          },
          {
            etiqueta: 'Experiencias',
            valor: formatearNumero(cliente.numeroEventos),
            detalle: `${exp.experiencias.length} en el sistema · ${exp.experienciasRealizadas.length} realizadas`,
          },
          {
            etiqueta: 'En proceso',
            valor: formatearNumero(exp.experienciasAbiertas.length),
            detalle:
              exp.valorEnCurso > 0
                ? `${formatearMonedaCompacta(exp.valorEnCurso)} en juego`
                : 'sin negociaciones abiertas',
          },
          {
            etiqueta: 'Última visita',
            valor: cliente.ultimaVisita ? formatearFechaCorta(cliente.ultimaVisita) : '—',
            detalle: dias !== null ? `hace ${dias} días` : 'sin visitas registradas',
          },
        ]}
      />

      <div className="grid items-start gap-6 xl:grid-cols-5">
        {/* Columna izquierda: quién es el cliente */}
        <div className="space-y-6 xl:col-span-2">
          <InformacionPersonal cliente={cliente} />
          <ComercialResponsable cliente={cliente} />
          <PreferenciasMesa cliente={cliente} />
          <MomentosEspeciales cliente={cliente} fechas={exp.fechasEspeciales} />
        </div>

        {/* Columna derecha: qué ha pasado con el cliente */}
        <div className="space-y-6 xl:col-span-3">
          <Tarjeta>
            <CabeceraTarjeta
              titulo="Expediente comercial"
              descripcion="Experiencias, gestiones y ventas de este cliente."
              icono={<FolderOpen size={16} />}
              acciones={
                <div className="flex gap-2">
                  <Boton
                    variante="secundario"
                    tamano="sm"
                    icono={<PhoneCall size={14} />}
                    onClick={() => setNuevaGestion(true)}
                  >
                    Registrar gestión
                  </Boton>
                  <Boton
                    variante="secundario"
                    tamano="sm"
                    icono={<CalendarPlus size={14} />}
                    onClick={() => setNuevaExperiencia(true)}
                  >
                    Nueva experiencia
                  </Boton>
                </div>
              }
            />
            <Pestanas pestanas={pestanas} activa={pestana} onCambiar={setPestana} />

            {pestana === 'experiencias' ? (
              <ListaExperiencias
                experiencias={exp.experiencias}
                mostrarCliente={false}
                vacio="Este cliente aún no tiene experiencias registradas."
              />
            ) : null}
            {pestana === 'seguimientos' ? (
              <HistorialSeguimientos seguimientos={exp.seguimientos} mostrarCliente={false} />
            ) : null}
            {pestana === 'ventas' ? (
              <ListaVentas items={exp.ventas} total={exp.totalVentas} />
            ) : null}
          </Tarjeta>

          <Tarjeta>
            <CabeceraTarjeta
              titulo="Actividad reciente"
              descripcion="Todo lo ocurrido con el cliente, del hecho más reciente al primero."
              icono={<Activity size={16} />}
            />
            <LineaActividad actividades={exp.actividad} />
          </Tarjeta>
        </div>
      </div>

      <FormularioCliente
        abierto={editando}
        onCerrar={() => setEditando(false)}
        cliente={cliente}
      />

      <FormularioExperiencia
        abierto={nuevaExperiencia}
        onCerrar={() => setNuevaExperiencia(false)}
        clienteFijo={cliente.id}
      />

      <FormularioSeguimiento
        abierto={nuevaGestion}
        onCerrar={() => setNuevaGestion(false)}
        clienteFijo={cliente.id}
      />
    </div>
  )
}
