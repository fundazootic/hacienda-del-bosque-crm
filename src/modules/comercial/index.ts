/**
 * API pública del módulo Gestión Comercial.
 * Expone el proceso de solicitud de reasignación para que otros módulos
 * (por ejemplo Clientes) puedan iniciarlo sin conocer su implementación.
 */
export { PanelSolicitud } from './components/PanelSolicitud'
export { tipoDeComercial, ETIQUETA_TIPO } from './services/comercialService'
