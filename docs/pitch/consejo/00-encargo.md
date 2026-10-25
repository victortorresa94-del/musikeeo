# Consejo de Musikeeo · ¿Cómo gana dinero? (25-oct-2026)

Eres uno de 10 expertos (5 de finanzas, matemáticas y monetización; 5 de viabilidad de startups y negocio). Cada uno da su opinión por separado; luego el presidente del consejo (Claude) junta las 10 y toma las decisiones para Víctor, el fundador. **Sé decidido: elige una opción y da números. «Depende» no sirve.** Si algo es hipótesis, dilo; si das un dato de fuera, pon la fuente.

## Qué es Musikeeo
- App web (PWA) que conecta **músicos y bandas, técnicos de sonido, salas, bares, promotores, novios y particulares, y tiendas de instrumentos**. Empieza en **Barcelona**, luego España, luego Europa y LATAM. Lema: «Conecta. Crea. Suena.»
- Fase: **antes del lanzamiento real**. Hay contenido de demostración para inversores. **Hoy todo es gratis y no se cobra nada**; no hay pagos dentro de la app (Stripe Connect no está montado).
- Lo que ya funciona:
  - **Explorar:** buscar artistas, técnicos y salas por categoría, con perfiles, vídeos y fichas.
  - **Bolos:** las salas publican y los músicos se postulan.
  - **Mercado:** compraventa y alquiler de instrumentos y equipo, con contacto por chat.
  - **Feed:** fotos y vídeos, me gusta, comentarios y algoritmo «Para ti».
  - **Chat interno.**
  - **Rodrigo:** asistente con IA que crea anuncios, bolos y perfiles.
  - **Cancionero:** letras y acordes que pegas tú, repertorios para el bolo, modo escenario, pedal Bluetooth y sacar acordes de un audio en el móvil. Funciona sin cuenta y sin cobertura. Es la herramienta que más usaría un músico a diario, se contrate o no por Musikeeo.
- **Recién hecho en el chat:** «Propuesta de bolo» (fecha, hora, sitio, caché, duración y notas) que el otro acepta con un toque, y un aviso cuando alguien escribe un teléfono, un email o «WhatsApp».
- **Decidido por Víctor hoy:** **esconder teléfonos, emails y enlaces de WhatsApp o Telegram en el chat**, como Airbnb. No hay que decidir si se hace; sí hasta cuándo y con qué excepciones (pregunta D3).
- Premisa de Víctor: para cobrar por la app, **los músicos son autónomos** («eso garantiza calidad»). Quien no lo es: se le da de alta el que contrata (empresa, régimen de artistas) o factura con una cooperativa o gestora.
- El dossier para inversores **no pide una cantidad**: quiere enseñar que Musikeeo **será rentable** para quien invierta (previsiones de ingresos, margen y desde qué mes cubre una estructura fija).

## Documentos que tienes que leer (rutas absolutas)
- `/home/user/musikeeo/docs/MONETIZACION.md`: el plan de cobro actual (8-oct).
- `/home/user/musikeeo/docs/REFERENCIAS-MONETIZACION.md`: **cómo cobran otras 20 plataformas**, con fuentes: Airbnb, Fiverr, Upwork, Encore, Cueup, GigSalad, The Bash, gigmit, Gigstarter (quebró), Bodas.net, Thumbtack, Bark, Cronoshare, Treatwell, Fresha, TheFork, Vinted, Wallapop, BlaBlaCar, Reverb, Etsy, Thomann, Ultimate Guitar y Sofar. Avisos: Homejoy, y el estudio de Gu y Zhu («más confianza, más fugas»).
- `/home/user/musikeeo/docs/pitch/modelo_financiero.py`: el modelo, con todas las hipótesis en el diccionario `H`.
- `/home/user/musikeeo/docs/pitch/rentabilidad.py`: lo corre sin ronda (margen de contribución, desde qué mes se cubre una estructura fija y sensibilidad). Se usa así: `cd <tu carpeta> && python3 /home/user/musikeeo/docs/pitch/rentabilidad.py /home/user/musikeeo/docs/pitch/modelo_financiero.py`
- `/home/user/musikeeo/docs/pitch/investigacion.md`: datos del mercado español (música en directo, bodas, bares, salas), comparables, take rates, CAC y conversiones freemium.
- Opcional: `/home/user/musikeeo/CLAUDE.md` (contexto del proyecto) y `/home/user/musikeeo/docs/LANZAMIENTO.md`.

## Hipótesis del modelo de hoy (resumen; el detalle está en `H`)
- Contrataciones al mes al cierre de cada año (base): 250 → 900 → 2.600 → 5.500 → 9.500. Escenarios: conservador ×0,5 y ambicioso ×1,6.
- Mezcla: bodas y particulares 30 % (900 €), bares y restaurantes 55 % (250 €), salas, fiestas y empresas 15 % (1.000 €). **Ticket medio: 558 €.**
  - Por volumen de dinero: bodas 48 %, bares 25 %, salas 27 %.
- Cliente nuevo en cada contratación: bodas 95 %, bares 15 %, salas 25 %. Pesado por dinero, **el 56 % del volumen viene de clientes nuevos**.
- **Comisión:**
  - 10 % que paga quien contrata, y 5 % al que repite con el mismo artista desde la 3.ª vez (se supone que es el 30 % de los bolos). **Media: 8,5 %.**
  - Gratis los 6 primeros meses. Contrataciones pagadas dentro de la app: 40 % desde el mes 7, 60 % desde el 13, 70 % desde el 25 y 75 % desde el 37.
  - Costes: Stripe 1,8 % y fondo de garantía 0,5 %.
- **Suscripciones:**
  - Pro para músicos a 8 €/mes (paga el 4 % de los perfiles) y Plan Sala a 39 €/mes (paga el 12 % de las salas), ambos desde el mes 13.
  - Tiendas a 49 €/mes desde el mes 7.
  - Destacados a 3 € (0,02 por perfil al mes) desde el mes 1, y postulación destacada a 1,99 € (4 por bolo cerrado) desde el mes 13.
- Perfiles al cierre de cada año: 1.200 → 5.000 → 15.000 → 32.000 → 55.000. Salas: 80 → 400 → 1.200 → 2.600 → 4.500.
- CAC: 40 € por cliente nuevo que contrata y 5 € por perfil.

**Resultados de hoy (escenario base, sin ronda):**

| Año | Ingresos | Margen de contribución |
|---|---|---|
| 1 | 18,5 k€ | −10,7 k€ |
| 2 | 267 k€ | 91 k€ (34 %) |
| 3 | 946 k€ | 376 k€ (40 %) |
| 4 | 2,38 M€ | 1,02 M€ (43 %) |
| 5 | 4,47 M€ | 1,96 M€ (44 %) |

- Margen de contribución = ingresos menos pagos, garantía y lo que cuesta captar a cada cliente.
- Una estructura fija de 25 k€/mes se cubre desde el mes 29; una de 50 k€/mes, desde el 37.
- **El 71 % de los ingresos del año 5 depende de que el bolo se pague dentro de la app.** Es lo más frágil del modelo.
- Sensibilidad: si captar un cliente cuesta 80 € y no 40 €, el margen del año 5 cae a 509 k€ y la estructura de 50 k€/mes no se cubre en 5 años.

## Las decisiones (responde TODAS, D1 a D10)
- **D1. Bares y salas que repiten.** Elige una:
  - (a) la de hoy: 10 %, y 5 % desde la 3.ª vez;
  - (b) Treatwell: 10 % solo la primera vez con cada artista, 0 % al repetir, y se gana con el Plan Sala;
  - (c) Upwork: una cuota única para «pasar a directo»;
  - (d) solo suscripción, sin comisión;
  - (e) otra.
  Da los números.
- **D2. Bodas y particulares.** ¿Quién paga la comisión (el cliente, el músico o a medias) y cuánto? ¿Qué garantía exacta se da (sustituto, devolución, plazo) y cuánto cuesta cubrirla?
- **D3. Esconder el contacto en el chat** (ya decidido que sí). ¿Hasta cuándo: hasta aceptar una propuesta, hasta pagar dentro, o nunca? ¿Excepciones en el Mercado? ¿Qué se hace con quien insiste?
- **D4. Músicos y técnicos.**
  - ¿Pro sí o no? Precio y qué incluye.
  - ¿El Pro debe bajar la comisión que pagan sus clientes?
  - ¿Cancionero Pro aparte o dentro del Pro? Precio, mensual o anual, y qué es gratis y qué de pago.
- **D5. Plan Sala.** Precio y escalones, qué incluye, y cuántos bolos al mes son gratis.
- **D6. Mercado y tiendas.** Precio de los destacados, protección al comprador (%), comisión de venta sí o no, plan de tienda.
- **D7. Lo demás.** ¿Cuáles sí, cuáles no y cuándo?
  - anuncios marcados «Promocionado»;
  - «Destacado en bodas» para músicos (al estilo Bodas.net);
  - pago por contacto (Thumbtack, Bark);
  - afiliados (Thomann);
  - seguro por bolo;
  - entradas para salas pequeñas.
- **D8. Orden y disparadores.** Qué se cobra el día 1, y con qué número exacto se enciende cada cobro (contrataciones al mes, salas activas, perfiles…).
- **D9. Métricas.** Qué medir desde ya, y qué valor de cada una dice «seguimos» o «cambiamos».
- **D10. Previsiones para el inversor.**
  - ¿Qué mezcla de ingresos presentar (comisión, suscripciones, anuncios y destacados)?
  - ¿Qué escenario como base?
  - ¿Qué hipótesis del modelo son demasiado optimistas o pesimistas? Corrígelas con un número.

## Formato de tu respuesta (en español, máximo unas 1.300 palabras)
```
## Veredicto en 3 líneas
## Decisiones
D1 … (la decisión concreta, por qué en 2-3 frases, el número o precio, confianza alta/media/baja)
…
D10 …
## Lo que cambiaría del plan actual (máx. 5)
## Riesgos principales (máx. 3) y cómo vigilarlos
## Números que he calculado (si aplica: qué corriste y qué salió)
```

## Reglas
- **No cambies ningún archivo del repositorio** (`/home/user/musikeeo`). No hagas commit ni push. No toques Firebase.
- Tus scripts y notas van en tu carpeta: `/tmp/claude-0/-home-user-musikeeo/0a27ca47-7998-5168-80df-8fe7bcc8b9ed/scratchpad/consejo/<tu-id>/`. Para variar el modelo, copia `modelo_financiero.py` ahí y cámbialo en la copia.
- Guarda tu informe final también en `<tu carpeta>/informe.md`, y devuélvelo entero como respuesta final.
- Puedes buscar en la web (WebSearch) si te falta un dato; WebFetch falla con algunas webs.
