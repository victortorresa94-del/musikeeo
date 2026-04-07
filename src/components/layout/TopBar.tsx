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
        <header className="h-14 border-b border-border bg-background/95 backdrop-blur-md hidden md:flex items-center justify-between px-4 sticky top-0 z-20">
            {/* Logo — visible on mobile, hidden on desktop (sidebar has it) */}
            <Link to="/feed" className="flex items-center gap-2">
                <img src="/logo-musikeeo.png" alt="Musikeeo" className="h-8 w-8 rounded-lg object-contain" />
                <span className="text-foreground font-bold text-lg font-heading">Musikeeo</span>
            </Link>

            {/* Search bar — desktop only */}
            <div className="flex-1 max-w-xl mx-4 hidden md:block">
                <div className="relative group">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Buscar artistas, gigs, equipo..."
                        className="pl-10 bg-muted/50 border-border focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all h-9"
                    />
                </div>
            </div>

            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-muted text-muted-foreground hover:text-foreground"
                    onClick={() => navigate('/messages')}
                >
                    <MessageCircle className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_rgba(255,216,77,0.6)] border border-background" />
                </Button>

                <Button variant="ghost" size="icon" className="relative hover:bg-muted text-muted-foreground hover:text-foreground">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive shadow-[0_0_6px_rgba(239,68,68,0.6)] border border-background" />
                </Button>

                <div
                    className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 p-[1px] cursor-pointer ml-1"
                    onClick={() => navigate('/profile')}
                >
                    <div className="h-full w-full rounded-full bg-background flex items-center justify-center">
                        <span className="font-bold text-xs text-foreground">M</span>
                    </div>
                </div>
            </div>
        </header>
    );
};
