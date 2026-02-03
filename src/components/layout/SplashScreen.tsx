import { useEffect, useState } from 'react';

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Mantener el splash screen visible por 2.5 segundos
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onFinish, 500); // Dar tiempo para la animación de salida
        }, 2500);

        return () => clearTimeout(timer);
    }, [onFinish]);

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-brand-black transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
        >
            <div className="relative flex flex-col items-center">
                {/* Logo con efecto de pulso/resplandor */}
                <div className="relative">
                    <div className="absolute inset-0 bg-brand-yellow blur-3xl opacity-20 rounded-full"></div>
                    <img
                        src="/logo-musikeeo.png"
                        alt="Musikeeo Isotype"
                        className="w-24 h-24 md:w-32 md:h-32 object-contain relative z-10 animate-fade-in-up rounded-3xl"
                    />
                </div>

                {/* Texto de carga opcional o slogan */}
                <p className="mt-8 font-heading text-brand-white/50 text-sm tracking-[0.2em] uppercase animate-pulse">
                    The sound of live
                </p>
            </div>
        </div>
    );
};

export default SplashScreen;
