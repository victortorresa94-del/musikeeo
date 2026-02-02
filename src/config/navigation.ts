import {
    User, Calendar, PlayCircle, CreditCard, LayoutDashboard, Briefcase, Zap, Settings
} from 'lucide-react';
import type { UserMode } from '../types';

export interface NavItem {
    icon: any; // Lucide icon type
    label: string;
    href: string;
}

export const NAVIGATION_CONFIG: Record<UserMode, NavItem[]> = {
    musician: [
        { icon: User, label: 'Mi Perfil Artístico', href: '/panel/perfil' },
        { icon: Calendar, label: 'Calendario', href: '/panel/calendario' },
        { icon: PlayCircle, label: 'Multimedia', href: '/panel/multimedia' },
        { icon: CreditCard, label: 'Servicios y Precios', href: '/panel/servicios' },
    ],
    organizer: [
        { icon: LayoutDashboard, label: 'Mis Eventos', href: '/panel/eventos' },
        { icon: User, label: 'Perfil Organizador', href: '/panel/perfil-organizador' },
        { icon: Zap, label: 'Crear Evento', href: '/eventos/crear' },
        { icon: Calendar, label: 'Calendario', href: '/panel/calendario' },
    ],
    provider: [
        { icon: Briefcase, label: 'Mis Servicios', href: '/panel/servicios-tecnicos' },
        { icon: User, label: 'Perfil Técnico', href: '/panel/perfil-tecnico' },
        { icon: Calendar, label: 'Disponibilidad', href: '/panel/calendario' },
    ]
};

export const COMMON_LINKS = [
    { icon: Settings, label: 'Ajustes de Cuenta', href: '/panel/ajustes' }
];
