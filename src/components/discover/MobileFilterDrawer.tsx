import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { DiscoverSidebar } from './DiscoverSidebar';
import { ProviderSidebar } from './ProviderSidebar';
import { createPortal } from 'react-dom';

interface MobileFilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    filters: any;
    onFilterChange: (key: string, value: any) => void;
    isSoundServices?: boolean;
}

export const MobileFilterDrawer = ({ isOpen, onClose, filters, onFilterChange, isSoundServices }: MobileFilterDrawerProps) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Drawer Content */}
            <div className="relative w-full h-[85vh] sm:h-full sm:w-80 bg-surface border-t sm:border-l border-white/10 shadow-2xl flex flex-col rounded-t-2xl sm:rounded-none animate-in slide-in-from-bottom sm:slide-in-from-right duration-300">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white uppercase tracking-wide">
                        {isSoundServices ? 'Filtros de Proveedor' : 'Filtros'}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-white">
                        <X size={24} />
                    </Button>
                </div>

                {/* Reuse the existing Sidebar content logic */}
                <div className="flex-1 overflow-hidden">
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

                <div className="p-4 border-t border-white/10">
                    <Button className="w-full bg-primary text-black font-bold h-12 text-base" onClick={onClose}>
                        Ver Resultados
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};
