#!/usr/bin/env python3
"""Prepara el subconjunto GuitarSet del corpus de acordes.

GuitarSet (Xi, Bittner, Pauwels, Ye, Bello; ISMIR 2018), CC BY 4.0,
https://zenodo.org/records/3371780

Baja SOLO lo necesario:
  * annotation.zip completo (39 MB, JAMS de las 360 tomas)
  * de audio_mono-mic.zip (657 MB) solo las 60 tomas "comp" elegidas,
    leidas con peticiones HTTP Range (remotezip), sin bajar el zip entero.

Seleccion equilibrada: 6 intérpretes x 5 estilos x 2 hojas = 60 tomas.
Cada estilo tiene 6 hojas (3 progresiones x 2 tempos); al intérprete p en el
estilo s le tocan las hojas (p+s) % 6 y (p+s+3) % 6, asi cada hoja sale
exactamente 2 veces, con intérpretes distintos, y cada intérprete toca dos
progresiones distintas por estilo.

Referencia de acordes: la anotacion "instructed" (acordes de la partitura),
que es la PRIMERA anotacion con namespace "chord" en cada JAMS (la segunda es
la "performed", transcrita de lo que se toco, con extensiones e inversiones).

Uso: python3 preparar_guitarset.py [--descargas DIR]
Salida: guitarset/<toma>.wav (mono 22050 Hz 16 bit), .lab, .beats.txt y
guitarset/_meta.json (lo recoge construir_manifest.py).
"""
import argparse
import io
import json
import os
import subprocess
import sys
import urllib.request
import zipfile

AQUI = os.path.dirname(os.path.abspath(__file__))
REC = 'https://zenodo.org/api/records/3371780/files/{}/content'
ESTILOS = ['BN', 'Funk', 'SS', 'Rock', 'Jazz']
SR = 22050


def bajar(url, destino):
    if os.path.exists(destino):
        return
    print('bajando', url, file=sys.stderr)
    tmp = destino + '.part'
    urllib.request.urlretrieve(url, tmp)
    os.replace(tmp, destino)


def hojas_de_estilo(nombres_comp, estilo):
    """Las 6 hojas (progresion-tempo-tono) de un estilo, en orden progresion, tempo."""
    hojas = set()
    for n in nombres_comp:
        hoja = n.split('_')[1]  # p.ej. BN1-129-Eb
        if hoja.rstrip('-').split('-')[0][:-1] == estilo:
            hojas.add(hoja)
    def clave(h):
        prog, tempo, _ = h.split('-')
        return (prog, int(tempo))
    hojas = sorted(hojas, key=clave)
    assert len(hojas) == 6, (estilo, hojas)
    return hojas


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--descargas', default=os.path.join(AQUI, 'dl'))
    args = ap.parse_args()
    os.makedirs(args.descargas, exist_ok=True)
    salida = os.path.join(AQUI, 'guitarset')
    os.makedirs(salida, exist_ok=True)

    zann = os.path.join(args.descargas, 'annotation.zip')
    bajar(REC.format('annotation.zip'), zann)
    ann = zipfile.ZipFile(zann)
    comps = sorted(n[:-5] for n in ann.namelist() if n.endswith('_comp.jams'))

    elegidas = []
    for s, estilo in enumerate(ESTILOS):
        hojas = hojas_de_estilo(comps, estilo)
        for p in range(6):
            for k in (0, 3):
                hoja = hojas[(p + s + k) % 6]
                elegidas.append(f'{p:02d}_{hoja}_comp')
    assert len(elegidas) == 60 and all(e in comps for e in elegidas)

    from remotezip import RemoteZip  # pip install remotezip
    meta = []
    with RemoteZip(REC.format('audio_mono-mic.zip')) as zaudio:
        for toma in elegidas:
            wav = os.path.join(salida, toma + '.wav')
            if not os.path.exists(wav):
                datos = zaudio.read(toma + '_mic.wav')
                # 44.1 kHz -> 22050 Hz mono 16 bit, con soxr
                subprocess.run(
                    ['ffmpeg', '-v', 'error', '-y', '-i', 'pipe:0', '-ac', '1',
                     '-af', 'aresample=resampler=soxr', '-ar', str(SR),
                     '-c:a', 'pcm_s16le', wav],
                    input=datos, check=True)
            dur = duracion_wav(wav)
            jam = json.loads(ann.read(toma + '.jams'))
            meta.append(escribir_anotaciones(toma, jam, dur, salida))
            print(toma, round(dur, 2), file=sys.stderr)

    with open(os.path.join(salida, '_meta.json'), 'w') as f:
        json.dump(meta, f, indent=1)


def duracion_wav(ruta):
    import wave
    with wave.open(ruta) as w:
        assert w.getframerate() == SR and w.getnchannels() == 1 and w.getsampwidth() == 2
        return w.getnframes() / SR


def escribir_anotaciones(toma, jam, dur, salida):
    acordes = [a for a in jam['annotations'] if a['namespace'] == 'chord']
    instr = acordes[0]  # instructed (la partitura); acordes[1] = performed
    assert instr['annotation_metadata'].get('data_source', '') == ''
    assert 'transcription' in acordes[1]['annotation_metadata']['data_source'].lower()
    segs = []
    for o in instr['data']:
        ini, fin = o['time'], o['time'] + o['duration']
        if ini >= dur:
            continue
        segs.append([ini, min(fin, dur), o['value']])
    # cubrir el fichero entero: hueco al principio -> N; final -> se alarga
    # el ultimo acorde si falta menos de 0.5 s, si no N
    if segs[0][0] > 1e-6:
        segs.insert(0, [0.0, segs[0][0], 'N'])
    if dur - segs[-1][1] > 0.5:
        segs.append([segs[-1][1], dur, 'N'])
    else:
        segs[-1][1] = dur
    for a, b in zip(segs, segs[1:]):
        b[0] = a[1]
    with open(os.path.join(salida, toma + '.lab'), 'w') as f:
        for ini, fin, lab in segs:
            f.write(f'{ini:.6f}\t{fin:.6f}\t{lab}\n')

    beats = [a for a in jam['annotations'] if a['namespace'] == 'beat_position'][0]['data']
    with open(os.path.join(salida, toma + '.beats.txt'), 'w') as f:
        for b in beats:
            if b['time'] < dur:
                f.write(f"{b['time']:.6f}\t{b['value']['position']}\n")
    num = beats[0]['value']['num_beats']
    uni = beats[0]['value']['beat_units']
    tempo = [a for a in jam['annotations'] if a['namespace'] == 'tempo'][0]['data'][0]['value']
    tono = [a for a in jam['annotations'] if a['namespace'] == 'key_mode'][0]['data'][0]['value']
    raiz, modo = tono.split(':')
    tono = f"{raiz}:{'maj' if modo == 'major' else 'min'}"
    jugador, hoja, _ = toma.split('_')
    estilo = hoja.split('-')[0][:-1]
    return {
        'path': f'guitarset/{toma}.wav',
        'lab': f'guitarset/{toma}.lab',
        'beats': f'guitarset/{toma}.beats.txt',
        'subset': 'guitarset',
        'source': f'GuitarSet audio_mono-mic.zip:{toma}_mic.wav + annotation.zip:{toma}.jams',
        'license': 'CC BY 4.0',
        'duration': round(dur, 4),
        'player': jugador,
        'style': estilo,
        'leadsheet': hoja,
        'key': tono,
        'tempo': float(tempo),
        'meter': f'{num}/{uni}',
        'chord_annotation': 'JAMS namespace "chord", annotation index 0 (instructed / lead sheet)',
        'chord_vocabulary': sorted({o['value'] for o in instr['data']}),
    }


if __name__ == '__main__':
    main()
