import { Disc3, ExternalLink, Flag, Guitar, Mic, Music2, Tag, Users, Zap, type LucideIcon } from 'lucide-react';

// Un icono por tipo de dato de la ficha, para reconocer cada píldora de un vistazo
export const ICONO_CAMPO: Record<'tono' | 'capo' | 'canta' | 'proyectos' | 'estilo' | 'energia' | 'estado' | 'etiqueta' | 'enlace', LucideIcon> = {
    tono: Music2, capo: Guitar, canta: Mic, proyectos: Users, estilo: Disc3, energia: Zap, estado: Flag, etiqueta: Tag, enlace: ExternalLink,
};
