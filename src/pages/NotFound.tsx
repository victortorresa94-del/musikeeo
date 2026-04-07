import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-6xl font-black text-primary font-heading mb-4">404</h1>
            <p className="text-xl text-foreground font-semibold mb-2">Pagina no encontrada</p>
            <p className="text-muted-foreground mb-6">Lo sentimos, esta pagina no existe.</p>
            <Link to="/feed" className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all">
                Volver al inicio
            </Link>
        </div>
    );
}
