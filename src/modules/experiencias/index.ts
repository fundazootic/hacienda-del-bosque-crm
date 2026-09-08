/**
 * API pública del módulo Experiencias.
 * Otros módulos (Clientes, Dashboard) reutilizan la lista y el formulario sin
 * conocer la implementación del tablero.
 */
export { ListaExperiencias } from './components/ListaExperiencias'
export { FormularioExperiencia } from './components/FormularioExperiencia'
export { TONO_ESTADO, valorDe } from './services/experienciasService'
