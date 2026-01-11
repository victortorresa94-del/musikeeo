import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
    Home,
    Calendar,
    MessageSquare,
    ShoppingBag,
    Menu,
    LogOut,
    User,
    Search,
    Bell
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export const MainLayout = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/login');
    };

    const navItems = [
        { icon: Home, label: 'Inicio', path: '/' },
        { icon: Calendar, label: 'Eventos', path: '/events' },
        { icon: MessageSquare, label: 'Mensajes', path: '/messages' },
        { icon: ShoppingBag, label: 'Mercado', path: '/market' },
    ];

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Desktop Sidebar */}
            <aside
                className={`hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'
                    }`}
            >
                <div className="p-4 flex items-center justify-between border-b border-border h-16">
                    {isSidebarOpen ? (
                        <div className="flex items-center gap-2">
                            <img src="/logo-musikeeo.png" alt="Musikeeo" className="h-8 w-auto" />
                            <span className="text-xl font-heading font-bold text-primary tracking-tight">Musikeeo</span>
                        </div>
                    ) : (
                        <img src="/logo-musikeeo.png" alt="M" className="h-8 w-auto mx-auto" />
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!isSidebarOpen)}>
                        <Menu className="h-4 w-4" />
                    </Button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                }`
                            }
                        >
                            <item.icon className="h-5 w-5" />
                            {isSidebarOpen && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-border">
                    <div className={`flex items-center gap-3 ${!isSidebarOpen && 'justify-center'}`}>
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {user?.displayName?.charAt(0) || <User className="h-4 w-4" />}
                        </div>
                        {isSidebarOpen && (
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium truncate">{user?.displayName || 'User'}</p>
                                <p className="text-xs text-muted-foreground truncate">Músico</p>
                            </div>
                        )}
                        {isSidebarOpen && (
                            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                                <LogOut className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-20">
                    <div className="md:hidden">
                        {/* Mobile Logo */}
                        <div className="flex items-center gap-2">
                            <img src="/logo-musikeeo.png" alt="Musikeeo" className="h-8 w-auto" />
                            <span className="text-xl font-heading font-bold text-primary">Musikeeo</span>
                        </div>
                    </div>

                    <div className="flex-1 max-w-xl mx-4 hidden md:block">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar artistas, gigs, equipo..."
                                className="pl-9 bg-muted/50 border-none focus-visible:ring-1"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border border-card" />
                        </Button>
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Search className="h-5 w-5" />
                        </Button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
                    <div className="max-w-5xl mx-auto">
                        <Outlet />
                    </div>
                </div>

                {/* Mobile Bottom Nav */}
                <nav className="md:hidden h-16 border-t border-border bg-card flex items-center justify-around px-2 z-20 pb-safe">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-muted-foreground'
                                }`
                            }
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                    <button
                        onClick={() => navigate('/profile')}
                        className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground"
                    >
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                            {user?.displayName?.charAt(0) || <User className="h-3 w-3" />}
                        </div>
                        <span className="text-[10px] font-medium">Yo</span>
                    </button>
                </nav>
            </main>
        </div>
    );
};
