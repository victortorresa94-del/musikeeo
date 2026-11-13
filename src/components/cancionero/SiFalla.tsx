import { Component, type ErrorInfo, type ReactNode } from 'react';

// Si una canción no se puede pintar (un texto raro, un fallo nuestro), falla SOLO esa canción y se
// ve su texto tal cual: en directo no puede caerse Tocar entero ni salir la pantalla de error
// (13-nov, Víctor: «que no se me reinicie la app en directo ni se me salga ni nada»)
export class SiFalla extends Component<{ texto: string; children: ReactNode; className?: string }, { fallo: boolean }> {
    state = { fallo: false };
    static getDerivedStateFromError() { return { fallo: true }; }
    componentDidCatch(error: Error, info: ErrorInfo) { console.error('[cancionero] no se pudo pintar la canción', error, info.componentStack); }
    componentDidUpdate(antes: { texto: string }) {
        // Si la canción cambia (se corrige el texto), se vuelve a intentar
        if (this.state.fallo && antes.texto !== this.props.texto) this.setState({ fallo: false });
    }
    render() {
        if (!this.state.fallo) return this.props.children;
        return (
            <div className={this.props.className}>
                <p className="mb-3 text-[13px] font-semibold text-muted-foreground">Esta canción se ve sin formato.</p>
                <pre className="whitespace-pre-wrap font-mono text-[15px] leading-[1.5] text-foreground">{this.props.texto}</pre>
            </div>
        );
    }
}
