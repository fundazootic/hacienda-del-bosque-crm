import { useSyncExternalStore } from 'react'

/**
 * Notificador de cambios de los datos en memoria.
 *
 * El prototipo no tiene backend: cuando un módulo crea o edita un registro,
 * avisa por aquí y las vistas suscritas se vuelven a pintar. Al conectar la API
 * real este archivo se reemplaza por el cliente de datos (React Query o similar)
 * sin tocar los módulos.
 */
const escuchas = new Set<() => void>()
let version = 0

export function notificarCambio() {
  version += 1
  escuchas.forEach((f) => f())
}

function suscribirse(f: () => void) {
  escuchas.add(f)
  return () => {
    escuchas.delete(f)
  }
}

const obtenerVersion = () => version

/** Suscribe un componente a los cambios de datos en memoria. */
export function useDatos() {
  return useSyncExternalStore(suscribirse, obtenerVersion, obtenerVersion)
}
