import { NavLink } from 'react-router-dom';
import { Home, Calendar, ShoppingBag, User, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export const BottomNav = () => {
    const navItems = [
        { icon: Home, label: 'Feed', path: '/' },
        { icon: Search, label: 'Descubrir', path: '/discover' },
        { icon: Calendar, label: 'Eventos', path: '/events' },
        { icon: ShoppingBag, label: 'Tienda', path: '/market' },
        { icon: User, label: 'Perfil', path: '/profile' },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-background/90 backdrop-blur-xl border-t border-white/10 pb-safe z-50">
            <div className="flex items-center justify-around h-full px-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            cn(
                                "relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                                isActive ? "text-brand-cyan" : "text-muted-foreground"
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className="relative">
                                    <item.icon className={cn("h-6 w-6 transition-transform duration-300", isActive && "-translate-y-1 scale-110")} />
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-glow"
                                            className="absolute inset-0 bg-brand-cyan/50 blur-lg rounded-full"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    )}
                                </div>
                                <span className={cn("text-[10px] font-medium transition-opacity", isActive ? "opacity-100" : "opacity-0")}>
                                    {item.label}
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-indicator"
                                        className="absolute -top-[1px] w-12 h-1 bg-brand-cyan rounded-b-full shadow-[0_0_10px_#37B7F6]"
                                    />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};
