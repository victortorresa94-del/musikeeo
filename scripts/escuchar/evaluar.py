#!/usr/bin/env python3
"""Evalúa un reconocedor de acordes contra el corpus (mir_eval).

Uso:
  python3 evaluar.py <dir_estimaciones> [--corpus DIR] [--sub guitarset|sintetico|otros]... [--por-fichero]

Para cada referencia <corpus>/<sub>/<nombre>.lab busca
<dir_estimaciones>/<sub>/<nombre>.lab (misma ruta relativa). Si falta, cuenta
como 0 y se lista. Métricas de acordes (mir_eval.chord): root, majmin, mirex,
thirds, sevenths, ponderadas por duración (WCSR: tiempo acertado / tiempo
evaluable, sumando sobre ficheros), y segmentación `seg` = min(overseg,
underseg) = 1 - directional Hamming distance en el peor sentido, ponderada por
duración del fichero.

Opcionales, si existen junto a la estimación:
  <nombre>.tempo.txt      un número (BPM). Correcto si está a <=4 % del tempo
                          real; los errores de octava (x2, x1/2) se cuentan aparte.
  <nombre>.tono.txt       p. ej. "A:min", "Eb:maj", "A minor" o "Am".
                          Puntuación MIREX de tonalidad (mir_eval.key.weighted_score).
  <nombre>.secciones.lab  inicio fin etiqueta. F de fronteras con ventana de 3 s
                          (mir_eval.segment.detection, trim=True: no cuentan el
                          principio ni el final del fichero). Solo donde la
                          referencia tiene secciones (sintetico).
  <nombre>.beats.txt      tiempos de pulso (1.ª columna). F-measure de pulsos
                          (mir_eval.beat.f_measure, ventana 70 ms).
El tempo y el tono reales salen de manifest.json.

Escribe todo en <dir_estimaciones>/resultados.json.
"""
import argparse
import datetime
import glob
import json
import os
import sys
import warnings

import mir_eval
import numpy as np

SUBS = ('guitarset', 'sintetico', 'otros')
METRICAS = ('root', 'majmin', 'mirex', 'thirds', 'sevenths')
AQUI = os.path.dirname(os.path.abspath(__file__))


def a_clave_mir_eval(s):
    s = s.strip().split('\n')[0].strip()
    if s.upper() in ('X', 'N', ''):
        return 'X'
    if ':' in s:
        raiz, modo = s.split(':', 1)
    elif ' ' in s:
        raiz, modo = s.split(None, 1)
    elif len(s) > 1 and s.endswith('m'):
        raiz, modo = s[:-1], 'min'
    else:
        raiz, modo = s, 'maj'
    modo = {'maj': 'major', 'major': 'major', 'mayor': 'major', 'min': 'minor', 'minor': 'minor',
            'menor': 'minor', 'm': 'minor'}.get(modo.strip().lower(), 'other')
    return f'{raiz.strip()} {modo}'


def acordes(ref_iv, ref_lab, est_iv, est_lab):
    """Devuelve {métrica: (acertado_s, evaluable_s)} y seg/overseg/underseg."""
    est_iv, est_lab = mir_eval.util.adjust_intervals(est_iv, est_lab, ref_iv.min(), ref_iv.max(),
                                                     mir_eval.chord.NO_CHORD, mir_eval.chord.NO_CHORD)
    ref_m = mir_eval.chord.merge_chord_intervals(ref_iv, ref_lab)
    est_m = mir_eval.chord.merge_chord_intervals(est_iv, est_lab)
    iv, rl, el = mir_eval.util.merge_labeled_intervals(ref_iv, ref_lab, est_iv, est_lab)
    dur = mir_eval.util.intervals_to_durations(iv)
    out = {}
    for m in METRICAS:
        comp = getattr(mir_eval.chord, m)(rl, el)
        ok = comp >= 0
        out[m] = (float(np.sum(dur[ok] * comp[ok])), float(np.sum(dur[ok])))
    over = float(mir_eval.chord.overseg(ref_m, est_m))
    under = float(mir_eval.chord.underseg(ref_m, est_m))
    return out, dict(seg=min(over, under), overseg=over, underseg=under)


def evaluable(ref_iv, ref_lab):
    dur = mir_eval.util.intervals_to_durations(ref_iv)
    out = {}
    for m in METRICAS:
        comp = getattr(mir_eval.chord, m)(ref_lab, ref_lab)
        out[m] = (0.0, float(np.sum(dur[comp >= 0])))
    return out


def clase_tempo(est, ref, tol=0.04):
    for nombre, f in (('correcto', 1.0), ('doble', 2.0), ('mitad', 0.5)):
        if abs(est / (ref * f) - 1) <= tol:
            return nombre
    return 'otro'


def leer_numero(ruta):
    with open(ruta) as f:
        return float(f.read().strip().split()[0].replace(',', '.'))


def leer_intervalos(ruta):
    try:
        iv, _ = mir_eval.io.load_labeled_intervals(ruta)
    except Exception:
        iv = mir_eval.io.load_intervals(ruta)
    return iv


def evaluar_fichero(corpus, est_dir, sub, lab, manifest):
    nombre = os.path.basename(lab)[:-4]
    rel = f'{sub}/{nombre}'
    est = os.path.join(est_dir, sub, nombre + '.lab')
    ref_iv, ref_lab = mir_eval.io.load_labeled_intervals(lab)
    dur = float(ref_iv.max() - ref_iv.min())
    r = dict(fichero=rel + '.lab', duracion=round(dur, 3), estimado=os.path.exists(est))
    if r['estimado']:
        try:
            est_iv, est_lab = mir_eval.io.load_labeled_intervals(est)
            mets, seg = acordes(ref_iv, ref_lab, est_iv, est_lab)
        except Exception as e:   # etiqueta inválida, fichero vacío...
            r['estimado'], r['error'] = False, f'{type(e).__name__}: {e}'
    if not r['estimado']:
        mets, seg = evaluable(ref_iv, ref_lab), dict(seg=0.0, overseg=0.0, underseg=0.0)
    r['_acordes'] = mets
    for m, (ok, ev) in mets.items():
        r[m] = round(ok / ev, 4) if ev > 0 else None
    r.update({k: round(v, 4) for k, v in seg.items()})

    info = manifest.get(rel + '.wav', {})
    ft = os.path.join(est_dir, sub, nombre + '.tempo.txt')
    if os.path.exists(ft) and info.get('tempo'):
        try:
            t = leer_numero(ft)
            r['tempo'] = dict(estimado=t, real=info['tempo'], clase=clase_tempo(t, info['tempo']))
        except Exception as e:
            r['tempo'] = dict(error=str(e), clase='otro', real=info['tempo'])
    fk = os.path.join(est_dir, sub, nombre + '.tono.txt')
    if os.path.exists(fk) and info.get('key'):
        ref_k = a_clave_mir_eval(info['key'])
        try:
            with open(fk) as f:
                est_k = a_clave_mir_eval(f.read())
            r['tono'] = dict(estimado=est_k, real=ref_k, puntuacion=float(mir_eval.key.weighted_score(ref_k, est_k)))
        except Exception as e:
            r['tono'] = dict(error=str(e), real=ref_k, puntuacion=0.0)
    fs_ref = os.path.join(corpus, sub, nombre + '.secciones.lab')
    fs_est = os.path.join(est_dir, sub, nombre + '.secciones.lab')
    if os.path.exists(fs_ref) and os.path.exists(fs_est):
        try:
            ri, ei = leer_intervalos(fs_ref), leer_intervalos(fs_est)
            p, rc, f = mir_eval.segment.detection(ri, ei, window=3.0, trim=True)
            p5, rc5, f5 = mir_eval.segment.detection(ri, ei, window=0.5, trim=True)
            r['secciones'] = dict(P=round(p, 4), R=round(rc, 4), F=round(f, 4), F_05s=round(f5, 4))
        except Exception as e:
            r['secciones'] = dict(error=str(e), P=0.0, R=0.0, F=0.0)
    fb_ref = os.path.join(corpus, sub, nombre + '.beats.txt')
    fb_est = os.path.join(est_dir, sub, nombre + '.beats.txt')
    if os.path.exists(fb_ref) and os.path.exists(fb_est):
        try:
            rb = np.loadtxt(fb_ref, ndmin=2)[:, 0]
            eb = np.loadtxt(fb_est, ndmin=2)[:, 0]
            r['pulsos'] = dict(F=round(float(mir_eval.beat.f_measure(rb, eb)), 4))
        except Exception as e:
            r['pulsos'] = dict(error=str(e), F=0.0)
    return r


def resumir(filas):
    s = dict(ficheros=len(filas), estimados=sum(f['estimado'] for f in filas),
             minutos=round(sum(f['duracion'] for f in filas) / 60, 2))
    for m in METRICAS:
        ok = sum(f['_acordes'][m][0] for f in filas)
        ev = sum(f['_acordes'][m][1] for f in filas)
        s[m] = round(ok / ev, 4) if ev else None
    d = sum(f['duracion'] for f in filas)
    for k in ('seg', 'overseg', 'underseg'):
        s[k] = round(sum(f[k] * f['duracion'] for f in filas) / d, 4) if d else None
    tt = [f['tempo'] for f in filas if 'tempo' in f]
    if tt:
        s['tempo'] = dict(n=len(tt), **{c: round(sum(t['clase'] == c for t in tt) / len(tt), 4)
                                        for c in ('correcto', 'doble', 'mitad', 'otro')})
    kk = [f['tono'] for f in filas if 'tono' in f]
    if kk:
        s['tono'] = dict(n=len(kk), mirex=round(float(np.mean([k['puntuacion'] for k in kk])), 4),
                         exactos=round(float(np.mean([k['puntuacion'] == 1.0 for k in kk])), 4))
    ss = [f['secciones'] for f in filas if 'secciones' in f]
    if ss:
        s['secciones'] = dict(n=len(ss), **{k: round(float(np.mean([x[k] for x in ss])), 4) for k in ('P', 'R', 'F')})
    bb = [f['pulsos'] for f in filas if 'pulsos' in f]
    if bb:
        s['pulsos'] = dict(n=len(bb), F=round(float(np.mean([x['F'] for x in bb])), 4))
    return s


def imprimir(resumenes, faltan, por_fichero, filas_por_sub):
    cab = f'{"subconjunto":<11} {"fich.":>7} {"min":>6} ' + ' '.join(f'{m:>8}' for m in METRICAS) + f' {"seg":>6}'
    print(cab)
    print('-' * len(cab))
    for nombre, s in resumenes.items():
        vals = ' '.join(f'{s[m]:8.3f}' if s[m] is not None else f'{"-":>8}' for m in METRICAS)
        print(f'{nombre:<11} {s["estimados"]:>3}/{s["ficheros"]:<3} {s["minutos"]:6.1f} {vals} {s["seg"]:6.3f}')
    print()
    for nombre, s in resumenes.items():
        extra = []
        if 'tempo' in s:
            t = s['tempo']
            extra.append(f'tempo n={t["n"]}: correcto {100 * t["correcto"]:.1f} %, x2 {100 * t["doble"]:.1f} %, '
                         f'x1/2 {100 * t["mitad"]:.1f} %, otro {100 * t["otro"]:.1f} %')
        if 'tono' in s:
            extra.append(f'tono n={s["tono"]["n"]}: MIREX {s["tono"]["mirex"]:.3f}, exactos {100 * s["tono"]["exactos"]:.1f} %')
        if 'secciones' in s:
            x = s['secciones']
            extra.append(f'secciones n={x["n"]}: F@3s {x["F"]:.3f} (P {x["P"]:.3f}, R {x["R"]:.3f})')
        if 'pulsos' in s:
            extra.append(f'pulsos n={s["pulsos"]["n"]}: F {s["pulsos"]["F"]:.3f}')
        if extra:
            print(f'{nombre}: ' + ' | '.join(extra))
    if por_fichero:
        print()
        for sub, filas in filas_por_sub.items():
            for f in filas:
                vals = ' '.join(f'{f[m]:.3f}' if f[m] is not None else '  -  ' for m in METRICAS)
                print(f'{f["fichero"]:<44} {vals} seg {f["seg"]:.3f}' + ('' if f['estimado'] else '  FALTA'))
    if faltan:
        print(f'\nFaltan {len(faltan)} estimaciones (cuentan como 0):')
        for f in faltan[:40]:
            print('  ' + f)
        if len(faltan) > 40:
            print(f'  ... y {len(faltan) - 40} más (ver resultados.json)')


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('est_dir')
    ap.add_argument('--corpus', default=AQUI)
    ap.add_argument('--sub', action='append', choices=SUBS)
    ap.add_argument('--por-fichero', action='store_true', help='imprime también una línea por fichero')
    args = ap.parse_args()
    warnings.filterwarnings('ignore')
    man_path = os.path.join(args.corpus, 'manifest.json')
    manifest = {}
    if os.path.exists(man_path):
        with open(man_path) as f:
            manifest = {e['path']: e for e in json.load(f)['files']}
    else:
        print('aviso: no hay manifest.json, no se evalúan tempo ni tono', file=sys.stderr)
    subs = args.sub or [s for s in SUBS if os.path.isdir(os.path.join(args.corpus, s))]
    filas_por_sub, resumenes, faltan = {}, {}, []
    for sub in subs:
        labs = sorted(l for l in glob.glob(os.path.join(args.corpus, sub, '*.lab')) if not l.endswith('.secciones.lab'))
        if not labs:
            continue
        filas = [evaluar_fichero(args.corpus, args.est_dir, sub, l, manifest) for l in labs]
        filas_por_sub[sub] = filas
        resumenes[sub] = resumir(filas)
        faltan += [f['fichero'] + (f' ({f["error"]})' if 'error' in f else '') for f in filas if not f['estimado']]
    todas = [f for fs in filas_por_sub.values() for f in fs]
    if len(filas_por_sub) > 1:
        resumenes['TOTAL'] = resumir(todas)
    imprimir(resumenes, faltan, args.por_fichero, filas_por_sub)
    for f in todas:
        f.pop('_acordes')
    salida = dict(fecha=datetime.datetime.now().isoformat(timespec='seconds'), corpus=os.path.abspath(args.corpus),
                  estimaciones=os.path.abspath(args.est_dir), mir_eval=mir_eval.__version__,
                  notas='Medias de acordes ponderadas por duración (tiempo acertado / tiempo evaluable). '
                        'Estimación ausente o inválida = 0.',
                  resumen=resumenes, faltan=faltan, ficheros=filas_por_sub)
    os.makedirs(args.est_dir, exist_ok=True)
    with open(os.path.join(args.est_dir, 'resultados.json'), 'w') as f:
        json.dump(salida, f, indent=1, ensure_ascii=False)
    print(f'\nResultados completos en {os.path.join(args.est_dir, "resultados.json")}')


if __name__ == '__main__':
    main()
