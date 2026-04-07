import { Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PanelSidebar } from '../components/panel/PanelSidebar';

export const PanelLayout = () => {
    const location = useLocation();
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

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
            <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
                {/* Mobile Header */}
                <div className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMobileNavOpen(true)}
                            className="p-2 -ml-2 text-foreground hover:bg-muted rounded-lg"
                        >
                            <Menu size={24} />
                        </button>
                        <span className="font-bold text-foreground text-lg tracking-tight">Musikeeo Panel</span>
                    </div>
                </div>

                <Outlet />
            </main>
        </div>
    );
};
