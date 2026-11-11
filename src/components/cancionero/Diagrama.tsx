import type { Postura } from '../../lib/diagramas';

// El diagrama de una postura, dibujado en SVG: 6 cuerdas, 5 trastes, puntos con el dedo,
// × (no se toca) y ○ (al aire), la cejilla como una barra y el traste donde empieza
export function DiagramaAcorde({ postura, ancho = 120, className }: { postura: Postura; ancho?: number; className?: string }) {
    const cuerdas = 6, trastes = 5;
    const m = { x: 22, arriba: 26, abajo: 8 };
    const sepX = (100 - 30) / (cuerdas - 1);
    const sepY = 22;
    const alto = m.arriba + sepY * trastes + m.abajo;
    const x = (i: number) => m.x + i * sepX;
    const y = (f: number) => m.arriba + (f - postura.base + 0.5) * sepY;
    const desc = postura.trastes.map(t => (t === null ? 'x' : t)).join(' ');
    return (
        <svg viewBox={`0 0 110 ${alto}`} width={ancho} height={(ancho * alto) / 110} className={className} role="img" aria-label={`Postura ${desc}`}>
            {/* Cejuela (si empieza en el 1) o el número del traste */}
            {postura.base === 1
                ? <rect x={m.x - 1} y={m.arriba - 4} width={sepX * 5 + 2} height={4} rx={1} className="fill-foreground" />
                : <text x={m.x - 6} y={m.arriba + sepY * 0.5 + 4} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 11, fontWeight: 700 }}>{postura.base}</text>}
            {Array.from({ length: trastes + 1 }, (_, f) => (
                <line key={`t${f}`} x1={m.x} x2={m.x + sepX * 5} y1={m.arriba + f * sepY} y2={m.arriba + f * sepY} className="stroke-muted-foreground" strokeWidth={f === 0 ? 1.2 : 1} opacity={0.6} />
            ))}
            {Array.from({ length: cuerdas }, (_, c) => (
                <line key={`c${c}`} x1={x(c)} x2={x(c)} y1={m.arriba} y2={m.arriba + sepY * trastes} className="stroke-foreground" strokeWidth={1.1} opacity={0.75} />
            ))}
            {postura.trastes.map((t, c) => (t === null
                ? <text key={`e${c}`} x={x(c)} y={m.arriba - 9} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 11, fontWeight: 700 }}>×</text>
                : t === 0 ? <circle key={`e${c}`} cx={x(c)} cy={m.arriba - 13} r={3.6} fill="none" className="stroke-foreground" strokeWidth={1.3} /> : null))}
            {postura.cejilla && (
                <rect x={x(postura.cejilla.desde) - 7} y={y(postura.cejilla.traste) - 7} width={x(postura.cejilla.hasta) - x(postura.cejilla.desde) + 14} height={14} rx={7} className="fill-foreground" />
            )}
            {postura.trastes.map((t, c) => (t && t > 0 && !(postura.cejilla && t === postura.cejilla.traste && c >= postura.cejilla.desde && c <= postura.cejilla.hasta)
                ? (
                    <g key={`p${c}`}>
                        <circle cx={x(c)} cy={y(t)} r={7.5} className="fill-foreground" />
                        {postura.dedos[c] && <text x={x(c)} y={y(t) + 3.8} textAnchor="middle" className="fill-background" style={{ fontSize: 10, fontWeight: 800 }}>{postura.dedos[c]}</text>}
                    </g>
                ) : null))}
            {postura.cejilla && (
                <text x={(x(postura.cejilla.desde) + x(postura.cejilla.hasta)) / 2} y={y(postura.cejilla.traste) + 3.8} textAnchor="middle" className="fill-background" style={{ fontSize: 10, fontWeight: 800 }}>1</text>
            )}
        </svg>
    );
}
