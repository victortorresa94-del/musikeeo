import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCancionero } from '../../hooks/useCancionero';
import { BotonHoja, Hoja } from './Hoja';
import type { Cancion } from '../../types/cancionero';

// Tu versión de una canción: una copia unida a la original (su portada, ficha, tono y ajustes)
// que puedes recortar y cambiar sin tocar la original. Se abre para editarla
export function HacerVersion({ cancion, abierta, onCerrar }: { cancion: Cancion; abierta: boolean; onCerrar: () => void }) {
    const navigate = useNavigate();
    const { canciones, nuevaCancion, guardar } = useCancionero();
    const [nombre, setNombre] = useState('');
    const base = cancion.original ? canciones.find(c => c.id === cancion.original) ?? cancion : cancion;
    const otras = canciones.filter(c => c.original === base.id).map(c => c.version).filter(Boolean);
    const hacer = () => {
        const version = nombre.trim().slice(0, 40) || 'Mía';
        const nueva = nuevaCancion({ titulo: base.titulo, artista: base.artista, texto: cancion.texto });
        guardar({
            ...nueva, ajustes: { ...cancion.ajustes }, ficha: cancion.ficha && { ...cancion.ficha },
            portada: cancion.portada, duracion: cancion.duracion, muestra: cancion.muestra, bpm: cancion.bpm,
            version, original: base.id,
        });
        setNombre('');
        onCerrar();
        toast.success(`Versión «${version}» creada`, { description: 'Borra lo que no toquéis y pon su tono y lo que dura. La original no cambia.' });
        navigate(`/cancionero/${nueva.id}/editar`);
    };
    return (
        <Hoja abierta={abierta} onCerrar={onCerrar} titulo="Hacer mi versión"
            izquierda={<BotonHoja onClick={onCerrar}>Cancelar</BotonHoja>}
            derecha={<BotonHoja fuerte onClick={hacer}>Crear</BotonHoja>}>
            <div className="px-4 pb-5">
                <p className="text-[15px] text-muted-foreground">
                    Una copia de «{base.titulo}» para tocarla a tu manera: recórtala, cambia el tono o la cejilla y pon lo que dura.
                    Al buscarla o añadirla a un repertorio sale tu versión primero.
                </p>
                <input value={nombre} onChange={e => setNombre(e.target.value.slice(0, 40))} onKeyDown={e => { if (e.key === 'Enter') hacer(); }}
                    placeholder="Nombre: Víctor, Cataleya, acústica…" aria-label="Nombre de la versión" enterKeyHint="done"
                    className="mt-4 w-full h-11 rounded-xl bg-fill px-3 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10" />
                {otras.length > 0 && <p className="mt-2 text-[13px] text-muted-foreground">Ya tienes: {otras.join(', ')}.</p>}
            </div>
        </Hoja>
    );
}
