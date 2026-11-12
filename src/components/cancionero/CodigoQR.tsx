import { useEffect, useState } from 'react';

// El QR del enlace, para enseñarlo en el ensayo y que lo escaneen. Se genera en el móvil
// (qrcode-generator, en su trozo) y se dibuja como un solo trazo SVG
export function CodigoQR({ texto, tamano = 220 }: { texto: string; tamano?: number }) {
    const [dibujo, setDibujo] = useState<{ n: number; d: string } | null>(null);
    const [demasiado, setDemasiado] = useState(false);
    useEffect(() => {
        let vivo = true;
        void import('qrcode-generator').then(({ default: qrcode }) => {
            try {
                const qr = qrcode(0, 'L');
                qr.addData(texto, 'Byte');
                qr.make();
                const n = qr.getModuleCount();
                let d = '';
                for (let f = 0; f < n; f++) for (let c = 0; c < n; c++) if (qr.isDark(f, c)) d += `M${c},${f}h1v1h-1z`;
                if (vivo) { setDibujo({ n, d }); setDemasiado(false); }
            } catch {
                if (vivo) { setDibujo(null); setDemasiado(true); }
            }
        });
        return () => { vivo = false; };
    }, [texto]);
    if (demasiado) return <p className="text-[13px] text-muted-foreground">El enlace es demasiado largo para un QR. Compártelo cifrado.</p>;
    if (!dibujo) return <div style={{ width: tamano, height: tamano }} className="rounded-2xl bg-fill" />;
    const m = 2;
    return (
        <svg viewBox={`${-m} ${-m} ${dibujo.n + m * 2} ${dibujo.n + m * 2}`} width={tamano} height={tamano} role="img" aria-label="Código QR del enlace"
            className="rounded-2xl bg-white" shapeRendering="crispEdges">
            <path d={dibujo.d} fill="#000" />
        </svg>
    );
}
