# Previsiones de ingresos y rentabilidad a partir del modelo (docs/pitch/modelo_financiero.py), sin ronda:
# ingresos, costes variables (pago, garantía y captación de cada cliente) y margen de contribución,
# y desde qué mes ese margen cubre una estructura fija dada. No cambia el modelo: solo lo corre.
import json, copy, sys
src = open(sys.argv[1]).read()
g = {}; exec(src.split("res = {k: corre")[0], g)
H0 = copy.deepcopy(g['H'])
NIVELES = (10_000, 25_000, 50_000, 100_000)
def correr(mods=None, k=1.0):
    g['H'].clear(); g['H'].update(copy.deepcopy(H0))
    if mods: g['H'].update(mods)
    r = g['corre'](k); H = g['H']
    meses = []
    for x in r['meses']:
        y = (x['m'] - 1) // 12
        capt_var = x['c_capt'] - H['marca_mes'][y]          # captar clientes y perfiles (sin la marca)
        contrib = x['ing'] - x['c_pago'] - capt_var
        meses.append(dict(m=x['m'], ing=x['ing'], pago=x['c_pago'], capt=capt_var, contrib=contrib, gmv=x['gmv'], contr=x['contr']))
    anyos = []
    for y in range(5):
        ms = meses[y*12:(y+1)*12]; s = lambda f: sum(z[f] for z in ms)
        a = r['anyos'][y]
        anyos.append(dict(anyo=y+1, contrataciones=a['contrataciones'], gmv=a['gmv'], gmv_dentro=a['gmv_dentro'], ingresos=a['ingresos'],
                          comision=a['comision'], suscripciones=a['suscripciones'], destacados=a['destacados'],
                          pago=s('pago'), captacion=s('capt'), contribucion=s('contrib'), take=a['take_efectivo'],
                          contrib_mes_dic=ms[-1]['contrib'], ing_mes_dic=ms[-1]['ing']))
    cubre = {}
    for n in NIVELES:
        cubre[n] = next((meses[i]['m'] for i in range(len(meses)-2) if all(meses[j]['contrib'] >= n for j in range(i, i+3))), None)
    return dict(anyos=anyos, cubre=cubre, ing=[z['ing'] for z in meses], contrib=[z['contrib'] for z in meses])
out = {k: correr(None, v) for k, v in g['ESC'].items()}
sens = []
for nombre, mods, k in [('Base', None, 1.0),
                        ('Comisión del 8 % (no del 10 %)', dict(comision=0.08, comision_repetidor=0.04), 1.0),
                        ('Menos reservas pagadas en la app (techo 55 %)', dict(pagado_dentro=[(1, 0.0), (7, 0.25), (13, 0.40), (25, 0.50), (37, 0.55)]), 1.0),
                        ('Captar un cliente cuesta el doble (80 €)', dict(cac_cliente=80), 1.0),
                        ('Ticket medio un 20 % más bajo', dict(ticket={a: b*0.8 for a, b in H0['ticket'].items()}), 1.0),
                        ('Un 30 % menos de contrataciones', None, 0.7)]:
    r = correr(mods, k)
    sens.append(dict(caso=nombre, ing3=r['anyos'][2]['ingresos'], ing5=r['anyos'][4]['ingresos'], contrib5=r['anyos'][4]['contribucion'], cubre25=r['cubre'][25_000], cubre50=r['cubre'][50_000]))
g['H'].clear(); g['H'].update(copy.deepcopy(H0))
bolo, ltv = g['economia_bolo']()
json.dump(dict(esc=out, sens=sens, bolo=bolo, ltv=ltv, H=H0, niveles=NIVELES), open('rentabilidad.json', 'w'), indent=1, default=float)
e = lambda x: f"{x:,.0f}".replace(',', '.')
for k, v in out.items():
    print('==', k, 'cubre', v['cubre'])
    for a in v['anyos']: print(a['anyo'], 'ing', e(a['ingresos']), 'pago', e(a['pago']), 'capt', e(a['captacion']), 'contrib', e(a['contribucion']), f"{a['contribucion']/a['ingresos']:.0%}", 'contrib dic/mes', e(a['contrib_mes_dic']))
for s in sens: print(s)
