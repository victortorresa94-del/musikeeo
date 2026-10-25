# Láminas de previsión de ingresos y rentabilidad (sin pedir una cantidad), a partir de rentabilidad.json,
# que sale del modelo docs/pitch/modelo_financiero.py. Las cifras NO se teclean: salen del modelo.
import json, sys

R = json.load(open(sys.argv[1]))
E = R['esc']; B, C, M = E['base'], E['conservador'], E['ambicioso']; H = R['H']
ESCS = [('Conservador', C, '#9A9A9A'), ('Base', B, '#111111'), ('Ambicioso', M, '#E0A800')]

def miles(x, dec=0):
    return f"{x:,.{dec}f}".replace(',', 'X').replace('.', ',').replace('X', '.')
def eur(x): return miles(x) + ' €'
def meur(x, dec=1): return miles(x / 1e6, dec) + ' M€'
def keur(x): return miles(x / 1000) + ' k€'
def pct(x, dec=0): return miles(x * 100, dec) + ' %'
def mes(m): return f'mes {m}' if m else 'después del año 5'

PIE = '<div class="pie"><span class="marca"><img src="img/logo.png">Musikeeo</span><span>{nota}0</span></div>'
b5 = B['anyos'][4]
out = []

# ── Portadilla ──────────────────────────────────────────────────────────────
out.append(f'''
<!-- R0 · Rentabilidad -->
<section class="s osc" style="justify-content: center;">
  <span class="ante">Viabilidad financiera</span>
  <h2 style="margin-top: 40px; font: 800 96px/1.05 'Manrope'; letter-spacing: -3px; max-width: 1560px;">Un negocio que deja margen <span style="color: #FFD60A;">en cada bolo.</span></h2>
  <div style="margin-top: 56px; display: flex; gap: 28px;">
    <div class="tarjeta oscura" style="flex: 1;"><span class="cifra" style="color: #FFD60A;">{meur(b5['ingresos'])}</span><p>de ingresos en el año 5 (escenario base), con {meur(b5['gmv'], 0)} contratados a través de la app.</p></div>
    <div class="tarjeta oscura" style="flex: 1;"><span class="cifra" style="color: #FFFFFF;">{pct(b5['contribucion'] / b5['ingresos'])}</span><p>de cada euro de ingresos queda después de pagos, garantía y lo que cuesta captar a cada cliente.</p></div>
    <div class="tarjeta oscura" style="flex: 1;"><span class="cifra" style="color: #FFFFFF;">Mes {B['cubre']['25000']}</span><p>desde el que ese margen paga una estructura de 25.000 € al mes. En el escenario prudente, 10.000 € al mes desde el mes {C['cubre']['10000']}.</p></div>
  </div>
  <p style="margin-top: 40px; font: 500 22px/1.4 'Inter'; color: #8A8A8A; max-width: 1500px;">Modelo financiero de Musikeeo a 60 meses (docs/pitch/modelo_financiero.py). Son previsiones con sus supuestos a la vista, no una promesa: cada supuesto está en la lámina siguiente.</p>
  {PIE.format(nota='')}
</section>''')

# ── Supuestos (lo que mueve los ingresos) ───────────────────────────────────
mz = H['mezcla']; tk = H['ticket']
take = (1 - H['parte_repetidores']) * H['comision'] + H['parte_repetidores'] * H['comision_repetidor']
ticket = sum(mz[s] * tk[s] for s in mz)
filas_sup = [
    ('Contrataciones al mes', 'Al cierre de cada año: ' + ' · '.join(miles(x) for x in H['contr_fin_anyo']) + f" (empieza en {H['contr_inicio']})"),
    ('Mezcla y caché medio', f"Bodas y privados {pct(mz['bodas_privados'])} a {eur(tk['bodas_privados'])} · bares {pct(mz['bares_restaurantes'])} a {eur(tk['bares_restaurantes'])} · salas, fiestas y empresa {pct(mz['salas_fiestas_corporativo'])} a {eur(tk['salas_fiestas_corporativo'])} → {eur(ticket)} de media"),
    ('Reservas pagadas en la app', ' · '.join(f"{pct(p)} desde el mes {m}" for m, p in H['pagado_dentro'][1:]) + ' (los 6 primeros meses, gratis y sin comisión)'),
    ('Comisión', f"{pct(H['comision'])} que paga quien contrata; {pct(H['comision_repetidor'])} con artistas repetidos ({pct(H['parte_repetidores'])} de las reservas) → {miles(take * 100, 1)} % de media"),
    ('Suscripciones (desde el mes 13)', f"Pro {eur(H['pro_precio'])}/mes ({pct(H['pro_conv'])} de los perfiles) · Plan Sala {eur(H['sala_precio'])}/mes ({pct(H['sala_conv'])} de las salas) · tiendas {eur(H['tienda_precio'])}/mes"),
    ('Destacados', f"{eur(H['destacado_precio'])} por anuncio o perfil destacado; postulaciones destacadas a {miles(H['postul_destacada'], 2)} €"),
    ('Perfiles', 'Al cierre de cada año: ' + ' · '.join(miles(x) for x in H['perfiles_fin_anyo']) + ' · salas: ' + ' · '.join(miles(x) for x in H['salas_fin_anyo'])),
    ('Costes de cada reserva', f"Pago con tarjeta {miles(H['stripe'] * 100, 1)} % y fondo de garantía {miles(H['fondo_garantia'] * 100, 1)} % para sustitutos y devoluciones"),
    ('Captar clientes', f"{eur(H['cac_cliente'])} por cada cliente nuevo que contrata y {eur(H['cac_perfil'])} por perfil nuevo"),
]
filas = ''.join(f'<tr><td style="width: 26%;"><b>{a}</b></td><td>{b}</td></tr>' for a, b in filas_sup)
out.append(f'''
<!-- R1 · Supuestos -->
<section class="s">
  <span class="ante">Supuestos de la previsión</span>
  <h2 class="tit">De dónde salen <span class="am">los números.</span></h2>
  <div style="margin-top: 34px;"><table class="compacta" style="font-size: 21px;">{filas}</table></div>
  <p class="fuente" style="bottom: 100px;">Ticket y mezcla: precios de bodas.net, Cronoshare y fichas de proveedores (oct-2026). Conversión a pago: Lenny's Newsletter y Gigstarter (8 %). Se validan con el piloto de Barcelona.</p>
  {PIE.format(nota='')}
</section>''')

# ── Previsión de ingresos y margen (base) ───────────────────────────────────
an = B['anyos']
def fila(titulo, f, fmt=keur, fuerte=False, sub=False, color=None):
    tds = ''.join(f'<td{" style=\"color:" + color + ";\"" if color else ""}>{"<b>" if fuerte else ""}{fmt(f(a))}{"</b>" if fuerte else ""}</td>' for a in an)
    pad = ' style="padding-left: 44px; color: #555;"' if sub else ''
    return f'<tr><td{pad}>{"<b>" if fuerte else ""}{titulo}{"</b>" if fuerte else ""}</td>{tds}</tr>'
cab = '<tr><th style="width: 30%;"></th>' + ''.join(f'<th style="width: 14%; text-align: right;">Año {a["anyo"]}</th>' for a in an) + '</tr>'
cuerpo = ''.join([
    fila('Contrataciones', lambda a: a['contrataciones'], miles),
    fila('Volumen contratado', lambda a: a['gmv'], lambda v: meur(v, 2)),
    fila('Ingresos', lambda a: a['ingresos'], keur, fuerte=True),
    fila('Comisión', lambda a: a['comision'], keur, sub=True),
    fila('Suscripciones', lambda a: a['suscripciones'], keur, sub=True),
    fila('Destacados', lambda a: a['destacados'], keur, sub=True),
    fila('− Pagos y garantía', lambda a: -a['pago'], keur, sub=True),
    fila('− Captar clientes y perfiles', lambda a: -a['captacion'], keur, sub=True),
    fila('Margen de contribución', lambda a: a['contribucion'], keur, fuerte=True),
    fila('Margen sobre ingresos', lambda a: a['contribucion'] / a['ingresos'], lambda v: pct(v)),
])
out.append(f'''
<!-- R2 · Previsión de ingresos -->
<section class="s">
  <span class="ante">Previsión de ingresos · escenario base</span>
  <h2 class="tit">De {keur(an[0]['ingresos'])} el primer año <span class="am">a {meur(an[4]['ingresos'])} el quinto.</span></h2>
  <div style="margin-top: 30px;"><table class="num compacta" style="font-size: 21px;">{cab}{cuerpo}</table></div>
  <p class="leyenda" style="margin-top: 22px; font-size: 21px;">El año 1 es de siembra: gratis y sin comisión los seis primeros meses para llenar la app de músicos y bolos. Desde el año 3, de cada euro que entra quedan unos {miles(an[2]['contribucion'] / an[2]['ingresos'] * 100)} céntimos para pagar la estructura y ganar dinero.</p>
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
grid = ''.join(f'<line x1="{x0}" x2="{W - 10}" y1="{y0 - v * sc:.1f}" y2="{y0 - v * sc:.1f}" stroke="#E8E8E5" stroke-width="2"/>' for v in (2e6, 4e6, 6e6))
svg = f'<svg width="{W}" height="{Hh}" viewBox="0 0 {W} {Hh}" xmlns="http://www.w3.org/2000/svg">{grid}<line x1="{x0}" x2="{W - 10}" y1="{y0}" y2="{y0}" stroke="#111" stroke-width="3"/>{barras}</svg>'
ey = ''.join(f'<span style="position: absolute; left: 0; top: {y0 - v * sc - 13:.0f}px; width: 84px; text-align: right; font: 500 20px/1 Inter; color: #8A8A8A;">{miles(v / 1e6)} M€</span>' for v in (2e6, 4e6, 6e6))
ex = ''.join(f'<span style="position: absolute; left: {x0 + 22 + i * 170}px; top: {y0 + 14}px; width: 144px; text-align: center; font: 700 22px/1 Inter;">Año {i + 1}</span>' for i in range(5))
filas_e = ''.join(f'<tr{" class=\"nos\"" if n == "Base" else ""}><td><b>{n}</b></td>' + ''.join(f'<td>{miles(a["ingresos"] / 1e6, 2)}</td>' for a in e['anyos']) + '</tr>' for n, e, _ in ESCS)
leyenda = ''.join(f'<span style="display:flex;align-items:center;gap:10px;"><span style="width:26px;height:26px;border-radius:6px;background:{c};"></span>{n}</span>' for n, _, c in ESCS)
out.append(f'''
<!-- R3 · Tres escenarios -->
<section class="s gris">
  <span class="ante">Previsión de ingresos · tres escenarios</span>
  <h2 class="tit">Con la mitad de bolos o con un 60 % más, <span class="am">los ingresos crecen.</span></h2>
  <div class="cuerpo" style="gap: 44px; margin-top: 30px; align-items: flex-start;">
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div style="position: relative; width: {W}px; height: {Hh + 30}px;">{svg}{ey}{ex}</div>
      <div style="display: flex; gap: 30px; font: 600 21px/1 Inter;">{leyenda}</div>
    </div>
    <div style="flex: 1; display: flex; flex-direction: column; gap: 16px;">
      <p class="leyenda" style="font-size: 22px;">Conservador: la mitad de contrataciones que el base. Ambicioso: un 60 % más. Todo lo demás, igual.</p>
      <p style="font: 700 20px/1 Inter; color: #555;">Ingresos, en millones de euros</p><table class="num compacta" style="font-size: 20px;"><tr><th style="width: 30%;"></th><th style="text-align:right;">A1</th><th style="text-align:right;">A2</th><th style="text-align:right;">A3</th><th style="text-align:right;">A4</th><th style="text-align:right;">A5</th></tr>{filas_e}</table>
    </div>
  </div>
  {PIE.format(nota='')}
</section>''')

# ── Desde cuándo se paga una estructura ─────────────────────────────────────
W2, H2, l, t, r_, b_ = 900, 470, 100, 16, 30, 56
vmax = max(max(e['contrib']) for _, e, _ in ESCS) * 1.05; vmin = min(min(e['contrib']) for _, e, _ in ESCS) - 10000
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
et = ''.join(f'<span style="position: absolute; left: 0; top: {Y(v) - 12:.0f}px; width: 90px; text-align: right; font: 500 19px/1 Inter; color: #8A8A8A;">{miles(v / 1000)} k€</span>' for v in (0, 100_000, 200_000, 300_000) if v < vmax)
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

# ── Economía por cliente ────────────────────────────────────────────────────
lt = R['ltv']
nombres = {'novios': ('Una pareja que se casa', 'rosa', 'ic-boda'), 'bar': ('Un bar con música', 'cielo', 'ic-bandas'), 'sala': ('Una sala', 'lavanda', 'ic-salas')}
tarj = ''
for k, (tit, color, ic) in nombres.items():
    x = lt[k]
    tarj += f'<div class="tarjeta {color}" style="flex: 1;"><img class="obj" src="img/{ic}.webp" style="width: 96px; height: 96px;"><h3>{tit}</h3><p>{x["contrataciones"]} contratación{"es" if x["contrataciones"] > 1 else ""} de {eur(x["ticket"])}</p><p style="font: 800 54px/1 Manrope; letter-spacing: -1px; margin-top: 6px;">{miles(x["ratio"], 1)}×</p><p>Deja {eur(round(x["ltv"]))} y captarla cuesta {eur(x["cac"])}.</p></div>'
out.append(f'''
<!-- R5 · Economía por cliente -->
<section class="s gris">
  <span class="ante">Economía por cliente</span>
  <h2 class="tit">Cada cliente deja <span class="am">más de lo que cuesta captarlo.</span></h2>
  <div class="cuerpo" style="gap: 28px; margin-top: 44px;">{tarj}</div>
  <p class="leyenda" style="margin-top: 26px;">Lo que deja un cliente en toda su vida frente a lo que cuesta captarlo. Las bodas no repiten y por eso quedan en {miles(lt['novios']['ratio'], 1)}×; bares y salas repiten y sostienen el negocio. Desde la tercera reserva con el mismo artista la comisión baja al {pct(H['comision_repetidor'])}, para que no se vayan por fuera.</p>
  {PIE.format(nota='Hipótesis: bar, 2 bolos al mes durante 10 meses; sala, 1 al mes durante 18 · ')}
</section>''')

# ── Sensibilidad ────────────────────────────────────────────────────────────
filas_s = ''.join(f'<tr{" class=\"nos\"" if s["caso"] == "Base" else ""}><td><b>{s["caso"]}</b></td><td>{meur(s["ing3"], 2)}</td><td>{meur(s["ing5"])}</td><td>{meur(s["contrib5"], 2)}</td><td>{mes(s["cubre25"])}</td><td>{mes(s["cubre50"])}</td></tr>' for s in R['sens'])
out.append(f'''
<!-- R6 · Sensibilidad -->
<section class="s">
  <span class="ante">Sensibilidad · escenario base</span>
  <h2 class="tit">Aunque algo salga peor, <span class="am">sigue siendo rentable.</span></h2>
  <div style="margin-top: 36px;"><table style="font-size: 21px;"><tr><th style="width: 32%;">Si cambia…</th><th>Ingresos año 3</th><th>Ingresos año 5</th><th>Margen año 5</th><th>Cubre 25.000 €/mes</th><th>Cubre 50.000 €/mes</th></tr>{filas_s}</table></div>
  <p class="leyenda" style="margin-top: 22px;">Un cambio cada vez, con todo lo demás igual. Lo que más pesa es lo que cuesta captar a cada cliente: por eso se crece primero por canales propios (el Cancionero, la red de músicos, los vídeos) y el coste se mide en Barcelona antes de pagar anuncios.</p>
  {PIE.format(nota='')}
</section>''')

# ── Valor de la empresa ─────────────────────────────────────────────────────
filas_v = ''
for n, e, _ in ESCS:
    i5 = e['anyos'][4]['ingresos']
    filas_v += f'<tr{" class=\"nos\"" if n == "Base" else ""}><td><b>{n}</b> · {meur(i5)}</td>' + ''.join(f'<td>{meur(i5 * m)}</td>' for m in (1.1, 3, 6)) + f'<td>{keur(i5 * 3 / 100)}</td></tr>'
out.append(f'''
<!-- R7 · Valor -->
<section class="s gris">
  <span class="ante">Para quien invierta</span>
  <h2 class="tit">Lo que valdría Musikeeo <span class="am">en el año 5.</span></h2>
  <div style="margin-top: 40px;"><table style="font-size: 22px;"><tr><th style="width: 30%;">Escenario · ingresos año 5</th><th>1,1× ingresos</th><th>3× ingresos</th><th>6× ingresos</th><th>Cada 1 % (a 3×)</th></tr>{filas_v}</table></div>
  <div style="margin-top: 34px; display: flex; gap: 26px;">
    <div class="tarjeta mantequilla" style="flex: 1; padding: 28px 32px;"><h3 style="font-size: 30px;">Cómo leerlo</h3><p style="font-size: 22px;">Una empresa como esta se valora por sus ingresos. 1,1× es lo que el mercado pagaba por Upwork en julio de 2026; 3× y 6×, lo habitual para un marketplace que crece o que lidera su sector.</p></div>
    <div class="tarjeta blanca" style="flex: 1; padding: 28px 32px;"><h3 style="font-size: 30px;">Y además, margen</h3><p style="font-size: 22px;">En el escenario base, el año 5 deja {meur(b5['contribucion'], 2)} de margen de contribución: el valor no depende solo de venderla.</p></div>
  </div>
  {PIE.format(nota='Órdenes de magnitud, no una promesa · ')}
</section>''')

# ── Riesgos ─────────────────────────────────────────────────────────────────
riesgos = [
    ('Que se contrate por fuera, por WhatsApp', 'La Reserva protegida da garantía y sustituto si falla el artista; la comisión la paga quien contrata y el músico cobra el 100 %; con artistas repetidos baja al 5 %.', 'rosa'),
    ('Que no haya bolos ni artistas al principio', 'Empezar por los músicos con una herramienta que usan cada semana (el Cancionero) y por una sola ciudad, Barcelona, antes de abrir más.', 'cielo'),
    ('Que captar clientes cueste más', 'Es lo que más pesa en las cuentas: medir el coste en el piloto y crecer por canales propios antes de pagar anuncios.', 'mantequilla'),
    ('Que las bodas sean de temporada', 'Bares, salas y empresas son el 70 % de las contrataciones previstas y se reparten todo el año.', 'menta'),
    ('Que entre un competidor de fuera', 'GigPig o Encore hacen una parte en otro país. Musikeeo junta todo el directo, en español, con la red de músicos de aquí.', 'lavanda'),
    ('Depender de otros proveedores', 'Firebase, Vercel, Stripe y la IA son piezas baratas y cambiables; Rodrigo ya tiene modelos de respaldo.', 'melocoton'),
]
tr = ''.join(f'<div class="tarjeta {c}" style="padding: 26px 28px; gap: 10px;"><h3 style="font-size: 28px;">{t}</h3><p style="font-size: 21px;">{d}</p></div>' for t, d, c in riesgos)
out.append(f'''
<!-- R8 · Riesgos -->
<section class="s">
  <span class="ante">Riesgos</span>
  <h2 class="tit">Lo que puede salir mal <span class="am">y qué hacemos.</span></h2>
  <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 22px;">{tr}</div>
  {PIE.format(nota='')}
</section>''')

# ── Por qué será rentable ───────────────────────────────────────────────────
com, sub, des = b5['comision'], b5['suscripciones'], b5['destacados']
out.append(f'''
<!-- R9 · Por qué será rentable -->
<section class="s gris">
  <span class="ante">En resumen</span>
  <h2 class="tit">Por qué Musikeeo <span class="am">será rentable.</span></h2>
  <div style="margin-top: 44px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
    <div class="tarjeta blanca" style="padding: 30px 34px;"><h3>La app ya está hecha</h3><p>Funciona en musikeeo.com: lo caro de un producto así ya está pagado. Lo que queda es darla a conocer.</p></div>
    <div class="tarjeta mantequilla" style="padding: 30px 34px;"><h3>Cobra en cada contratación</h3><p>Un 10 % que paga quien contrata. De los 150 € de una boda de 1.500 €, quedan 112,80 € después de pagos y garantía.</p></div>
    <div class="tarjeta cielo" style="padding: 30px 34px;"><h3>Varias fuentes de ingreso</h3><p>En el año 5 (base): comisión {pct(com / b5['ingresos'])}, suscripciones {pct(sub / b5['ingresos'])} y destacados {pct(des / b5['ingresos'])}.</p></div>
    <div class="tarjeta rosa" style="padding: 30px 34px;"><h3>Un mercado grande y sin dueño</h3><p>Solo la música de las bodas mueve unos 160 M€ al año en España, y nadie junta artistas, técnicos, salas y equipo en una app.</p></div>
  </div>
  {PIE.format(nota='')}
</section>''')

open(sys.argv[2], 'w').write('\n'.join(out))
print(len(out), 'láminas')
