/**
 * Normalización de claves de identidad del cliente.
 * Es la base de la regla antiduplicados: dos clientes no pueden compartir
 * teléfono ni correo, sin importar cómo se hayan digitado.
 */

/** Deja solo dígitos y conserva los últimos 10 (formato nacional colombiano). */
export function normalizarTelefono(telefono: string): string {
  const digitos = telefono.replace(/\D/g, '')
  return digitos.length > 10 ? digitos.slice(-10) : digitos
}

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}
