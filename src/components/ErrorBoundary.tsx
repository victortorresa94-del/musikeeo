import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./ui/button";
import { Sentry } from "../lib/sentry";

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        Sentry.withScope((scope: any) => {
            scope.setExtras({ componentStack: errorInfo.componentStack });
            Sentry.captureException(error);
        });
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-black text-foreground flex flex-col items-center justify-center p-6 text-center">
                    <h1 className="text-4xl font-bold text-primary-ink mb-4">Ups, algo ha fallado.</h1>
                    <p className="text-muted-foreground mb-8 max-w-md">
                        Hemos detectado un error inesperado. No te preocupes, tu cuenta está segura.
                    </p>
                    {this.state.error && (
                        <div className="bg-fill-strong p-4 rounded text-left text-sm font-mono mb-8 max-w-lg w-full overflow-auto">
                            {this.state.error.message}
                        </div>
                    )}
                    <div className="flex gap-4">
                        <Button
                            onClick={() => window.location.reload()}
                            className="bg-primary text-black hover:bg-primary/80"
                        >
                            Recargar Página
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => window.location.href = '/'}
                            className="border-hairline-strong hover:bg-fill-strong"
                        >
                            Volver al Inicio
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
