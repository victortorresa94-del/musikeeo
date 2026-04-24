import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
                    <div className="bg-card border border-destructive/30 rounded-2xl p-8 max-w-md text-center shadow-2xl">
                        <h1 className="text-3xl font-bold mb-4 text-destructive">Algo salió mal</h1>
                        <p className="text-muted-foreground mb-6">
                            Ha ocurrido un error inesperado en la aplicación. Por favor, intenta recargar la página.
                        </p>
                        {this.state.error && (
                            <div className="bg-muted p-3 rounded-lg text-left mb-6 overflow-auto max-h-32">
                                <code className="text-xs text-destructive font-mono">
                                    {this.state.error.toString()}
                                </code>
                            </div>
                        )}
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-primary text-primary-foreground font-bold py-3 px-6 rounded-xl hover:brightness-105 transition-all hover:scale-105"
                        >
                            Recargar Página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
