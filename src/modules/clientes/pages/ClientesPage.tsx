import { useMemo, useState } from 'react'
import { Download, ShieldCheck, UserPlus, Users } from 'lucide-react'
import { useSesion } from '@/core/auth/SesionContext'
import { useDatos } from '@/core/data/store'
import { clientesRepo } from '@/core/data/repositories'
import { formatearMonedaCompacta, formatearNumero } from '@/core/utils/format'
import { Boton, CabeceraTarjeta, EncabezadoPagina, Etiqueta, Tarjeta } from '@/ui'
import { FiltrosClientes } from '../components/FiltrosClientes'
import { ListaClientes } from '../components/ListaClientes'
import { FormularioCliente } from '../components/FormularioCliente'
import {
  filtrarClientes,
  FILTROS_INICIALES,
  hayFiltrosActivos,
  type FiltrosClientes as Filtros,
  type OrdenClientes,
} from '../services/clientesService'

export default function ClientesPage() {
  // La versión de los datos entra en las dependencias: al crear o editar,
  // la lista se recalcula además de repintarse.
  const version = useDatos()
  const { usuario, esGerencia } = useSesion()

  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIALES)
  const [orden, setOrden] = useState<OrdenClientes>('recientes')
  const [creando, setCreando] = useState(false)

  const universo = useMemo(() => clientesRepo.listarVisibles(usuario), [usuario, version])
  const resultados = useMemo(
    () => filtrarClientes(usuario, filtros, orden),
    [usuario, filtros, orden, version],
  )

  const valorCartera = universo.reduce((s, c) => s + c.valorHistorico, 0)
  const intentos = clientesRepo.intentos().length

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        antetitulo={esGerencia ? 'Cartera de la hacienda' : 'Su cartera'}
        titulo="Clientes"
        descripcion="Un cliente, un comercial responsable. El sistema impide duplicados por teléfono o correo y deja registro de cada intento."
        acciones={
          <>
            <Boton variante="secundario" icono={<Download size={15} />}>
              Exportar
            </Boton>
            <Boton variante="primario" icono={<UserPlus size={15} />} onClick={() => setCreando(true)}>
              Nuevo cliente
            </Boton>
          </>
        }
      />

      {/* Resumen de la cartera */}
      <div className="grid grid-cols-2 divide-x divide-y divide-crema-200 overflow-hidden rounded-xl border border-crema-300/70 bg-white shadow-suave sm:grid-cols-4 sm:divide-y-0">
        <div className="px-5 py-4">
          <p className="text-[11.5px] uppercase tracking-marca text-bosque-400">Clientes en cartera</p>
          <p className="mt-1.5 font-display text-2xl leading-none text-bosque-800">
            {formatearNumero(universo.length)}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-[11.5px] uppercase tracking-marca text-bosque-400">Valor histórico</p>
          <p className="mt-1.5 font-display text-2xl leading-none text-bosque-800">
            {formatearMonedaCompacta(valorCartera)}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-[11.5px] uppercase tracking-marca text-bosque-400">
            Autorizan comunicaciones
          </p>
          <p className="mt-1.5 font-display text-2xl leading-none text-bosque-800">
            {formatearNumero(universo.filter((c) => c.autorizaComunicaciones).length)}
            <span className="ml-1 text-sm text-carbon/35">de {universo.length}</span>
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-[11.5px] uppercase tracking-marca text-bosque-400">
            Duplicados evitados
          </p>
          <p className="mt-1.5 flex items-baseline gap-2 font-display text-2xl leading-none text-bosque-800">
            {formatearNumero(intentos)}
            <ShieldCheck size={15} className="text-bosque-400" />
          </p>
        </div>
      </div>

      <FiltrosClientes
        filtros={filtros}
        onCambiar={setFiltros}
        onLimpiar={() => setFiltros(FILTROS_INICIALES)}
        orden={orden}
        onOrdenar={setOrden}
        universo={universo}
      />

      <Tarjeta>
        <CabeceraTarjeta
          titulo={hayFiltrosActivos(filtros) ? 'Resultados' : 'Directorio de clientes'}
          descripcion={
            hayFiltrosActivos(filtros)
              ? `${resultados.length} de ${universo.length} clientes coinciden con la búsqueda`
              : 'Seleccione un cliente para abrir su ficha completa'
          }
          icono={<Users size={16} />}
          acciones={<Etiqueta tono="contorno">{resultados.length}</Etiqueta>}
        />
        <ListaClientes clientes={resultados} />
      </Tarjeta>

      <FormularioCliente abierto={creando} onCerrar={() => setCreando(false)} />
    </div>
  )
}
