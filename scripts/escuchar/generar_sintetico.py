#!/usr/bin/env python3
"""Genera el subconjunto sintético del corpus de acordes (Musikeeo).

30 canciones de 60-90 s con banda completa sintetizada con numpy/scipy:
batería (ruido filtrado y barridos), bajo (raíces, quintas, notas de paso,
inversiones), guitarra rasgueada/arpegiada (Karplus-Strong), piano aditivo,
colchón de cuerdas, y una melodía (seno o sierra con vibrato) que usa notas
fuera del acorde. Reverb por convolución y limitador de mastering.

Verdad exacta por canción (en sintetico/):
  sNN_estilo.wav            mono 22050 Hz 16 bit
  sNN_estilo.lab            acordes (Harte, MIREX: inicio fin etiqueta)
  sNN_estilo.secciones.lab  secciones (silencio/intro/estrofa/estribillo/puente/final)
  sNN_estilo.beats.txt      tiempo<TAB>número de pulso en el compás
  _meta.json                tono, tempo, compás, progresiones... (manifest)

Un 40 % de las canciones va desafinado 10-35 cents respecto a La 440
(campo tuning_cents del manifest); las etiquetas no cambian.

Reproducible: semilla fija SEMILLA; cada canción usa su propio generador
np.random.default_rng([SEMILLA, i]) así que el resultado no depende del
orden ni del número de procesos.

Uso: python3 generar_sintetico.py [--procesos 4] [--solo 3,7]
"""
import argparse
import itertools
import json
import os
import re
import sys
import wave
from multiprocessing import Pool

import numpy as np
from scipy import ndimage as ndi
from scipy import signal as sps

SR = 22050
SEMILLA = 20261025
N_CANCIONES = 30
AQUI = os.path.dirname(os.path.abspath(__file__))
SALIDA = os.path.join(AQUI, 'sintetico')

# ---------------------------------------------------------------- teoría
SOSTENIDOS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
BEMOLES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
TONOS_BEMOL = {'maj': {5, 10, 3, 8, 1}, 'min': {2, 7, 0, 5, 10, 3}}
CALIDADES = {'maj': (0, 4, 7), 'min': (0, 3, 7), '7': (0, 4, 7, 10),
             'maj7': (0, 4, 7, 11), 'min7': (0, 3, 7, 10), 'sus4': (0, 5, 7)}
GRADO = {3: 'b3', 4: '3', 7: '5', 10: 'b7', 11: '7'}
ESCALA = {'maj': (0, 2, 4, 5, 7, 9, 11), 'min': (0, 2, 3, 5, 7, 8, 10)}
ROMANO = {'I': 0, 'II': 2, 'III': 4, 'IV': 5, 'V': 7, 'VI': 9, 'VII': 11}
RX_ROMANO = re.compile(r'^([b#]?)(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)(maj7|7|sus4)?(?:/(3|5|7))?$')


def nombres_de(raiz, modo):
    return BEMOLES if raiz in TONOS_BEMOL[modo] else SOSTENIDOS


class Acorde:
    __slots__ = ('raiz', 'cal', 'bajo')

    def __init__(self, raiz, cal, bajo=0):
        self.raiz, self.cal, self.bajo = raiz % 12, cal, bajo

    def pcs(self):
        return [(self.raiz + i) % 12 for i in CALIDADES[self.cal]]

    def bajo_pc(self):
        return (self.raiz + self.bajo) % 12

    def etiqueta(self, nombres):
        e = f'{nombres[self.raiz]}:{self.cal}'
        return e + ('/' + GRADO[self.bajo] if self.bajo else '')

    def clave(self):
        return (self.raiz, self.cal, self.bajo)

    def copia(self):
        return Acorde(self.raiz, self.cal, self.bajo)


def romano(tok, raiz):
    m = RX_ROMANO.match(tok)
    if not m:
        raise ValueError(tok)
    acc, num, suf, inv = m.groups()
    grado = ROMANO[num.upper()] + {'': 0, 'b': -1, '#': 1}[acc]
    may = num.isupper()
    cal = ('maj' if may else 'min') if suf is None else (('7' if may else 'min7') if suf == '7' else suf)
    bajo = 0
    if inv == '3':
        bajo = CALIDADES[cal][1]
    elif inv == '5':
        bajo = 7
    elif inv == '7':
        bajo = CALIDADES[cal][3]
    return Acorde(raiz + grado, cal, bajo)


PROG = {
    'I-V-vi-IV': ['I', 'V', 'vi', 'IV'],
    'vi-IV-I-V': ['vi', 'IV', 'I', 'V'],
    'I-vi-IV-V': ['I', 'vi', 'IV', 'V'],
    'I-IV-V-IV': ['I', 'IV', 'V', 'IV'],
    'I-bVII-IV-I': ['I', 'bVII', 'IV', 'I'],
    'canon I-V/3-vi-iii-IV-I/3-IV-V': ['I', 'V/3', 'vi', 'iii', 'IV', 'I/3', 'IV', 'V'],
    'IV-V-iii-vi': ['IV', 'V', 'iii', 'vi'],
    'IV-I-V-vi': ['IV', 'I', 'V', 'vi'],
    'I-IV-I-V': ['I', 'IV', 'I', 'V'],
    'ii-V-I': ['ii7', 'V7', 'Imaj7', 'Imaj7'],
    'I-vi-ii-V': ['Imaj7', 'vi7', 'ii7', 'V7'],
    'IV-iii-ii-V': ['IVmaj7', 'iii7', 'ii7', 'V7'],
    'rumba I-V7': ['I', 'I', 'V7', 'V7'],
    'I-IV-V7-I': ['I', 'IV', 'V7', 'I'],
    'blues 12 compases': ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'],
    'blues 12 cambio rápido': ['I7', 'IV7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'],
    'blues vuelta V-IV-I-V': ['V7', 'IV7', 'I7', 'V7'],
    'cadencia andaluza i-bVII-bVI-V': ['i', 'bVII', 'bVI', 'V'],
    'i-iv-V7-i': ['i', 'iv', 'V7', 'i'],
    'iv-i-V-i': ['iv', 'i', 'V', 'i'],
    'i-bVI-bIII-bVII': ['i', 'bVI', 'bIII', 'bVII'],
    'i-bVII-bVI-bVII': ['i', 'bVII', 'bVI', 'bVII'],
    'i-iv-bVII-bIII': ['i', 'iv', 'bVII', 'bIII'],
    'frigio V-bVI (Mi-Fa en La menor)': ['V', 'bVI', 'V', 'bVI'],
    'iv7-V7-i': ['iv7', 'V7', 'i', 'i'],
    'i-V7': ['i', 'V7', 'V7', 'i'],
    'bVI-bVII-i': ['bVI', 'bVII', 'i', 'i'],
}

ESTILO_PROG = {
    ('pop', 'maj'): dict(estrofa=['I-V-vi-IV', 'I-vi-IV-V', 'canon I-V/3-vi-iii-IV-I/3-IV-V', 'I-IV-I-V', 'vi-IV-I-V'],
                         estribillo=['I-V-vi-IV', 'vi-IV-I-V', 'IV-I-V-vi', 'I-vi-IV-V'],
                         puente=['IV-V-iii-vi', 'ii-V-I']),
    ('pop', 'min'): dict(estrofa=['i-bVI-bIII-bVII', 'i-iv-bVII-bIII', 'cadencia andaluza i-bVII-bVI-V'],
                         estribillo=['i-bVI-bIII-bVII', 'i-bVII-bVI-bVII', 'bVI-bVII-i'],
                         puente=['iv7-V7-i', 'cadencia andaluza i-bVII-bVI-V']),
    ('rumba', 'min'): dict(estrofa=['cadencia andaluza i-bVII-bVI-V', 'i-iv-V7-i'],
                           estribillo=['cadencia andaluza i-bVII-bVI-V', 'iv-i-V-i', 'i-V7'],
                           puente=['frigio V-bVI (Mi-Fa en La menor)', 'iv7-V7-i']),
    ('rumba', 'maj'): dict(estrofa=['rumba I-V7', 'I-IV-V7-I'],
                           estribillo=['I-IV-V7-I', 'I-V-vi-IV', 'I-IV-I-V'],
                           puente=['IV-V-iii-vi', 'vi-IV-I-V']),
    ('rock', 'maj'): dict(estrofa=['I-IV-V-IV', 'I-bVII-IV-I', 'I-IV-I-V'],
                          estribillo=['I-bVII-IV-I', 'I-V-vi-IV', 'IV-I-V-vi'],
                          puente=['vi-IV-I-V', 'IV-V-iii-vi']),
    ('rock', 'min'): dict(estrofa=['i-bVII-bVI-bVII', 'cadencia andaluza i-bVII-bVI-V'],
                          estribillo=['i-bVI-bIII-bVII', 'bVI-bVII-i'],
                          puente=['iv7-V7-i', 'i-iv-bVII-bIII']),
    ('balada', 'maj'): dict(estrofa=['canon I-V/3-vi-iii-IV-I/3-IV-V', 'I-vi-IV-V', 'I-vi-ii-V'],
                            estribillo=['I-V-vi-IV', 'IV-I-V-vi', 'IV-V-iii-vi'],
                            puente=['ii-V-I', 'vi-IV-I-V']),
    ('balada', 'min'): dict(estrofa=['i-iv-bVII-bIII', 'i-bVI-bIII-bVII'],
                            estribillo=['i-bVI-bIII-bVII', 'cadencia andaluza i-bVII-bVI-V'],
                            puente=['iv7-V7-i']),
    ('flamenco', 'min'): dict(estrofa=['cadencia andaluza i-bVII-bVI-V', 'iv-i-V-i'],
                              estribillo=['i-bVI-bIII-bVII', 'cadencia andaluza i-bVII-bVI-V', 'i-iv-V7-i'],
                              puente=['frigio V-bVI (Mi-Fa en La menor)']),
    ('blues', 'maj'): dict(estrofa=['blues 12 compases'], estribillo=['blues 12 cambio rápido'],
                           puente=['blues 12 compases'], intro=['blues vuelta V-IV-I-V'],
                           final=['blues vuelta V-IV-I-V']),
    ('jazz', 'maj'): dict(estrofa=['I-vi-ii-V', 'ii-V-I'], estribillo=['ii-V-I', 'IV-iii-ii-V'],
                          puente=['IV-iii-ii-V', 'I-vi-ii-V']),
}

DECORA = {  # probabilidades de enriquecer los acordes de la plantilla
    'pop': dict(maj7=.10, min7=.12, dom7=.15, inv=.30, sus=.03),
    'balada': dict(maj7=.35, min7=.35, dom7=.30, inv=.45, sus=.04),
    'rock': dict(maj7=0, min7=0, dom7=.05, inv=.10, sus=.04),
    'rumba': dict(maj7=0, min7=.10, dom7=.45, inv=.05, sus=.02),
    'flamenco': dict(maj7=.05, min7=.10, dom7=.40, inv=.10, sus=.03),
    'jazz': dict(maj7=.0, min7=.0, dom7=.0, inv=.0, sus=0),
    'blues': dict(maj7=0, min7=0, dom7=0, inv=0, sus=0),
}
ANTICIPA = {'pop': .25, 'rumba': .35, 'flamenco': .30, 'rock': .20, 'balada': .10, 'jazz': .25, 'blues': .10}

ESTRUCTURAS = [
    ['intro', 'estrofa', 'estribillo', 'estrofa', 'estribillo', 'final'],
    ['intro', 'estrofa', 'estribillo', 'estrofa', 'estribillo', 'puente', 'estribillo', 'final'],
    ['intro', 'estrofa', 'estrofa', 'estribillo', 'estrofa', 'estribillo', 'final'],
    ['intro', 'estrofa', 'estribillo', 'puente', 'estribillo', 'final'],
]
ESTRUCTURAS_BLUES = [
    ['intro', 'estrofa', 'estribillo', 'estrofa', 'final'],
    ['intro', 'estrofa', 'puente', 'estrofa', 'final'],
    ['intro', 'estrofa', 'estribillo', 'final'],
    ['estrofa', 'estribillo', 'puente', 'final'],
]
TAMANOS = {'intro': (2, 4, 8), 'estrofa': (4, 8, 16), 'estribillo': (4, 8, 16), 'puente': (4, 8), 'final': (2, 4)}
TAMANOS_BLUES = {'intro': (4,), 'estrofa': (12,), 'estribillo': (12,), 'puente': (12,), 'final': (4,)}
PESO_TAM = {2: 1.0, 4: 1.0, 8: 1.5, 12: 1.0, 16: 0.5}


def crear_loop(nombre, raiz, modo, estilo, compas, tempo, rng):
    """Un ciclo armónico: lista de [Acorde, pulsos, anticipado]."""
    toks = PROG[nombre]
    acs = [romano(t, raiz) for t in toks]
    p = DECORA[estilo]
    dec = []
    for i, a in enumerate(acs):
        a = a.copia()
        sig = acs[(i + 1) % len(acs)]
        rel = (a.raiz - raiz) % 12
        nrel = (sig.raiz - raiz) % 12
        if a.cal == 'maj' and a.bajo == 0:
            u = rng.random()
            if rel == 7 and u < p['dom7']:
                a.cal = '7'
            elif rel in (0, 5, 3, 8) and u < p['maj7']:
                a.cal = 'maj7'
            elif rng.random() < p['sus']:
                a.cal = 'sus4'
        elif a.cal == 'min' and a.bajo == 0 and rng.random() < p['min7']:
            a.cal = 'min7'
        if a.bajo == 0 and a.cal in ('maj', '7') and rng.random() < p['inv']:
            if rel == 7 and nrel == 9:
                a.bajo = 4                       # V/3 -> vi (bajo que baja)
            elif rel == 0 and nrel in (5, 2):
                a.bajo = 4                       # I/3 -> IV, ii
            elif rel == 0 and nrel == 7 and a.cal == 'maj':
                a.bajo = 7                       # I/5 -> V (6/4 cadencial)
        dec.append(a)
    if estilo == 'blues':
        d = 4
    elif compas == 3:
        d = 3
    elif len(dec) >= 8:
        d = int(rng.choice([2, 4]))
    else:
        d = 4 if rng.random() < (.65 if tempo > 120 else .5) else 2
    loop = [[a, d, False] for a in dec]
    if estilo != 'blues' and rng.random() < .4:   # partir el último acorde
        a = loop[-1][0]
        mitades = (2, 1) if d == 3 else (d // 2, d // 2)
        dom = Acorde(raiz + 7, '7' if (modo == 'min' or rng.random() < .4) else 'maj')
        if (a.raiz - raiz) % 12 == 7 and a.cal in ('maj', '7') and a.bajo == 0:
            loop[-1:] = [[Acorde(a.raiz, 'sus4'), mitades[0], False], [a, mitades[1], False]]
        else:
            loop[-1:] = [[a, mitades[0], False], [dom, mitades[1], False]]
    pa = ANTICIPA[estilo]
    for i in range(len(loop)):
        prev = loop[i - 1]
        if prev[1] >= 2 and rng.random() < pa:
            loop[i][2] = True
    return loop


# ---------------------------------------------------------------- síntesis
AFINACION = 0.0   # desafinación global de la canción en cents (la fija generar())


def hz(m):
    return 440.0 * 2 ** ((m - 69 + AFINACION / 100) / 12)


_CACHE = {}


def tono_piano(m):
    k = ('p', m, AFINACION)
    if k in _CACHE:
        return _CACHE[k]
    f0 = hz(m)
    n = int(4.0 * SR)
    t = np.arange(n) / SR
    rg = np.random.default_rng(1000 + m)
    B = 1e-4 * 2 ** ((m - 48) / 18)
    tau0 = float(np.clip(3.5 * (130 / f0) ** 0.5, 0.7, 6))
    out = np.zeros(n)
    for h in range(1, 25):
        fh = h * f0 * np.sqrt(1 + B * h * h)
        if fh > 9000:
            break
        a = abs(np.sin(np.pi * h * 0.118)) / h ** 0.9
        th = tau0 / (1 + 0.35 * (h - 1))
        env = 0.6 * np.exp(-t / (th * 0.2)) + 0.4 * np.exp(-t / th)
        out += a * env * (np.sin(2 * np.pi * fh * t + rg.uniform(0, 6.3))
                          + 0.5 * np.sin(2 * np.pi * fh * 1.0007 * t + rg.uniform(0, 6.3)))
    out *= np.minimum(1, t / 0.002)
    out /= np.max(np.abs(out)) + 1e-9
    _CACHE[k] = out.astype(np.float32)
    return _CACHE[k]


def tono_guitarra(m, var):
    """Karplus-Strong con retardo fraccionario (interpolación lineal)."""
    k = ('g', m, var, AFINACION)
    if k in _CACHE:
        return _CACHE[k]
    f0 = hz(m)
    rg = np.random.default_rng(2000 + 7 * m + var)
    P = SR / f0
    N = int(np.floor(P - 0.5))
    d = P - 0.5 - N
    n = int(3.0 * SR)
    exc = rg.uniform(-1, 1, N)
    a = 0.25 + 0.15 * var
    exc = sps.lfilter([1 - a], [1, -a], exc)
    kp = max(1, int(round(N * (0.12 + 0.05 * var))))
    e2 = exc.copy()
    e2[kp:] -= exc[:-kp]
    e2 -= e2.mean()
    e2 /= np.max(np.abs(e2)) + 1e-9
    t60 = float(np.interp(m, [40, 76], [4.5, 1.8]))
    g = 0.001 ** (1 / (f0 * t60))
    c0, c1, c2 = g * 0.5 * (1 - d), g * 0.5, g * 0.5 * d
    pad = N + 2
    Y = np.zeros(pad + n)
    X = np.zeros(n)
    X[:N] = e2
    s = 0
    while s < n:
        e = min(s + N, n)
        Y[pad + s:pad + e] = (X[s:e] + c0 * Y[pad + s - N:pad + e - N]
                              + c1 * Y[pad + s - N - 1:pad + e - N - 1]
                              + c2 * Y[pad + s - N - 2:pad + e - N - 2])
        s = e
    y = Y[pad:]
    y -= np.mean(y)
    y /= np.max(np.abs(y)) + 1e-9
    _CACHE[k] = y.astype(np.float32)
    return _CACHE[k]


def tono_bajo(m):
    k = ('b', m, AFINACION)
    if k in _CACHE:
        return _CACHE[k]
    f0 = hz(m)
    n = int(3.0 * SR)
    t = np.arange(n) / SR
    rg = np.random.default_rng(3000 + m)
    out = np.zeros(n)
    for h in range(1, 14):
        if h * f0 > 3500:
            break
        a = abs(np.sin(np.pi * h * 0.22)) / h ** 1.2
        tau = 1.8 / (1 + 0.55 * (h - 1))
        out += a * np.exp(-t / tau) * np.sin(2 * np.pi * h * f0 * t + rg.uniform(0, 6.3))
    out *= np.minimum(1, t / 0.004)
    out /= np.max(np.abs(out)) + 1e-9
    _CACHE[k] = out.astype(np.float32)
    return _CACHE[k]


def tono_pad(m):
    k = ('c', m, AFINACION)
    if k in _CACHE:
        return _CACHE[k]
    f0 = hz(m)
    n = int(6.0 * SR)
    t = np.arange(n) / SR
    rg = np.random.default_rng(4000 + m)
    out = np.zeros(n)
    for det in (-0.0035, 0.0035):
        for h in range(1, 17):
            if h * f0 > 3200:
                break
            out += np.sin(2 * np.pi * h * f0 * (1 + det) * t + rg.uniform(0, 6.3)) / h ** 1.3
    out *= 0.85 + 0.15 * np.sin(2 * np.pi * 0.4 * t)
    out /= np.max(np.abs(out)) + 1e-9
    _CACHE[k] = out.astype(np.float32)
    return _CACHE[k]


def nota_melodia(m, dur, timbre, rng):
    n = int((dur + 0.12) * SR)
    t = np.arange(n) / SR
    f0 = hz(m)
    prof = rng.uniform(20, 40) / 1200
    vel = rng.uniform(5.0, 6.2)
    rampa = np.clip((t - 0.15) / 0.25, 0, 1)
    f = f0 * 2 ** (prof * rampa * np.sin(2 * np.pi * vel * t + rng.uniform(0, 6.3)))
    fase = 2 * np.pi * np.cumsum(f) / SR
    if timbre == 'sierra':
        x = np.zeros(n)
        for h in range(1, 11):
            if h * f0 > 7000:
                break
            x += np.sin(h * fase) / h ** 1.5
    else:
        x = np.sin(fase) + 0.25 * np.sin(2 * fase) + 0.08 * np.sin(3 * fase)
    env = np.minimum(1, t / 0.03) * (0.85 + 0.15 * np.exp(-t / 0.15))
    nd = int(dur * SR)
    env[nd:] *= np.exp(-(t[nd:] - dur) / 0.03)
    return (x * env).astype(np.float32)


def kit_bateria(rng):
    """3 variantes por golpe, generadas para cada canción."""
    def T(s):
        return np.arange(int(s * SR)) / SR

    def bp(x, lo, hi, orden=2):
        return sps.sosfilt(sps.butter(orden, [lo, hi], 'band', fs=SR, output='sos'), x)

    def hp(x, fc, orden=4):
        return sps.sosfilt(sps.butter(orden, fc, 'high', fs=SR, output='sos'), x)

    kit = {}
    for v in range(3):
        r = np.random.default_rng(rng.integers(1 << 30))
        t = T(0.45)
        f = 48 + 95 * np.exp(-t / 0.035)
        kit.setdefault('bombo', []).append(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2)
                                           + hp(r.normal(0, 1, len(t)), 1500) * np.exp(-t / 0.004) * 0.3)
        t = T(0.3)
        kit.setdefault('caja', []).append(bp(r.normal(0, 1, len(t)), 900, 7000) * np.exp(-t / 0.12) * 0.7
                                          + np.sin(2 * np.pi * 186 * t) * np.exp(-t / 0.07) * 0.6
                                          + np.sin(2 * np.pi * 330 * t) * np.exp(-t / 0.05) * 0.25)
        t = T(0.12)
        kit.setdefault('aro', []).append(bp(r.normal(0, 1, len(t)), 1500, 4500) * np.exp(-t / 0.015)
                                         + np.sin(2 * np.pi * 460 * t) * np.exp(-t / 0.02) * 0.5)
        t = T(0.12)
        kit.setdefault('hh', []).append(hp(r.normal(0, 1, len(t)), 7000) * np.exp(-t / 0.028))
        t = T(0.6)
        kit.setdefault('hh_abierto', []).append(hp(r.normal(0, 1, len(t)), 6500) * np.exp(-t / 0.25))
        t = T(0.1)
        kit.setdefault('hh_pie', []).append(hp(r.normal(0, 1, len(t)), 6000) * np.exp(-t / 0.018) * 0.6)
        t = T(1.2)
        met = sum(np.sin(2 * np.pi * fr * t + r.uniform(0, 6)) for fr in (3110, 4270, 5340, 6620)) * 0.08
        kit.setdefault('ride', []).append((hp(r.normal(0, 1, len(t)), 5000) * 0.35 + met) * np.exp(-t / 0.55))
        t = T(2.5)
        kit.setdefault('crash', []).append(hp(r.normal(0, 1, len(t)), 3500) * np.exp(-t / 1.1))
        t = T(0.25)
        cl = np.zeros(len(t))
        for off in (0.0, 0.009, 0.017, 0.025):
            i0 = int(off * SR)
            tt = t[:len(t) - i0]
            cl[i0:] += bp(r.normal(0, 1, len(tt)), 900, 3500) * np.exp(-tt / 0.006)
        cl += bp(r.normal(0, 1, len(t)), 900, 3500) * np.exp(-t / 0.06) * 0.35
        kit.setdefault('palmas', []).append(cl)
        t = T(0.35)
        f = 65 + 55 * np.exp(-t / 0.03)
        kit.setdefault('cajon_g', []).append(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12)
                                             + bp(r.normal(0, 1, len(t)), 100, 800) * np.exp(-t / 0.03) * 0.4)
        t = T(0.25)
        kit.setdefault('cajon_a', []).append(bp(r.normal(0, 1, len(t)), 1200, 6000) * np.exp(-t / 0.06)
                                             + np.sin(2 * np.pi * 235 * t) * np.exp(-t / 0.05) * 0.4)
        t = T(0.15)
        sh = bp(r.normal(0, 1, len(t)), 4000, 9500) * np.minimum(1, t / 0.01) * np.exp(-t / 0.04)
        kit.setdefault('shaker', []).append(sh)
        t = T(0.35)
        kit.setdefault('escobilla', []).append(bp(r.normal(0, 1, len(t)), 2000, 8000)
                                               * np.minimum(1, t / 0.04) * np.exp(-t / 0.12) * 0.5)
        for nombre, f1 in (('tom_a', 210), ('tom_m', 160), ('tom_g', 115)):
            t = T(0.6)
            f = f1 * (1 + 0.3 * np.exp(-t / 0.05))
            kit.setdefault(nombre, []).append(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.25)
                                              + bp(r.normal(0, 1, len(t)), 200, 3000) * np.exp(-t / 0.02) * 0.2)
        t = T(0.08)
        kit.setdefault('palillos', []).append(bp(r.normal(0, 1, len(t)), 2000, 6000) * np.exp(-t / 0.008)
                                              + np.sin(2 * np.pi * 1850 * t) * np.exp(-t / 0.012) * 0.4)
    for k in kit:
        kit[k] = [(x / (np.max(np.abs(x)) + 1e-9)).astype(np.float32) for x in kit[k]]
    return kit


GANANCIA_BAT = {'bombo': 1.0, 'caja': 0.8, 'aro': 0.5, 'hh': 0.3, 'hh_abierto': 0.3, 'hh_pie': 0.25,
                'ride': 0.35, 'crash': 0.45, 'palmas': 0.55, 'cajon_g': 0.9, 'cajon_a': 0.7,
                'shaker': 0.18, 'escobilla': 0.3, 'tom_a': 0.7, 'tom_m': 0.7, 'tom_g': 0.75, 'palillos': 0.5}


def _h(paso, vel=.45, cada=2, n=16, fuerte=None):
    return [(s, (fuerte if (fuerte and s % 4 == 0) else vel)) for s in range(0, n, cada)]


BAT = {  # pasos de semicorchea por compás
    'pop': {'bombo': [(0, 1), (8, .9), (10, .55)], 'caja': [(4, 1), (12, 1)], 'hh': _h(2, .5, fuerte=.8)},
    'pop_ligero': {'bombo': [(0, .9), (8, .7)], 'aro': [(4, .8), (12, .8)], 'hh': _h(2, .3, fuerte=.45)},
    'rock': {'bombo': [(0, 1), (6, .6), (8, 1), (10, .7)], 'caja': [(4, 1), (12, 1)], 'hh': _h(2, .7, fuerte=.9)},
    'rock_estribillo': {'bombo': [(0, 1), (6, .6), (8, 1), (10, .7)], 'caja': [(4, 1), (12, 1)],
                        'ride': _h(2, .8)},
    'balada': {'bombo': [(0, .9), (10, .45)], 'aro': [(8, .8)], 'hh': _h(2, .35)},
    'balada_estribillo': {'bombo': [(0, .9), (10, .5)], 'caja': [(8, .85)], 'hh': _h(2, .4)},
    'rumba': {'cajon_g': [(0, 1), (7, .5), (8, .9)], 'cajon_a': [(4, 1), (12, 1), (14, .45)],
              'palmas': [(4, .9), (12, .9)], 'shaker': [(s, .45 if s % 2 else .3) for s in range(16)]},
    'rumba_estribillo': {'cajon_g': [(0, 1), (7, .5), (8, .9)], 'cajon_a': [(4, 1), (12, 1), (14, .45)],
                         'palmas': [(4, 1), (12, 1), (2, .6), (6, .6), (10, .6), (14, .6)],
                         'shaker': [(s, .45 if s % 2 else .3) for s in range(16)]},
    'palmas': {'palmas': [(4, .9), (12, .9)]},
    'flamenco_pop': {'bombo': [(0, 1), (8, .8)], 'caja': [(4, .9), (12, .9)],
                     'palmas': [(4, .8), (12, .8), (14, .5)], 'hh': _h(2, .4)},
    'blues': {'bombo': [(0, 1), (8, .85)], 'caja': [(4, 1), (12, 1)], 'hh': _h(2, .5, fuerte=.7)},
    'jazz': {'ride': [(0, .75), (4, .85), (6, .55), (8, .75), (12, .85), (14, .55)], 'hh_pie': [(4, .6), (12, .6)],
             'bombo': [(0, .2), (8, .2)], 'escobilla': [(4, .4), (12, .4)]},
    # 3/4 (12 pasos)
    'vals': {'bombo': [(0, 1)], 'aro': [(4, .7), (8, .7)], 'hh': _h(2, .4, n=12)},
    'balada34': {'bombo': [(0, .9)], 'aro': [(8, .6)], 'hh': _h(2, .3, n=12)},
    'vals_jazz': {'ride': [(0, .75), (4, .8), (6, .5), (8, .8)], 'hh_pie': [(4, .55), (8, .55)], 'bombo': [(0, .25)]},
}

COMP = {
    4: {
        'pop': [(0, 'D', 1), (1, 'D', .75), (1.5, 'U', .55), (2.5, 'U', .6), (3, 'D', .75), (3.5, 'U', .55)],
        'rumba': [(0, 'D', 1), (.5, 'U', .55), (1, 'M', .9), (1.5, 'U', .55), (2, 'D', .85), (2.5, 'U', .55),
                  (3, 'M', .9), (3.5, 'U', .6)],
        'rock8': [(k * .5, 'P', 1 if k % 2 == 0 else .8) for k in range(8)],
        'rock_abierto': [(0, 'D', 1), (1.5, 'D', .85), (2, 'D', .9), (3, 'D', .85), (3.5, 'U', .6)],
        'arpegio': [(k * .5, ('A', j), .65) for k, j in enumerate([0, 2, 3, 4, 5, 4, 3, 2])],
        'shuffle': [(0, 'D', .9), (.5, 'U', .5), (1, 'D', .7), (1.5, 'U', .5), (2, 'D', .85), (2.5, 'U', .5),
                    (3, 'D', .7), (3.5, 'U', .5)],
        'bloque': [(0, 'B', .95), (2, 'B', .8)],
        'pulso': [(0, 'B', .9)] + [(k * .5, 'R', .7 if k % 2 == 0 else .5) for k in range(1, 8)],
        'redonda': [(0, 'B', .85)],
        'piano_arpegio': [(k * .5, ('a', j), .6) for k, j in enumerate([0, 1, 2, 3, 4, 3, 2, 1])],
        'charleston': [(0, 'B', .8), (1.5, 'R', .7), (3, 'R', .55)],
        'blues_piano': [(0, 'B', .85), (1.5, 'R', .55), (2, 'R', .75), (3.5, 'R', .6)],
        'pad': [(0, 'S', .8)],
    },
    3: {
        'pop': [(0, 'D', 1), (1, 'D', .7), (1.5, 'U', .5), (2, 'D', .7), (2.5, 'U', .5)],
        'arpegio': [(k * .5, ('A', j), .65) for k, j in enumerate([0, 2, 3, 4, 3, 2])],
        'vals': [(0, 'L', .9), (1, 'R', .65), (2, 'R', .6)],
        'piano_arpegio': [(k * .5, ('a', j), .6) for k, j in enumerate([0, 1, 2, 3, 2, 1])],
        'redonda': [(0, 'B', .85)],
        'pad': [(0, 'S', .8)],
    },
}
FORZADO = {'pop': 'D', 'rumba': 'D', 'rock8': 'P', 'rock_abierto': 'D', 'arpegio': ('A', 0), 'shuffle': 'D',
           'bloque': 'B', 'pulso': 'B', 'redonda': 'B', 'piano_arpegio': ('a', 0), 'charleston': 'B',
           'blues_piano': 'B', 'pad': 'S', 'vals': 'B'}

BAJO = {
    4: {
        'pulso8': [(k * .5, .45, 'R') for k in range(8)],
        'raiz_quinta': [(0, 1.45, 'R'), (1.5, .45, 'R'), (2, .95, '5'), (3, .95, '8')],
        'redonda': [(0, 3.9, 'R')],
        'blancas': [(0, 1.9, 'R'), (2, 1.9, '5')],
        'rumba': [(0, 1.45, 'R'), (1.5, .45, '5'), (2, 1.45, 'R'), (3.5, .45, '5')],
        'boogie': [(0, .95, 'R'), (1, .95, '3'), (2, .95, '5'), (3, .95, '6')],
        'walk': [(0, .95, 'R'), (1, .95, 'W'), (2, .95, 'W'), (3, .95, 'W')],
    },
    3: {
        'vals_bajo': [(0, 1.9, 'R'), (2, .9, '5')],
        'redonda': [(0, 2.9, 'R')],
        'vals_walk': [(0, .95, 'R'), (1, .95, 'W'), (2, .95, 'W')],
    },
}

TIPOS = ['intro', 'estrofa', 'estribillo', 'puente', 'final']


def _todos(p):
    return {t: p for t in TIPOS}


def arreglo(estilo, compas, rng):
    """Instrumentación por tipo de sección."""
    pistas, bajo, bat = [], {}, {}
    sin_bat_intro = rng.random() < .5
    if compas == 3:
        if estilo == 'balada':
            pistas.append(dict(inst='piano', pat=_todos('piano_arpegio')))
            pistas.append(dict(inst='pad', pat={'estribillo': 'pad', 'puente': 'pad', 'final': 'pad'}))
            bajo = {'estrofa': 'vals_bajo', 'estribillo': 'vals_bajo', 'puente': 'redonda', 'final': 'vals_bajo'}
            bat = {'estrofa': 'balada34', 'estribillo': 'vals', 'puente': 'balada34', 'final': 'vals'}
        elif estilo == 'pop':
            pistas.append(dict(inst='guitarra', pat=dict(_todos('pop'), puente='arpegio')))
            pistas.append(dict(inst='piano', pat={'estribillo': 'vals', 'final': 'vals', 'puente': 'redonda'}))
            bajo = dict(_todos('vals_bajo'), intro=None)
            bat = dict(_todos('vals'), intro=None if sin_bat_intro else 'vals')
        else:  # jazz vals
            pistas.append(dict(inst='piano', pat=_todos('vals')))
            bajo = dict(_todos('vals_walk'), intro='redonda')
            bat = dict(_todos('vals_jazz'))
        return dict(pistas=pistas, bajo=bajo, bat=bat)
    if estilo == 'pop':
        if rng.random() < .65:
            pistas.append(dict(inst='guitarra', pat=dict(_todos('pop'),
                                                         estrofa='arpegio' if rng.random() < .3 else 'pop',
                                                         puente='arpegio')))
            if rng.random() < .6:
                pistas.append(dict(inst='piano', pat={'estribillo': 'pulso', 'final': 'pulso'}))
        else:
            pistas.append(dict(inst='piano', pat=dict(intro='bloque', estrofa='bloque', estribillo='pulso',
                                                      puente='redonda', final='pulso')))
            if rng.random() < .5:
                pistas.append(dict(inst='pad', pat={'estribillo': 'pad', 'puente': 'pad', 'final': 'pad'}))
        bajo = dict(intro='redonda' if rng.random() < .5 else None, estrofa='raiz_quinta', estribillo='pulso8',
                    puente='blancas', final='pulso8')
        bat = dict(intro=None if sin_bat_intro else 'pop_ligero', estrofa='pop_ligero', estribillo='pop',
                   puente='pop_ligero', final='pop')
    elif estilo == 'rumba':
        pistas.append(dict(inst='guitarra', pat=_todos('rumba')))
        if rng.random() < .5:
            pistas.append(dict(inst='guitarra', pat={'estribillo': 'arpegio', 'puente': 'arpegio'}))
        bajo = dict(_todos('rumba'), intro=None if rng.random() < .5 else 'rumba')
        bat = dict(intro='palmas' if sin_bat_intro else 'rumba', estrofa='rumba', estribillo='rumba_estribillo',
                   puente='rumba', final='rumba_estribillo')
    elif estilo == 'flamenco':
        pistas.append(dict(inst='guitarra', pat=_todos('rumba')))
        pistas.append(dict(inst='piano', pat={'estribillo': 'pulso', 'puente': 'redonda', 'final': 'pulso'}))
        bajo = dict(_todos('rumba'), estribillo='pulso8', intro=None)
        bat = dict(intro=None if sin_bat_intro else 'palmas', estrofa='flamenco_pop', estribillo='flamenco_pop',
                   puente='palmas', final='flamenco_pop')
    elif estilo == 'rock':
        pistas.append(dict(inst='guitarra', dist=True,
                           pat=dict(intro='rock_abierto', estrofa='rock8', estribillo='rock_abierto',
                                    puente='rock8', final='rock_abierto')))
        if rng.random() < .4:
            pistas.append(dict(inst='piano', pat={'estribillo': 'bloque', 'final': 'bloque'}))
        bajo = _todos('pulso8')
        bat = dict(intro=None if sin_bat_intro else 'rock', estrofa='rock', estribillo='rock_estribillo',
                   puente='rock', final='rock_estribillo')
    elif estilo == 'balada':
        pistas.append(dict(inst='piano', pat=dict(_todos('piano_arpegio'),
                                                  estribillo='bloque' if rng.random() < .4 else 'piano_arpegio')))
        pistas.append(dict(inst='pad', pat={'estribillo': 'pad', 'puente': 'pad', 'final': 'pad'}))
        if rng.random() < .35:
            pistas.append(dict(inst='guitarra', pat={'estrofa': 'arpegio', 'estribillo': 'arpegio'}))
        bajo = dict(intro=None, estrofa='redonda', estribillo='blancas', puente='redonda', final='blancas')
        bat = dict(intro=None, estrofa=None if rng.random() < .5 else 'balada', estribillo='balada_estribillo',
                   puente='balada', final='balada_estribillo')
    elif estilo == 'blues':
        pistas.append(dict(inst='piano', pat=_todos('blues_piano')))
        pistas.append(dict(inst='guitarra', pat={'estribillo': 'shuffle', 'puente': 'shuffle', 'final': 'shuffle'}))
        bajo = _todos('boogie')
        bat = _todos('blues')
    elif estilo == 'jazz':
        pistas.append(dict(inst='piano', pat=_todos('charleston')))
        bajo = dict(_todos('walk'), intro='blancas', estrofa='blancas' if rng.random() < .5 else 'walk')
        bat = _todos('jazz')
    return dict(pistas=pistas, bajo=bajo, bat=bat)


# ---------------------------------------------------------------- voicings
def voicing_piano(ac, prev, rng):
    pcs = ac.pcs()
    cands = []
    for rot in range(len(pcs)):
        orden = pcs[rot:] + pcs[:rot]
        for base in range(53, 68):
            if base % 12 != orden[0]:
                continue
            notas = [base]
            for pc in orden[1:]:
                m = notas[-1] + 1
                while m % 12 != pc:
                    m += 1
                notas.append(m)
            if notas[-1] <= 79:
                cands.append(notas)
    ref = np.mean(prev) if prev else 65.0
    coste = [abs(np.mean(c) - ref) + rng.uniform(0, 1.5) for c in cands]
    return cands[int(np.argmin(coste))]


def voicing_guitarra(ac, n_cuerdas, rng):
    pcs = set(ac.pcs())
    b = 40 + (ac.bajo_pc() - 40) % 12
    notas = [b]
    falta = pcs - {b % 12}
    while len(notas) < n_cuerdas:
        lo, hi = (3, 10) if len(notas) == 1 else (3, 9)
        cand = [m for m in range(notas[-1] + lo, notas[-1] + hi) if m % 12 in pcs and m <= 77]
        if not cand:
            break
        pref = [m for m in cand if m % 12 in falta] or cand
        m = pref[0] if rng.random() < .7 else pref[int(rng.integers(len(pref)))]
        notas.append(m)
        falta.discard(m % 12)
    for pc in list(falta):   # asegurar 3ª/7ª: sustituir una nota repetida
        cuenta = {}
        for m in notas[1:]:
            cuenta[m % 12] = cuenta.get(m % 12, 0) + 1
        reps = [i for i in range(1, len(notas)) if cuenta[notas[i] % 12] > 1 or notas[i] % 12 == b % 12]
        if reps:
            i = reps[-1]
            m = notas[i]
            notas[i] = min((x for x in range(max(notas[0] + 1, m - 6), m + 7) if x % 12 == pc),
                           key=lambda x: abs(x - m))
    return sorted(notas)


# ---------------------------------------------------------------- canción
class Linea:
    def __init__(self, segs, fin):
        self.ini = np.array([s[0] for s in segs])
        self.acs = [s[1] for s in segs]
        self.fin = fin

    def idx(self, b):
        return max(0, int(np.searchsorted(self.ini, b + 1e-6, 'right')) - 1)

    def en(self, b):
        return self.acs[self.idx(b)]

    def siguiente_cambio(self, b):
        i = int(np.searchsorted(self.ini, b + 1e-6, 'right'))
        return self.ini[i] if i < len(self.ini) else self.fin


def elegir_estructura(estilo, compas, bd, extra, rng):
    bar = compas * bd
    objetivo = rng.uniform(64, 86)
    E, T = (ESTRUCTURAS_BLUES, TAMANOS_BLUES) if estilo == 'blues' else (ESTRUCTURAS, TAMANOS)
    ops, pesos, todas = [], [], []
    for est in E:
        tipos = sorted(set(est))
        for combo in itertools.product(*[T[t] for t in tipos]):
            tam = dict(zip(tipos, combo))
            if tam.get('intro', 0) > tam.get('estrofa', 99) or tam.get('final', 0) > tam.get('estribillo', 99):
                continue
            dur = extra + (sum(tam[t] for t in est) + 1) * bar
            todas.append((abs(dur - 75), est, tam))
            if 60 <= dur <= 90:
                w = np.prod([PESO_TAM[tam[t]] for t in tipos]) * np.exp(-abs(dur - objetivo) / 6)
                ops.append((est, tam))
                pesos.append(w)
    if not ops:
        _, est, tam = min(todas, key=lambda x: x[0])
        return est, tam
    pesos = np.array(pesos) / np.sum(pesos)
    return ops[int(rng.choice(len(ops), p=pesos))]


def ritmo_frase(n8, rng, densidad):
    cola = int(rng.integers(2, 5))
    on = []
    for k in range(n8 - cola):
        p = (.85 if k == 0 else .7) if k % 2 == 0 else .35 * densidad
        if rng.random() < p:
            on.append(k)
    if len(on) < 3:
        on = sorted(set(on) | {0, 2, 4})
    out = []
    for a, b in zip(on, on[1:] + [n8 - cola]):
        out.append((a * .5, min(b - a, 6) * .5))
    return out


def melodia(linea, b0, nbeats, compas, raiz, modo, centro, rng, densidad, blues_solo=False):
    """Notas (b_rel, dur, midi, vel) de una sección: tonos del acorde en partes
    fuertes, notas de paso, bordaduras y apoyaturas fuera del acorde."""
    esc_base = {(raiz + x) % 12 for x in ((0, 3, 5, 6, 7, 10) if blues_solo else ESCALA[modo])}
    lo, hi = centro - 7, centro + 9
    frase = 2 * compas
    n8 = int(frase * 2)
    notas, prev, ritmo_ant, nct_fuerte = [], centro, None, False
    for p in range(int(nbeats // frase)):
        if p % 2 == 1 and ritmo_ant is not None and rng.random() < .6:
            ritmo = ritmo_ant
        else:
            ritmo = ritmo_frase(n8, rng, densidad)
        ritmo_ant = ritmo
        for r, d in ritmo:
            bb = p * frase + r
            ac = linea.en(b0 + bb)
            cts = set(ac.pcs())
            esc = set(esc_base)
            if not blues_solo:   # la escala se adapta al acorde (p. ej. Sol# sobre Mi en La menor)
                for c in cts:
                    if c not in esc_base:
                        rel = (c - raiz) % 12
                        esc.discard((c - 1) % 12 if (modo == 'min' and rel in (4, 9, 11)) else (c + 1) % 12)
                        esc.add(c)
            rr = round(r)
            fuerte = abs(r - rr) < 1e-6 and rr % (2 if compas == 4 else 3) == 0
            if nct_fuerte:   # resolver la apoyatura por grado conjunto
                pool = [m for m in range(prev - 2, prev + 3) if m % 12 in cts and lo <= m <= hi]
            else:
                pool = []
            if not pool:
                p_ct = (.45 if blues_solo else .72) if fuerte else .4
                if rng.random() < p_ct:
                    pool = [m for m in range(lo, hi + 1) if m % 12 in cts]
                else:
                    pool = [m for m in range(lo, hi + 1) if m % 12 in esc and m % 12 not in cts]
            pool = np.array(pool)
            w = np.exp(-np.abs(pool - prev) / 2.5) * np.where(pool == prev, .5, 1.0)
            m = int(pool[rng.choice(len(pool), p=w / w.sum())])
            nct_fuerte = fuerte and m % 12 not in cts
            notas.append((bb, d * .95, m, rng.uniform(.75, 1.0)))
            prev = m
    return notas


def ir_reverb(rng, rt60):
    n = int(min(2.5, rt60 * 1.3) * SR)
    t = np.arange(n) / SR
    x = rng.normal(0, 1, n) * np.exp(-6.91 * t / rt60)
    x = sps.sosfilt(sps.butter(2, 4500, 'low', fs=SR, output='sos'), x)
    x[:int(0.012 * SR)] = 0
    for d, g in ((0.013, .6), (0.021, .45), (0.029, .4), (0.043, .3)):
        x[int(d * SR)] += g * np.sqrt(np.sum(x ** 2) / n) * 40
    return (x / np.sqrt(np.sum(x ** 2))).astype(np.float32)


def limitador(x, techo):
    nec = np.minimum(1.0, techo / np.maximum(np.abs(x), 1e-9))
    h = int(0.03 * SR)
    g = ndi.uniform_filter1d(ndi.minimum_filter1d(nec, 2 * h + 1), 2 * h + 1)
    return np.clip(x * g, -techo, techo)


def cerrar(notas_ev, cambios, fin, max_b):
    """notas_ev: (b, grupo, midi, vel, extra) ordenadas. Cada nota acaba en el
    siguiente ataque del mismo grupo, en el siguiente cambio de acorde o al final."""
    out = []
    abiertas = {}
    cambios = np.asarray(cambios)
    for b, g, m, v, ex in notas_ev:
        if g in abiertas:
            o = abiertas.pop(g)
            o[1] = min(o[1], b)
        i = int(np.searchsorted(cambios, b + 1e-6))
        sig = cambios[i] if i < len(cambios) else fin
        o = [b, min(sig, b + max_b, fin), m, v, ex]
        abiertas[g] = o
        out.append(o)
    return out


def generar(cfg):
    global AFINACION
    AFINACION = cfg['afinacion']
    i = cfg['i']
    rng = np.random.default_rng([SEMILLA, i])
    estilo, compas, raiz, modo, tempo = cfg['estilo'], cfg['compas'], cfg['raiz'], cfg['modo'], cfg['tempo']
    nombres = nombres_de(raiz, modo)
    bd = 60.0 / tempo
    swing = {'blues': .64, 'jazz': .6}.get(estilo, .5)
    pre = float(rng.uniform(0.4, 2.0))
    post = float(rng.uniform(1.8, 3.2))
    cuenta = rng.random() < .3
    est, tam = elegir_estructura(estilo, compas, bd, pre + post + (compas * bd if cuenta else 0), rng)

    # --- progresiones por sección
    tabla = ESTILO_PROG[(estilo, modo)]
    prog = {'estrofa': str(rng.choice(tabla['estrofa']))}
    prog['estribillo'] = str(rng.choice([p for p in tabla['estribillo'] if p != prog['estrofa']] or tabla['estribillo']))
    prog['puente'] = str(rng.choice([p for p in tabla['puente'] if p not in prog.values()] or tabla['puente']))
    loops = {t: crear_loop(prog[t], raiz, modo, estilo, compas, tempo, rng) for t in ('estrofa', 'estribillo', 'puente')}
    if estilo == 'blues':
        for t in ('intro', 'final'):
            prog[t] = tabla[t][0]
            loops[t] = crear_loop(prog[t], raiz, modo, estilo, compas, tempo, rng)
    else:
        prog['intro'] = prog['estrofa'] if rng.random() < .5 else prog['estribillo']
        loops['intro'] = loops['estrofa'] if prog['intro'] == prog['estrofa'] else loops['estribillo']
        prog['final'] = prog['estribillo']
        loops['final'] = loops['estribillo']

    # --- línea de acordes en pulsos (pulso 0 = primer compás de la intro)
    segs, secciones, apar, b = [], [], {}, 0
    for k, tipo in enumerate(est):
        L = tam[tipo] * compas
        loop = loops[tipo]
        r, j = 0, 0
        while r < L - 1e-9:
            ac, d, ant = loop[j % len(loop)]
            ini = b + r
            if ant and ini > 0 and segs and ini - segs[-1][0] >= 2:
                ini -= 0.5
            segs.append([ini, ac])
            r += min(d, L - r)
            j += 1
        if tipo == 'final':
            ton = Acorde(raiz, 'min' if modo == 'min' else 'maj')
            if estilo == 'blues':
                ton = Acorde(raiz, '7')
            elif estilo in ('jazz', 'balada') and modo == 'maj' and rng.random() < .5:
                ton = Acorde(raiz, 'maj7')
            segs.append([b + L, ton])
            L += compas
        secciones.append((tipo, b, b + L, apar.get(tipo, 0)))
        apar[tipo] = apar.get(tipo, 0) + 1
        b += L
    total_b = b
    fus = []
    for s in segs:   # fundir acordes iguales seguidos
        if fus and fus[-1][1].clave() == s[1].clave():
            continue
        fus.append(s)
    linea = Linea(fus, total_b)
    cambios = list(linea.ini[1:]) + [total_b]
    t0 = pre + (compas * bd if cuenta else 0)

    def b2t(bb):
        bb = np.asarray(bb, dtype=float)
        if swing != .5:
            w = np.floor(bb)
            f = bb - w
            bb = w + np.where(f < .5, f * swing / .5, swing + (f - .5) * (1 - swing) / .5)
        return t0 + bb * bd

    t_fin = float(b2t(total_b))
    dur_total = t_fin + post
    N = int(round(dur_total * SR))

    # --- voicings por acorde
    n_cuerdas = int(rng.choice([5, 6]))
    vp, vg, prev = [], [], None
    for ac in linea.acs:
        prev = voicing_piano(ac, prev, rng)
        vp.append(prev)
        vg.append(voicing_guitarra(ac, n_cuerdas, rng))
    oct_izq = rng.random() < .5

    arr = arreglo(estilo, compas, rng)
    nivel = {'intro': .8, 'estrofa': .85, 'estribillo': 1.0, 'puente': .85, 'final': 1.0}
    compases = []   # (b_inicio, tipo, aparición, último_de_sección, compás_final_sostenido)
    for tipo, sb0, sb1, ap in secciones:
        nb = int(round((sb1 - sb0) / compas))
        for q in range(nb):
            compases.append((sb0 + q * compas, tipo, ap, q == nb - 1, tipo == 'final' and q == nb - 1))

    def seccion_en(bb):
        for tipo, sb0, sb1, ap in secciones:
            if sb0 - 1e-9 <= bb < sb1 - 1e-9:
                return tipo
        return secciones[-1][0]

    def jit(s=0.006):
        return float(np.clip(rng.normal(0, s), -2.5 * s, 2.5 * s))

    # --- acompañamiento armónico
    buses = {}
    for pista in arr['pistas']:
        inst, pats = pista['inst'], pista['pat']
        ev = []
        for cb, tipo, ap, ult, sost in compases:
            pat = pats.get(tipo)
            if not pat:
                continue
            if sost:
                k = 'S' if inst == 'pad' else ('D' if inst == 'guitarra' else 'B')
                ev.append((cb, k, nivel[tipo]))
                continue
            for pos, k, v in COMP[compas][pat]:
                ev.append((cb + pos, k, v * nivel[tipo]))
        hay = {round(e[0], 3) for e in ev}
        for c in linea.ini:   # siempre se ataca el acorde nuevo cuando cambia
            pat = pats.get(seccion_en(c + 0.5))
            if pat and round(c, 3) not in hay and c < total_b:
                ev.append((c, FORZADO[pat], .8))
        ev.sort(key=lambda e: e[0])
        if inst == 'pad':   # el colchón sólo se ataca al cambiar de acorde o al entrar
            nuevo, ult_i = [], None
            for e in ev:
                ii = linea.idx(e[0])
                if ii != ult_i or (nuevo and e[0] - nuevo[-1][0] > 8 * compas):
                    nuevo.append(e)
                ult_i = ii
            ev = nuevo
        notas_ev = []
        for bb, k, v in ev:
            ii = linea.idx(bb)
            ac = linea.acs[ii]
            j = jit()
            if inst == 'guitarra':
                voz = vg[ii]
                n = len(voz)
                sp = rng.uniform(0.006, 0.013)
                if k == 'D':
                    cuerdas = list(range(n))
                    offs = [q * sp for q in range(n)]
                elif k == 'U':
                    top = int(rng.integers(3, 5))
                    cuerdas = list(range(n - 1, n - 1 - top, -1))
                    offs = [q * sp * .8 for q in range(top)]
                elif k == 'P':
                    cuerdas = list(range(min(3, n)))
                    offs = [q * sp * .5 for q in range(len(cuerdas))]
                elif k == 'M':
                    cuerdas = list(range(n))
                    offs = [q * sp * .6 for q in range(n)]
                else:
                    cuerdas = [k[1] % n]
                    offs = [0]
                for c, o in zip(cuerdas, offs):
                    notas_ev.append((bb, ('c', c), voz[c], v * rng.uniform(.8, 1.0),
                                     dict(off=j + o, var=int(rng.integers(3)), palm=k == 'P', mute=k == 'M')))
            elif inst == 'piano':
                rh = vp[ii]
                bajo = 36 + (ac.bajo_pc() - 36) % 12
                lh = [bajo, bajo + 12] if oct_izq else [bajo, bajo + 7 if (ac.bajo == 0 and ac.cal != 'sus4') else bajo + 12]
                piscina = lh[:1] + [x for x in rh if x > lh[0] + 6]
                if not isinstance(k, tuple):
                    if k in ('B', 'L'):
                        for x in lh:
                            notas_ev.append((bb, ('L', x - bajo), x, v * .8, dict(off=j)))
                    if k in ('B', 'R'):
                        for q, x in enumerate(rh):
                            notas_ev.append((bb, ('R', q), x, v * .9, dict(off=j + q * .003)))
                else:
                    q = k[1] % len(piscina)
                    notas_ev.append((bb, ('a', q), piscina[q], v, dict(off=j)))
            else:   # pad
                for q, x in enumerate(vp[ii]):
                    notas_ev.append((bb, ('p', q), x, v, dict(off=0)))
        max_b = (2.6 / bd) if inst == 'guitarra' else (3.8 / bd if inst == 'piano' else 5.5 / bd)
        notas = cerrar(notas_ev, cambios, total_b, max_b)
        x = np.zeros(N, np.float32)
        for b_on, b_off, m, v, ex in notas:
            t_on = float(b2t(b_on)) + ex['off']
            t_off = float(b2t(b_off)) + (ex['off'] if b_off < total_b else 0)
            i0 = int(t_on * SR)
            if i0 >= N or t_off <= t_on:
                continue
            if inst == 'guitarra':
                tono = tono_guitarra(m, ex['var'])
                if ex['mute']:
                    nn = min(int(0.07 * SR), N - i0)
                    tt = np.arange(nn) / SR
                    x[i0:i0 + nn] += tono[:nn] * np.exp(-tt / 0.012) * v * .7
                    ruido = rng.normal(0, 1, nn) * np.exp(-tt / 0.01) * v * .25
                    x[i0:i0 + nn] += sps.lfilter([1, -0.9], [1], ruido).astype(np.float32)
                    continue
                rel = 0.015
            elif inst == 'piano':
                tono, rel = tono_piano(m), 0.12
            else:
                tono, rel = tono_pad(m), 0.35
            nd = int((t_off - t_on) * SR)
            nn = min(nd + int(rel * 4 * SR), len(tono), N - i0)
            if nn <= 0:
                continue
            env = np.ones(nn, np.float32)
            if nd < nn:
                env[nd:] = np.exp(-np.arange(nn - nd) / (rel * SR))
            if inst == 'guitarra' and ex['palm']:
                env *= np.exp(-np.arange(nn) / (0.12 * SR)).astype(np.float32)
            if inst == 'pad':
                env *= np.minimum(1, np.arange(nn) / (0.25 * SR)).astype(np.float32)
            x[i0:i0 + nn] += tono[:nn] * env * v
        if inst == 'guitarra':
            x = x + 0.35 * sps.lfilter(*sps.iirpeak(105, 3, fs=SR), x) + 0.25 * sps.lfilter(*sps.iirpeak(210, 4, fs=SR), x)
            if pista.get('dist'):
                x = x / (np.max(np.abs(x)) + 1e-9)
                x = np.tanh(4 * x) / np.tanh(4)
                x = sps.sosfilt(sps.butter(2, 4500, 'low', fs=SR, output='sos'), x)
            x = sps.sosfilt(sps.butter(2, 75, 'high', fs=SR, output='sos'), x)
        elif inst == 'pad':
            x = sps.sosfilt(sps.butter(2, 2500, 'low', fs=SR, output='sos'), x)
        clave = inst + ('2' if inst in buses else '')
        buses[clave] = x.astype(np.float32)

    # --- bajo
    xb = np.zeros(N, np.float32)
    notas_b = []
    for cb, tipo, ap, ult, sost in compases:
        pat = arr['bajo'].get(tipo)
        if not pat:
            continue
        if sost:
            notas_b.append([cb, compas, 'R'])
            continue
        for pos, d, rol in BAJO[compas][pat]:
            if pat == 'pulso8' and pos % 1 and rng.random() < .15:
                rol = '8'
            if pat == 'boogie' and ((cb - secciones[0][1]) / compas) % 2 == 1:
                rol = {'3': '6', '6': 'b7'}.get(rol, rol) if pos >= 2 else rol
            notas_b.append([cb + pos, d, rol])
    activos = {round(n[0], 3) for n in notas_b}
    for c in linea.ini:
        pat = arr['bajo'].get(seccion_en(c + 0.5))
        if pat and round(c, 3) not in activos and c < total_b:
            notas_b.append([c, 1.0, 'R'])
    notas_b.sort(key=lambda n: n[0])
    prev = 40
    n_aprox = 0
    for q, (bb, d, rol) in enumerate(notas_b):
        sig_on = notas_b[q + 1][0] if q + 1 < len(notas_b) else total_b
        cam = linea.siguiente_cambio(bb)
        fin_b = min(bb + d, sig_on, cam, total_b)
        ii = linea.idx(bb)
        ac = linea.acs[ii]
        empieza_acorde = abs(linea.ini[ii] - bb) < 1e-6
        def cerca(pc, ref):
            cands = [m for m in range(28, 53) if m % 12 == pc]
            return min(cands, key=lambda m: abs(m - ref))
        if rol == 'R' or empieza_acorde:
            m = cerca(ac.bajo_pc(), prev)
        else:
            r0 = cerca(ac.raiz, prev)
            if rol == '5':
                m = r0 + 7 if r0 + 7 <= 55 else r0 - 5
            elif rol == '8':
                m = cerca(ac.bajo_pc(), prev) + 12
                if m > 57:
                    m -= 12
            elif rol == '3':
                m = r0 + CALIDADES[ac.cal][1]
            elif rol == '6':
                m = r0 + 9
            elif rol == 'b7':
                m = r0 + 10
            else:   # 'W' paseo
                tonos = [x for x in range(prev - 5, prev + 6) if x % 12 in ac.pcs() or
                         x % 12 in {(raiz + e) % 12 for e in ESCALA[modo]}]
                tonos = [x for x in tonos if x != prev and 28 <= x <= 55] or [prev]
                m = int(tonos[int(rng.integers(len(tonos)))])
        siguiente = linea.acs[min(ii + 1, len(linea.acs) - 1)]
        if (not empieza_acorde and cam < total_b and cam - bb <= 1.0 + 1e-6 and sig_on >= cam - 1e-6
                and (rol == 'W' or rng.random() < .35)):
            objetivo = cerca(siguiente.bajo_pc(), m)
            m = objetivo + int(rng.choice([-1, 1, -2, 2]))   # nota de paso / aproximación
            n_aprox += 1
        m = int(np.clip(m, 26, 57))
        prev = m
        t_on = float(b2t(bb)) + jit()
        t_off = float(b2t(fin_b))
        i0 = int(t_on * SR)
        nd = int((t_off - t_on) * SR)
        tono = tono_bajo(m)
        nn = min(nd + int(0.12 * SR), len(tono), N - i0)
        if nn <= 0 or nd <= 0:
            continue
        env = np.ones(nn, np.float32)
        if nd < nn:
            env[nd:] = np.exp(-np.arange(nn - nd) / (0.03 * SR))
        xb[i0:i0 + nn] += tono[:nn] * env * rng.uniform(.8, 1.0)
    xb = sps.sosfilt(sps.butter(2, 2200, 'low', fs=SR, output='sos'), xb).astype(np.float32)
    buses['bajo'] = xb

    # --- batería
    kit = kit_bateria(rng)
    xd = np.zeros(N, np.float32)
    golpes = []
    if cuenta:
        for q in range(compas):
            golpes.append((-compas + q, 'palillos', .9))
    nombres_sec = [s[0] for s in secciones]
    for cb, tipo, ap, ult, sost in compases:
        pat = arr['bat'].get(tipo)
        if tipo == 'estrofa' and ap > 0 and pat in ('pop_ligero',):
            pat = 'pop'
        if not pat:
            continue
        pasos = 4 * compas
        es_primero = any(abs(cb - s[1]) < 1e-6 for s in secciones)
        if sost:
            golpes += [(cb, 'bombo', 1.0), (cb, 'crash', 1.0)]
            continue
        relleno = ult and estilo not in ('jazz',) and rng.random() < .6 and pat != 'palmas'
        for inst, lista in BAT[pat].items():
            for paso, v in lista:
                if relleno and paso >= pasos // 2 and inst in ('caja', 'aro', 'hh', 'cajon_a', 'ride', 'palmas'):
                    continue
                golpes.append((cb + paso / 4, inst, v * rng.uniform(.85, 1.0)))
        if relleno:
            if estilo in ('rumba',):
                for paso in range(pasos // 2, pasos):
                    golpes.append((cb + paso / 4, 'cajon_a', .5 + .5 * (paso - pasos // 2) / (pasos // 2)))
            elif rng.random() < .5:
                for q, paso in enumerate(range(pasos // 2, pasos)):
                    golpes.append((cb + paso / 4, 'caja', .45 + .5 * q / (pasos // 2)))
            else:
                toms = ['tom_a'] * 3 + ['tom_m'] * 3 + ['tom_g'] * 2
                for q, paso in enumerate(range(pasos // 2, pasos)):
                    golpes.append((cb + paso / 4, toms[min(q * 8 // (pasos // 2), 7)], .8))
        if es_primero and tipo in ('estribillo', 'puente', 'final') and estilo not in ('jazz', 'rumba'):
            golpes.append((cb, 'crash', .8))
            golpes.append((cb, 'bombo', .9))
    for bb, inst, v in golpes:
        t = float(b2t(bb)) + jit(0.004)
        i0 = int(t * SR)
        s = kit[inst][int(rng.integers(3))]
        nn = min(len(s), N - i0)
        if nn > 0 and i0 >= 0:
            xd[i0:i0 + nn] += s[:nn] * GANANCIA_BAT[inst] * v ** 1.5
    buses['bateria'] = xd

    # --- melodía
    timbre = str(rng.choice(['seno', 'sierra']))
    tonica = 57 + (raiz - 57) % 12
    con_mel = {'estrofa': (tonica + 4, 1.0), 'estribillo': (tonica + 7, 1.3)}
    if 'puente' in est and (estilo == 'blues' or rng.random() < .6):
        con_mel['puente'] = (tonica + 5, 1.6 if estilo == 'blues' else 1.0)
    mel = {}
    for tipo, (centro, dens) in con_mel.items():
        if tipo not in est:
            continue
        sec = next(s for s in secciones if s[0] == tipo)
        mel[tipo] = melodia(linea, sec[1], sec[2] - sec[1], compas, raiz, modo, centro, rng, dens,
                            blues_solo=(estilo == 'blues' and tipo == 'puente'))
    xm = np.zeros(N, np.float32)
    n_notas_mel = 0
    for tipo, sb0, sb1, ap in secciones:
        for bb, d, m, v in mel.get(tipo, []):
            t_on = float(b2t(sb0 + bb)) + jit(0.008)
            t_off = float(b2t(sb0 + bb + d))
            y = nota_melodia(m, max(0.08, t_off - t_on), timbre, rng)
            i0 = int(t_on * SR)
            nn = min(len(y), N - i0)
            xm[i0:i0 + nn] += y[:nn] * v
            n_notas_mel += 1
    buses['melodia'] = xm

    # --- mezcla
    i_ini, i_fin = int(pre * SR), int(t_fin * SR)
    objetivo_db = {'bateria': -19, 'bajo': -21, 'guitarra': -21, 'guitarra2': -25, 'piano': -21, 'piano2': -24,
                   'pad': -27, 'melodia': -20}
    envio = {'bateria': .08, 'bajo': 0.0, 'guitarra': .18, 'guitarra2': .2, 'piano': .2, 'piano2': .2,
             'pad': .25, 'melodia': .22}
    if estilo == 'balada':
        objetivo_db['bateria'] = -24
    rt60 = float(rng.uniform(1.2, 1.8) if estilo == 'balada' else rng.uniform(0.6, 1.3))
    ir = ir_reverb(rng, rt60)
    mezcla = np.zeros(N)
    for k, x in buses.items():
        seg = x[i_ini:i_fin]
        activos = np.abs(seg) > 1e-4
        rms = np.sqrt(np.mean(seg[activos] ** 2)) if activos.any() else 0
        if rms <= 0:
            continue
        x = x * (10 ** ((objetivo_db[k] + rng.uniform(-1.5, 1.5)) / 20) / rms)
        if envio[k] > 0:
            x = x + envio[k] * sps.fftconvolve(x, ir)[:N]
        mezcla += x
    mezcla = sps.sosfilt(sps.butter(2, 30, 'high', fs=SR, output='sos'), mezcla)
    rms = np.sqrt(np.mean(mezcla[i_ini:i_fin] ** 2))
    mezcla *= 10 ** (-15 / 20) / rms
    mezcla = limitador(mezcla, 10 ** (-1 / 20))
    mezcla += np.random.default_rng([SEMILLA, i, 9]).normal(0, 10 ** (-75 / 20), N)
    pcm = np.clip(np.round(mezcla * 32767), -32768, 32767).astype('<i2')

    nombre = f's{i + 1:02d}_{estilo}'
    os.makedirs(SALIDA, exist_ok=True)
    base = os.path.join(SALIDA, nombre)
    with wave.open(base + '.wav', 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())

    # --- anotaciones
    lab = [[0.0, float(b2t(linea.ini[0])), 'N']]
    for q, ac in enumerate(linea.acs):
        b_fin = linea.ini[q + 1] if q + 1 < len(linea.ini) else total_b
        lab.append([float(b2t(linea.ini[q])), float(b2t(b_fin)), ac.etiqueta(nombres)])
    lab.append([t_fin, dur_total, 'N'])
    lab = [s for s in lab if s[1] - s[0] > 1e-6]
    with open(base + '.lab', 'w') as f:
        for a, bq, e in lab:
            f.write(f'{a:.6f}\t{bq:.6f}\t{e}\n')
    t_sec0 = pre
    secl = [[0.0, t_sec0, 'silencio']]
    for q, (tipo, sb0, sb1, ap) in enumerate(secciones):
        a = t_sec0 if q == 0 else float(b2t(sb0))
        secl.append([a, float(b2t(sb1)), tipo])
    secl.append([t_fin, dur_total, 'silencio'])
    with open(base + '.secciones.lab', 'w') as f:
        for a, bq, e in secl:
            f.write(f'{a:.6f}\t{bq:.6f}\t{e}\n')
    with open(base + '.beats.txt', 'w') as f:
        for k in range(-compas if cuenta else 0, int(round(total_b))):
            f.write(f'{float(b2t(k)):.6f}\t{k % compas + 1}\n')

    voc = {}
    for a, bq, e in lab:
        q = 'N' if e == 'N' else e.split(':')[1].split('/')[0] + ('/inv' if '/' in e else '')
        voc[q] = voc.get(q, 0) + bq - a
    tonica_nombre = nombres[raiz]
    return {
        'path': f'sintetico/{nombre}.wav', 'lab': f'sintetico/{nombre}.lab',
        'secciones': f'sintetico/{nombre}.secciones.lab', 'beats': f'sintetico/{nombre}.beats.txt',
        'subset': 'sintetico',
        'source': f'generar_sintetico.py (semilla {SEMILLA}, canción {i})',
        'license': 'CC0 1.0 (generado para este corpus)',
        'duration': round(dur_total, 4), 'key': f'{tonica_nombre}:{modo}', 'tempo': float(tempo),
        'meter': f'{compas}/4', 'style': estilo, 'swing': swing != .5,
        'count_in': bool(cuenta), 'tuning_cents': cfg['afinacion'], 'silence_start': round(pre, 3), 'music_end': round(t_fin, 3),
        'structure': [{'section': s[0], 'start': round(a, 3), 'end': round(bq, 3)}
                      for s, (a, bq, _) in zip(secciones, secl[1:-1])],
        'progressions': {t: {'name': prog[t], 'chords': [f'{ac.etiqueta(nombres)}*{d}{"(ant)" if an else ""}'
                                                           for ac, d, an in loops[t]]}
                         for t in prog if t in est},
        'n_chord_segments': len(linea.acs), 'n_anticipations': int(sum(1 for s in segs if s[0] % 1)),
        'n_bass_approach_notes': n_aprox, 'n_melody_notes': n_notas_mel,
        'instruments': sorted(buses), 'melody_timbre': timbre, 'reverb_rt60': round(rt60, 2),
        'chord_seconds_by_quality': {k: round(v, 2) for k, v in sorted(voc.items())},
    }


def planificar():
    rng = np.random.default_rng(SEMILLA)
    estilos = ['pop'] * 8 + ['rumba'] * 6 + ['rock'] * 5 + ['balada'] * 4 + ['flamenco'] * 3 + ['blues'] * 2 + ['jazz'] * 2
    modos = (['maj'] * 5 + ['min'] * 3 + ['min'] * 4 + ['maj'] * 2 + ['maj'] * 3 + ['min'] * 2
             + ['maj'] * 3 + ['min'] + ['min'] * 3 + ['maj'] * 2 + ['maj'] * 2)
    compases = [4] * 30
    for k in (0, 19, 20, 28):   # un pop, dos baladas y un jazz en 3/4
        compases[k] = 3
    raices = list(rng.permutation(12)) + list(rng.permutation(12)) + list(rng.permutation(12)[:6])
    TEMPO = {('pop', 4): (88, 132), ('pop', 3): (84, 120), ('rumba', 4): (96, 136), ('rock', 4): (110, 160),
             ('balada', 4): (70, 88), ('balada', 3): (72, 100), ('flamenco', 4): (90, 124),
             ('blues', 4): (100, 150), ('jazz', 4): (100, 140), ('jazz', 3): (120, 160)}
    cfgs = []
    for k in range(30):
        lo, hi = TEMPO[(estilos[k], compases[k])]
        cfgs.append(dict(estilo=estilos[k], modo=modos[k], compas=compases[k], raiz=int(raices[k]),
                         tempo=int(rng.integers(lo, hi + 1))))
    orden = rng.permutation(30)
    # ~40 % de las canciones desafinadas 10-35 cents (como una banda real sin La 440)
    afin = [0.0 if rng.random() < .6 else float(rng.choice([-1, 1]) * rng.uniform(10, 35)) for _ in range(30)]
    out = []
    for i, k in enumerate(orden):
        c = dict(cfgs[k])
        c['i'] = i
        c['afinacion'] = round(afin[i], 1)
        out.append(c)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--procesos', type=int, default=4)
    ap.add_argument('--solo', default='')
    args = ap.parse_args()
    cfgs = planificar()
    if args.solo:
        quiero = {int(x) for x in args.solo.split(',')}
        cfgs = [c for c in cfgs if c['i'] + 1 in quiero]
    with Pool(args.procesos) as p:
        metas = p.map(generar, cfgs, chunksize=1)
    for m in metas:
        print(m['path'], m['style'], m['key'], m['tempo'], m['meter'], round(m['duration'], 1), file=sys.stderr)
    if not args.solo:
        with open(os.path.join(SALIDA, '_meta.json'), 'w') as f:
            json.dump(metas, f, indent=1, ensure_ascii=False)


if __name__ == '__main__':
    main()
