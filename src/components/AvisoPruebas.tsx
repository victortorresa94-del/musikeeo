import { esPruebas } from '../lib/firebase';

// Píldora fija que avisa de que esto NO es musikeeo.com: datos y gente de prueba (agentes)
export default function AvisoPruebas() {
    if (!esPruebas) return null;
    return (
        <div role="status" className="pointer-events-none fixed left-1/2 -translate-x-1/2 top-[calc(0.25rem+env(safe-area-inset-top))] z-[90] h-6 px-2.5 rounded-full bg-foreground text-background text-[11px] font-bold flex items-center">
            Entorno de pruebas · agentes simulados
        </div>
    );
}
