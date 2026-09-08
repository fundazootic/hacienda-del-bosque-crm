# Hacienda del Bosque · CRM

Prototipo del CRM modular para **Hacienda del Bosque** — restaurante de alto nivel
en Cali, Valle del Cauca: gastronomía, experiencias, celebraciones y eventos
sociales y empresariales.

## Puesta en marcha

```bash
npm install
npm run dev
```

La aplicación queda en `http://localhost:5173`.

Otros comandos:

```bash
npm run build        # compila y verifica tipos
npm run preview      # sirve la versión compilada
npm run build:unico  # todo el CRM en un solo archivo HTML, sin servidor
```

## Stack

- **React 18 + TypeScript** — componentes tipados y modulares
- **Vite** — arranque inmediato y compilación rápida
- **Tailwind CSS** — sistema de diseño con los tokens de marca de la hacienda
- **React Router** — rutas generadas desde el registro de módulos
- **date-fns** — fechas en español de Colombia

Las gráficas están dibujadas a mano en SVG: no hay librería de gráficos. La que
había pesaba más que todo el resto del CRM junto para dibujar unas barras.

Sin backend ni integraciones externas: los datos son ficticios y viven en
`src/core/data/mock`, detrás de repositorios que después se conectarán a la API real.

## Publicación

El sitio es **estático**: no necesita servidor propio, base de datos ni nada que
se pueda caer. Las rutas usan almohadilla (`/#/reportes`), así que funciona
igual servido desde una raíz, desde un subdirectorio o desde un archivo suelto.

- **GitHub Pages** — al subir a la rama `main`, el flujo de trabajo
  `.github/workflows/publicar.yml` compila y publica solo. Hay que activarlo una
  vez en *Settings › Pages › Source: GitHub Actions*.
- **Un solo archivo** — `npm run build:unico` deja
  `publicacion/hacienda-crm.html`, que se abre con doble clic o se envía por
  correo.

## Si algo falla

Un error en un módulo ya no tumba la aplicación: queda encerrado en esa
pantalla, con un aviso y un botón para reintentar, mientras el menú y los demás
módulos siguen funcionando.

## Cómo probar los roles

En el encabezado, el selector de usuario permite ver el CRM como Gerencia,
comercial interno o comercial freelancer. Cambian los indicadores, la cartera
visible, el menú lateral y las acciones disponibles.

| Usuario | Rol |
|---|---|
| Camila Restrepo Arboleda | Gerencia |
| Andrés Felipe Ocampo · Valentina Zúñiga · Julián Escobar | Comercial interno |
| Mauricio Lozano · Daniela Sarmiento | Comercial freelancer |

## Documentación

La arquitectura completa — estructura, modelo de datos, relaciones, permisos,
componentes y lenguaje visual — está en [ARQUITECTURA.md](ARQUITECTURA.md).
