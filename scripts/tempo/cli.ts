// Tempo de canciones del catálogo de Apple con el motor de «Sacar acordes» (src/lib/escuchar.ts),
// sobre la muestra de 30 s. Uso (ver README):
//   node .cli.cjs lista.json > tempos.json      lista.json = [{ "titulo": "...", "artista": "...", "buscar"?: "título en Apple" }, ...]
// Necesita ffmpeg para pasar la muestra (AAC) a WAV. No inventa: si no hay coincidencia clara o el
// tempo no es fiable, deja null.
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';
import { join } from 'path';
import { tmpdir } from 'os';
import { portadaDe } from '../../src/lib/buscarCanciones';
import { tempoDeAudio } from '../../src/lib/tempo';

function leerWav(b: Buffer): { x: Float32Array; sr: number } {
    let p = 12, sr = 0;
    while (p < b.length) {
        const id = b.toString('ascii', p, p + 4), tam = b.readUInt32LE(p + 4);
        if (id === 'fmt ') sr = b.readUInt32LE(p + 12);
        if (id === 'data') {
            const n = Math.floor(tam / 2), x = new Float32Array(n);
            for (let i = 0; i < n; i++) x[i] = b.readInt16LE(p + 8 + i * 2) / 32768;
            return { x, sr };
        }
        p += 8 + tam + (tam % 2);
    }
    throw new Error('wav sin datos');
}

const espera = (ms: number) => new Promise(r => setTimeout(r, ms));

(async () => {
    const lista: { titulo: string; artista: string; buscar?: string }[] = JSON.parse(readFileSync(process.argv[2], 'utf8'));
    const dir = mkdtempSync(join(tmpdir(), 'tempo-'));
    const salida: Record<string, unknown> = {};
    for (const { titulo, artista, buscar } of lista) {
        let fila: Record<string, unknown> = { bpm: null };
        try {
            const r = await portadaDe(buscar ?? titulo, artista);
            if (!r) { fila.motivo = 'sin coincidencia clara en el catálogo'; }
            else {
                fila = { ...fila, encontrada: `${r.titulo} — ${r.artista}`, duracion: r.duracion ?? null };
                if (r.muestra) {
                    const aac = join(dir, 'm.m4a'), wav = join(dir, 'm.wav');
                    writeFileSync(aac, Buffer.from(await (await fetch(r.muestra)).arrayBuffer()));
                    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', aac, '-ac', '1', '-ar', '22050', wav]);
                    const { x, sr } = leerWav(readFileSync(wav));
                    const t = tempoDeAudio(x, sr);
                    fila = { ...fila, ...t, bpm: t.fiable ? t.bpm : null };
                }
            }
        } catch (e) { fila.motivo = String(e); }
        salida[titulo] = fila;
        process.stderr.write(`${titulo}\t${JSON.stringify(fila)}\n`);
        await espera(3500); // Apple frena a unas 20 búsquedas por minuto
    }
    rmSync(dir, { recursive: true, force: true });
    console.log(JSON.stringify(salida, null, 2));
})();
