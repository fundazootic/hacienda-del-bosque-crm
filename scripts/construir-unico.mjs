/**
 * Compila el CRM en un único archivo HTML autocontenido.
 *
 * Sirve para publicarlo donde no hay servidor que valga: un visor de artefactos,
 * un adjunto de correo, una memoria USB. Todo el JavaScript y todo el CSS
 * quedan incrustados; lo único que se pide fuera son las tipografías de Google,
 * y si no cargan el sistema usa las de respaldo.
 *
 * Salida: `publicacion/hacienda-crm.html`
 */
import { build } from 'vite'
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const temporal = path.join(raiz, '.unico')
const destino = path.join(raiz, 'publicacion')

process.env.BUILD_UNICO = '1'

await build({ root: raiz, build: { outDir: temporal, emptyOutDir: true } })

const html = await readFile(path.join(temporal, 'index.html'), 'utf8')

const leer = (ruta) => readFile(path.join(temporal, ruta.replace(/^\.?\//, '')), 'utf8')

/**
 * Reemplaza cada etiqueta que apunta a un archivo por su contenido.
 *
 * Los reemplazos van con función a propósito: el JavaScript minificado contiene
 * secuencias como `$&` que, en un reemplazo de texto plano, volverían a
 * insertar la etiqueta original en mitad del código.
 */
async function incrustar(texto) {
  let salida = texto

  for (const [etiqueta, src] of texto.matchAll(
    /<script[^>]*src="([^"]+)"[^>]*><\/script>/g,
  )) {
    const codigo = await leer(src)
    salida = salida.replace(etiqueta, () => `<script type="module">\n${codigo}\n</script>`)
  }

  for (const [etiqueta, href] of texto.matchAll(
    /<link[^>]*rel="stylesheet"[^>]*href="(\.[^"]+)"[^>]*>/g,
  )) {
    const css = await leer(href)
    salida = salida.replace(etiqueta, () => `<style>\n${css}\n</style>`)
  }

  return salida
}

const completo = await incrustar(html)

if (/(src|href)="\.?\/assets\//.test(completo)) {
  throw new Error('Quedaron referencias a archivos externos: el HTML no es autocontenido.')
}

await mkdir(destino, { recursive: true })
await writeFile(path.join(destino, 'hacienda-crm.html'), completo, 'utf8')
await rm(temporal, { recursive: true, force: true })

const kb = Math.round(Buffer.byteLength(completo) / 1024)
console.log(`\npublicacion/hacienda-crm.html · ${kb} kB en un solo archivo`)
