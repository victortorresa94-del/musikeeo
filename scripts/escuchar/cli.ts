// Pasa WAV por el motor: node cli.cjs <salida_dir> <wav>... (escribe .lab, .tempo.txt, .tono.txt, .hoja.txt)
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join, relative } from 'path';
import { escuchar, hojaDeAcordes, nombreAcorde, conBemoles, AJUSTES_ESCUCHA } from '../../src/lib/escuchar';

function leerWav(ruta: string): { x: Float32Array; sr: number } {
    const b = readFileSync(ruta);
    let p = 12, sr = 0, canales = 1, bits = 16, formato = 1;
    while (p < b.length) {
        const id = b.toString('ascii', p, p + 4), tam = b.readUInt32LE(p + 4);
        if (id === 'fmt ') { formato = b.readUInt16LE(p + 8); canales = b.readUInt16LE(p + 10); sr = b.readUInt32LE(p + 12); bits = b.readUInt16LE(p + 22); }
        if (id === 'data') {
            const n = Math.floor(tam / (bits / 8) / canales), x = new Float32Array(n);
            for (let i = 0; i < n; i++) {
                let s = 0;
                for (let c = 0; c < canales; c++) {
                    const o = p + 8 + (i * canales + c) * (bits / 8);
                    s += formato === 3 ? b.readFloatLE(o) : bits === 16 ? b.readInt16LE(o) / 32768 : b.readInt32LE(o) / 2147483648;
                }
                x[i] = s / canales;
            }
            return { x, sr };
        }
        p += 8 + tam + (tam % 2);
    }
    throw new Error('sin datos');
}
const HARTE: Record<string, string> = { M: 'maj', m: 'min', '7': '7', m7: 'min7', maj7: 'maj7', sus4: 'sus4' };
const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const [salida, ...wavs] = process.argv.slice(2);
if (process.env.AJUSTES) Object.assign(AJUSTES_ESCUCHA, JSON.parse(process.env.AJUSTES));
const base = process.env.BASE ?? '';
for (const w of wavs) {
    const t0 = Date.now();
    const { x, sr } = leerWav(w);
    const r = escuchar(x, sr);
    const ms = Date.now() - t0;
    const rel = (base ? relative(base, w) : w.split('/').pop()!).replace(/\.wav$/, '');
    const dest = join(salida, rel);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest + '.lab', r.acordes.map(a => `${a.inicio.toFixed(3)}\t${a.fin.toFixed(3)}\t${a.raiz < 0 ? 'N' : `${NOTAS[a.raiz]}:${HARTE[a.tipo!]}`}`).join('\n') + '\n');
    writeFileSync(dest + '.tempo.txt', String(r.bpm));
    writeFileSync(dest + '.tono.txt', `${NOTAS[r.tono.raiz]}:${r.tono.menor ? 'minor' : 'major'}`);
    writeFileSync(dest + '.hoja.txt', hojaDeAcordes(r));
    console.log(`${rel}\t${(r.duracion).toFixed(0)}s\t${ms}ms\tbpm ${r.bpm}\t${r.compas}/4\ttono ${nombreAcorde({ raiz: r.tono.raiz, tipo: r.tono.menor ? 'm' : 'M' }, conBemoles(r.tono))}\tafin ${r.afinacion.toFixed(0)}`);
}
