# Modelo del plan de cobro decidido por el consejo (25-oct-2026, docs/DECISIONES-COBRO.md). Lo escribió
# el matemático del consejo (f1-quant); el presidente quitó la postulación destacada (decisión legal) y
# puso las tiendas al mismo ritmo que el resto. Base = 60 % del volumen del modelo_financiero.py.
# Margen de contribución = ingresos − costes de cobro (Stripe, Connect, disputas, también en suscripciones y destacados)
#                          − garantía − soporte − captación variable (parejas, locales, salas/empresas, perfiles).
# Uso: cd docs/pitch && python3 modelo_consejo.py [tiradas]   → modelo_consejo.txt
import math, random, sys, copy
import numpy as np
from statistics import NormalDist

def interp(inicio, fines, m):
    y = (m - 1) // 12
    a = inicio if y == 0 else fines[y - 1]
    b = fines[y]
    return a * (b / a) ** (((m - 1) % 12 + 1) / 12)

def escalon(tabla, m):
    v = 0.0
    for d, x in tabla:
        if m >= d: v = x
    return v

HOY = [250, 900, 2600, 5500, 9500]
ESC = {
    'conservador': dict(inicio=15 * 0.35, fines=[x * 0.35 for x in HOY], k=0.35, tiendas=0.35),
    'base':        dict(inicio=15 * 0.60, fines=[150, 550, 1600, 3400, 5700], k=0.60, tiendas=0.6),
    'ambicioso':   dict(inicio=15, fines=HOY, k=1.0, tiendas=1.0),
}

P0 = dict(
    # mezcla por número y tickets (con dispersión dentro de cada segmento para aplicar mínimos y topes)
    mezcla_bodas=[0.12, 0.22, 0.30, 0.30, 0.30], mezcla_salas=0.15,
    ticket={'bodas': 800, 'bares': 220, 'salas': 1000}, ticket_mult=1.0, sigma={'bodas': 0.6, 'bares': 0.4, 'salas': 0.5},
    # bodas y particulares
    com_bodas_ini=0.10, com_bodas=0.12, min_bodas=25, tope_bodas=300,
    rp_desde=5, bodas_com_desde=7, bodas_12_desde=11,          # Reserva protegida mes 5; 6 semanas al 0 %; 10 % sus 6 primeros meses (5-10)
    pd_bodas=[(5, 0.50), (13, 0.65), (25, 0.70)], pd_bodas_mult=1.0,
    garantia=0.01, soporte=5.0,
    # salas y eventos
    com_salas=0.10, primera_salas=0.50, salas_desde=7, capt_salas=[(7, 0.55), (13, 0.65)], capt_salas_mult=1.0,
    mesa_n=4, mesa_ticket=1200, mesa_com=0.12, mesa_desde=2, mesa_hasta=12,
    # bares
    com_bares=0.10, min_bares=15, primera_bares=0.35, bares_desde=8, capt_bares=[(8, 0.45), (13, 0.55)], capt_bares_mult=1.0,
    # cobros
    iva=0.21, st_pct=0.015, st_fijo=0.25, cn_pct=0.0025, cn_fijo=0.10, cn_cuenta=2.0, pagos_por_cuenta=1.5, disputa=0.003 * 20,
    # captación
    cac_pareja=50, cac_bar=90, cac_sala=80, cac_perfil=3, nuevo_salas=0.25, churn_local=0.02, cac_bar_por_bolo=False,
    # base de usuarios (la de hoy × k)
    perfiles_fin=[1200, 5000, 15000, 32000, 55000], perfiles_inicio=60, activos=0.5, churn_activo=0.03,
    locales_fin=[80, 400, 1200, 2600, 4500], locales_inicio=5, tiendas_fin=[5, 30, 90, 200, 350],
    # suscripciones (con bajas): la conversión se aplica a lo que entra cada mes (y a lo que había al lanzar)
    sala_desde=12, sala_conv=0.20, sala_arpa=38, sala_baja=0.03, fundadores_sala=30, fundadores_meses=12,
    pro_desde=13, pro_conv=0.03, pro_arpa=6.3, pro_baja=0.04,
    pro_fund_n=300, pro_fund_precio=49,
    canc_desde=6, canc_conv=0.025, canc_precio=24.99 / 12, canc_x_activo=1.5, canc_baja=0.03, churn_canc=0.04,
    bd_desde=15, bd_precio=29, bd_provincias=[1, 1, 5, 15, 25], bd_formatos=6, bd_max=5, bd_relleno=0.4, bd_perfil_bodas=0.30, bd_conv=0.05,
    tienda_desde=7, tienda_arpa=55,
    dest_precio=3, dest_x_perfil=0.02,
    post_desde=13, post_x_bolo=0, post_precio=1.99,   # postulación destacada FUERA (cobrar a quien busca trabajo)
    merc_desde=20, merc_x_perfil=0.01, merc_ticket=250, merc_fee=0.05, merc_fijo=0.70, merc_riesgo=0.01,
    promo_desde=30, promo_x_perfil=0.05,
)

_Z = np.array([NormalDist().inv_cdf((i + 0.5) / 400) for i in range(400)])

def fee_medio(t_medio, sigma, tasa, lo=0.0, hi=float('inf')):
    """Comisión media por bolo con mínimo y tope, con el caché lognormal de media t_medio."""
    if tasa <= 0: return 0.0
    t = t_medio * np.exp(sigma * _Z - sigma ** 2 / 2)
    return float(np.clip(t * tasa, lo, hi).mean())

def corre(P, esc, nadie_dentro=False):
    k, ini, fines = esc['k'], esc['inicio'], esc['fines']
    T = {s: P['ticket'][s] * P['ticket_mult'] for s in P['ticket']}
    F = {  # comisiones medias por bolo
        'b10': fee_medio(T['bodas'], P['sigma']['bodas'], P['com_bodas_ini'], P['min_bodas'], P['tope_bodas']),
        'b12': fee_medio(T['bodas'], P['sigma']['bodas'], P['com_bodas'], P['min_bodas'], P['tope_bodas']),
        's': fee_medio(T['salas'], P['sigma']['salas'], P['com_salas']),
        'bar': fee_medio(T['bares'], P['sigma']['bares'], P['com_bares'], P['min_bares']),
    }
    meses = []
    prev = dict(loc=P['locales_inicio'] * k, act=P['perfiles_inicio'] * k * P['activos'], reg=P['perfiles_inicio'] * k)
    prev['canc'] = prev['act'] * P['canc_x_activo']
    sala_pag = fund_sala = pro_pag = canc_pag = 0.0
    fund_pro = []   # cohortes de Pro fundadores
    for m in range(1, 61):
        y = (m - 1) // 12
        contr = interp(ini, fines, m)
        fb, fs = P['mezcla_bodas'][y], P['mezcla_salas']; fbar = 1 - fb - fs
        nb, ns, nbar = contr * fb, contr * fs, contr * fbar
        o = dict(m=m, contr=contr, gmv=nb * T['bodas'] + ns * T['salas'] + nbar * T['bares'])
        # --- bodas ---
        pd_plan = escalon(P['pd_bodas'], m) if m >= P['rp_desde'] else 0.0
        pdb = 0.0 if nadie_dentro else min(pd_plan * P['pd_bodas_mult'], 0.95)
        tasa = 0 if m < P['bodas_com_desde'] else (F['b10'] if m < P['bodas_12_desde'] else F['b12'])
        pag = nb * pdb
        cobrado = T['bodas'] + tasa * (1 + P['iva'])
        o['com_bodas'] = pag * tasa
        o['cobro'] = pag * (P['st_pct'] * cobrado + P['st_fijo'] + P['cn_pct'] * T['bodas'] + P['cn_fijo'] + P['cn_cuenta'] / P['pagos_por_cuenta'] + P['disputa'])
        o['garantia'] = pag * T['bodas'] * P['garantia'] + pag * P['soporte']
        o['cac_bodas'] = P['cac_pareja'] * nb * pd_plan            # gasto fijado con el % del plan (si paga menos gente, el gasto no baja)
        o['bodas_pagadas'] = pag
        # --- salas y eventos ---
        cs = 0.0 if (nadie_dentro or m < P['salas_desde']) else min(escalon(P['capt_salas'], m) * P['capt_salas_mult'], 0.95)
        nf = ns * P['primera_salas'] * cs
        o['com_salas'] = nf * F['s']
        o['cobro'] += nf * (P['st_pct'] * F['s'] * (1 + P['iva']) + P['st_fijo'] + P['disputa'])
        o['cac_salas'] = ns * P['nuevo_salas'] * P['cac_sala']
        if P['mesa_desde'] <= m <= P['mesa_hasta'] and not nadie_dentro:   # mesa de eventos de empresa, facturada a mano
            o['com_salas'] += P['mesa_n'] * P['mesa_ticket'] * P['mesa_com']
            o['cac_salas'] += P['mesa_n'] * P['cac_sala']
        # --- bares ---
        cb = 0.0 if (nadie_dentro or m < P['bares_desde']) else min(escalon(P['capt_bares'], m) * P['capt_bares_mult'], 0.95)
        nfb = nbar * P['primera_bares'] * cb
        o['com_bares'] = nfb * F['bar']
        o['cobro'] += nfb * (P['st_pct'] * F['bar'] * (1 + P['iva']) + P['st_fijo'] + P['disputa'])
        loc = interp(P['locales_inicio'] * k, [x * k for x in P['locales_fin']], m)
        nuevos_loc = max(loc - prev['loc'], 0) + P['churn_local'] * prev['loc']
        if P['cac_bar_por_bolo']:   # alternativa: como el modelo de hoy, el 15 % de los bolos de bar es de un cliente nuevo
            o['cac_bares'] = nbar * 0.15 * P['cac_bar']
        else:
            o['cac_bares'] = nuevos_loc * fbar / (fbar + fs) * P['cac_bar']
        # --- usuarios ---
        reg = interp(P['perfiles_inicio'] * k, [x * k for x in P['perfiles_fin']], m)
        act = reg * P['activos']
        entra_act = max(act - prev['act'], 0) + P['churn_activo'] * prev['act']
        canc_u = act * P['canc_x_activo']
        entra_canc = max(canc_u - prev['canc'], 0) + P['churn_canc'] * prev['canc']
        o['cac_perfiles'] = max(reg - prev['reg'], 0) * P['cac_perfil']
        # --- suscripciones con bajas ---
        if m == P['sala_desde']:
            fund_sala = min(P['fundadores_sala'], 0.5 * loc)
            sala_pag = P['sala_conv'] * (loc - fund_sala)
        elif m > P['sala_desde']:
            sala_pag = sala_pag * (1 - P['sala_baja']) + P['sala_conv'] * nuevos_loc
            fund_sala *= (1 - P['sala_baja'])
        pagan_sala = sala_pag + (fund_sala if m >= P['sala_desde'] + P['fundadores_meses'] else 0)
        o['sala'] = pagan_sala * P['sala_arpa']
        if m == P['pro_desde']: pro_pag = P['pro_conv'] * act
        elif m > P['pro_desde']: pro_pag = pro_pag * (1 - P['pro_baja']) + P['pro_conv'] * entra_act
        o['pro'] = pro_pag * P['pro_arpa']
        if m in (1, 2, 3): fund_pro.append([m, P['pro_fund_n'] / 3])
        for c in fund_pro:
            if m > c[0] and (m - c[0]) % 12 == 0: c[1] *= (1 - P['pro_baja']) ** 12   # renovación anual
        n_fund = sum(c[1] for c in fund_pro)
        o['pro_fund'] = n_fund * P['pro_fund_precio'] / 12
        if m == P['canc_desde']: canc_pag = P['canc_conv'] * canc_u
        elif m > P['canc_desde']: canc_pag = canc_pag * (1 - P['canc_baja']) + P['canc_conv'] * entra_canc
        o['canc'] = canc_pag * P['canc_precio']
        n_tiendas = interp(1, [x * esc['tiendas'] for x in P['tiendas_fin']], m) if m >= P['tienda_desde'] else 0
        o['tiendas'] = n_tiendas * P['tienda_arpa']
        # --- visibilidad y Mercado ---
        n_bd = min(P['bd_provincias'][y] * P['bd_formatos'] * P['bd_max'] * P['bd_relleno'], P['bd_conv'] * P['bd_perfil_bodas'] * act) if m >= P['bd_desde'] else 0
        o['dest_bodas'] = n_bd * P['bd_precio']
        n_post = contr * P['post_x_bolo'] if m >= P['post_desde'] else 0
        o['postul'] = n_post * P['post_precio']
        o['promo'] = reg * P['promo_x_perfil'] if m >= P['promo_desde'] else 0
        n_dest = reg * P['dest_x_perfil']
        o['dest_merc'] = n_dest * P['dest_precio']
        n_merc = reg * P['merc_x_perfil'] if m >= P['merc_desde'] else 0
        o['prot_merc'] = n_merc * (P['merc_ticket'] * P['merc_fee'] + P['merc_fijo'])
        # costes de cobro de todo lo que no es un bolo (1,5 % + 0,25 € por cargo)
        st = lambda precio: P['st_pct'] * precio + P['st_fijo']
        o['cobro'] += (pagan_sala * st(P['sala_arpa']) + pro_pag * (0.3 * st(7.99) + 0.7 * st(69) / 12) + n_fund * st(49) / 12
                       + canc_pag * st(24.99) / 12 + n_tiendas * st(P['tienda_arpa']) + n_bd * st(P['bd_precio'])
                       + n_dest * st(P['dest_precio']) + n_post * st(5 * P['post_precio']) / 5 + o['promo'] * 0.03
                       + n_merc * (st(P['merc_ticket'] * (1 + P['merc_fee']) + P['merc_fijo']) + P['cn_pct'] * P['merc_ticket'] + P['cn_fijo'] + P['disputa']))
        o['garantia'] += n_merc * P['merc_ticket'] * P['merc_riesgo']
        # --- totales ---
        o['comision'] = o['com_bodas'] + o['com_salas'] + o['com_bares']
        o['subs'] = o['sala'] + o['pro'] + o['pro_fund'] + o['canc'] + o['tiendas']
        o['visib'] = o['dest_bodas'] + o['postul'] + o['promo']
        o['mercado'] = o['dest_merc'] + o['prot_merc']
        o['ing'] = o['comision'] + o['subs'] + o['visib'] + o['mercado']
        o['capt'] = o['cac_bodas'] + o['cac_salas'] + o['cac_bares'] + o['cac_perfiles']
        o['contrib'] = o['ing'] - o['cobro'] - o['garantia'] - o['capt']
        o['locales'] = loc; o['pagan_sala'] = pagan_sala; o['activos'] = act; o['pro_pag'] = pro_pag; o['canc_u'] = canc_u; o['canc_pag'] = canc_pag; o['n_bd'] = n_bd
        meses.append(o)
        prev = dict(loc=loc, act=act, reg=reg, canc=canc_u)
    return meses, F

def suma(ms, y, f): return sum(x[f] for x in ms[(y - 1) * 12:y * 12])
def cubre(ms, n): return next((ms[i]['m'] for i in range(len(ms) - 2) if all(ms[j]['contrib'] >= n for j in range(i, i + 3))), None)
def e(x): return f"{x/1e6:,.2f} M€".replace('.', ',') if abs(x) >= 1e6 else f"{x/1e3:,.0f} k€".replace(',', '.')
def mes(x): return '—' if x is None else str(x)

def con(**mods):
    P = copy.deepcopy(P0); P.update(mods); return P

# ---------------------------------------------------------------- Monte Carlo (mis priores, alrededor del BASE)
def tri(r, a, m, b): return r.triangular(a, b, m)
def tirada(r):
    km = math.exp(r.gauss(0, 0.43))
    esc = dict(inicio=ESC['base']['inicio'] * km, fines=[x * km for x in ESC['base']['fines']], k=ESC['base']['k'] * km, tiendas=0.6)
    x = dict(k=km,
             pd_bodas_mult=tri(r, 0.50, 0.70, 0.85) / 0.70, capt_bares_mult=tri(r, 0.35, 0.55, 0.75) / 0.55, capt_salas_mult=tri(r, 0.45, 0.65, 0.80) / 0.65,
             primera_bares=tri(r, 0.20, 0.35, 0.50), primera_salas=tri(r, 0.35, 0.50, 0.65),
             cac_pareja=50 * math.exp(r.gauss(0, 0.37)), cac_bar=90 * math.exp(r.gauss(0, 0.40)), cac_sala=80 * math.exp(r.gauss(0, 0.40)),
             ticket_mult=tri(r, 0.80, 1.00, 1.10), sala_conv=tri(r, 0.10, 0.20, 0.30), sala_baja=tri(r, 0.02, 0.03, 0.05),
             pro_conv=tri(r, 0.015, 0.03, 0.05), pro_baja=tri(r, 0.03, 0.04, 0.06), canc_conv=tri(r, 0.01, 0.025, 0.04), canc_x_activo=tri(r, 1.0, 1.5, 3.0),
             bd_relleno=tri(r, 0.2, 0.4, 0.6), churn_local=tri(r, 0.01, 0.02, 0.04), garantia=tri(r, 0.007, 0.01, 0.015))
    P = con(**{a: b for a, b in x.items() if a != 'k'})
    return x, P, esc

def eta2(xs, ys, bins=20):
    xs, ys = np.asarray(xs), np.asarray(ys)
    idx = np.clip(np.searchsorted(np.quantile(xs, np.linspace(0, 1, bins + 1)), xs, side='right') - 1, 0, bins - 1)
    mu, tot = ys.mean(), ys.var()
    return sum((idx == b).mean() * (ys[idx == b].mean() - mu) ** 2 for b in range(bins) if (idx == b).any()) / tot

if __name__ == '__main__':
    N = int(sys.argv[1]) if len(sys.argv) > 1 else 5000
    out = []
    pr = lambda s='': out.append(s)
    pr("# Plan final · cifras para el dossier (f1-quant, modelo por segmentos; margen = contribución sin estructura fija)")
    # (a)
    pr("\n## (a) Tres escenarios")
    res = {}
    for nom in ('conservador', 'base', 'ambicioso'):
        ms, F = corre(P0, ESC[nom]); res[nom] = ms
        pr(f"\n### {nom}  (contrataciones/mes en dic: " + ' → '.join(f"{ms[y*12+11]['contr']:,.0f}".replace(',', '.') for y in range(5)) + ")")
        pr("| Año | Ingresos | Margen | % |"); pr("|---|---|---|---|")
        for y in range(1, 6):
            i, c = suma(ms, y, 'ing'), suma(ms, y, 'contrib')
            pr(f"| {y} | {e(i)} | {e(c)} | {c/i:.0%} |")
        pr(f"Cubre 10 / 25 / 50 k€/mes desde el mes: {mes(cubre(ms, 10_000))} / {mes(cubre(ms, 25_000))} / {mes(cubre(ms, 50_000))}")
    # (b)
    ms = res['base']
    pr("\n## (b) Mezcla del año 5 (base)")
    I5 = suma(ms, 5, 'ing')
    filas = [('Comisión bodas y particulares', 'com_bodas'), ('Comisión salas y eventos', 'com_salas'), ('Comisión bares', 'com_bares'),
             ('Plan Sala', 'sala'), ('Musikeeo Pro', 'pro'), ('Pro fundadores', 'pro_fund'), ('Cancionero Pro', 'canc'), ('Tiendas', 'tiendas'),
             ('Destacado en bodas', 'dest_bodas'), ('Postulación destacada', 'postul'), ('Promocionado', 'promo'),
             ('Destacados del Mercado', 'dest_merc'), ('Protección al comprador', 'prot_merc')]
    pr("| Línea | A5 | % |"); pr("|---|---|---|")
    for n, f in filas: pr(f"| {n} | {e(suma(ms, 5, f))} | {suma(ms, 5, f)/I5:.1%} |")
    for n, f in (('**Comisión (total)**', 'comision'), ('**Suscripciones**', 'subs'), ('**Visibilidad**', 'visib'), ('**Mercado**', 'mercado')):
        pr(f"| {n} | {e(suma(ms, 5, f))} | {suma(ms, 5, f)/I5:.0%} |")
    d = ms[59]
    pr(f"Diciembre del A5: {d['locales']:,.0f} locales activos, {d['pagan_sala']:,.0f} pagan Plan Sala ({d['pagan_sala']/d['locales']:.0%}); "
       f"{d['activos']:,.0f} perfiles activos, {d['pro_pag']:,.0f} Pro ({d['pro_pag']/d['activos']:.1%}); {d['canc_u']:,.0f} usuarios del Cancionero, "
       f"{d['canc_pag']:,.0f} Cancionero Pro ({d['canc_pag']/d['canc_u']:.1%}); {d['n_bd']:,.0f} Destacados en bodas".replace(',', '.'))
    pr(f"Costes A5: cobro {e(suma(ms,5,'cobro'))}, garantía y soporte {e(suma(ms,5,'garantia'))}, captación {e(suma(ms,5,'capt'))} "
       f"(parejas {e(suma(ms,5,'cac_bodas'))}, bares {e(suma(ms,5,'cac_bares'))}, salas y empresas {e(suma(ms,5,'cac_salas'))}, perfiles {e(suma(ms,5,'cac_perfiles'))}); "
       f"GMV A5 {e(suma(ms,5,'gmv'))}; ingresos/GMV {I5/suma(ms,5,'gmv'):.1%}")
    # (c)
    pr(f"\n## (c) Monte Carlo del plan ({N} tiradas, mis priores alrededor del base)")
    r = random.Random(11); X, Y = [], []
    for _ in range(N):
        x, P, esc = tirada(r); m_, _ = corre(P, esc); X.append(x)
        Y.append((suma(m_, 5, 'ing'), suma(m_, 5, 'contrib'), cubre(m_, 25_000) or 61, cubre(m_, 10_000) or 61, cubre(m_, 50_000) or 61))
    Y = np.array(Y)
    q = lambda a: [np.percentile(a, p) for p in (10, 50, 90)]
    mm = lambda v: '>60' if v > 60 else f"{v:.0f}"
    pr("| | P10 | P50 | P90 |"); pr("|---|---|---|---|")
    pr("| Ingresos A5 | " + ' | '.join(e(v) for v in q(Y[:, 0])) + " |")
    pr("| Margen A5 | " + ' | '.join(e(v) for v in q(Y[:, 1])) + " |")
    pr("| Margen A5 en % | " + ' | '.join(f"{v:.0%}" for v in q(Y[:, 1] / Y[:, 0])) + " |")
    pr("| Mes en que cubre 25 k€/mes (P10 = el mejor) | " + ' | '.join(mm(v) for v in q(Y[:, 2])) + " |")
    pr(f"No cubre 25 k€/mes en 5 años: {(Y[:,2] > 60).mean():.0%} · 10 k€: {(Y[:,3] > 60).mean():.0%} · 50 k€: {(Y[:,4] > 60).mean():.0%} · margen A5 negativo: {(Y[:,1] < 0).mean():.0%}")
    rk = sorted(((eta2([x[a] for x in X], Y[:, 1]), a) for a in X[0]), reverse=True)[:4]
    pr("Lo que más mueve el margen A5 (parte de la varianza): " + ', '.join(f"{a} {v:.0%}" for v, a in rk))
    # (d)
    pr("\n## (d) Si nadie paga dentro (base)")
    z, _ = corre(P0, ESC['base'], nadie_dentro=True)
    pr(f"Ingresos A5 {e(suma(z,5,'ing'))} ({suma(z,5,'ing')/I5:.0%} de {e(I5)}). Margen A5 con el mismo gasto en captar {e(suma(z,5,'contrib'))}; "
       f"sin pagar por parejas {e(suma(z,5,'contrib') + suma(z,5,'cac_bodas'))}. Cubre 25 k€/mes: {mes(cubre(z, 25_000))}")
    # (e)
    pr("\n## (e) Sensibilidad del margen A5 (base)")
    pr("| Caso | Ingresos A5 | Margen A5 | Cubre 25 / 50 k€ |"); pr("|---|---|---|---|")
    for nom, P in (('Plan (pareja a 50 €)', P0), ('Pareja a 30 € (fincas y planners)', con(cac_pareja=30)), ('Pareja a 70 €', con(cac_pareja=70)),
                   ('Bodas al 10 % (no 12 %)', con(com_bodas=0.10)), ('Plan Sala al 12 % (no 20 %)', con(sala_conv=0.12)),
                   ('Bares: CAC como hoy (15 % de sus bolos, cliente nuevo)', con(cac_bar_por_bolo=True))):
        m_, _ = corre(P, ESC['base'])
        pr(f"| {nom} | {e(suma(m_,5,'ing'))} | {e(suma(m_,5,'contrib'))} | {mes(cubre(m_,25_000))} / {mes(cubre(m_,50_000))} |")
    # (f)
    pr("\n## (f) Lo que deja cada bolo pagado dentro (régimen, base)")
    P = P0; T = P['ticket']
    fb = fee_medio(T['bodas'], P['sigma']['bodas'], 0.12, 25, 300); fb10 = fee_medio(T['bodas'], P['sigma']['bodas'], 0.10, 25, 300)
    fs = fee_medio(T['salas'], P['sigma']['salas'], 0.10); fbar = fee_medio(T['bares'], P['sigma']['bares'], 0.10, 15)
    pr("| Bolo | Comisión media | Cobro | Garantía + soporte | Neto antes de captar | Captación | Neto |"); pr("|---|---|---|---|---|---|---|")
    for nom, fee in (('Boda 800 € al 12 %', fb), ('Boda 800 € al 10 %', fb10)):
        cob = P['st_pct'] * (T['bodas'] + fee * 1.21) + P['st_fijo'] + P['cn_pct'] * T['bodas'] + P['cn_fijo'] + P['cn_cuenta'] / P['pagos_por_cuenta'] + P['disputa']
        gs = T['bodas'] * P['garantia'] + P['soporte']
        pr(f"| {nom} | {fee:.1f} € | {cob:.1f} € | {gs:.1f} € | {fee-cob-gs:.1f} € | {P['cac_pareja']} € | {fee-cob-gs-P['cac_pareja']:.1f} € |")
    for nom, fee, cac in (('Bar, 1.ª vez (220 €)', fbar, 'local 90 €'), ('Sala o evento, 1.ª vez (1.000 €)', fs, 'sala/empresa 80 €')):
        cob = P['st_pct'] * fee * 1.21 + P['st_fijo'] + P['disputa']
        pr(f"| {nom} | {fee:.1f} € | {cob:.2f} € | — | {fee-cob:.1f} € | {cac} (se reparte entre sus bolos) | — |")
    pr(f"Un bar nuevo tiene que hacer {str(round(90/(fbar - (P['st_pct']*fbar*1.21+P['st_fijo']+P['disputa'])),1)).replace('.',',')} primeras veces cobradas para pagar sus 90 € "
       f"(≈ {90/(fbar - (P['st_pct']*fbar*1.21+P['st_fijo']+P['disputa']))/(0.35*0.55):.0f} bolos); el Plan Sala ({0.2*38:.1f} €/local/mes de media) ayuda")
    import re
    txt = re.sub(r'(\d)\.(\d{1,2})(?=\s?(%|€))', r'\1,\2', '\n'.join(out))   # decimales con coma
    open(__file__.replace('.py', '.txt'), 'w').write(txt + '\n')
    print(txt)
