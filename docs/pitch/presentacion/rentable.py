# Láminas de previsión de ingresos y rentabilidad (sin pedir una cantidad), a partir de rentabilidad_consejo.json,
# que sale del modelo del plan de cobro decidido el 25-oct-2026 (docs/pitch/modelo_consejo.py y
# docs/DECISIONES-COBRO.md). Las cifras NO se teclean: salen del modelo.
import json, sys

R = json.load(open(sys.argv[1]))
E = R['esc']; B, C, M = E['base'], E['conservador'], E['ambicioso']; P = R['P']
ESCS = [('Conservador', C, '#9A9A9A'), ('Base', B, '#111111'), ('Ambicioso', M, '#E0A800')]

def miles(x, dec=0):
    return f"{x:,.{dec}f}".replace(',', 'X').replace('.', ',').replace('X', '.')
def eur(x, dec=0): return miles(x, dec) + ' €'
def meur(x, dec=2): return miles(x / 1e6, dec) + ' M€'
def keur(x): return miles(x / 1000) + ' k€'
def pct(x, dec=0): return miles(x * 100, dec) + ' %'
def mes(m): return f'mes {m}' if m else 'después del año 5'

PIE = '<div class="pie"><span class="marca"><img src="img/logo.png">Musikeeo</span><span>{nota}0</span></div>'
an = B['anyos']; b5 = an[4]
out = []

# ── Portadilla ──────────────────────────────────────────────────────────────
out.append(f'''
<!-- R0 · Rentabilidad -->
<section class="s osc" style="justify-content: center;">
  <span class="ante">Viabilidad financiera</span>
  <h2 style="margin-top: 40px; font: 800 96px/1.05 'Manrope'; letter-spacing: -3px; max-width: 1560px;">Un negocio que deja margen <span style="color: #FFD60A;">en cada bolo.</span></h2>
  <div style="margin-top: 56px; display: flex; gap: 28px;">
    <div class="tarjeta oscura" style="flex: 1;"><span class="cifra" style="color: #FFD60A;">{meur(b5['ingresos'])}</span><p>de ingresos en el año 5 (escenario base, solo España), con {meur(b5['gmv'], 0)} contratados a través de la app.</p></div>
    <div class="tarjeta oscura" style="flex: 1;"><span class="cifra" style="color: #FFFFFF;">{pct(b5['contribucion'] / b5['ingresos'])}</span><p>de cada euro de ingresos queda después de cobros, garantía, atención y lo que cuesta conseguir a cada cliente.</p></div>
    <div class="tarjeta oscura" style="flex: 1;"><span class="cifra" style="color: #FFFFFF;">Mes {B['cubre']['25000']}</span><p>desde el que ese margen paga una estructura de 25.000 € al mes. En el escenario prudente, 10.000 € al mes desde el mes {C['cubre']['10000']}.</p></div>
  </div>
  <p style="margin-top: 40px; font: 500 22px/1.4 'Inter'; color: #8A8A8A; max-width: 1560px;">Previsión a 60 meses con supuestos prudentes: un 60 % del volumen que planteábamos al principio, IVA, costes reales de cobro y la comisión solo cuando hay cliente nuevo. Son previsiones con sus supuestos a la vista, no una promesa.</p>
  {PIE.format(nota='')}
</section>''')

# ── Supuestos ───────────────────────────────────────────────────────────────
fb = P['mezcla_bodas']; T = P['ticket']
filas_sup = [
    ('Contrataciones al mes', 'Al cierre de cada año: ' + ' · '.join(miles(x) for x in R['ESC']['base']['fines']) + '. Como referencia, GigPig hace unas 5.000 al mes en el Reino Unido.'),
    ('Mezcla y caché', f"Bodas y particulares del {pct(fb[0])} al {pct(fb[2])} de los bolos, a {eur(T['bodas'])} · salas y eventos {pct(P['mezcla_salas'])}, a {eur(T['salas'])} · bares, el resto, a {eur(T['bares'])}"),
    ('Bodas y particulares', f"Gestión y garantía del {pct(P['com_bodas'])} + IVA que paga el cliente ({pct(P['com_bodas_ini'])} los seis primeros meses). El músico cobra el 100 %. Pagadas por la app: " + ' → '.join(pct(p) for _, p in P['pd_bodas'])),
    ('Bares y salas', f"{pct(P['com_bares'])} + IVA solo la primera vez con cada artista ({pct(P['primera_bares'])} de los bolos de bar, {pct(P['primera_salas'])} en salas). Repetir es gratis: así no se van por fuera."),
    ('Suscripciones', f"Plan Sala desde 29 €/mes (lo paga el {pct(P['sala_conv'])} de los locales) · Pro 7,99 €/mes ({pct(P['pro_conv'])} de los perfiles activos) · Cancionero Pro 24,99 €/año · tiendas desde 49 €/mes · Destacado en bodas 29 €/mes. Con bajas del 3-4 % al mes."),
    ('Costes de cada cobro', f"Tarjeta 1,5 % + 0,25 €, Stripe Connect y disputas · fondo de garantía del {pct(P['garantia'])} y {eur(P['soporte'])} de atención por boda"),
    ('Conseguir clientes', f"{eur(P['cac_pareja'])} por pareja de boda, {eur(P['cac_bar'])} por bar nuevo, {eur(P['cac_sala'])} por sala o empresa y {eur(P['cac_perfil'])} por perfil"),
    ('Cuándo se cobra', f"Cada cobro se enciende al llegar a un número, no en una fecha. En la previsión: bodas desde el mes {P['bodas_com_desde']}, salas el {P['salas_desde']}, bares el {P['bares_desde']}, Plan Sala el {P['sala_desde']} y Pro el {P['pro_desde']}"),
]
filas = ''.join(f'<tr><td style="width: 24%;"><b>{a}</b></td><td>{b}</td></tr>' for a, b in filas_sup)
out.append(f'''
<!-- R1 · Supuestos -->
<section class="s">
  <span class="ante">Supuestos de la previsión</span>
  <h2 class="tit">De dónde salen <span class="am">los números.</span></h2>
  <div style="margin-top: 30px;"><table class="compacta" style="font-size: 20px;">{filas}</table></div>
  <p class="fuente" style="bottom: 96px;">Modelo por segmentos (docs/pitch/modelo_consejo.py). Las decisiones de cobro se contrastaron con 10 análisis expertos hechos con IA: finanzas, precios, legal e inversión. Se validan con el piloto de Barcelona.</p>
  {PIE.format(nota='')}
</section>''')

# ── Previsión de ingresos y margen (base) ───────────────────────────────────
def fila(titulo, f, fmt=keur, fuerte=False, sub=False):
    tds = ''.join(f'<td>{"<b>" if fuerte else ""}{fmt(f(a))}{"</b>" if fuerte else ""}</td>' for a in an)
    pad = ' style="padding-left: 44px; color: #555;"' if sub else ''
    return f'<tr><td{pad}>{"<b>" if fuerte else ""}{titulo}{"</b>" if fuerte else ""}</td>{tds}</tr>'
cab = '<tr><th style="width: 32%;"></th>' + ''.join(f'<th style="width: 13.6%; text-align: right;">Año {a["anyo"]}</th>' for a in an) + '</tr>'
cuerpo = ''.join([
    fila('Contrataciones', lambda a: a['contrataciones'], miles),
    fila('Volumen contratado', lambda a: a['gmv'], lambda v: meur(v, 2)),
    fila('Ingresos', lambda a: a['ingresos'], keur, fuerte=True),
    fila('Comisión', lambda a: a['comision'], keur, sub=True),
    fila('Suscripciones', lambda a: a['suscripciones'], keur, sub=True),
    fila('Visibilidad y Mercado', lambda a: a['visibilidad'], keur, sub=True),
    fila('− Cobros, garantía y atención', lambda a: -a['pago'], keur, sub=True),
    fila('− Conseguir clientes', lambda a: -a['captacion'], keur, sub=True),
    fila('Margen de contribución', lambda a: a['contribucion'], keur, fuerte=True),
    fila('Margen sobre ingresos', lambda a: a['contribucion'] / a['ingresos'], lambda v: pct(v)),
])
out.append(f'''
<!-- R2 · Previsión de ingresos -->
<section class="s">
  <span class="ante">Previsión de ingresos · escenario base</span>
  <h2 class="tit">De {keur(an[0]['ingresos'])} el primer año <span class="am">a {meur(an[4]['ingresos'])} el quinto.</span></h2>
  <div style="margin-top: 28px;"><table class="num compacta" style="font-size: 21px;">{cab}{cuerpo}</table></div>
  <p class="leyenda" style="margin-top: 20px; font-size: 21px;">El año 1 es de siembra: lo que entra es la preventa de Pro Fundadores y los eventos de empresa. Desde el año 3, de cada euro quedan unos {miles(an[2]['contribucion'] / an[2]['ingresos'] * 100)} céntimos, y {miles(b5['contribucion'] / b5['ingresos'] * 100)} en el año 5, para pagar la estructura y ganar dinero.</p>
  {PIE.format(nota='')}
</section>''')

# ── Ingresos en tres escenarios (gráfico) ───────────────────────────────────
W, Hh, x0, y0 = 960, 500, 96, 450
maxv = M['anyos'][4]['ingresos'] * 1.08
sc = (y0 - 20) / maxv
barras = ''
for i in range(5):
    cx = x0 + 22 + i * 170
    for j, (n, e, col) in enumerate(ESCS):
        v = e['anyos'][i]['ingresos'] * sc
        barras += f'<rect x="{cx + j * 50}" y="{y0 - v:.1f}" width="44" height="{v:.1f}" rx="6" fill="{col}"/>'
marcas = [v for v in (1e6, 2e6, 3e6, 4e6) if v < maxv]
grid = ''.join(f'<line x1="{x0}" x2="{W - 10}" y1="{y0 - v * sc:.1f}" y2="{y0 - v * sc:.1f}" stroke="#E8E8E5" stroke-width="2"/>' for v in marcas)
svg = f'<svg width="{W}" height="{Hh}" viewBox="0 0 {W} {Hh}" xmlns="http://www.w3.org/2000/svg">{grid}<line x1="{x0}" x2="{W - 10}" y1="{y0}" y2="{y0}" stroke="#111" stroke-width="3"/>{barras}</svg>'
ey = ''.join(f'<span style="position: absolute; left: 0; top: {y0 - v * sc - 13:.0f}px; width: 84px; text-align: right; font: 500 20px/1 Inter; color: #8A8A8A;">{miles(v / 1e6)} M€</span>' for v in marcas)
ex = ''.join(f'<span style="position: absolute; left: {x0 + 22 + i * 170}px; top: {y0 + 14}px; width: 144px; text-align: center; font: 700 22px/1 Inter;">Año {i + 1}</span>' for i in range(5))
filas_e = ''.join(f'<tr{" class=\"nos\"" if n == "Base" else ""}><td><b>{n}</b></td>' + ''.join(f'<td>{miles(a["ingresos"] / 1e6, 2)}</td>' for a in e['anyos']) + '</tr>' for n, e, _ in ESCS)
filas_m = ''.join(f'<tr{" class=\"nos\"" if n == "Base" else ""}><td><b>{n}</b></td><td>{meur(e["anyos"][4]["contribucion"])}</td><td>{pct(e["anyos"][4]["contribucion"] / e["anyos"][4]["ingresos"])}</td></tr>' for n, e, _ in ESCS)
leyenda = ''.join(f'<span style="display:flex;align-items:center;gap:10px;"><span style="width:26px;height:26px;border-radius:6px;background:{c};"></span>{n}</span>' for n, _, c in ESCS)
out.append(f'''
<!-- R3 · Tres escenarios -->
<section class="s gris">
  <span class="ante">Previsión de ingresos · tres escenarios</span>
  <h2 class="tit">Con menos bolos o con Europa, <span class="am">los ingresos crecen.</span></h2>
  <div class="cuerpo" style="gap: 44px; margin-top: 30px; align-items: flex-start;">
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div style="position: relative; width: {W}px; height: {Hh + 30}px;">{svg}{ey}{ex}</div>
      <div style="display: flex; gap: 30px; font: 600 21px/1 Inter;">{leyenda}</div>
    </div>
    <div style="flex: 1; display: flex; flex-direction: column; gap: 14px;">
      <p class="leyenda" style="font-size: 21px;">Conservador: un tercio de los bolos del ambicioso. Base: el 60 %, solo España. Ambicioso: con Europa desde el año 4.</p>
      <p style="font: 700 20px/1 Inter; color: #555;">Ingresos, en millones de euros</p><table class="num compacta" style="font-size: 19px;"><tr><th style="width: 30%;"></th><th style="text-align:right;">A1</th><th style="text-align:right;">A2</th><th style="text-align:right;">A3</th><th style="text-align:right;">A4</th><th style="text-align:right;">A5</th></tr>{filas_e}</table>
      <p style="font: 700 20px/1 Inter; color: #555; margin-top: 6px;">Margen de contribución, año 5</p><table class="num compacta" style="font-size: 19px;"><tr><th style="width: 30%;"></th><th style="text-align:right;">Margen</th><th style="text-align:right;">Sobre ingresos</th></tr>{filas_m}</table>
    </div>
  </div>
  {PIE.format(nota='')}
</section>''')

# ── Desde cuándo se paga una estructura ─────────────────────────────────────
W2, H2, l, t, r_, b_ = 900, 470, 100, 16, 30, 56
vmax = max(max(e['contrib']) for _, e, _ in ESCS) * 1.05; vmin = min(min(e['contrib']) for _, e, _ in ESCS) - 8000
X = lambda m: l + (m - 1) / 59 * (W2 - l - r_)
Y = lambda v: t + (vmax - v) / (vmax - vmin) * (H2 - t - b_)
lin = ''
for n, e, col in ESCS:
    pts = ' '.join(f'{X(i + 1):.1f},{Y(v):.1f}' for i, v in enumerate(e['contrib']))
    lin += f'<polyline points="{pts}" fill="none" stroke="{col}" stroke-width="5" stroke-linejoin="round"/>'
niveles = (10_000, 25_000, 50_000)
ref = ''.join(f'<line x1="{l}" x2="{W2 - r_}" y1="{Y(v):.1f}" y2="{Y(v):.1f}" stroke="#B9B9B9" stroke-width="2" stroke-dasharray="8 7"/>' for v in niveles)
ref += f'<line x1="{l}" x2="{W2 - r_}" y1="{Y(0):.1f}" y2="{Y(0):.1f}" stroke="#111" stroke-width="2"/>'
svg2 = f'<svg width="{W2}" height="{H2}" viewBox="0 0 {W2} {H2}" xmlns="http://www.w3.org/2000/svg">{ref}{lin}</svg>'
paso = 25_000 if vmax < 160_000 else 50_000
et = ''.join(f'<span style="position: absolute; left: 0; top: {Y(v) - 12:.0f}px; width: 90px; text-align: right; font: 500 19px/1 Inter; color: #8A8A8A;">{miles(v / 1000)} k€</span>' for v in range(0, int(vmax), paso))
et += ''.join(f'<span style="position: absolute; left: {X(m) - 40:.0f}px; top: {H2 - b_ + 14}px; width: 80px; text-align: center; font: 500 19px/1 Inter; color: #8A8A8A;">mes {m}</span>' for m in (12, 24, 36, 48, 60))
filas_c = ''.join(f'<tr{" class=\"nos\"" if n == "Base" else ""}><td><b>{n}</b></td>' + ''.join(f'<td>{mes(e["cubre"][str(v)])}</td>' for v in niveles) + '</tr>' for n, e, _ in ESCS)
out.append(f'''
<!-- R4 · Estructura -->
<section class="s">
  <span class="ante">Rentabilidad</span>
  <h2 class="tit">Desde el mes {B['cubre']['25000']}, el margen paga <span class="am">25.000 € al mes de estructura.</span></h2>
  <div class="cuerpo" style="gap: 44px; margin-top: 30px; align-items: flex-start;">
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <p style="font: 800 24px/1.2 Manrope;">Margen de contribución, mes a mes</p>
      <div style="position: relative; width: {W2}px; height: {H2 + 30}px;">{svg2}{et}</div>
    </div>
    <div style="flex: 1; display: flex; flex-direction: column; gap: 18px;">
      <p style="font: 800 24px/1.2 Manrope;">Desde qué mes cubre una estructura fija de…</p>
      <table style="font-size: 20px;"><tr><th style="width: 31%;"></th><th>10.000 €/mes</th><th>25.000 €/mes</th><th>50.000 €/mes</th></tr>{filas_c}</table>
      <p class="leyenda" style="font-size: 21px;">La app ya está hecha y funcionando: lo fijo es el equipo que la lleva y los servidores. Cuánto se gasta en estructura lo decide quien la lleve; aquí se ve desde cuándo se paga sola.</p>
    </div>
  </div>
  {PIE.format(nota='Tres meses seguidos por encima de cada nivel · ')}
</section>''')

# ── Lo que deja cada bolo ───────────────────────────────────────────────────
bo = R['bolos']; cac = bo['cac']
def tarjeta(color, ic, tit, linea, neto, nota):
    return f'<div class="tarjeta {color}" style="flex: 1;"><img class="obj" src="img/{ic}.webp" style="width: 96px; height: 96px;"><h3>{tit}</h3><p>{linea}</p><p style="font: 800 54px/1 Manrope; letter-spacing: -1px; margin-top: 6px;">{neto}</p><p>{nota}</p></div>'
tarj = ''.join([
    tarjeta('rosa', 'ic-boda', 'Una boda', f"Caché de {eur(bo['boda']['cache'])}: el cliente paga {eur(bo['boda']['comision'])} + IVA de gestión y garantía.", eur(bo['boda']['neto']), f"quedan tras el cobro, la garantía y la atención. Conseguir a la pareja no puede costar más de {eur(cac['pareja'])}."),
    tarjeta('cielo', 'ic-bandas', 'Un bar, la primera vez', f"Caché de {eur(bo['bar']['cache'])}: el bar paga {eur(bo['bar']['comision'])} + IVA al aceptar la propuesta.", eur(bo['bar']['neto']), "Repetir con ese artista es gratis: el bar paga después el Plan Sala, desde 29 € al mes."),
    tarjeta('lavanda', 'ic-salas', 'Una sala o una empresa', f"Caché de {eur(bo['sala']['cache'])}: {eur(bo['sala']['comision'])} + IVA la primera vez con ese artista.", eur(bo['sala']['neto']), f"quedan, frente a unos {eur(cac['sala'])} que cuesta conseguir una sala o empresa nueva."),
])
out.append(f'''
<!-- R5 · Lo que deja cada bolo -->
<section class="s gris">
  <span class="ante">Economía por bolo</span>
  <h2 class="tit">Lo que deja cada bolo <span class="am">y lo que cuesta conseguirlo.</span></h2>
  <div class="cuerpo" style="gap: 28px; margin-top: 40px;">{tarj}</div>
  <p class="leyenda" style="margin-top: 24px;">La boda paga lo que cuesta conseguirla; el margen lo dan los locales (la primera vez y el Plan Sala), las tiendas y la visibilidad. Al 10 %, una boda deja {eur(bo['boda10']['neto'])}: por eso ese precio es solo de lanzamiento, y mientras dure no se pagan anuncios para conseguir parejas.</p>
  {PIE.format(nota='')}
</section>''')

# ── Sensibilidad ────────────────────────────────────────────────────────────
filas_s = ''.join(f'<tr{" class=\"nos\"" if s["caso"].startswith("Base") else ""}><td><b>{s["caso"]}</b></td><td>{meur(s["ing3"], 2)}</td><td>{meur(s["ing5"])}</td><td>{keur(s["contrib5"])}</td><td>{mes(s["cubre25"])}</td><td>{mes(s["cubre50"])}</td></tr>' for s in R['sens'])
out.append(f'''
<!-- R6 · Sensibilidad -->
<section class="s">
  <span class="ante">Sensibilidad · escenario base</span>
  <h2 class="tit">Aunque algo salga peor, <span class="am">sigue dejando margen.</span></h2>
  <div style="margin-top: 32px;"><table class="compacta" style="font-size: 20px;"><tr><th style="width: 34%;">Si cambia…</th><th>Ingresos año 3</th><th>Ingresos año 5</th><th>Margen año 5</th><th>Cubre 25.000 €/mes</th><th>Cubre 50.000 €/mes</th></tr>{filas_s}</table></div>
  <p class="leyenda" style="margin-top: 20px; font-size: 21px;">Un cambio cada vez, con todo lo demás igual. Lo que más pesa es lo que cuesta conseguir unos novios: por eso llegan a través de fincas, wedding planners y los propios músicos, y el coste se mide en Barcelona antes de pagar anuncios.</p>
  {PIE.format(nota='')}
</section>''')

# ── Tres palancas e incertidumbre ───────────────────────────────────────────
mc = R['mc']
sens = {s['caso']: s for s in R['sens']}
s30 = sens['Conseguir unos novios cuesta 30 €']; s70 = sens['Conseguir unos novios cuesta 70 €']
s12 = sens['Plan Sala lo paga el 12 %, no el 20 %']; s55 = sens['Bodas pagadas por la app: 55 % como mucho']
out.append(f'''
<!-- R7 · Palancas -->
<section class="s gris">
  <span class="ante">Para quien invierta</span>
  <h2 class="tit">Tres números <span class="am">deciden el resultado.</span></h2>
  <div style="margin-top: 36px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px;">
    <div class="tarjeta rosa" style="padding: 28px 30px;"><h3 style="font-size: 30px;">1 · Lo que cuesta conseguir unos novios</h3><p style="font-size: 22px;">Objetivo: 50 € o menos. A 30 €, el margen del año 5 sube a {keur(s30['contrib5'])}; a 70 €, baja a {keur(s70['contrib5'])}.</p></div>
    <div class="tarjeta mantequilla" style="padding: 28px 30px;"><h3 style="font-size: 30px;">2 · Bodas pagadas por la app</h3><p style="font-size: 22px;">Objetivo: 60 % o más a los 12 meses. Con un 55 % como mucho, el margen queda en {keur(s55['contrib5'])}. Si no llega al 40 %, plan B: «Destacado en bodas».</p></div>
    <div class="tarjeta lavanda" style="padding: 28px 30px;"><h3 style="font-size: 30px;">3 · Locales con Plan Sala</h3><p style="font-size: 22px;">Objetivo: 20 % de los locales activos. Si solo lo paga el 12 %, el margen del año 5 queda en {keur(s12['contrib5'])}.</p></div>
  </div>
  <div style="margin-top: 28px; display: flex; gap: 24px; align-items: stretch;">
    <div class="tarjeta blanca" style="flex: 1.3; padding: 28px 32px;"><h3 style="font-size: 30px;">5.000 futuros posibles</h3><p style="font-size: 22px;">Con todo lo dudoso moviéndose a la vez (bolos, coste por pareja, cobro por la app, Plan Sala…), el año 5 deja:</p>
      <table class="num compacta" style="font-size: 20px; margin-top: 6px;"><tr><th style="width: 34%;"></th><th style="text-align:right;">Peor 10 %</th><th style="text-align:right;">Normal</th><th style="text-align:right;">Mejor 10 %</th></tr>
      <tr><td><b>Ingresos</b></td><td>{meur(mc['ing'][0])}</td><td>{meur(mc['ing'][1])}</td><td>{meur(mc['ing'][2])}</td></tr>
      <tr><td><b>Margen</b></td><td>{keur(mc['contrib'][0])}</td><td>{keur(mc['contrib'][1])}</td><td>{keur(mc['contrib'][2])}</td></tr></table></div>
    <div class="tarjeta" style="flex: 1; padding: 28px 32px; background: #0A0A0A; color: #FFFFFF;"><span class="cifra" style="color: #FFD60A; font-size: 88px;">{pct(mc['negativo'])}</span><p style="color: #C8C8C8; font-size: 22px;">de esos futuros pierden dinero en el año 5. No damos una cifra de valoración: enseñamos de dónde sale el margen y cómo lo medimos desde el primer mes.</p></div>
  </div>
  {PIE.format(nota='')}
</section>''')

# ── Riesgos ─────────────────────────────────────────────────────────────────
riesgos = [
    ('Que se contrate por fuera, por WhatsApp', 'El teléfono no se ve hasta aceptar la propuesta, como en Airbnb. Repetir con el mismo artista es gratis, así que no hay motivo para irse. Y dentro hay garantía y factura.', 'rosa'),
    ('Que cueste mucho conseguir clientes', 'Es lo que más pesa. Las bodas llegan por fincas, planners y los propios músicos; el coste se mide en Barcelona antes de pagar anuncios.', 'mantequilla'),
    ('Que no haya bolos ni artistas al principio', 'Empezar por los músicos, con el Cancionero, que usan cada semana, y por los bares de un barrio antes de abrir la ciudad.', 'cielo'),
    ('Lo legal y lo fiscal', 'Antes del primer euro: sociedad, asesor laboral y fiscal, Stripe Connect y el alta como plataforma en Hacienda (DAC7). El Plan Sala incluirá las altas de los músicos con una gestoría.', 'menta'),
    ('Que las bodas sean de temporada', 'Bares, salas y empresas son el 70 % de las contrataciones previstas y se reparten todo el año.', 'lavanda'),
    ('Que entre un competidor de fuera', 'GigPig o Encore hacen una parte en otro país. Musikeeo junta todo el directo, en español y con la red de músicos de aquí.', 'melocoton'),
]
tr = ''.join(f'<div class="tarjeta {c}" style="padding: 26px 28px; gap: 10px;"><h3 style="font-size: 28px;">{t}</h3><p style="font-size: 21px;">{d}</p></div>' for t, d, c in riesgos)
out.append(f'''
<!-- R8 · Riesgos -->
<section class="s">
  <span class="ante">Riesgos</span>
  <h2 class="tit">Lo que puede salir mal <span class="am">y qué hacemos.</span></h2>
  <div style="margin-top: 36px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 22px;">{tr}</div>
  {PIE.format(nota='')}
</section>''')

# ── Por qué será rentable ───────────────────────────────────────────────────
com, sub, vis = b5['comision'], b5['suscripciones'], b5['visibilidad']
out.append(f'''
<!-- R9 · Por qué será rentable -->
<section class="s gris">
  <span class="ante">En resumen</span>
  <h2 class="tit">Por qué Musikeeo <span class="am">será rentable.</span></h2>
  <div style="margin-top: 44px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
    <div class="tarjeta blanca" style="padding: 30px 34px;"><h3>La app ya está hecha</h3><p>Funciona en musikeeo.com: lo caro de un producto así ya está pagado. Lo que queda es darla a conocer.</p></div>
    <div class="tarjeta mantequilla" style="padding: 30px 34px;"><h3>Cobra el primer encuentro</h3><p>Un {pct(P['com_bodas'])} de gestión y garantía en bodas, que paga el cliente, y un {pct(P['com_bares'])} la primera vez que un local contrata a un artista. Repetir es gratis.</p></div>
    <div class="tarjeta cielo" style="padding: 30px 34px;"><h3>Varias fuentes de ingreso</h3><p>En el año 5 (base): comisión {pct(com / b5['ingresos'])}, suscripciones {pct(sub / b5['ingresos'])} y visibilidad y Mercado {pct(vis / b5['ingresos'])}.</p></div>
    <div class="tarjeta rosa" style="padding: 30px 34px;"><h3>Un mercado grande y sin dueño</h3><p>Solo la música de las bodas mueve unos 160 M€ al año en España, y nadie junta artistas, técnicos, salas y equipo en una app.</p></div>
  </div>
  {PIE.format(nota='')}
</section>''')

open(sys.argv[2], 'w').write('\n'.join(out))
print(len(out), 'láminas')
