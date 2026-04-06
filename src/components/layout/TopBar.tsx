import { Bell, Search, MessageCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useNavigate, Link } from 'react-router-dom';

interface TopBarProps {
    onMenuClick: () => void;
}

export const TopBar = ({ onMenuClick: _onMenuClick }: TopBarProps) => {
    const navigate = useNavigate();

    return (
        <header className="h-14 border-b border-white/5 bg-background/90 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-20">
            {/* Logo — visible on mobile, hidden on desktop (sidebar has it) */}
            <Link to="/feed" className="flex items-center gap-2 md:hidden">
                <img src="/logo-musikeeo.png" alt="Musikeeo" className="h-8 w-8 rounded-lg object-contain" />
                <span className="text-white font-bold text-lg font-heading">Musikeeo</span>
            </Link>

            {/* Search bar — desktop only */}
            <div className="flex-1 max-w-xl mx-4 hidden md:block">
                <div className="relative group">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                    <Input
                        placeholder="Buscar artistas, gigs, equipo..."
                        className="pl-10 bg-white/5 border-white/5 focus-visible:ring-accent/50 focus-visible:border-accent/50 transition-all h-9"
                    />
                </div>
            </div>

            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-white/5 text-muted-foreground hover:text-white"
                    onClick={() => navigate('/messages')}
                >
                    <MessageCircle className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-cyan shadow-[0_0_6px_#37B7F6] border border-background" />
                </Button>

                <Button variant="ghost" size="icon" className="relative hover:bg-white/5 text-muted-foreground hover:text-white">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-lime shadow-[0_0_6px_#82FF1F] border border-background" />
                </Button>

                <div
                    className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-petrol to-brand-cyan p-[1px] cursor-pointer ml-1"
                    onClick={() => navigate('/profile')}
                >
                    <div className="h-full w-full rounded-full bg-black flex items-center justify-center">
                        <span className="font-bold text-xs text-white">M</span>
                    </div>
                </div>
            </div>
        </header>
    );
};
