import { Bell, Search, Menu, Bot } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface TopBarProps {
    onMenuClick: () => void;
    onAIToggle: () => void;
    isAIOpen: boolean;
}

export const TopBar = ({ onMenuClick, onAIToggle, isAIOpen }: TopBarProps) => {
    return (
        <header className="h-16 border-b border-white/5 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-20">
            <div className="flex items-center gap-4 md:hidden">
                <Button variant="ghost" size="icon" onClick={onMenuClick}>
                    <Menu className="h-5 w-5" />
                </Button>
                {/* Mobile Logo */}
                <div className="flex items-center gap-2">
                    <img src="/logo-musikeeo.png" alt="Musikeeo" className="h-8 w-auto" />
                </div>
            </div>

            <div className="flex-1 max-w-xl mx-4 hidden md:block">
                <div className="relative group">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-accent transition-colors" />
                    <Input
                        placeholder="Buscar artistas, gigs, equipo..."
                        className="pl-10 bg-white/5 border-white/5 focus-visible:ring-accent/50 focus-visible:border-accent/50 transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onAIToggle}
                    className={`hidden lg:flex items-center gap-2 ${isAIOpen ? 'text-brand-lime bg-brand-lime/10' : 'text-muted-foreground hover:text-white'}`}
                >
                    <Bot className="h-5 w-5" />
                    <span className="hidden xl:inline">{isAIOpen ? 'Asistente' : 'Activar IA'}</span>
                </Button>

                <Button variant="ghost" size="icon" className="relative hover:bg-white/5 text-muted-foreground hover:text-white">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-3 h-2 w-2 rounded-full bg-brand-lime shadow-[0_0_8px_#82FF1F]" />
                </Button>
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-petrol to-brand-cyan p-[1px]">
                    <div className="h-full w-full rounded-full bg-black flex items-center justify-center">
                        <span className="font-heading font-bold text-xs">JP</span>
                    </div>
                </div>
            </div>
        </header>
    );
};
