# Cifras del dossier a partir del modelo del plan de cobro del consejo (modelo_consejo.py, docs/DECISIONES-COBRO.md).
# Uso: cd docs/pitch && python3 rentabilidad_consejo.py  → rentabilidad_consejo.json (lo lee presentacion/rentable.py)
import json, copy, random
import numpy as np
import modelo_consejo as M

NIVELES = (10_000, 25_000, 50_000)
P0 = M.con()


def anyos_de(ms):
    out = []
    for y in range(1, 6):
        s = lambda f: M.suma(ms, y, f)
        pago = s('cobro') + s('garantia')
        capt = s('capt')
        out.append(dict(anyo=y, contrataciones=s('contr'), gmv=s('gmv'), ingresos=s('ing'),
                        comision=s('comision'), suscripciones=s('subs'), visibilidad=s('visib') + s('mercado'),
                        pago=pago, captacion=capt, contribucion=s('contrib'),
                        com_bodas=s('com_bodas'), com_salas=s('com_salas'), com_bares=s('com_bares'),
                        sala=s('sala'), tiendas=s('tiendas'), pro=s('pro') + s('pro_fund'), canc=s('canc'),
                        dest_bodas=s('dest_bodas'), promo=s('promo'), prot_merc=s('prot_merc'), dest_merc=s('dest_merc')))
    return out


def escenario(P, esc):
    ms, _ = M.corre(P, esc)
    return dict(anyos=anyos_de(ms), cubre={str(n): M.cubre(ms, n) for n in NIVELES},
                contrib=[x['contrib'] for x in ms], ing=[x['ing'] for x in ms])


esc = {n: escenario(P0, M.ESC[n]) for n in ('conservador', 'base', 'ambicioso')}

# Sensibilidad: un cambio cada vez sobre el base
def caso(nombre, mods=None, factor=1.0):
    e = copy.deepcopy(M.ESC['base'])
    if factor != 1.0:
        e['inicio'] *= factor; e['fines'] = [x * factor for x in e['fines']]; e['k'] *= factor
    r = escenario(M.con(**(mods or {})), e)
    a = r['anyos']
    return dict(caso=nombre, ing3=a[2]['ingresos'], ing5=a[4]['ingresos'], contrib5=a[4]['contribucion'],
                cubre25=r['cubre']['25000'], cubre50=r['cubre']['50000'])

sens = [
    caso('Base (pareja a 50 €)'),
    caso('Conseguir unos novios cuesta 30 €', dict(cac_pareja=30)),
    caso('Conseguir unos novios cuesta 70 €', dict(cac_pareja=70)),
    caso('Bodas al 10 % y no al 12 %', dict(com_bodas=0.10)),
    caso('Plan Sala lo paga el 12 %, no el 20 %', dict(sala_conv=0.12)),
    caso('Bodas pagadas por la app: 55 % como mucho', dict(pd_bodas_mult=0.55 / 0.70)),
    caso('Un 30 % menos de contrataciones', None, 0.7),
]

# Lo que deja cada bolo pagado dentro (sin dispersión: precios redondos)
def bolo(cache, tasa, iva=0.21, boda=False):
    com = cache * tasa
    cobrado = (cache + com * (1 + iva)) if boda else com * (1 + iva)
    cobro = P0['st_pct'] * cobrado + P0['st_fijo'] + P0['disputa']
    if boda:
        cobro += P0['cn_pct'] * cache + P0['cn_fijo'] + P0['cn_cuenta'] / P0['pagos_por_cuenta']
    gar = (cache * P0['garantia'] + P0['soporte']) if boda else 0
    return dict(cache=cache, comision=com, cobro=cobro, garantia=gar, neto=com - cobro - gar)

bolos = dict(boda=bolo(800, 0.12, boda=True), boda10=bolo(800, 0.10, boda=True),
             sala=bolo(1000, 0.10), bar=bolo(220, 0.10), cac=dict(pareja=P0['cac_pareja'], bar=P0['cac_bar'], sala=P0['cac_sala']))

# Monte Carlo (priores del matemático del consejo, alrededor del base)
r = random.Random(11); I, C, c25 = [], [], []
for _ in range(5000):
    x, P, e = M.tirada(r)
    ms, _ = M.corre(P, e)
    I.append(M.suma(ms, 5, 'ing')); C.append(M.suma(ms, 5, 'contrib')); c25.append(M.cubre(ms, 25_000) or 99)
q = lambda v, p: float(np.percentile(v, p))
mc = dict(ing=[q(I, p) for p in (10, 50, 90)], contrib=[q(C, p) for p in (10, 50, 90)],
          negativo=float(np.mean(np.array(C) < 0)), cubre25_p50=int(q(c25, 50)), cubre25_nunca=float(np.mean(np.array(c25) == 99)))

# Si nadie paga por la app
ms0, _ = M.corre(P0, M.ESC['base'], nadie_dentro=True)
nadie = dict(ing5=M.suma(ms0, 5, 'ing'), contrib5=M.suma(ms0, 5, 'contrib'))

json.dump(dict(esc=esc, sens=sens, bolos=bolos, mc=mc, nadie=nadie, P=P0, ESC=M.ESC, niveles=NIVELES),
          open('rentabilidad_consejo.json', 'w'), indent=1, default=float)
b = esc['base']['anyos'][4]
print('base A5', round(b['ingresos']), round(b['contribucion']), esc['base']['cubre'])
for s in sens: print(s['caso'], round(s['contrib5']), s['cubre25'], s['cubre50'])
print('bolos', {k: round(v['neto'], 1) for k, v in bolos.items() if k != 'cac'})
print('mc', mc)
