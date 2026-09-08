# Hacienda del Bosque · CRM — Arquitectura del sistema

Documento base del prototipo. Define cómo está construido el núcleo y cómo se
agregan o modifican módulos sin afectar el resto del sistema.

> Alcance de esta etapa: **núcleo del CRM**. Sin integraciones externas
> (WhatsApp, POS, facturación, plataformas de reserva). Datos ficticios en memoria.

---

## 1. Estructura del proyecto

```
src/
├── app/                      Arranque de la aplicación
│   ├── App.tsx               Providers + enrutador + guarda de permisos
│   └── modulos.tsx           REGISTRO ÚNICO DE MÓDULOS (menú + rutas)
│
├── core/                     Capa transversal — no depende de ningún módulo
│   ├── auth/                 Sesión actual (hoy simulada, mañana login real)
│   ├── notificaciones/       Canales de aviso y plantillas de correo
│   ├── permissions/          Matriz de permisos, alcance por rol, componente <Si>
│   ├── types/                Modelo de datos (una entidad por archivo)
│   ├── data/
│   │   ├── mock/             Datos ficticios realistas
│   │   └── repositories/     Único punto de acceso a datos (se cambia por API)
│   └── utils/                Formatos, fechas, normalización, etiquetas
│
├── ui/                       Sistema de diseño reutilizable (sin lógica de negocio)
│
├── layout/                   Estructura visual: AppLayout, Sidebar, Header
│
├── modules/                  UN MÓDULO POR CARPETA — aislados entre sí
│   ├── dashboard/
│   │   ├── pages/            Pantallas del módulo
│   │   ├── components/       Componentes propios del módulo
│   │   └── services/         Reglas y cálculos del módulo
│   ├── clientes/
│   ├── comercial/
│   ├── experiencias/
│   ├── momentos/
│   ├── seguimientos/
│   ├── fidelizacion/
│   ├── ventas/
│   ├── reportes/
│   └── configuracion/
│
└── styles/                   Estilos globales y tokens de marca
```

**Regla de dependencias (clave de la modularidad):**

```
modules/*  →  ui, core                  ✅ permitido
core       →  nada                       ✅ independiente
ui         →  core (utils)               ✅ permitido
modules/A  →  modules/B/index.ts         ✅ solo la API pública del módulo
modules/A  →  modules/B/components/...   ❌ prohibido
layout     →  app/modulos                ✅ solo el registro
```

Cada módulo expone en su `index.ts` lo poco que otros necesitan. Así Clientes
puede abrir el proceso de reasignación (`PanelSolicitud`) sin conocer cómo está
construido el módulo Comercial.

Un módulo se puede reescribir, reemplazar o eliminar sin tocar los demás: solo se
edita su carpeta y su línea en `src/app/modulos.tsx`.

### Cómo se agrega un módulo nuevo

1. Crear `src/modules/<nombre>/pages/<Nombre>Page.tsx`.
2. Agregar una entrada en `MODULOS` (`src/app/modulos.tsx`) con ruta, ícono, grupo y permiso.
3. Listo: el menú lateral, la ruta y la guarda de permisos se generan solas.

---

## 2. Modelo de datos

### Usuario
`id · nombre · email · telefono · rol · cargo · activo · comisionPorcentaje? · metaMensual? · fechaIngreso`

### Cliente
| Grupo | Campos |
|---|---|
| Identidad | `nombres · apellidos · fechaNacimiento? · aniversario?` |
| Contacto | `telefono · email · telefonoNormalizado · emailNormalizado · ciudad · direccion?` |
| Empresa | `empresa? · cargo?` |
| Relación comercial | `origen · fechaRegistro · comercialId · fechaAsignacion · categoria` |
| Experiencia | `preferencias[] · restricciones[] · observaciones? · autorizaComunicaciones` |
| Métricas | `valorHistorico · numeroEventos · ultimaVisita?` |
| Auditoría | `id · codigo · creadoPor · actualizadoEn` |

**Categorías:** `nuevo · frecuente · vip · ocasional · por_recuperar`.
Reemplazan al antiguo `estado`: una sola clasificación comercial, sin conceptos solapados.

> El cliente **siempre es una persona**. Las cuentas corporativas se modelan como la
> persona de contacto más `empresa` y `cargo`: en un restaurante se negocia con alguien,
> no con una razón social.

### IntentoDuplicado (auditoría)
`id · clienteId · comercialSolicitanteId · comercialResponsableId · criterio (telefono|email) ·`
`valorDetectado · datosIntento{nombres, apellidos, telefono, email} · fecha · estado · resueltoPor? · observacion?`

### AsignacionHistorial (historial de propietarios)
`id · clienteId · comercialAnteriorId? · comercialNuevoId · origen · motivo · autorizadoPor · fecha · solicitudId?`

`origen`: `registro · reasignacion_gerencia · solicitud_aprobada`.

> **Append-only.** Cuando un cliente cambia de responsable se agrega una línea;
> nunca se modifica ni se elimina lo anterior. La asignación inicial se deriva de
> `creadoPor` + `fechaRegistro`, de modo que ninguna ficha aparezca sin origen.

### SolicitudReasignacion
`id · clienteId · solicitanteId · propietarioActualId · motivo · origen (duplicado|ficha_restringida|manual) ·`
`intentoDuplicadoId? · fecha · estado (pendiente|aprobada|rechazada) · resueltaPor? · fechaResolucion? · comentarioResolucion?`

### RegistroAuditoria
`id · fecha · accion · actorId · entidad (cliente|solicitud|experiencia) · entidadId · descripcion · detalle?`

`accion`: `cliente_creado · cliente_editado · cliente_reasignado · duplicado_bloqueado ·`
`solicitud_creada · solicitud_aprobada · solicitud_rechazada · experiencia_creada ·`
`experiencia_editada · experiencia_estado`.

### Experiencia
| Grupo | Campos |
|---|---|
| Identidad | `id · codigo · clienteId · comercialId · titulo · tipo` |
| Pipeline | `estado · motivoPerdida?` |
| La celebración | `fechaTentativa? · numeroPersonas` |
| Cifras | `presupuesto? · valorCotizado? · valorFinal? · anticipo?` |
| Gestión | `fuente · observaciones? · proximoSeguimiento?` |
| Montaje | `espacioId? · menuId? · horaInicio? · horaFin? · requerimientos[] · responsableOperativo?` |
| Auditoría | `creadoEn · creadoPor · actualizadoEn` |

**Tipos:** cumpleaños · aniversario · matrimonio · cena romántica · evento empresarial ·
evento social · celebración familiar · reserva de grupo · otro.

**Pipeline:** `nuevo → contactado → visita → cotizacion → negociacion → confirmado → realizado`,
con `perdido` como salida en cualquier punto.

> **Una sola entidad.** Antes existían `Oportunidad` (lo comercial) y `Evento` (lo
> operativo): la misma celebración contada dos veces, con el riesgo de que las cifras
> no coincidieran. La experiencia nace como solicitud y, al confirmarse, se le suman
> los campos de montaje.

### Momento (calculado, no se almacena)
`id · tipo (cumpleanos|aniversario|evento|recuperacion) · clienteId · comercialId · fecha · dias ·`
`titulo · detalle? · valor? · experienciaId? · ultimaInteraccion? · ultimaVentaOEvento? · accionRecomendada`

> Los momentos se derivan de las fechas del cliente y de su comportamiento cada vez
> que se consultan: así nunca quedan desactualizados ni hay que mantenerlos al día.

### ReglaRecordatorio
`id · tipo · anticipacion (30|15|7|0) · activa · canales[] · descripcion`

### Notificacion
`id · reglaId · momentoId · tipo · clienteId · destinatarioId · titulo · mensaje ·`
`accionRecomendada · fechaMomento · fechaGenerada · canal (crm|correo) · estado · enviadaPorCorreo · fechaEnvioCorreo?`

### AlertaCorreo
`id · nombre · descripcion · frecuencia · horaEnvio · activa · ventanas[] · destinatarios[] ·`
`soloCarteraPropia · ultimoEnvio?`

> `destinatarios` guarda **identificadores de usuarios del CRM**, nunca direcciones
> sueltas. Es lo que hace imposible, por construcción, escribirle a un cliente.

### EnvioCorreo (bitácora)
`id · alertaId · fecha · asunto · destinatarios[{usuarioId, email, entregado, motivo, registros}] ·`
`resultado (simulado|enviado|error|sin_destinatarios|sin_contenido) · detalle · disparadoPor · actorId? · cuerpoHtml?`

### Seguimiento
`id · entidadTipo (cliente|experiencia) · entidadId · clienteId · comercialId · tipo ·`
`asunto · detalle · fecha · resultado · proximaAccion? · fechaProximaAccion? · creadoEn`

`tipo`: llamada · correo · visita · reunión · degustación · nota
`resultado`: pendiente · exitoso · sin respuesta · reprogramado · cerrado

> Una gestión está **abierta** mientras tenga una próxima acción sin cerrar. Ese
> par —acción comprometida y fecha— es lo que alimenta la agenda del comercial.

### FechaEspecial
`id · clienteId · tipo (cumpleanos|aniversario|fecha_corporativa|otra) · descripcion · fecha (MM-DD) · recordatorioDias · activa`

### Venta
`id · codigo · clienteId · comercialId · experienciaId? · categoria · descripcion · fecha · monto ·`
`descuento · estadoPago · comisionPorcentaje · comisionValor · comisionLiquidada`

`categoria`: evento · restaurante · experiencia · bar · otros
`estadoPago`: anticipo · parcial · pagado · vencido

> La **comisión no se digita**: el repositorio la calcula con el porcentaje pactado
> del comercial sobre el valor neto (`monto − descuento`).

### Fidelización
- **MembresiaFidelidad**: `clienteId · nivel · puntos · visitasAno · ingresoAcumulado · desde`
- **MovimientoPuntos**: `clienteId · tipo · puntos · concepto · fecha · referenciaVentaId?`
- **Beneficio**: `nombre · descripcion · nivelMinimo · costoPuntos · activo`

Niveles con identidad de la hacienda: **Semilla → Guadua → Ceiba → Samán**.

### Catálogos (Configuración)
- **Espacio**: Casona Principal, Terraza de los Samanes, Jardín del Bosque, Comedor Privado La Bodega, Mirador del Guadual.
- **MenuExperiencia**: Menú Raíces, Menú del Bosque, Menú Hacienda, Estación Corporativa.

---

## 3. Relaciones entre entidades

```
Usuario (comercial)
   │ 1
   │ responsable de
   ▼ N
Cliente ──1─┬──N─→ Experiencia ──0..N─→ Venta
            │                 ▲
            ├──N─→ Seguimiento┘ (apunta a un cliente o a una experiencia)
            ├──N─→ FechaEspecial
            ├──1─→ MembresiaFidelidad ──N─→ MovimientoPuntos
            ├──N─→ IntentoDuplicado (evidencia)
            ├──N─→ SolicitudReasignacion
            └──N─→ AsignacionHistorial

Espacio ──N─→ Experiencia     Menu ──N─→ Experiencia
Venta ──1─→ Usuario (comisión del freelancer)
```

**Cardinalidades y reglas:**

| Relación | Regla |
|---|---|
| Cliente → Comercial | **1 y solo 1** responsable. Nunca queda sin dueño. |
| Cliente → Experiencia | Un cliente puede tener varias experiencias simultáneas. |
| Experiencia → Venta | Una experiencia puede facturar en varios movimientos (anticipo, saldo). |
| Seguimiento → entidad | Polimórfico: cliente o experiencia; siempre guarda `clienteId`. |
| Cliente → Membresía | 1:0..1, se crea al primer consumo registrado. |

### Regla fundamental: propiedad comercial y antiduplicados

1. Antes de crear un cliente se ejecuta `clientesRepo.detectarDuplicado({ telefono, email })`.
2. La comparación se hace sobre **claves normalizadas** (`telefonoNormalizado`, `emailNormalizado`),
   nunca sobre el texto digitado: `+57 318 774-1120`, `3187741120` y `57 318 7741120` son el mismo teléfono.
3. Si el cliente existe, el sistema **no crea el registro** y muestra quién es el comercial responsable.
4. El intento queda registrado como `IntentoDuplicado` con lo que el comercial alcanzó a
   digitar. Si lo intentó el propio responsable, queda como `registrado` (solo auditoría);
   si fue otro comercial, como `pendiente` y llega al tablero de Gerencia.
5. **Solo Gerencia** resuelve el conflicto: reasignar o rechazar. Toda reasignación deja
   rastro en `AsignacionHistorial` con motivo, autor y fecha.

---

## 4. Sistema de roles y permisos

Una sola fuente de verdad: `src/core/permissions/permisos.ts`.
Ningún módulo pregunta por el rol; siempre pregunta por el **permiso**.

```
Permiso = `${Recurso}:${Accion}`

Recursos: dashboard · clientes · oportunidades · eventos · seguimientos ·
          fidelizacion · ventas · comisiones · comerciales · reportes · configuracion
Acciones: ver · crear · editar · eliminar · reasignar · exportar · ver_margenes · liquidar
```

Además del permiso, cada rol tiene un **alcance** que define *qué registros* ve:

| Rol | Alcance | Puede | No puede |
|---|---|---|---|
| **Gerencia** | `todos` | Todo el sistema, reasignar clientes, ver márgenes, configurar, liquidar comisiones | — |
| **Comercial interno** | `propios` | Crear y editar sus clientes, oportunidades, eventos, seguimientos y ventas; ver reportes propios y exportarlos | Reasignar clientes, ver cartera de otros, configurar el sistema |
| **Comercial freelancer** | `propios` | Crear y editar sus clientes, oportunidades y seguimientos; consultar sus ventas y comisiones | Crear eventos, ver fidelización, exportar, ver márgenes, ver cartera de otros, configurar |

Aplicación práctica:

- `puede(usuario, 'clientes:reasignar')` → controla botones y acciones.
- `filtrarPorAlcance(usuario, registros)` → filtra cualquier colección con `comercialId`.
- `<Si permiso="ventas:crear">…</Si>` → oculta elementos de la interfaz.
- La guarda de ruta usa **el mismo permiso** que el menú: no hay puertas traseras por URL.

---

## 5. Componentes reutilizables (`src/ui`)

| Componente | Uso |
|---|---|
| `Tarjeta` / `CabeceraTarjeta` / `CuerpoTarjeta` | Contenedor estándar de todo bloque de contenido |
| `PanelLateral` | Panel deslizante para crear y editar sin perder el contexto |
| `Pestanas` | Navegación por pestañas con filete dorado en la activa |
| `Campo` · `CampoBloque` · `Entrada` · `AreaTexto` · `Seleccion` | Controles de formulario |
| `Interruptor` | Autorizaciones y consentimientos |
| `ListaEditable` | Listas tipo etiqueta: preferencias, restricciones, alergias |
| `IndicadorCompacto` | Indicador secundario horizontal con acento de atención |
| `Indicador` | Tarjeta de KPI con variación y variante destacada |
| `Boton` | 4 variantes (primario, secundario, fantasma, latón) × 2 tamaños |
| `Etiqueta` / `Punto` | Estados, segmentos y categorías con 7 tonos |
| `Avatar` | Iniciales de usuario o cliente |
| `EncabezadoPagina` | Antetítulo + título editorial + descripción + acciones |
| `EstadoVacio` | Mensaje elegante cuando no hay datos |
| `BarraProgreso` | Metas, embudos y avances |
| `Filete` | Separador con degradado dorado de marca |
| `ModuloEnConstruccion` | Marcador de módulo previsto con su alcance |

Del layout: `AppLayout`, `Sidebar`, `Header`.
Del núcleo: `<Si permiso>` (control de acceso declarativo).

---

## 6. Estructura visual y lenguaje de marca

**Concepto:** hacienda vallecaucana contemporánea — naturaleza, historia y alta cocina.
Nada de apariencia de software administrativo genérico.

| Token | Valor | Uso |
|---|---|---|
| `bosque-800` | `#16281F` | Menú lateral, bloques destacados |
| `bosque-700 / 500` | `#1D3A2C` / `#33684E` | Títulos, botones primarios, gráficas |
| `laton-400` | `#C9A961` | Acento de lujo: filetes, indicadores activos, nivel destacado |
| `crema-100 / 50` | `#F5F1E7` / `#FBF9F4` | Fondo de la aplicación y de tarjetas alternas |
| `carbon` | `#23231F` | Texto principal |
| `terracota` | `#A9553C` | Alertas puntuales |

- **Tipografía:** *Cormorant Garamond* (títulos y cifras, aire editorial) + *Inter* (interfaz).
- **Microtipografía de marca:** etiquetas en versalitas con `tracking` amplio (`.eyebrow`).
- **Filete dorado** al pie de cada indicador y como separador de secciones.
- **Trama de hoja** sutil en el menú lateral (SVG embebido, sin peticiones externas).
- **Espaciado generoso**, bordes de 1 px, sombras suaves; sin degradados estridentes.

**Estructura de pantalla:**

```
┌────────────┬──────────────────────────────────────────────┐
│            │  Header: buscador · fecha · alertas · sesión │
│  Sidebar   ├──────────────────────────────────────────────┤
│  fijo      │  Encabezado de página (antetítulo + título)  │
│  264 px    │  Indicadores (4 columnas)                    │
│            │  Contenido en grilla 2/3 + 1/3               │
│  Marca     │                                              │
│  Grupos    │                                              │
│  Usuario   │  Pie con filete dorado                       │
└────────────┴──────────────────────────────────────────────┘
```

**Responsive:** el menú se convierte en panel deslizante bajo 1024 px; los
indicadores pasan a 2 columnas y luego a 1; las grillas colapsan a una columna.

---

## 7. Módulo Dashboard

Pensado para Gerencia: la lectura del estado comercial debe resolverse en menos de
30 segundos. Una sola gráfica, jerarquía clara y cifras acompañadas de su contexto.

### Orden de lectura

1. **Ventas comerciales del mes** — franja oscura, cifra grande, variación contra el
   mes anterior, avance de meta y tendencia de seis meses (la única gráfica del tablero).
2. **Cartera y negocio en curso** — total de clientes · clientes nuevos del mes ·
   oportunidades activas · eventos en negociación.
3. **Señales que piden acción** — seguimientos pendientes · cumpleaños próximos ·
   clientes por recuperar. Con acento de color y acción sugerida.
4. **Conflictos de propiedad comercial** — solo Gerencia, solo si hay pendientes.
5. **Pipeline comercial** — las cuatro etapas activas con su valor y la tasa de cierre.
6. **Actividad comercial** — canal interno frente a canal freelancer.
7. **Momentos Hacienda** — la agenda que genera ventas.

### Definición de cada indicador

| Indicador | Regla de cálculo |
|---|---|
| Total de clientes | Clientes visibles según el alcance del rol (Gerencia: todos) |
| Clientes nuevos del mes | `creadoEn` dentro del mes en curso, comparado contra el mes anterior |
| Oportunidades activas | Etapa distinta de ganada y perdida; se muestra el valor en juego |
| Eventos en negociación | Eventos futuros en estado `tentativo` (cotizados, sin confirmar) |
| Ventas comerciales del mes | Suma de `monto − descuento` de las ventas del mes |
| Seguimientos pendientes | Con próxima acción y resultado distinto de cerrado; se destacan los vencidos |
| Cumpleaños próximos | Fechas especiales tipo cumpleaños en los siguientes 30 días |
| Clientes por recuperar | Inactivos, o con más de 90 días sin visita y sin evento agendado |
| Tasa de cierre / conversión | Ganadas ÷ (ganadas + perdidas) del año en curso |
| Valor ponderado | Σ (valor estimado × probabilidad) de las oportunidades activas |

### Actividad comercial por canal

Compara **comercial interno** y **comercial freelancer** en cinco métricas —clientes
asignados, oportunidades, ventas cerradas, valor vendido y tasa de conversión—, cada
una con su barra de participación relativa. El detalle por asesor se despliega bajo
demanda para no competir con la lectura rápida.

> El valor vendido incluye consumo de restaurante y experiencias, que no siempre pasa
> por una oportunidad; por eso un asesor puede mostrar ventas altas con pocos cierres.

### Momentos Hacienda

Línea de tiempo única con cumpleaños, aniversarios, experiencias agendadas y
seguimientos importantes de los próximos 30 días, filtrable por tipo. Para no
convertirla en una lista de tareas, solo entran los seguimientos que sostienen una
negociación superior a $ 40 M o que corresponden a un cliente VIP; la agenda completa
vive en el indicador de seguimientos pendientes y en el módulo de Seguimientos.

### Comportamiento por rol

Gerencia ve la hacienda completa, la comparativa de canales y los conflictos de
propiedad. Un comercial ve exactamente los mismos bloques calculados sobre su propia
cartera, sin la comparativa de canales ni la bandeja de conflictos, y con su meta
personal en lugar de la meta global.

---

## 8. Módulo Clientes

El corazón del CRM. Aquí vive la regla de propiedad comercial y el control de
duplicados; todo lo demás cuelga de la ficha del cliente.

### Pantallas

| Pantalla | Ruta | Contenido |
|---|---|---|
| Directorio | `/clientes` | Resumen de cartera, buscador, filtros y listado |
| Ficha 360 | `/clientes/:id` | Expediente completo del cliente |
| Crear / editar | Panel lateral | Formulario por secciones, sin salir del contexto |

Las subrutas se declaran en el registro de módulos (`subRutas`) y heredan el
permiso del módulo: no hay puertas traseras por URL.

### Buscador y filtros

- **Buscador**: nombre, empresa, código, correo y teléfono. El teléfono se busca con la
  misma normalización con que se guarda, así que `+57 315 220 8844`, `3152208844` y
  `315 220` encuentran al mismo cliente.
- **Filtros**: categoría (con contadores), comercial responsable (solo Gerencia),
  origen, ciudad y autorización de comunicaciones.
- **Orden**: registro más reciente, nombre, valor histórico o última visita.

### Ficha 360

| Bloque | Qué muestra |
|---|---|
| Encabezado | Monograma, nombre, empresa y cargo, contacto, categoría, origen y autorización |
| Cinta de cifras | Valor histórico · experiencias · oportunidades activas · última visita |
| Información personal | Los quince campos de la ficha |
| Comercial responsable | Responsable, desde cuándo, historial de asignación y reasignación (Gerencia) |
| En la mesa | Preferencias, restricciones y alergias, observaciones |
| Momentos especiales | Cumpleaños, aniversario y fechas conmemorativas con cuenta regresiva |
| Expediente comercial | Pestañas de oportunidades, eventos, seguimientos y ventas |
| Actividad reciente | Línea de tiempo unificada de todo lo ocurrido con el cliente |

### Control de duplicados

Dos momentos distintos, a propósito:

1. **Aviso preventivo** — al salir del campo de teléfono o correo, si ya existe una
   coincidencia se avisa sin interrumpir. No se registra nada todavía.
2. **Bloqueo al guardar** — el sistema no crea el registro y muestra
   *«Este cliente ya se encuentra registrado»* con el nombre, el comercial responsable
   y la fecha de creación, más un enlace para abrir la ficha existente. Ese intento sí
   queda en la auditoría.

El contador **Duplicados evitados** del directorio muestra cuántos intentos ha
frenado el sistema.

### Estado en memoria

El prototipo no tiene backend: `src/core/data/store.ts` notifica los cambios y las
vistas suscritas con `useDatos()` se recalculan. Al conectar la API real se reemplaza
ese archivo por el cliente de datos, sin tocar los módulos.

---

## 9. Módulo Gestión Comercial

Administra la propiedad de las cuentas: quién es dueño de cada cliente, cómo se
pide un traslado y quién lo autoriza.

### Vistas

| Vista | Quién la ve | Contenido |
|---|---|---|
| **Cartera comercial** | Gerencia | Una fila por comercial, comparable: clientes, valor de cartera, ventas del año, oportunidades, recibidos y cedidos. Se despliega para ver sus clientes |
| **Mis clientes** | Cada comercial | Su cartera, ordenada por lo último que le asignaron, indicando si cada cuenta llegó por registro propio o por traslado |
| **Solicitudes** | Ambos | Gerencia ve todas y las resuelve; el comercial ve las que pidió y las que le piden |
| **Auditoría** | Gerencia | Bitácora completa del sistema, filtrable por tipo de acción |

### Proceso de reasignación

```
Comercial                         Gerencia
    │                                 │
    ├─ Solicitar reasignación ───────►│   (estado: pendiente)
    │   · desde un duplicado          │
    │   · desde una ficha ajena       ├─► Aprobar  → reasigna + historial + auditoría
    │                                 └─► Rechazar → la cuenta no se mueve
    │                                       (motivo por escrito en ambos casos)
```

Reglas que hace cumplir el sistema:

- Un comercial **puede solicitar pero no aprobar**: la acción de resolver solo
  existe para Gerencia, tanto en la interfaz como en el repositorio.
- No se admite una segunda solicitud del mismo comercial sobre el mismo cliente
  mientras la primera siga pendiente.
- Nadie puede solicitar una cuenta que ya es suya.
- Aprobar dispara la reasignación: cambia `comercialId`, actualiza
  `fechaAsignacion`, agrega una línea al historial de propietarios y deja dos
  entradas en la auditoría (la decisión y el traslado).

### Auditoría

`auditoriaRepo` **solo tiene método de alta**. No existe forma de editar ni
borrar un registro, ni siquiera para Gerencia. Cada acción que toca la propiedad
comercial —altas, ediciones, duplicados bloqueados, solicitudes y reasignaciones—
deja su entrada con actor, fecha, entidad y detalle.

---

## 10. Módulo Experiencias / Eventos

El pipeline comercial de la hacienda: de la primera consulta a la celebración.

### Vistas

| Vista | Para qué sirve |
|---|---|
| **Kanban** | Trabajo diario: ocho columnas, una por etapa, con el conteo y el valor de cada una. Las tarjetas se arrastran entre etapas |
| **Lista** | Revisión comparable: primero lo que viene (de lo más próximo a lo más lejano) y después lo ya ocurrido |

Ambas comparten buscador (experiencia, cliente o código) y filtros por tipo,
comercial, etapa y «solo abiertas».

### Reglas de cierre

| Transición | Exigencia |
|---|---|
| → **Confirmado** | Valor final acordado. Sin él, el movimiento se rechaza |
| → **Perdido** | Motivo. Hay seis motivos frecuentes de un clic, o texto libre |
| → **Realizado** | Solo desde Confirmado: no se celebra lo que no se cerró |

Estas reglas viven en `experienciasRepo.cambiarEstado`, no en la interfaz: arrastrar
la tarjeta, usar los botones de la ficha o editar el formulario pasan todos por la
misma validación.

### Historial

Cada movimiento relevante —alta, cambio de etapa y ediciones de valor, fecha, aforo,
responsable o próximo seguimiento— queda en la bitácora del sistema con su actor y su
fecha, y se lee en la propia ficha de la experiencia. Las etapas y los cierres también
aparecen en la auditoría general del módulo Comercial.

### Valor de una experiencia

Se toma, en este orden: **valor final** (si ya se cerró), **valor cotizado** o
**presupuesto** del cliente. Así una solicitud recién llegada ya aporta al pipeline con
la cifra que el cliente declaró, sin inventar valores.

---

## 11. Módulo Momentos Hacienda

Convierte las fechas y el comportamiento del cliente en oportunidades concretas de
fidelización. Aparece en el menú bajo **Crecimiento**, junto a Fidelización.

### Los cuatro tipos de momento

| Tipo | De dónde sale |
|---|---|
| **Cumpleaños** | `fechaNacimiento` del cliente y fechas especiales registradas |
| **Aniversarios** | `aniversario` del cliente y fechas corporativas |
| **Eventos próximos** | Experiencias confirmadas con fecha por delante |
| **Clientes por recuperar** | Categoría «por recuperar», o más de 90 días sin visitar y sin experiencia agendada |

### Vista cronológica

Cuatro ventanas —**Hoy · 7 · 15 · 30 días**— con su conteo, más un filtro por tipo.
Dentro, la lista se agrupa por cercanía (hoy, próximos 7 días, entre 8 y 15, entre 16 y 30).

Cada fila trae lo necesario para decidir sin abrir la ficha:

`Cliente · Fecha · Categoría · Comercial responsable · Última interacción · Última venta o evento · Acción recomendada`

La **acción recomendada** se calcula: un VIP recibe una propuesta con cortesía de la
casa; un cliente por recuperar, una invitación de regreso; y a quien no autoriza
comunicaciones escritas se le indica llamar por teléfono.

### Reglas de recordatorio

Una matriz de **tipo × anticipación** (30, 15, 7 días y el mismo día) que Gerencia
activa o desactiva. Un comercial las ve en modo lectura.

Una regla de N días avisa cuando el momento **entra en su ventana** (`dias ≤ N`), no
solo el día exacto: el recordatorio aparece aunque nadie abra el CRM esa mañana. La
generación es idempotente — una regla nunca avisa dos veces del mismo momento.

### Notificaciones

Viven **dentro del CRM**: bandeja en el módulo y campana en el encabezado, con
contador de pendientes. Cada aviso se puede marcar como atendido o descartado, y se
dirige siempre **al comercial responsable, nunca al cliente**.

### Preparado para el correo

`src/core/notificaciones/notificador.ts` define el contrato `Notificador` y dos
implementaciones: `notificadorCRM` (activa) y `notificadorCorreo` (declarada y
**apagada**, devuelve un rechazo explícito). Habilitar el correo será escribir el
cuerpo de `notificadorCorreo.enviar` y marcar `disponible: true`; ni las reglas ni la
interfaz cambian. El campo `enviadaPorCorreo` de cada notificación ya guarda el sitio
para esa trazabilidad.

> En esta etapa **no sale ningún mensaje hacia el cliente**. Todo lo que produce el
> módulo es trabajo para el equipo comercial.

---

## 12. Notificaciones por correo

Primer sistema de alertas al equipo interno. Se configura en **Configuración ›
Alertas por correo**, y solo Gerencia entra a ese módulo.

### La alerta inicial: «Próximos cumpleaños»

Resumen diario con los clientes que cumplen años, agrupados en **Hoy · 7 · 15 · 30
días** —cada cliente aparece una sola vez, en la ventana más cercana que le
corresponde—. Por cada uno: **nombre, fecha de cumpleaños, categoría, comercial
responsable, teléfono y última interacción**.

Está escrito para el equipo: incluye el teléfono del cliente para que el comercial
pueda llamarlo, y cierra recordando que ningún saludo sale desde el resumen.

### Configuración

| Parámetro | Qué hace |
|---|---|
| Activa / inactiva | Apagada, la alerta no corre ni manual ni automáticamente |
| Hora de envío | Hora del resumen diario (la dispara el servidor cuando exista backend) |
| Agrupaciones | Cuáles de las cuatro ventanas se incluyen |
| Destinatarios | Se marcan de la lista de usuarios del CRM |
| Cartera propia | Cada comercial recibe solo sus clientes; Gerencia siempre el total |

Las **reglas de recordatorio del CRM** (las de Momentos Hacienda) también se activan
y desactivan desde aquí: es el mismo componente, montado en las dos pantallas.

### Vista previa y ejecución

- **Vista previa** renderiza el correo real —el mismo HTML que saldría— en un iframe
  aislado, y permite verlo como lo recibiría cada destinatario.
- **Ejecutar ahora** corre la alerta al instante: compone un mensaje por destinatario,
  lo pasa por el canal y registra el resultado.

### Bitácora de envíos

Cada corrida deja: fecha y hora, asunto, resultado, si fue manual o programada, y por
cada destinatario su correo, cuántos registros llevaba su resumen y si se entregó.
El cuerpo generado se conserva para consultarlo después. La ejecución también queda
en la auditoría general.

### Estado del canal

`notificadorCorreo` ya compone y valida el mensaje, pero opera en **modo simulado**:
no existe todavía el servicio de mensajería que lo entrega, así que cada envío se
registra con resultado `simulado` en lugar de `enviado`. Es deliberado — nadie debe
creer que un correo salió cuando no hay quien lo entregue.

Para activarlo de verdad:

1. Implementar el cuerpo de `notificadorCorreo.enviarCorreo` contra el proveedor.
2. Cambiar `modo` a `'real'`.

Alertas, destinatarios, plantillas, bitácora y pantalla ya están construidos y no
cambian. El disparo diario a la hora configurada será un trabajo del servidor.

> **Nunca al cliente.** Los destinatarios se eligen de la lista de usuarios y el
> repositorio descarta cualquier identificador que no corresponda a un usuario activo
> del CRM.

---

## 13. Módulo Seguimientos

La bitácora de la gestión comercial y la agenda que se deriva de ella.

### Dos vistas

| Vista | Qué muestra |
|---|---|
| **Agenda** | Las acciones comprometidas, agrupadas por urgencia: vencidos · hoy · próximos 7 días · más adelante |
| **Historial** | Todo lo registrado, de lo más reciente hacia atrás, con buscador y filtros por tipo, resultado y comercial |

### Registrar una gestión

Tipo, asunto, detalle, fecha y resultado; opcionalmente se vincula a una experiencia
del cliente, de modo que la gestión aparezca también en el expediente de esa
celebración. Al final, un interruptor decide si queda una **próxima acción con fecha**.

### Cerrar una acción

El cierre exige decir cómo salió y ofrece **encadenar la siguiente gestión** en el
mismo gesto: se cierra la anterior y nace la nueva ya agendada. Es lo que evita el
problema clásico del CRM —clientes que se enfrían porque nadie dejó un próximo paso—,
y por eso el indicador **cartera sin gestión** cuenta los clientes sin acción abierta.

### Dónde más aparece

- **Ficha del cliente** · pestaña Seguimientos y botón «Registrar gestión».
- **Momentos Hacienda** · «Atender» abre este formulario con el cliente y un asunto
  sugerido; al guardarlo, el recordatorio queda atendido. Así el ciclo se cierra:
  el momento propone, la gestión registra.
- **Dashboard** · las próximas acciones y el conteo de vencidos salen de aquí.
- **Auditoría** · cada registro y cada cierre dejan su entrada.

---

## 14. Módulo Ventas y comisiones

Cierra el ciclo: lo que el pipeline cerró tiene que entrar como ingreso y pagar su
comisión.

### Tres vistas

| Vista | Qué muestra |
|---|---|
| **Ventas** | Todas las operaciones con buscador y filtros por período, categoría, estado de pago y comercial. El estado de pago se cambia en la propia fila |
| **Por registrar** | Experiencias cerradas cuyo valor final todavía no está registrado como venta: el hueco entre lo vendido y lo cobrado |
| **Comisiones** | Solo Gerencia. Por comercial: pendiente, liquidable, ya liquidado y total vendido |

Arriba, el reparto del mes por categoría muestra de dónde viene el ingreso.

### Registrar una venta

Cliente, categoría, concepto, fecha, estado de pago, valor y descuento. Al vincularla
a una experiencia cerrada —o al entrar desde «Por registrar»— el formulario **propone
el saldo pendiente** de esa experiencia, y muestra en vivo el valor neto y la comisión
que generará.

### Comisiones

Se liquidan por comercial, y **solo la parte correspondiente a ventas ya pagadas**:
la hacienda no paga comisión sobre dinero que aún no ha entrado. Lo retenido se
muestra aparte con su explicación, y el botón se deshabilita cuando no hay nada
liquidable. Cada liquidación queda en la auditoría con las operaciones y el valor.

### Cartera vencida

Si hay operaciones en estado `vencido`, aparecen en una tarjeta propia al pie con su
valor acumulado.

---

## 15. Módulo Fidelización

**Qué resuelve:** reconocer a los clientes que vuelven. El programa tiene cuatro
niveles con nombres de los árboles de la hacienda y una bolsa de puntos que el
cliente puede cambiar por beneficios de la casa.

### Los cuatro niveles

| Nivel | Sube cuando… | Qué significa |
|---|---|---|
| **Semilla** | se registra | todo cliente entra aquí |
| **Guadua** | 3 visitas al año **o** $20 M gastados | ya volvió varias veces |
| **Ceiba** | 6 visitas al año **o** $50 M gastados | cliente habitual, accede a la bodega |
| **Samán** | 9 visitas al año **o** $80 M gastados | el nivel más alto de la casa |

Las dos condiciones son alternativas, no acumulativas: **basta con cumplir una**.
Los umbrales viven en `NIVELES` (`fidelizacionRepo.ts`), no repartidos por la
interfaz, de modo que Gerencia pueda ajustarlos en un solo lugar.

### Puntos

Por cada **$10.000** consumidos el cliente gana **1 punto** (`PESOS_POR_PUNTO`).
Los puntos no caducan y solo se descuentan al entregar un beneficio. Cada
movimiento —lo ganado y lo usado— queda con fecha, concepto y autor.

### Beneficios

Cada beneficio declara un **nivel mínimo** y un **costo en puntos**. Cuando un
cliente no lo alcanza, el sistema no esconde la opción: la muestra bloqueada y
dice por qué («Solo para clientes Ceiba o superior», «Le faltan 340 puntos»).
Es una decisión deliberada de diseño: el comercial entiende qué le falta al
cliente sin preguntarle a nadie.

### Quién puede qué

- **Comercial:** ve solo sus clientes y puede **entregar** un beneficio.
- **Gerencia:** ve el programa completo, puede **subir de nivel** a quien ya
  cumple los requisitos y **ajustar puntos** a mano (cortesías y correcciones),
  siempre con un motivo que queda registrado.

El nivel no sube solo: el sistema avisa «Ya puede subir a Samán» y la decisión
la toma una persona. Igual criterio que en el resto del CRM.

### Historial

`entregarBeneficio`, `registrarPuntos` y `actualizarNivel` escriben en la
auditoría general. Nada se borra ni se edita.

---

## 16. Módulo Reportes

**Qué resuelve:** dar a Gerencia una lectura del negocio sin tener que pedirle
cifras a nadie. Un informe solo sirve si quien lo lee saca una conclusión, así
que **cada bloque trae su frase escrita arriba** («lo que más deja en los
últimos 3 meses es eventos: $157,6 M, 88 % de todo lo vendido») y la tabla queda
debajo como respaldo, no al revés.

### Período

Un informe siempre responde «¿de cuándo?». Tres opciones, nada más: **Este mes**,
**Últimos 3 meses** y **Todo el año**. El período es un rango de fechas en texto
ISO —comparar cadenas basta y evita problemas de zona horaria— y lo aplican
todos los bloques a la vez.

### Las cuatro lecturas

| Pestaña | Responde a |
|---|---|
| **De dónde viene el dinero** | Qué pesa más: eventos, restaurante, bar o experiencias; y qué tipo de celebración deja más |
| **Equipo comercial** | Cuánto vendió cada asesor, con qué ticket promedio y cuántos de sus negocios cerrados terminaron en venta |
| **Clientes** | Por dónde llegan, cómo está clasificada la cartera y qué nos piden |
| **Por qué se pierde** | Los motivos de pérdida agrupados, con dos frases textuales del comercial en cada grupo |

La cabecera muestra siempre cuatro cifras del período: vendido, ticket promedio,
celebraciones cerradas con sus comensales, y clientes nuevos. Debajo, la
evolución mes a mes —**todos** los meses del rango, incluidos los que quedaron
en cero: un mes sin ventas es información, y saltárselo falsea la tendencia.

### Motivos de pérdida

El motivo es obligatorio al marcar una experiencia como perdida, pero suelto no
sirve para decidir nada. El informe los agrupa en familias reconociendo las
palabras que el equipo usa de verdad (precio, proveedor, fecha, aplazó, no
respondió, lo hicieron en su propio espacio). Lo que no encaje cae en «Otros
motivos», que **siempre se ordena de último**: es un cajón de sastre, no una
conclusión, y por eso la frase de lectura nunca se cuelga de él.

### Alcance y permisos

Comercial ve el informe con **sus** clientes y **sus** ventas —el encabezado
cambia de «Lectura gerencial» a «Sus resultados»— y la pestaña de equipo
sencillamente no existe para él. Gerencia ve la hacienda completa.

### Impresión

El botón **Imprimir** usa la impresión del navegador (papel o PDF). Una hoja de
estilos de impresión retira el menú, el encabezado, el pie y los propios
controles, y evita que una tarjeta se parta entre dos páginas. Es la única
«exportación» del prototipo: no hace falta más para llevar el informe al comité.

---

## 17. Lenguaje y legibilidad

El prototipo se presenta a Gerencia, no a un equipo técnico. Dos decisiones
transversales:

**Letra más grande.** Se subió el piso tipográfico de toda la interfaz: los
textos auxiliares pasaron de 9–11 px a 11–12,5 px. Ninguna cifra ni etiqueta
queda por debajo de lo cómodamente legible en una pantalla de sala de juntas.

**Palabras de la casa, no del software.** Se retiró la jerga de CRM de todo lo
que el usuario lee:

| Antes | Ahora |
|---|---|
| Pipeline comercial | Embudo de ventas |
| Pipeline de experiencias / Kanban | Tablero de experiencias / Tablero |
| En el pipeline | En proceso |
| Oportunidades activas | Negocios abiertos |
| Tasa de conversión | Cuántos cierran |
| Ponderado por probabilidad | Cierre probable |
| Cronología | Línea de tiempo |
| Modo simulado | Todavía en pruebas |
| Bitácora | Historial |

Los nombres técnicos siguen vivos en el código (`pipelineComercial`,
`TableroKanban`, `resultado: 'simulado'`): cambió lo que se lee, no la
arquitectura.

Además, cada pantalla explica en una línea qué hace y qué se espera de quien la
mira, y los bloqueos dicen su motivo en vez de solo impedir la acción.

---

## 18. Diseño responsivo e impresión

El CRM se usa en el computador de la oficina, pero se revisa desde una tableta o
un teléfono. El prototipo responde en tres tamaños, sin una versión aparte:

| Ancho | Qué cambia |
|---|---|
| **< 768 px** (teléfono) | Menú lateral oculto tras el botón de tres rayas; una sola columna; las experiencias abren en **Lista** en vez de tablero; los paneles ocupan la pantalla completa |
| **768 – 1023 px** (tableta) | Dos columnas de indicadores; buscador visible; menú aún plegable |
| **≥ 1024 px** | Menú lateral fijo; cuatro columnas de indicadores; informes y fichas a dos columnas |

Decisiones que sostienen esto:

- **`min-w-0` en las tarjetas.** Una tarjeta casi siempre es hija de un grid, y
  sin esto su contenido ensancha la columna y saca barra horizontal. Era el
  origen de todo el desbordamiento del tablero principal.
- **Cabeceras que se parten.** Título y acciones se envuelven en vez de
  comprimirse: en pantalla angosta el botón baja a la línea siguiente.
- **Desplazamientos horizontales acotados y avisados.** El tablero de
  experiencias y las pestañas se desplazan dentro de su propia caja, nunca
  arrastrando la página; en las pestañas un velo degradado en el borde avisa de
  que hay más a la derecha.
- **Paneles deslizantes a pantalla completa en móvil**, con máximo de ancho en
  pantallas grandes.

Verificado: ninguna de las diez pantallas produce desplazamiento horizontal a
375 px, 1024 px ni 1440 px.

**Impresión.** `@media print` retira menú, encabezado, pie y controles, quita
las sombras y evita que una tarjeta se parta entre dos páginas. Cualquier
pantalla se imprime; Reportes además trae el botón.

---

## 19. Estado del prototipo

| Módulo | Estado |
|---|---|
| Layout, Sidebar, Header | ✅ Construido |
| Dashboard | ✅ Construido, orientado a Gerencia y sensible al rol |
| Clientes | ✅ Construido: listado, buscador, filtros, alta con antiduplicados, edición y ficha 360 |
| Gestión Comercial | ✅ Construido: cartera comercial, mis clientes, solicitudes de reasignación y auditoría |
| Experiencias / Eventos | ✅ Construido: tablero y lista, alta y edición, reglas de cierre e historial |
| Momentos Hacienda | ✅ Construido: línea de tiempo, reglas configurables y recordatorios en el CRM |
| Configuración | ◐ Alertas por correo, reglas de recordatorio e historial de envíos construidos; catálogos, usuarios y parámetros de fidelización pendientes |
| Seguimientos | ✅ Construido: agenda por urgencia, historial con filtros, registro y cierre encadenado |
| Ventas y comisiones | ✅ Construido: operaciones, estado de cobro, brecha por registrar y liquidación de comisiones |
| Fidelización | ✅ Construido: cuatro niveles, puntos, beneficios con motivo de bloqueo y movimientos |
| Reportes | ✅ Construido: cuatro informes con lectura escrita, período configurable e impresión |

**Simulación de sesión:** el selector del encabezado permite ver el CRM como
cualquier usuario y demostrar el sistema de permisos ante Gerencia. Se reemplaza
por el inicio de sesión real sin modificar los módulos.

**Fecha de referencia de los datos ficticios:** 4 de septiembre de 2026.
Vive en una sola constante, `HOY_DEMO` (`src/core/utils/fecha.ts`), que usan todos los
módulos y repositorios: lo que se cree durante la demostración queda fechado el mismo
día que muestra la interfaz.
