import { NavLink } from 'react-router-dom';
import { Home, Calendar, ShoppingBag, Radio, User, LogOut, Search, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
    };

    const navItems = [
        { icon: Home, label: 'Feed', path: '/feed' },
        { icon: Search, label: 'Descubrir', path: '/discover' },
        { icon: Calendar, label: 'Eventos', path: '/eventos' },
        { icon: ShoppingBag, label: 'Mercado', path: '/market' },
        { icon: Radio, label: 'Proyectos', path: '/projects' },
        { icon: Zap, label: 'Rodrigo AI', path: '/rodrigo' },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 border-r border-border bg-background h-screen sticky top-0">
            {/* Brand */}
            <div className="p-6 flex items-center gap-3">
                <div className="relative h-10 w-10">
                    <img src="/logo-musikeeo.png" alt="M" className="h-full w-full object-contain rounded-xl" />
                </div>
                <span className="text-2xl font-heading font-bold text-foreground tracking-wide">
                    Musikeeo
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1 mt-4">
                <p className="px-4 text-xs font-mono text-muted-foreground mb-4 uppercase tracking-wider">Menu</p>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", isActive && "text-primary")} />
                                <span className="font-medium">{item.label}</span>
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-border mx-4 mb-4 bg-muted/50 rounded-2xl">
                <div className="flex items-center gap-3">
                    <NavLink to="/profile" className="flex items-center gap-3 flex-1 overflow-hidden group">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-primary/60 p-[2px]">
                            <div className="h-full w-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                                {user?.photoURL ? <img src={user.photoURL} alt={user.displayName || 'User'} loading="lazy" className="h-full w-full object-cover" /> : <User className="h-5 w-5 text-muted-foreground" />}
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{user?.displayName || 'Usuario'}</p>
                            <p className="text-xs text-muted-foreground truncate">Músico</p>
                        </div>
                    </NavLink>
                    <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive shrink-0">
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </aside>
    );
};
