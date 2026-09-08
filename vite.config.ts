import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

/**
 * Dos formas de compilar:
 *
 *  - `npm run build`        → sitio estático normal, con la aplicación partida
 *                             en trozos que se cargan bajo demanda. Es lo que
 *                             se publica en GitHub Pages.
 *  - `npm run build:unico`  → un solo archivo HTML con todo dentro, para
 *                             enviarlo por correo o abrirlo sin servidor.
 *
 * `BASE_PUBLICA` permite servir el sitio desde un subdirectorio, que es como
 * funciona GitHub Pages (usuario.github.io/repositorio/).
 */
const unico = process.env.BUILD_UNICO === '1'

export default defineConfig({
  base: unico ? './' : (process.env.BASE_PUBLICA ?? '/'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: { port: 5173, open: true },
  build: {
    // El archivo único no puede pedir trozos al servidor: va todo junto.
    cssCodeSplit: !unico,
    assetsInlineLimit: unico ? 100_000_000 : 4096,
    rollupOptions: {
      output: unico
        ? { inlineDynamicImports: true }
        : {
            // React y el enrutador cambian mucho menos que el CRM: en su propio
            // trozo, el navegador los reutiliza entre publicaciones.
            manualChunks: {
              react: ['react', 'react-dom', 'react-router-dom'],
            },
          },
    },
  },
})
