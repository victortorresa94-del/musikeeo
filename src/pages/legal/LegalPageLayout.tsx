import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '../../components/layout/Footer';

interface LegalPageProps {
    title: string;
    lastUpdated: string;
    children: React.ReactNode;
}

export default function LegalPageLayout({ title, lastUpdated, children }: LegalPageProps) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                        <ArrowLeft className="h-4 w-4" /> Inicio
                    </Link>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-12">
                <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight mb-2">{title}</h1>
                <p className="text-sm text-muted-foreground mb-10">Última actualización: {lastUpdated}</p>
                <article className="prose prose-invert max-w-none prose-headings:font-heading prose-headings:tracking-tight prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3 prose-h3:text-base prose-h3:mt-6 prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-a:text-primary prose-strong:text-foreground">
                    {children}
                </article>
            </main>

            <Footer />
        </div>
    );
}
