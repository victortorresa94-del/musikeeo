#!/usr/bin/env python3
"""Prepara otros/: grabaciones REALES con acordes y licencia clara.

Schubert Winterreise Dataset v2.1 (Weiß et al., 2020), Zenodo 10839767.
Solo la interpretación HU33 (Gerhard Hüsch, barítono, y Hanns Udo Müller,
piano, grabada en 1933), cuyo fichero de licencia en el propio dataset
(03_ExtraMaterial/license_HU33.txt) es Public Domain Mark 1.0.

NO se usa SC06 (Scarlata/Denk, 2006): su fichero license_SC06.txt dice
CC BY-NC-ND 3.0 mientras el README y Zenodo dicen CC BY 3.0 con la condición de
no redistribuirlo modificado; con esa contradicción la licencia no es clara.

Baja con peticiones HTTP Range (remotezip) solo: 24 wav de HU33 (ya vienen en
mono 22050 Hz), sus acordes y estructura alineados al audio, la tonalidad
global, el README y la licencia.

Acordes: columna "shorthand" (Harte). El bajo viene como nota ("B:dim7/C") y
se pasa a grado ("B:dim7/b2") para que mir_eval lo lea. Antes de la primera
etiqueta y después de la última se rellena con N.
"""
import csv
import io
import json
import os
import shutil
import subprocess
import sys
import wave

from remotezip import RemoteZip

AQUI = os.path.dirname(os.path.abspath(__file__))
URL = 'https://zenodo.org/api/records/10839767/files/Schubert_Winterreise_Dataset_v2-1.zip/content'
SR = 22050
PC = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
GRADOS = {1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: 'b5', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7'}


def nota_pc(n):
    pc = PC[n[0].upper()]
    for c in n[1:]:
        pc += {'#': 1, 'b': -1}[c]
    return pc % 12


def a_harte(lab):
    lab = lab.strip()
    if lab in ('N', 'X', ''):
        return 'N'
    if '/' in lab:
        cuerpo, bajo = lab.rsplit('/', 1)
        if bajo and bajo[0].upper() in PC:   # bajo como nota -> grado
            raiz = cuerpo.split(':')[0]
            iv = (nota_pc(bajo) - nota_pc(raiz)) % 12
            return cuerpo if iv == 0 else f'{cuerpo}/{GRADOS[iv]}'
    return lab


def leer_csv(datos):
    return list(csv.DictReader(io.StringIO(datos.decode('utf-8')), delimiter=';', quotechar='"'))


def main():
    salida = os.path.join(AQUI, 'otros')
    os.makedirs(salida, exist_ok=True)
    import mir_eval
    meta = []
    with RemoteZip(URL) as z:
        nombres = z.namelist()
        lic = z.read('03_ExtraMaterial/license_HU33.txt').decode().strip()
        assert 'publicdomain/mark' in lic, lic
        with open(os.path.join(salida, 'LICENCIA_HU33.txt'), 'w') as f:
            f.write(lic + '\n\nFuente: Schubert Winterreise Dataset v2.1, 03_ExtraMaterial/license_HU33.txt\n')
        claves = {(r['WorkID'], r['PerformanceID']): r['key']
                  for r in leer_csv(z.read('02_Annotations/ann_audio_globalkey.csv'))}
        for n in range(1, 25):
            obra = f'Schubert_D911-{n:02d}'
            base = f'{obra}_HU33'
            wav_dst = os.path.join(salida, base + '.wav')
            if not os.path.exists(wav_dst):
                datos = z.read(f'01_RawData/audio_wav/{base}.wav')
                with wave.open(io.BytesIO(datos)) as w:
                    ok = w.getframerate() == SR and w.getnchannels() == 1 and w.getsampwidth() == 2
                if ok:
                    with open(wav_dst, 'wb') as f:
                        f.write(datos)
                else:
                    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'pipe:0', '-ac', '1', '-af',
                                    'aresample=resampler=soxr', '-ar', str(SR), '-c:a', 'pcm_s16le', wav_dst],
                                   input=datos, check=True)
            with wave.open(wav_dst) as w:
                dur = w.getnframes() / w.getframerate()
            filas = leer_csv(z.read(f'02_Annotations/ann_audio_chord/{base}.csv'))
            segs = []
            for r in filas:
                a, b, e = float(r['start']), float(r['end']), a_harte(r['shorthand'])
                mir_eval.chord.encode(e)   # valida la etiqueta
                a, b = max(a, 0.0), min(b, dur)
                if b <= a:
                    continue
                if segs and a > segs[-1][1] + 1e-6:
                    segs.append([segs[-1][1], a, 'N'])
                elif segs and a < segs[-1][1]:
                    a = segs[-1][1]
                segs.append([a, b, e])
            if segs[0][0] > 0:
                segs.insert(0, [0.0, segs[0][0], 'N'])
            if segs[-1][1] < dur - 1e-6:
                segs.append([segs[-1][1], dur, 'N'])
            with open(os.path.join(salida, base + '.lab'), 'w') as f:
                for a, b, e in segs:
                    f.write(f'{a:.6f}\t{b:.6f}\t{e}\n')
            est = f'02_Annotations/ann_audio_structure/{base}.csv'
            if est in nombres:
                ss = [[max(0.0, float(r['start'])), min(dur, float(r['end'])), r['structure']]
                      for r in leer_csv(z.read(est))]
                ss = [s for s in ss if s[1] > s[0]]
                if ss[0][0] > 0:
                    ss.insert(0, [0.0, ss[0][0], 'silencio'])
                if ss[-1][1] < dur - 1e-6:
                    ss.append([ss[-1][1], dur, 'silencio'])
                with open(os.path.join(salida, base + '.secciones.lab'), 'w') as f:
                    for a, b, e in ss:
                        f.write(f'{a:.6f}\t{b:.6f}\t{e}\n')
            meta.append({
                'path': f'otros/{base}.wav', 'lab': f'otros/{base}.lab',
                'secciones': f'otros/{base}.secciones.lab' if est in nombres else None,
                'subset': 'otros',
                'source': f'Schubert Winterreise Dataset v2.1 (Zenodo 10839767): 01_RawData/audio_wav/{base}.wav '
                          f'+ 02_Annotations/ann_audio_chord/{base}.csv (columna shorthand)',
                'license': 'Public Domain Mark 1.0 (audio HU33); anotaciones SWD CC BY 3.0',
                'duration': round(dur, 4), 'key': claves[(obra, 'HU33')],
                'tempo': None, 'meter': None,
                'performers': 'Gerhard Hüsch (barítono), Hanns Udo Müller (piano), 1933',
                'chord_annotation': 'ann_audio_chord, shorthand; bajo convertido de nota a grado',
            })
            print(base, round(dur, 1), file=sys.stderr)
    with open(os.path.join(salida, '_meta.json'), 'w') as f:
        json.dump(meta, f, indent=1, ensure_ascii=False)


if __name__ == '__main__':
    main()
