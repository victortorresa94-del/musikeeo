#!/usr/bin/env python3
"""Junta los <sub>/_meta.json en manifest.json y comprueba el corpus:
cada .wav (mono, 22050 Hz, 16 bit) tiene su .lab, los .lab cubren el fichero
entero sin huecos y todas las etiquetas las entiende mir_eval."""
import datetime
import json
import os
import sys
import wave

import mir_eval

AQUI = os.path.dirname(os.path.abspath(__file__))
SUBS = {
    'guitarset': dict(
        source='GuitarSet, Zenodo 3371780 (https://zenodo.org/records/3371780): annotation.zip + audio_mono-mic.zip',
        license='CC BY 4.0',
        attribution=('Q. Xi, R. M. Bittner, J. Pauwels, X. Ye, J. P. Bello, "GuitarSet: A Dataset for Guitar '
                     'Transcription", Proc. 19th ISMIR, Paris, 2018. Datos: https://zenodo.org/records/3371780, '
                     'CC BY 4.0. Cambios: 60 tomas "comp" de audio_mono-mic remuestreadas de 44.1 kHz a 22050 Hz '
                     '(soxr); acordes de la anotación "instructed" del JAMS pasados a .lab; beat_position a .beats.txt.'),
        chord_annotation='JAMS namespace "chord", anotación índice 0 = "instructed" (acordes de la partitura). '
                         'La índice 1 ("performed", transcrita de lo tocado) NO se usa.',
        script='preparar_guitarset.py'),
    'sintetico': dict(
        source='generar_sintetico.py (numpy/scipy, semilla 20261025)',
        license='CC0 1.0 (generado para este corpus)',
        attribution='Generado para Musikeeo; sin requisitos de atribución.',
        chord_annotation='Verdad exacta del generador (incluye anticipaciones de corchea).',
        script='generar_sintetico.py'),
    'otros': dict(
        source='Schubert Winterreise Dataset v2.1, Zenodo 10839767 (https://zenodo.org/records/10839767), '
               'solo la interpretación HU33',
        license='Audio HU33: Public Domain Mark 1.0; anotaciones: CC BY 3.0',
        attribution=('C. Weiß, F. Zalkow, V. Arifi-Müller, M. Müller, H. V. Koops, A. Volk, H. G. Grohganz, '
                     '"Schubert Winterreise dataset: A multimodal scenario for music analysis", ACM Journal on '
                     'Computing and Cultural Heritage (JOCCH), 2020. Datos: https://zenodo.org/records/10839767, '
                     'CC BY 3.0. Grabación: Gerhard Hüsch y Hanns Udo Müller (1933), dominio público. Cambios: '
                     'etiquetas "shorthand" con el bajo pasado de nota a grado Harte y N antes/después.'),
        chord_annotation='ann_audio_chord, columna shorthand (Harte); bajo como grado',
        script='preparar_otros.py'),
}


def comprobar(entrada):
    errores = []
    wav = os.path.join(AQUI, entrada['path'])
    with wave.open(wav) as w:
        if (w.getframerate(), w.getnchannels(), w.getsampwidth()) != (22050, 1, 2):
            errores.append('formato wav')
        dur = w.getnframes() / w.getframerate()
    iv, labs = mir_eval.io.load_labeled_intervals(os.path.join(AQUI, entrada['lab']))
    for e in labs:
        try:
            mir_eval.chord.encode(e)
        except Exception:
            errores.append(f'etiqueta {e}')
    if abs(iv[0, 0]) > 1e-3 or abs(iv[-1, 1] - dur) > 0.05:
        errores.append(f'cobertura {iv[0, 0]:.3f}-{iv[-1, 1]:.3f} de {dur:.3f}')
    if (abs(iv[1:, 0] - iv[:-1, 1]) > 1e-3).any():
        errores.append('huecos o solapes')
    return errores, dur


def main():
    archivos, subsets, mal = [], {}, 0
    for sub, info in SUBS.items():
        ruta = os.path.join(AQUI, sub, '_meta.json')
        if not os.path.exists(ruta):
            continue
        with open(ruta) as f:
            metas = json.load(f)
        for m in metas:
            err, dur = comprobar(m)
            if err:
                mal += 1
                print('ERROR', m['path'], err, file=sys.stderr)
            m['duration'] = round(dur, 4)
        archivos += metas
        subsets[sub] = dict(info, files=len(metas), minutes=round(sum(m['duration'] for m in metas) / 60, 2))
    man = dict(
        name='Corpus de evaluación de acordes (Musikeeo)',
        created=datetime.date.today().isoformat(),
        audio_format='WAV PCM 16 bit, mono, 22050 Hz',
        label_format='MIREX .lab: inicio<TAB>fin<TAB>etiqueta (sintaxis Harte que lee mir_eval); N = sin acorde',
        key_format='"<tónica>:maj" o "<tónica>:min" (evaluar.py lo pasa a "A minor" para mir_eval.key)',
        tempo_unit='BPM de negra (pulso del fichero .beats.txt)',
        subsets=subsets,
        total=dict(files=len(archivos), minutes=round(sum(m['duration'] for m in archivos) / 60, 2)),
        files=archivos,
    )
    with open(os.path.join(AQUI, 'manifest.json'), 'w') as f:
        json.dump(man, f, indent=1, ensure_ascii=False)
    for s, d in subsets.items():
        print(f'{s}: {d["files"]} ficheros, {d["minutes"]} min')
    print(f'total: {man["total"]["files"]} ficheros, {man["total"]["minutes"]} min; errores: {mal}')


if __name__ == '__main__':
    main()
