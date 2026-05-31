import { Instagram, Mail } from 'lucide-react';
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
                        Conectamos músicos, técnicos y promotores por toda España.
                        <br />
                        <span className="text-primary">Conecta. Crea. Suena.</span>
                    </p>
                </div>

                {/* Descubrir */}
                <div>
                    <h4 className="text-white font-bold mb-6 font-heading">Descubrir</h4>
                    <ul className="flex flex-col gap-3 text-muted-foreground text-sm">
                        <li><Link to="/discover" className="hover:text-primary transition-colors">Músicos y Técnicos</Link></li>
                        <li><Link to="/eventos" className="hover:text-primary transition-colors">Eventos y Bolos</Link></li>
                        <li><Link to="/market" className="hover:text-primary transition-colors">Mercado</Link></li>
                        <li><Link to="/rodrigo" className="hover:text-primary transition-colors">Rodrigo AI</Link></li>
                    </ul>
                </div>

                {/* Comunidad */}
                <div>
                    <h4 className="text-white font-bold mb-6 font-heading">Tu cuenta</h4>
                    <ul className="flex flex-col gap-3 text-muted-foreground text-sm">
                        <li><Link to="/register" className="hover:text-primary transition-colors">Crear cuenta</Link></li>
                        <li><Link to="/login" className="hover:text-primary transition-colors">Iniciar sesión</Link></li>
                        <li><Link to="/publicar" className="hover:text-primary transition-colors">Publicar un bolo</Link></li>
                        <li><Link to="/market/create" className="hover:text-primary transition-colors">Vender o alquilar</Link></li>
                    </ul>
                </div>

                {/* Legal */}
                <div>
                    <h4 className="text-white font-bold mb-6 font-heading">Legal</h4>
                    <ul className="flex flex-col gap-3 text-muted-foreground text-sm">
                        <li><Link to="/aviso-legal" className="hover:text-primary transition-colors">Aviso legal</Link></li>
                        <li><Link to="/terminos" className="hover:text-primary transition-colors">Términos y condiciones</Link></li>
                        <li><Link to="/privacidad" className="hover:text-primary transition-colors">Privacidad</Link></li>
                        <li><Link to="/cookies" className="hover:text-primary transition-colors">Cookies</Link></li>
                    </ul>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-muted-foreground text-xs text-center md:text-left">
                    © {new Date().getFullYear()} Musikeeo · Hecho con <span className="text-primary">♥</span> en España
                </p>
                <div className="flex items-center gap-5">
                    <a
                        href="mailto:hola@musikeeo.com"
                        className="text-gray-400 hover:text-primary transition-colors"
                        aria-label="Email"
                    >
                        <Mail size={20} />
                    </a>
                    <a
                        href="https://instagram.com/musikeeo"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-primary transition-colors"
                        aria-label="Instagram"
                    >
                        <Instagram size={20} />
                    </a>
                </div>
            </div>
        </footer>
    );
};
