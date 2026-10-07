import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PanelSidebar } from '../components/panel/PanelSidebar';
import { BottomNav } from '../components/layout/BottomNav';

// Nombre de cada sección para la cabecera móvil
const SECTION_TITLES: Record<string, string> = {
    '/panel/perfil': 'Mi perfil',
    '/panel/calendario': 'Calendario',
    '/panel/multimedia': 'Multimedia',
    '/panel/servicios': 'Servicios y precios',
    '/panel/eventos': 'Mis eventos',
    '/panel/perfil-organizador': 'Perfil organizador',
    '/panel/servicios-tecnicos': 'Mis servicios',
    '/panel/perfil-tecnico': 'Perfil técnico',
    '/panel/ajustes': 'Ajustes',
};

export const PanelLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const title = SECTION_TITLES[location.pathname] || 'Mi panel';

    // En la app instalada no hay botón «atrás» del navegador: si hay historial
    // dentro de la app se vuelve, si se entró directo se va a la home
    const goBack = () => {
        const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
        if (idx > 0) navigate(-1);
        else navigate('/home');
    };

    // Close mobile nav on route change
    useEffect(() => {
        setIsMobileNavOpen(false);
    }, [location.pathname]);

    return (
        <div className="flex min-h-screen w-full bg-background text-foreground font-sans">
            {/* Desktop Sidebar */}
            <aside className="w-[280px] flex-shrink-0 flex-col border-r border-border bg-background h-screen sticky top-0 hidden md:flex">
                <PanelSidebar />
            </aside>

            {/* Mobile Nav Overlay */}
            {isMobileNavOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setIsMobileNavOpen(false)}
                    />
                    <aside className="relative flex flex-col w-[85%] max-w-[300px] h-full bg-background border-r border-border shadow-2xl animate-in slide-in-from-left duration-300">
                        <button
                            onClick={() => setIsMobileNavOpen(false)}
                            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground z-50 bg-muted rounded-full"
                        >
                            <X size={20} />
                        </button>
                        <PanelSidebar />
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-y-auto relative pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">
                {/* Cabecera móvil: atrás · sección · menú */}
                <div className="md:hidden sticky top-0 z-40 h-14 px-2 grid grid-cols-[44px_1fr_44px] items-center bg-background/85 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/[0.06]">
                    <button onClick={goBack} aria-label="Volver" className="h-11 w-11 flex items-center justify-center text-foreground active:opacity-60">
                        <ChevronLeft className="h-7 w-7" />
                    </button>
                    <span className="text-center font-semibold text-[17px] text-foreground truncate">{title}</span>
                    <button onClick={() => setIsMobileNavOpen(true)} aria-label="Menú del panel" className="h-11 w-11 flex items-center justify-center text-foreground active:opacity-60">
                        <Menu className="h-6 w-6" />
                    </button>
                </div>

                <Outlet />
            </main>

            {/* La misma barra de la app: siempre se puede salir del panel */}
            <BottomNav />
        </div>
    );
};
