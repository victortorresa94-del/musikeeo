import { Facebook, Instagram, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
    return (
        <footer className="bg-[#050505] border-t border-white/10 pt-16 pb-8 px-4 md:px-10 relative z-10">
            <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

                {/* Brand Column */}
                <div className="col-span-1 md:col-span-1">
                    <Link to="/" className="flex items-center gap-2 text-white mb-6 group">
                        <div className="text-primary transition-transform group-hover:scale-110">
                            <span className="material-symbols-outlined !text-[32px]">equalizer</span>
                        </div>
                        <span className="font-heading font-bold text-xl">Musikeeo</span>
                    </Link>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Conectando el mejor talento musical con escenarios inolvidables. La plataforma líder en booking musical en Latinoamérica.
                    </p>
                </div>

                {/* Links Columns */}
                <div>
                    <h4 className="text-white font-bold mb-6 font-heading">Descubrir</h4>
                    <ul className="flex flex-col gap-3 text-muted-foreground text-sm">
                        <li><Link to="/artistas" className="hover:text-primary transition-colors">Músicos</Link></li>
                        <li><Link to="/sonido" className="hover:text-primary transition-colors">DJs y Sonido</Link></li>
                        <li><Link to="/eventos" className="hover:text-primary transition-colors">Eventos</Link></li>
                        <li><Link to="/rodrigo" className="hover:text-primary transition-colors">Rodrigo AI</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-6 font-heading">Para Músicos</h4>
                    <ul className="flex flex-col gap-3 text-muted-foreground text-sm">
                        <li><Link to="/registro-musico" className="hover:text-primary transition-colors">Crear Perfil</Link></li>
                        <li><Link to="/recursos" className="hover:text-primary transition-colors">Recursos</Link></li>
                        <li><Link to="/comunidad" className="hover:text-primary transition-colors">Comunidad</Link></li>
                        <li><Link to="/exito" className="hover:text-primary transition-colors">Historias de Éxito</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-6 font-heading">Soporte</h4>
                    <ul className="flex flex-col gap-3 text-muted-foreground text-sm">
                        <li><Link to="/ayuda" className="hover:text-primary transition-colors">Centro de Ayuda</Link></li>
                        <li><Link to="/seguridad" className="hover:text-primary transition-colors">Confianza y Seguridad</Link></li>
                        <li><Link to="/terminos" className="hover:text-primary transition-colors">Términos de Servicio</Link></li>
                        <li><Link to="/privacidad" className="hover:text-primary transition-colors">Privacidad</Link></li>
                    </ul>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-muted-foreground text-xs">© 2023 Musikeeo Inc. Todos los derechos reservados.</p>
                <div className="flex gap-6">
                    <a href="#" className="text-gray-400 hover:text-white transition-colors"><Facebook size={20} /></a>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors"><Instagram size={20} /></a>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors"><Twitter size={20} /></a>
                </div>
            </div>
        </footer>
    );
};
