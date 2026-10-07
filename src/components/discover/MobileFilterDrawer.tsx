import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { DiscoverSidebar } from './DiscoverSidebar';
import { ProviderSidebar } from './ProviderSidebar';
import { createPortal } from 'react-dom';
import { useEffect } from 'react';

interface MobileFilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    filters: any;
    onFilterChange: (key: string, value: any) => void;
    isSoundServices?: boolean;
}

export const MobileFilterDrawer = ({ isOpen, onClose, filters, onFilterChange, isSoundServices }: MobileFilterDrawerProps) => {
    // Bloquea el scroll de la página mientras el cajón está abierto
    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Drawer Content */}
            <div role="dialog" aria-modal="true" aria-label="Filtros" className="relative w-full h-[85svh] sm:h-full sm:w-80 bg-card border-t sm:border-l border-border shadow-2xl flex flex-col rounded-t-3xl sm:rounded-none animate-in slide-in-from-bottom sm:slide-in-from-right duration-300">
                <div className="sm:hidden mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-white/20" aria-hidden />
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="font-heading text-lg font-bold text-foreground">
                        {isSoundServices ? 'Filtrar técnicos' : 'Filtrar artistas'}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar filtros" className="text-muted-foreground hover:text-foreground">
                        <X size={24} />
                    </Button>
                </div>

                {/* Reuse the existing Sidebar content logic */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                    {isSoundServices ? (
                        <ProviderSidebar
                            className="w-full border-none bg-transparent"
                            filters={filters}
                            onFilterChange={onFilterChange}
                        />
                    ) : (
                        <DiscoverSidebar
                            className="w-full border-none bg-transparent"
                            filters={filters}
                            onFilterChange={onFilterChange}
                        />
                    )}
                </div>

                <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-border">
                    <Button className="w-full bg-primary text-primary-foreground font-bold h-12 text-base rounded-2xl" onClick={onClose}>
                        Ver resultados
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};
