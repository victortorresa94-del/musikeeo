import { useEffect, useMemo, useState } from 'react';
import { posturasDe } from '../../lib/diagramas';
import { cerrarAcordes, escucharAcordes, type PeticionAcorde } from '../../lib/verAcorde';
import { DiagramaAcorde } from './Diagrama';
import { BotonHoja, Hoja } from './Hoja';

// El visor de diagramas, uno para toda la app: un acorde con «Cambiar» para ver otras
// posturas, o todos los de la canción en fila
export default function VisorDiagramas() {
    const [peticion, setPeticion] = useState<PeticionAcorde>(null);
    useEffect(() => escucharAcordes(setPeticion), []);
    const abierta = !!peticion;
    const uno = peticion?.nombres.length === 1 ? peticion.nombres[0] : null;
    return (
        <Hoja abierta={abierta} onCerrar={cerrarAcordes} titulo={uno ? 'Acorde' : 'Acordes de la canción'} derecha={<BotonHoja fuerte onClick={cerrarAcordes}>Listo</BotonHoja>} encima>
            {peticion && (uno ? <UnAcorde key={uno} nombre={uno} /> : <Todos nombres={peticion.nombres} />)}
        </Hoja>
    );
}

function UnAcorde({ nombre }: { nombre: string }) {
    const lista = useMemo(() => posturasDe(nombre), [nombre]);
    const [i, setI] = useState(0);
    if (!lista.length) return <p className="px-4 pb-6 text-center text-[15px] text-muted-foreground">No sabemos dibujar «{nombre}» todavía.</p>;
    const p = lista[i];
    return (
        <div className="px-4 pb-6 flex flex-col items-center">
            <p className="font-heading text-[34px] font-bold leading-none text-foreground">{nombre}</p>
            <DiagramaAcorde postura={p} ancho={190} className="mt-3" />
            <p className="mt-1 text-[13px] text-muted-foreground tabular-nums">Postura {i + 1} de {lista.length}{p.base > 1 ? ` · traste ${p.base}` : ''}</p>
            {lista.length > 1 && (
                <div className="mt-3 flex gap-2">
                    <button onClick={() => setI(n => (n - 1 + lista.length) % lista.length)} className="pulsable h-10 px-4 rounded-full bg-fill text-[15px] font-semibold text-foreground">Anterior</button>
                    <button onClick={() => setI(n => (n + 1) % lista.length)} className="pulsable h-10 px-5 rounded-full bg-foreground text-background text-[15px] font-semibold">Cambiar</button>
                </div>
            )}
        </div>
    );
}

function Todos({ nombres }: { nombres: string[] }) {
    const [elegidas, setElegidas] = useState<Record<string, number>>({});
    return (
        <div className="px-3 pb-6 grid grid-cols-3 gap-x-1 gap-y-3">
            {nombres.map(n => {
                const lista = posturasDe(n);
                const i = elegidas[n] ?? 0;
                return (
                    <button key={n} onClick={() => lista.length > 1 && setElegidas(e => ({ ...e, [n]: (i + 1) % lista.length }))}
                        className="flex flex-col items-center rounded-2xl py-1 active:bg-fill" aria-label={`${n}: toca para cambiar de postura`}>
                        <span className="text-[17px] font-bold text-foreground">{n}</span>
                        {lista.length ? <DiagramaAcorde postura={lista[i]} ancho={96} /> : <span className="py-8 text-[12px] text-muted-foreground">Sin dibujo</span>}
                    </button>
                );
            })}
            <p className="col-span-3 text-center text-[12.5px] text-muted-foreground">Toca un diagrama para ver otra postura.</p>
        </div>
    );
}
