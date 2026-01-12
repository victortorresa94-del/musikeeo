import { NavLink } from 'react-router-dom';
import { Home, Calendar, ShoppingBag, Radio, User, LogOut, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
    };

    const navItems = [
        { icon: Home, label: 'Feed', path: '/' },
        { icon: Search, label: 'Descubrir', path: '/discover' },
        { icon: Calendar, label: 'Eventos', path: '/events' },
        { icon: ShoppingBag, label: 'Mercado', path: '/market' },
        { icon: Radio, label: 'Proyectos', path: '/projects' },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 border-r border-white/5 bg-background h-screen sticky top-0">
            {/* Brand */}
            <div className="p-6 flex items-center gap-3">
                <div className="relative h-10 w-10">
                    <img src="/logo-musikeeo.png" alt="M" className="h-full w-full object-contain rounded-xl" />
                    <div className="absolute inset-0 bg-brand-cyan blur-xl opacity-20 rounded-full"></div>
                </div>
                <span className="text-2xl font-heading font-bold text-white tracking-wide">
                    Musikeeo
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 mt-4">
                <p className="px-4 text-xs font-mono text-muted-foreground mb-4 uppercase tracking-wider">Main Module</p>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                                isActive
                                    ? "bg-brand-petrol/20 text-brand-cyan shadow-[0_0_15px_rgba(55,183,246,0.1)] border border-brand-petrol/30"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", isActive && "text-brand-lime drop-shadow-[0_0_5px_rgba(130,255,31,0.5)]")} />
                                <span className="font-medium">{item.label}</span>
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-cyan shadow-[0_0_8px_#37B7F6]" />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-white/5 mx-4 mb-4 bg-white/5 rounded-2xl">
                <div className="flex items-center gap-3">
                    <NavLink to="/profile" className="flex items-center gap-3 flex-1 overflow-hidden group">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-brand-petrol to-brand-lime p-[2px]">
                            <div className="h-full w-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                {user?.photoURL ? <img src={user.photoURL} alt={user.displayName || 'User'} className="h-full w-full object-cover" /> : <User className="h-5 w-5" />}
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-white truncate group-hover:text-brand-cyan transition-colors">{user?.displayName || 'Usuario'}</p>
                            <p className="text-xs text-brand-lime truncate">Músico Pro</p>
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
