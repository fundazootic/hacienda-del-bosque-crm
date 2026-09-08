import { useMemo, useState } from 'react'
import { Briefcase, ClipboardList, History, Users2 } from 'lucide-react'
import { useSesion } from '@/core/auth/SesionContext'
import { useDatos } from '@/core/data/store'
import { auditoriaRepo, comercialRepo, equipoRepo } from '@/core/data/repositories'
import { etiquetaCategoria } from '@/core/utils/etiquetas'
import { formatearMonedaCompacta, formatearNumero } from '@/core/utils/format'
import { formatearFechaCorta } from '@/core/utils/fecha'
import {
  CabeceraTarjeta,
  EncabezadoPagina,
  Etiqueta,
  Indicador,
  IndicadorCompacto,
  Pestanas,
  Tarjeta,
  type Pestana,
} from '@/ui'
import { TONO_CATEGORIA } from '@/modules/clientes'
import { CarteraComercial } from '../components/CarteraComercial'
import { MisClientes } from '../components/MisClientes'
import { BandejaSolicitudes } from '../components/BandejaSolicitudes'
import { BitacoraAuditoria } from '../components/BitacoraAuditoria'
import {
  carteraPorComercial,
  ETIQUETA_ORIGEN_ASIGNACION,
  miCartera,
  movimientosDePropiedad,
} from '../services/comercialService'

export default function ComercialPage() {
  const version = useDatos()
  const { usuario, esGerencia } = useSesion()

  const carteras = useMemo(() => (esGerencia ? carteraPorComercial() : []), [esGerencia, version])
  const mia = useMemo(() => (esGerencia ? null : miCartera(usuario)), [usuario, esGerencia, version])
  const solicitudes = useMemo(() => comercialRepo.solicitudes(), [version])
  const auditoria = useMemo(() => auditoriaRepo.listar(), [version])
  const movimientos = useMemo(() => movimientosDePropiedad(6), [version])

  const pendientes = solicitudes.filter((s) => s.estado === 'pendiente')
  const misSolicitudes = useMemo(
    () =>
      solicitudes.filter(
        (s) => s.solicitanteId === usuario.id || s.propietarioActualId === usuario.id,
      ),
    [solicitudes, usuario.id],
  )

  const [pestana, setPestana] = useState(esGerencia ? 'cartera' : 'mis_clientes')

  const pestanas: Pestana[] = esGerencia
    ? [
        { clave: 'cartera', etiqueta: 'Cartera comercial', contador: carteras.length },
        { clave: 'solicitudes', etiqueta: 'Solicitudes', contador: pendientes.length },
        { clave: 'auditoria', etiqueta: 'Auditoría', contador: auditoria.length },
      ]
    : [
        { clave: 'mis_clientes', etiqueta: 'Mis clientes', contador: mia?.total ?? 0 },
        { clave: 'solicitudes', etiqueta: 'Mis solicitudes', contador: misSolicitudes.length },
      ]

  /*
   * Al cambiar de perfil, la pestaña abierta puede no existir para el nuevo rol
   * (la auditoría es solo de Gerencia). En ese caso se vuelve a la primera.
   */
  const activa = pestanas.some((p) => p.clave === pestana) ? pestana : pestanas[0].clave

  // Cifras superiores, distintas según quién mira
  const totalClientes = esGerencia
    ? carteras.reduce((s, c) => s + c.clientes.length, 0)
    : (mia?.total ?? 0)
  const valorTotal = esGerencia
    ? carteras.reduce((s, c) => s + c.valorCartera, 0)
    : (mia?.valorCartera ?? 0)

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        antetitulo={esGerencia ? 'Gestión comercial' : 'Su gestión comercial'}
        titulo={esGerencia ? 'Cartera y propiedad de cuentas' : 'Mi cartera'}
        descripcion={
          esGerencia
            ? 'Cada cliente tiene un comercial responsable. Aquí se compara la cartera de cada asesor, se resuelven las solicitudes de traslado y queda el registro de todo lo ocurrido.'
            : 'Sus clientes asignados, desde cuándo son suyos y el estado de las solicitudes de traslado que ha pedido.'
        }
      />

      {/* Cifras de encabezado */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          etiqueta={esGerencia ? 'Clientes con responsable' : 'Clientes asignados'}
          valor={formatearNumero(totalClientes)}
          detalle={
            esGerencia
              ? `${carteras.length} comerciales activos`
              : `${mia?.registrados ?? 0} registrados por usted`
          }
          icono={<Users2 size={16} />}
        />
        <Indicador
          etiqueta="Valor de la cartera"
          valor={formatearMonedaCompacta(valorTotal)}
          detalle="histórico acumulado"
          icono={<Briefcase size={16} />}
        />
        <Indicador
          etiqueta="Negocios abiertos"
          valor={formatearNumero(
            esGerencia
              ? carteras.reduce((s, c) => s + c.oportunidadesActivas, 0)
              : (mia?.oportunidadesActivas ?? 0),
          )}
          detalle={formatearMonedaCompacta(
            esGerencia
              ? carteras.reduce((s, c) => s + c.valorEnCurso, 0)
              : (mia?.valorEnCurso ?? 0),
          )}
          icono={<ClipboardList size={16} />}
        />
        <Indicador
          destacado={pendientes.length > 0 && esGerencia}
          etiqueta="Solicitudes pendientes"
          valor={formatearNumero(
            esGerencia ? pendientes.length : misSolicitudes.filter((s) => s.estado === 'pendiente').length,
          )}
          detalle={esGerencia ? 'esperan su decisión' : 'en manos de Gerencia'}
          icono={<History size={16} />}
        />
      </section>

      {/* Composición de la cartera propia */}
      {!esGerencia && mia ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <IndicadorCompacto
            etiqueta="Registrados por usted"
            valor={formatearNumero(mia.registrados)}
            detalle="alta propia"
            tono="neutro"
          />
          <IndicadorCompacto
            etiqueta="Recibidos por traslado"
            valor={formatearNumero(mia.recibidos)}
            detalle="reasignados por Gerencia"
            tono="laton"
          />
          <IndicadorCompacto
            etiqueta="Ventas del año"
            valor={formatearMonedaCompacta(mia.ventasAnio)}
            detalle="2026"
            tono="neutro"
          />
        </section>
      ) : null}

      <Tarjeta>
        <Pestanas pestanas={pestanas} activa={activa} onCambiar={setPestana} />

        {activa === 'cartera' && esGerencia ? <CarteraComercial carteras={carteras} /> : null}

        {activa === 'mis_clientes' && mia ? (
          <>
            <div className="flex flex-wrap gap-1.5 border-b border-crema-200 px-5 py-3">
              {(Object.keys(mia.porCategoria) as (keyof typeof mia.porCategoria)[])
                .filter((cat) => mia.porCategoria[cat] > 0)
                .map((cat) => (
                  <Etiqueta key={cat} tono={TONO_CATEGORIA[cat]}>
                    {etiquetaCategoria[cat]} · {mia.porCategoria[cat]}
                  </Etiqueta>
                ))}
            </div>
            <MisClientes clientes={mia.clientes} usuarioId={usuario.id} />
          </>
        ) : null}

        {activa === 'solicitudes' ? (
          <BandejaSolicitudes
            solicitudes={esGerencia ? solicitudes : misSolicitudes}
            vacio={
              esGerencia
                ? 'Ningún comercial ha pedido el traslado de una cuenta.'
                : 'No ha solicitado ninguna cuenta ni le han pedido las suyas.'
            }
          />
        ) : null}

        {activa === 'auditoria' && esGerencia ? (
          <BitacoraAuditoria registros={auditoria} />
        ) : null}
      </Tarjeta>

      {/* Movimientos de propiedad: el historial nunca se borra */}
      {esGerencia ? (
        <Tarjeta>
          <CabeceraTarjeta
            titulo="Últimos movimientos de propiedad"
            descripcion="Cada cambio de responsable agrega una línea; ninguna se modifica ni se elimina."
            icono={<History size={16} />}
          />
          <ul className="divide-y divide-crema-200">
            {movimientos.map((m) => (
              <li key={m.id} className="flex items-center gap-4 px-5 py-3">
                <span className="w-24 shrink-0 text-[12.5px] uppercase tracking-wider text-carbon/40">
                  {formatearFechaCorta(m.fecha)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-bosque-800">
                    {equipoRepo.obtener(m.comercialAnteriorId ?? '')?.nombre ?? 'Sin responsable'}{' '}
                    → {equipoRepo.obtener(m.comercialNuevoId)?.nombre}
                  </p>
                  <p className="truncate text-[12.5px] italic text-carbon/50">{m.motivo}</p>
                </div>
                <Etiqueta tono={m.origen === 'solicitud_aprobada' ? 'exito' : 'neutro'}>
                  {ETIQUETA_ORIGEN_ASIGNACION[m.origen]}
                </Etiqueta>
              </li>
            ))}
          </ul>
        </Tarjeta>
      ) : null}
    </div>
  )
}
