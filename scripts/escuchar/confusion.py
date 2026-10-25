# Qué intervalo hay entre la raíz estimada y la de verdad, en tiempo (y por estilo)
import sys, os, glob, mir_eval, numpy as np, warnings, collections
warnings.filterwarnings('ignore')
C = os.path.dirname(os.path.abspath(__file__))
sal, sub = sys.argv[1], sys.argv[2]
iv = collections.Counter(); estilo = collections.defaultdict(lambda: [0, 0]); calidad = collections.Counter()
for ref in sorted(glob.glob(f'{C}/{sub}/**/*.lab', recursive=True)):
    if ref.endswith('.secciones.lab'): continue
    est = os.path.join(sal, os.path.relpath(ref, C))
    if not os.path.exists(est): continue
    ri, rl = mir_eval.io.load_labeled_intervals(ref); ei, el = mir_eval.io.load_labeled_intervals(est)
    ei, el = mir_eval.util.adjust_intervals(ei, el, ri.min(), ri.max(), mir_eval.chord.NO_CHORD, mir_eval.chord.NO_CHORD)
    ints, r2, e2 = mir_eval.util.merge_labeled_intervals(ri, rl, ei, el)
    d = np.diff(ints).ravel()
    st = os.path.basename(ref).split('_')[1].rstrip('0123456789-').split('-')[0] if sub == 'guitarset' else 'sint'
    st = ''.join(c for c in st if c.isalpha())
    for dur, a, b in zip(d, r2, e2):
        ra = mir_eval.chord.encode(a)[0]; rb = mir_eval.chord.encode(b)[0]
        if ra < 0 or rb < 0: continue
        k = (rb - ra) % 12; iv[k] += dur; estilo[st][0] += dur; estilo[st][1] += dur * (k == 0)
        if k == 0: calidad[(a.split(':')[1] if ':' in a else a, b.split(':')[1] if ':' in b else b)] += dur
tot = sum(iv.values())
print('intervalo raíz estimada - real (% del tiempo):', ' '.join(f'{k}:{100 * v / tot:.0f}' for k, v in sorted(iv.items())))
print('raíz bien por estilo:', ' '.join(f'{s}:{100 * b / a:.0f}%' for s, (a, b) in sorted(estilo.items())))
print('con raíz bien, calidad real→estimada:', ', '.join(f'{a}→{b} {v:.0f}s' for (a, b), v in calidad.most_common(10)))
