import { useState } from 'react';

// «Suena | Formas» en el cifrado: se recuerda en el móvil
export function useFormas(): [boolean, (f: boolean) => void] {
    const [formas, setFormas] = useState(() => { try { return localStorage.getItem('musikeeo-cifrado-formas') === '1'; } catch { return false; } });
    const cambiar = (f: boolean) => { setFormas(f); try { localStorage.setItem('musikeeo-cifrado-formas', f ? '1' : '0'); } catch { /* */ } };
    return [formas, cambiar];
}

