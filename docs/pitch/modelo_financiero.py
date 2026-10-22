# Modelo financiero de Musikeeo (pre-seed). Todo lo que no es DATO es HIPÓTESIS y está aquí arriba.
# Mes 1 = primer mes tras cerrar la ronda. Salida: modelo.json
import json, math

H = dict(
    # Volumen: contrataciones al mes al CIERRE de cada año (escenario base) y al empezar
    contr_inicio=15,
    contr_fin_anyo=[250, 900, 2600, 5500, 9500],
    # Mezcla y ticket medio por segmento (caché, sin la comisión)
    mezcla={'bodas_privados': 0.30, 'bares_restaurantes': 0.55, 'salas_fiestas_corporativo': 0.15},
    ticket={'bodas_privados': 900, 'bares_restaurantes': 250, 'salas_fiestas_corporativo': 1000},
    # % de contrataciones que vienen de un cliente nuevo (las bodas casi no repiten; los bares sí)
    nuevo_cliente={'bodas_privados': 0.95, 'bares_restaurantes': 0.15, 'salas_fiestas_corporativo': 0.25},
    # Monetización (docs/MONETIZACION.md): gratis 6 meses, luego «Reserva protegida» opcional
    pagado_dentro=[(1, 0.0), (7, 0.40), (13, 0.60), (25, 0.70), (37, 0.75)],
    comision=0.10, comision_repetidor=0.05, parte_repetidores=0.30,
    stripe=0.018,          # sobre lo que paga el cliente (caché + 10 %); confirmar tarifa vigente
    fondo_garantia=0.005,  # sustitutos y devoluciones, sobre el GMV pagado dentro
    # Suscripciones (desde el mes 13)
    perfiles_fin_anyo=[1200, 5000, 15000, 32000, 55000],
    pro_precio=8, pro_conv=0.04,
    salas_fin_anyo=[80, 400, 1200, 2600, 4500],
    sala_precio=39, sala_conv=0.12,
    tiendas_fin_anyo=[5, 30, 90, 200, 350], tienda_precio=49,   # desde el mes 7
    destacado_precio=3, destacados_por_perfil_mes=0.02,          # desde el mes 1
    postul_destacada=1.99, postul_por_contr=4,                   # desde el mes 13 (4 destacadas por bolo cerrado)
    # Costes
    plantilla=[3, 6, 11, 18, 26], coste_persona_mes=3500,       # coste empresa medio (bruto + SS)
    cac_cliente=40, cac_perfil=5,
    marca_mes=[1000, 3000, 8000, 15000, 25000],
    infra_mes=[500, 1500, 4000, 8000, 14000],                    # Firebase, Vercel, Kimi, Sentry, email
    otros_mes=[1500, 3000, 6000, 10000, 15000],                  # asesoría, legal, seguros, coworking, viajes
    # Ronda
    ronda=350_000, enisa=300_000, premoney=2_000_000,
    seed=1_500_000, mes_seed=20,   # siguiente ronda (hipótesis), cuando se cumplan los hitos
)

ESC = {'conservador': 0.5, 'base': 1.0, 'ambicioso': 1.6}

def interp_anual(inicio, fines, m):
    """Valor del mes m (1..60) creciendo geométricamente hasta el valor de cierre de cada año"""
    y = (m - 1) // 12
    a = inicio if y == 0 else fines[y - 1]
    b = fines[y]
    t = ((m - 1) % 12 + 1) / 12
    return a * (b / a) ** t

def escalon(tabla, m):
    v = 0
    for desde, x in tabla:
        if m >= desde: v = x
    return v

def corre(k):
    h = H
    ticket_medio = sum(h['mezcla'][s] * h['ticket'][s] for s in h['mezcla'])
    nuevo = sum(h['mezcla'][s] * h['nuevo_cliente'][s] for s in h['mezcla'])
    take = (1 - h['parte_repetidores']) * h['comision'] + h['parte_repetidores'] * h['comision_repetidor']
    meses = []
    perfiles_prev = 0
    for m in range(1, 61):
        y = (m - 1) // 12
        contr = interp_anual(h['contr_inicio'] * k, [x * k for x in h['contr_fin_anyo']], m)
        perfiles = interp_anual(60 * k, [x * k for x in h['perfiles_fin_anyo']], m)
        salas = interp_anual(5 * k, [x * k for x in h['salas_fin_anyo']], m)
        tiendas = interp_anual(1, [x * max(k, 0.6) for x in h['tiendas_fin_anyo']], m)
        gmv = contr * ticket_medio
        pd = escalon(h['pagado_dentro'], m)
        gmv_dentro = gmv * pd
        ing_comision = gmv_dentro * take
        ing_pro = perfiles * h['pro_conv'] * h['pro_precio'] if m >= 13 else 0
        ing_sala = salas * h['sala_conv'] * h['sala_precio'] if m >= 13 else 0
        ing_tienda = tiendas * h['tienda_precio'] if m >= 7 else 0
        ing_dest = perfiles * h['destacados_por_perfil_mes'] * h['destacado_precio']
        ing_post = contr * h['postul_por_contr'] * h['postul_destacada'] if m >= 13 else 0
        ingresos = ing_comision + ing_pro + ing_sala + ing_tienda + ing_dest + ing_post
        c_pago = gmv_dentro * (1 + h['comision']) * h['stripe'] + gmv_dentro * h['fondo_garantia']
        c_capt = contr * nuevo * h['cac_cliente'] + max(perfiles - perfiles_prev, 0) * h['cac_perfil'] + h['marca_mes'][y]
        c_equipo = h['plantilla'][y] * h['coste_persona_mes']
        c_infra = h['infra_mes'][y] + h['otros_mes'][y]
        costes = c_pago + c_capt + c_equipo + c_infra
        perfiles_prev = perfiles
        meses.append(dict(m=m, contr=contr, gmv=gmv, gmv_dentro=gmv_dentro, ing=ingresos, ing_comision=ing_comision,
                          ing_subs=ing_pro + ing_sala + ing_tienda, ing_dest=ing_dest + ing_post,
                          c_pago=c_pago, c_capt=c_capt, c_equipo=c_equipo, c_infra=c_infra, costes=costes,
                          ebitda=ingresos - costes, mrr_subs=ing_pro + ing_sala + ing_tienda))
    caja = h['ronda'] + h['enisa']
    min_caja, mes_min = caja, 0
    for x in meses:
        caja += x['ebitda'] + (h['seed'] if x['m'] == h['mes_seed'] else 0); x['caja'] = caja
        if caja < min_caja: min_caja, mes_min = caja, x['m']
    anyos = []
    for y in range(5):
        ms = meses[y * 12:(y + 1) * 12]
        s = lambda f: sum(x[f] for x in ms)
        anyos.append(dict(anyo=y + 1, contrataciones=s('contr'), gmv=s('gmv'), gmv_dentro=s('gmv_dentro'),
                          ingresos=s('ing'), comision=s('ing_comision'), suscripciones=s('ing_subs'), destacados=s('ing_dest'),
                          costes=s('costes'), pago=s('c_pago'), captacion=s('c_capt'), equipo=s('c_equipo'), infra_otros=s('c_infra'),
                          ebitda=s('ebitda'), caja_fin=ms[-1]['caja'], contr_mes_dic=ms[-1]['contr'],
                          take_efectivo=s('ing') / s('gmv') if s('gmv') else 0))
    # Meses de caja con la ronda: primer mes en que la caja se acaba (si pasa)
    sin_caja = next((x['m'] for x in meses if x['caja'] < 0), None)
    # Punto de equilibrio: primer mes con EBITDA > 0 sostenido 3 meses
    eq = next((meses[i]['m'] for i in range(len(meses) - 2) if all(meses[j]['ebitda'] > 0 for j in range(i, i + 3))), None)
    hitos = {m: dict(contr_mes=meses[m-1]['contr'], gmv_mes=meses[m-1]['gmv'], ing_mes=meses[m-1]['ing'], caja=meses[m-1]['caja'],
                     ebitda_mes=meses[m-1]['ebitda']) for m in (12, 18, 24)}
    uso = {f: sum(x[f] for x in meses[:24]) for f in ('c_equipo', 'c_capt', 'c_infra', 'c_pago', 'ing')}
    return dict(hitos=hitos, uso24=uso, ticket_medio=ticket_medio, take=take, nuevo=nuevo, anyos=anyos, min_caja=min_caja, mes_min_caja=mes_min,
                sin_caja=sin_caja, equilibrio=eq, meses=meses)

def economia_bolo():
    h = H
    out = {}
    for nombre, cache in [('boda', 1500), ('medio', None), ('bar', 250)]:
        t = cache or sum(h['mezcla'][s] * h['ticket'][s] for s in h['mezcla'])
        com = t * h['comision']; stripe = t * (1 + h['comision']) * h['stripe']; fondo = t * h['fondo_garantia']
        out[nombre] = dict(cache=t, cliente_paga=t * 1.1, ingreso=com, stripe=stripe, fondo=fondo, margen=com - stripe - fondo)
    # LTV / CAC del cliente que contrata (contribución por contratación × contrataciones en su vida)
    vida = {'novios': 1, 'bar': 2 * 10, 'sala': 1 * 18}      # bar: 2 bolos/mes 10 meses; sala: 1/mes 18 meses (hipótesis)
    ticket = {'novios': 1500, 'bar': 250, 'sala': 1000}
    ltv = {}
    for k, n in vida.items():
        t = ticket[k]
        rep = 0 if n < 3 else (n - 2) / n                # desde la 3.ª reserva con el mismo artista, 5 %
        take = (1 - rep) * h['comision'] + rep * h['comision_repetidor']
        margen = t * take - t * 1.1 * h['stripe'] - t * h['fondo_garantia']
        ltv[k] = dict(contrataciones=n, ticket=t, ltv=margen * n, cac=h['cac_cliente'], ratio=margen * n / h['cac_cliente'])
    return out, ltv

def roi(base):
    h = H
    post = h['premoney'] + h['ronda']
    part = h['ronda'] / post
    # Dilución hipotética: seed (20 %) y Serie A (20 %) + pool de opciones (10 %)
    part_final = part * 0.8 * 0.8 * 0.9
    ing5 = base['anyos'][4]['ingresos']
    filas = []
    for nombre, mult, ref in [('Como hoy cotiza Upwork', 1.1, 'Upwork 1,1× ingresos (jul-2026)'),
                              ('Marketplace que crece', 3, 'hipótesis'),
                              ('Líder de su vertical', 6, 'hipótesis')]:
        val = ing5 * mult
        filas.append(dict(escenario=nombre, multiplo=mult, ref=ref, valoracion=val, a_inversor=val * part_final,
                          multiplo_inversor=val * part_final / h['ronda']))
    return dict(post=post, participacion=part, participacion_final=part_final, ingresos_y5=ing5, filas=filas)

res = {k: corre(v) for k, v in ESC.items()}
H_post = H['premoney'] + H['ronda']; part_final = H['ronda'] / H_post * 0.8 * 0.8 * 0.9
rejilla = {k: {m: res[k]['anyos'][4]['ingresos'] * m * part_final / H['ronda'] for m in (1.1, 3, 6)} for k in ESC}
bolo, ltv = economia_bolo()
r = roi(res['base'])
for k, v in res.items():
    v.pop('meses') if k != 'base' else None

def eur(x): return f"{x:,.0f} €".replace(',', '.')
print('ticket medio', eur(res['base']['ticket_medio']), 'take comisión', f"{res['base']['take']:.2%}", 'cliente nuevo', f"{res['base']['nuevo']:.0%}")
for k, v in res.items():
    print(f"\n== {k} == equilibrio mes {v['equilibrio']} · caja mínima {eur(v['min_caja'])} (mes {v['mes_min_caja']}) · se acaba la caja: {v['sin_caja']}")
    for a in v['anyos']:
        print(f"A{a['anyo']}: contr {a['contrataciones']:>8,.0f} (dic {a['contr_mes_dic']:>6,.0f}/mes) GMV {eur(a['gmv']):>14} ingresos {eur(a['ingresos']):>12} "
              f"[com {eur(a['comision'])}, subs {eur(a['suscripciones'])}, dest {eur(a['destacados'])}] costes {eur(a['costes']):>12} EBITDA {eur(a['ebitda']):>12} caja {eur(a['caja_fin']):>12} take {a['take_efectivo']:.1%}")
print('\nbolo', json.dumps(bolo, indent=1))
print('ltv', json.dumps(ltv, indent=1))
print('roi', json.dumps(r, indent=1))
print('rejilla', json.dumps(rejilla, indent=1))
for k in res: print(k, json.dumps(res[k]['hitos'], indent=0, default=float), json.dumps(res[k]['uso24'], default=float))
json.dump(dict(hipotesis=H, escenarios=res, bolo=bolo, ltv=ltv, roi=r, rejilla=rejilla), open(__file__.replace('.py', '.json'), 'w'), indent=1, default=float)
