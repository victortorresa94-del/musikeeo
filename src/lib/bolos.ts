import type { Repertorio } from '../types/cancionero';

// La hora del bolo escrita en el nombre («Lady Jarana · Pallejà 12:30», «… 19h00»), en minutos
export function horaDelNombre(nombre: string): number | null {
    const m = /(?:^|\D)([01]?\d|2[0-3])\s*[:h.]\s*([0-5]\d)(?!\d)/i.exec(nombre);
    return m ? +m[1] * 60 + +m[2] : null;
}

// Por fecha y, el mismo día, por la hora del nombre (sin hora, por cuándo se creó)
export function antesQue(a: Repertorio, b: Repertorio): number {
    const f = a.fecha.localeCompare(b.fecha);
    if (f) return f;
    const ha = horaDelNombre(a.nombre), hb = horaDelNombre(b.nombre);
    if (ha !== null && hb !== null && ha !== hb) return ha - hb;
    if (ha !== null && hb === null) return -1;
    if (hb !== null && ha === null) return 1;
    return (a.creadaEn ?? '').localeCompare(b.creadaEn ?? '');
}
