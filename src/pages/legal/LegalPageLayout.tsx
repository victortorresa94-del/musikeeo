import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface Props {
    title: string;
    updatedAt: string;
    children: React.ReactNode;
}

// Marker de campos que el operador del sitio debe rellenar antes de lanzar.
// Buscar `[` en estos ficheros para localizarlos rápido.
export default function LegalPageLayout({ title, updatedAt, children }: Props) {
    return (
        <div className="dark min-h-screen bg-background text-foreground">
            <header className="border-b border-border bg-[#0a0a0a]">
                <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="font-heading font-black text-lg hover:text-primary transition-colors">Musikeeo</Link>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={14} /> Volver al inicio
                    </Link>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 md:px-6 py-10 md:py-14">
                <h1 className="font-heading text-3xl md:text-4xl font-black tracking-tight mb-2">{title}</h1>
                <p className="text-sm text-muted-foreground mb-10">Última actualización: {updatedAt}</p>

                <article className="legal-prose space-y-4 text-muted-foreground leading-relaxed">
                    {children}
                </article>

                <footer className="mt-16 pt-6 border-t border-border text-xs text-muted-foreground">
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                        <Link to="/aviso-legal" className="hover:text-primary transition-colors">Aviso legal</Link>
                        <Link to="/privacidad" className="hover:text-primary transition-colors">Privacidad</Link>
                        <Link to="/cookies" className="hover:text-primary transition-colors">Cookies</Link>
                        <Link to="/terminos" className="hover:text-primary transition-colors">Términos</Link>
                    </div>
                </footer>
            </main>
        </div>
    );
}
