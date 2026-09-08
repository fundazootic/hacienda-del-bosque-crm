import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RotateCcw, TriangleAlert } from 'lucide-react'
import { Boton } from './Boton'

interface Props {
  children: ReactNode
  /** Qué estaba mostrándose. Aparece en el aviso: «Reportes». */
  donde?: string
}

interface Estado {
  error: Error | null
}

/**
 * Contención de fallos.
 *
 * Sin esto, un error en cualquier módulo deja la pantalla en blanco y parece
 * que «se cayó la web». Con esto, el fallo queda encerrado en el módulo: el
 * menú, el encabezado y el resto del CRM siguen funcionando, y quien esté
 * presentando puede seguir a la siguiente pantalla sin recargar nada.
 */
export class LimiteDeError extends Component<Props, Estado> {
  state: Estado = { error: null }

  static getDerivedStateFromError(error: Error): Estado {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // En el prototipo no hay servicio de registro: la consola es suficiente
    // para que quien desarrolla vea qué pasó.
    console.error('Fallo contenido en el CRM:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <section className="mx-auto max-w-lg rounded-xl border border-crema-300/70 bg-white p-8 text-center shadow-suave">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-crema-100 text-terracota">
          <TriangleAlert size={20} />
        </span>
        <h2 className="mt-3 font-display text-2xl text-bosque-800">
          Esta pantalla no se pudo mostrar
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-carbon/60">
          {this.props.donde
            ? `Ocurrió un problema al preparar ${this.props.donde}. `
            : 'Ocurrió un problema al preparar esta sección. '}
          El resto del sistema sigue funcionando: puede continuar por el menú de la izquierda.
        </p>

        <Boton
          variante="secundario"
          icono={<RotateCcw size={15} />}
          className="mx-auto mt-5"
          onClick={() => this.setState({ error: null })}
        >
          Intentar de nuevo
        </Boton>

        <p className="mt-4 text-[11.5px] text-carbon/35">{this.state.error.message}</p>
      </section>
    )
  }
}
