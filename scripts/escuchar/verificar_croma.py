#!/usr/bin/env python3
"""Comprobación numérica del audio: ¿el croma de cada tramo etiquetado se
parece al acorde de la etiqueta?

Para cada tramo de acorde (no N, >= 0.9 s) promedia un croma STFT y busca la
plantilla mayor/menor (24 tríadas) más parecida. Cuenta aciertos de raíz y de
mayor/menor (como `majmin`: 7 y maj7 -> mayor, min7 -> menor; sus4 se salta).

Con --estimar DIR además escribe una LÍNEA BASE ingenua (plantillas de croma
fotograma a fotograma + filtro de mediana) para todos los .lab del corpus, en
DIR/<subconjunto>/<nombre>.lab, útil para probar evaluar.py con números que no
sean ni 0 ni 1.

Uso: python3 verificar_croma.py [--corpus DIR] [--sub sintetico] [--estimar DIR]
"""
import argparse
import glob
import os
import wave

import mir_eval
import numpy as np
from scipy import ndimage as ndi

SR = 22050
NFFT, HOP = 8192, 1024
NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']


def leer_wav(ruta):
    with wave.open(ruta) as w:
        assert w.getframerate() == SR and w.getnchannels() == 1 and w.getsampwidth() == 2
        return np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float32) / 32768


def croma(x):
    win = np.hanning(NFFT).astype(np.float32)
    n = 1 + max(0, (len(x) - NFFT) // HOP)
    idx = np.arange(NFFT)[None, :] + HOP * np.arange(n)[:, None]
    X = np.abs(np.fft.rfft(x[idx] * win, axis=1))
    f = np.fft.rfftfreq(NFFT, 1 / SR)
    # espectro por semitono (media de los bins de cada nota, MIDI 36-95) y croma
    # = suma por octavas del log; la media evita que las notas agudas, con más
    # bins por semitono, pesen más
    midi = np.round(12 * np.log2(np.maximum(f, 1e-3) / 440.0) + 69).astype(int)
    M = np.zeros((len(f), 60), np.float32)
    for p in range(36, 96):
        sel = midi == p
        if sel.any():
            M[sel, p - 36] = 1.0 / sel.sum()
    S = np.log1p(1000 * (X ** 2 @ M) / NFFT)
    C = S @ np.tile(np.eye(12, dtype=np.float32), (5, 1))
    t = (np.arange(n) * HOP + NFFT / 2) / SR
    energia = np.sqrt(np.mean(X ** 2, axis=1))
    return t, C, energia


def plantillas():
    T, nombres = [], []
    for r in range(12):
        for cal, iv in (('maj', (0, 4, 7)), ('min', (0, 3, 7))):
            v = np.zeros(12)
            v[[(r + i) % 12 for i in iv]] = 1
            T.append(v - v.mean())
            nombres.append(f'{NOTAS[r]}:{cal}')
    T = np.array(T)
    return T / np.linalg.norm(T, axis=1, keepdims=True), nombres


def majmin_de(etiqueta):
    raiz, bits, _ = mir_eval.chord.encode(etiqueta)
    if raiz < 0:
        return None
    if bits[4] and bits[7]:
        return raiz, 'maj'
    if bits[3] and bits[7]:
        return raiz, 'min'
    if bits[3] and bits[6]:   # hdim7 / dim: cuenta como menor para la raíz
        return raiz, 'min'
    return None


def verificar(corpus, sub):
    T, nombres = plantillas()
    tot = dict(n=0, raiz=0, mm=0, dur=0.0, dur_mm=0.0)
    peores = []
    for lab in sorted(glob.glob(os.path.join(corpus, sub, '*.lab'))):
        if lab.endswith('.secciones.lab'):
            continue
        x = leer_wav(lab[:-4] + '.wav')
        t, C, _ = croma(x)
        iv, labs = mir_eval.io.load_labeled_intervals(lab)
        ok_f = n_f = 0
        for (a, b), e in zip(iv, labs):
            ref = majmin_de(e)
            if ref is None or b - a < 0.9:
                continue
            sel = (t >= a + 0.1) & (t <= b - 0.05)
            if not sel.any():
                continue
            c = C[sel].mean(0)
            c = c - c.mean()
            k = int(np.argmax(T @ c))
            r_est = NOTAS.index(nombres[k].split(':')[0])
            q_est = nombres[k].split(':')[1]
            tot['n'] += 1
            n_f += 1
            tot['dur'] += b - a
            if r_est == ref[0]:
                tot['raiz'] += 1
                if q_est == ref[1]:
                    tot['mm'] += 1
                    tot['dur_mm'] += b - a
                    ok_f += 1
        if n_f:
            peores.append((ok_f / n_f, os.path.basename(lab)))
    peores.sort()
    print(f'{sub}: {tot["n"]} tramos >= 0.9 s | raíz correcta {100 * tot["raiz"] / tot["n"]:.1f} % | '
          f'mayor/menor correcto {100 * tot["mm"] / tot["n"]:.1f} % de tramos, '
          f'{100 * tot["dur_mm"] / tot["dur"]:.1f} % de duración')
    print('  peores ficheros:', ', '.join(f'{n} {100 * p:.0f}%' for p, n in peores[:4]))
    return tot


def estimar(corpus, sub, destino):
    T, nombres = plantillas()
    os.makedirs(os.path.join(destino, sub), exist_ok=True)
    for lab in sorted(glob.glob(os.path.join(corpus, sub, '*.lab'))):
        if lab.endswith('.secciones.lab'):
            continue
        x = leer_wav(lab[:-4] + '.wav')
        t, C, en = croma(x)
        C = ndi.uniform_filter1d(C, 9, axis=0)
        Cc = C - C.mean(1, keepdims=True)
        k = np.argmax(Cc @ T.T, axis=1)
        k = ndi.median_filter(k, 11)
        silencio = en < 0.02 * np.median(en)
        etiquetas = np.where(silencio, 'N', np.array(nombres)[k])
        dur = len(x) / SR
        bordes = np.concatenate([[0], (t[1:] + t[:-1]) / 2, [dur]])
        segs = []
        for i, e in enumerate(etiquetas):
            if segs and segs[-1][2] == e:
                segs[-1][1] = bordes[i + 1]
            else:
                segs.append([bordes[i], bordes[i + 1], e])
        with open(os.path.join(destino, sub, os.path.basename(lab)), 'w') as f:
            for a, b, e in segs:
                f.write(f'{a:.4f}\t{b:.4f}\t{e}\n')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--corpus', default=os.path.dirname(os.path.abspath(__file__)))
    ap.add_argument('--sub', action='append')
    ap.add_argument('--estimar')
    args = ap.parse_args()
    subs = args.sub or [s for s in ('guitarset', 'sintetico', 'otros') if os.path.isdir(os.path.join(args.corpus, s))]
    for s in subs:
        verificar(args.corpus, s)
        if args.estimar:
            estimar(args.corpus, s, args.estimar)


if __name__ == '__main__':
    main()
