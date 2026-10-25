# v5-diablo · Abogado del diablo (pre-mortem)

## Veredicto en 3 líneas
Musikeeo no cierra en 2029 por cobrar poco. Cierra porque ningún mercado de Barcelona llega a tener bastante gente, porque cada boda captada con anuncios cuesta más de lo que deja (en el modelo de hoy, una boda deja **2,6 €** después de captarla), y porque el **36 % del margen del año 5** sale de «4 postulaciones destacadas por bolo» que nadie va a pagar.
Propuesta: cobrar solo cuando hay un cliente nuevo y un caché alto (eventos de 300 € o más), que los bares repitan gratis, 90 días con un solo objetivo en Barcelona, y enseñar al inversor el escenario conservador corregido.
La rentabilidad depende de una sola cifra: captar a cada cliente nuevo por **40 € o menos**.

## Pre-mortem: por qué cerró en octubre de 2029
| # | Causa (prob.) | Señal temprana | Decisión de hoy que la evita |
|---|---|---|---|
| 1 | **Pueblo fantasma por dispersión (30 %).** Un fundador, que además lleva Aether Labs, con 7 productos: Explorar, Bolos, Mercado, Feed con algoritmo, chat, Rodrigo y Cancionero (con acordes sacados de audio). El 15-oct se lanzaba «en 3 días». El 25-oct `posts` sigue dando permiso denegado en producción, y en esos días se hicieron un modelo oculto de Markov, MiroFish y agentes simulados | Menos de 15 propuestas aceptadas al mes a los 3 meses del lanzamiento; menos del 50 % de los bolos con 3 o más postulaciones en 72 h; tareas de operación abiertas más de 7 días | Congelar 90 días Feed, agentes, Mercado y funciones nuevas de Rodrigo y del Cancionero. Una sola métrica: **propuestas aceptadas por semana en Barcelona**. Desplegar las reglas hoy |
| 2 | **La demanda cuesta más de lo que deja (25 %).** Con el 10 % y el 75 % pagado dentro, una boda aguanta un CAC de **43 €** como máximo. Captar parejas con Meta o Google contra Bodas.net, cuyo dueño, The Knot Worldwide, compra Zola ([The Star/Reuters, 15-oct-2026](https://www.thestar.com.my/tech/tech-news/2026/10/15/the-knot-worldwide-to-acquire-zola-in-wedding-platform-union-sources-say)), cuesta bastante más (hipótesis: 80–150 €) | El CAC por boda contratada en la primera prueba de 1.000 € pasa de 50 € | No comprar parejas con anuncios. La demanda llega por los músicos (que traen a sus clientes) y por 10 fincas y wedding planners de Barcelona. CAC objetivo: 30 € o menos |
| 3 | **La comisión no se cobra (20 %).** El bar y la banda se conocen en persona en el primer bolo. El perfil enseña el nombre de la banda, y con él se la encuentra en Instagram (`fuga.ts` no tapa «@usuario» ni «insta»). La mayoría de los músicos gana unos 7.000 €/año y el 35 % trabaja sin contrato (investigacion.md). Pagar dentro significa que Hacienda recibe sus ingresos por DAC7 (modelo 238, [Pérez-Llorca](https://perezllorca.com/wp-content/uploads/2024/02/Nota-Juridica-Aprobado-el-desarrollo-reglamentario-de-la-transposicion-de-la-DAC-7-y-los-modelos-040-y-238.pdf)) | Menos del 25 % de las propuestas aceptadas se pagan dentro en los 3 primeros meses de la Reserva protegida; menos del 40 % de los músicos activos con alta o NIF | No basar la previsión en el 75 %. Bares sin comisión al repetir. Reserva protegida solo para eventos |
| 4 | **La promesa legal y operativa revienta (15 %).** «Sustituto garantizado» un sábado de julio sin banquillo de sustitutos. «Factura hecha» para quien no es autónomo: el RD 607/2026 entra en vigor el 25-may-2027 ([BOE-A-2026-16173](https://www.boe.es/boe/dias/2026/07/25/pdfs/BOE-A-2026-16173.pdf)), justo cuando se encenderían los pagos. Precedente: Inspección desclasificó la cooperativa de facturación Factoo ([El Salto](https://www.elsaltodiario.com/laboral/caso-factoo-pagar-por-ser-precario)) | La primera boda sin sustituto; un asesor laboralista que no firma el flujo | Prometer sustituto solo en estilos con 10 o más grupos disponibles (en el resto, solo devolución). Dictamen laboral y fiscal antes de Stripe |
| 5 | **Modelo inflado y la seed no llega (10 %).** La base pide 9.500 bolos al mes en el año 5, 2,9 veces el ritmo de GigPig (unos 3.300 al mes con una seed de 1,3 M£). Si no llega la seed de 1,5 M€ del mes 20, **la caja se acaba en el mes 29 (conservador) o en el 32 (base)**: octubre de 2029 | 450 bolos al mes en el mes 24 en lugar de 900 | Presentar el escenario conservador corregido (D10) y no prometer hitos que dependen de la seed |

## Dónde fallan las opciones «bonitas»
- **Treatwell (D1 b).** Treatwell cobra un **25 %** la primera vez, no un 10 %, y vende la agenda que la peluquería usa todo el día. Un bar programa 4–8 bolos al mes y le basta con WhatsApp y Google Calendar. El Plan Sala no compensará al 12–20 %: yo pondría un 5 %. Aun así, gana a la (a), porque la (a) cobra un 5 % por repeticiones que igualmente se harán fuera. Con fugas realistas, la diferencia entre (a) y (b) es de **unos 100 k€ en el año 5 (4–5 % de los ingresos)**: no es la decisión importante.
- **Cancionero Pro.** Si lo usa el 30 % de los perfiles y paga el 5 % a 30 €/año, da **20 k€ en el año 5 (0,9 % de los ingresos)**. La competencia marca el precio: UG Pro, 39,99 €/año con ofertas de hasta un −80 %; OnSong, 29,99 $/año ([OnSong](https://4.onsongapp.com/pricing/group)). Además, cobrar por compartir letras con la banda es distribuir obra protegida. Como entrada gratuita de músicos vale oro; como producto de pago, se come horas del fundador.
- **Esconder teléfonos.** Es poroso: el nombre de la banda, Instagram y el primer bolo en persona. Castigar sin dar nada a cambio dobla las fugas (Platform Chronicles), y cuanta más confianza hay, más fugas (Gu y Zhu). Sirve solo como empujón hacia la propuesta, no como muro.

## Decisiones
**D1.** **(b), con matices:** 10 % + IVA para el local, solo la 1.ª vez con cada artista (mínimo 15 €). Repetir: 0 %, y se apunta en la app gratis (agenda, factura y reseña). En el modelo no se usa el Plan Sala para compensar. Confianza: media.

**D2.** Paga el **cliente un 10 % + IVA**. En pantalla sale como «12,1 % de gestión y garantía, IVA incluido», porque a un consumidor hay que enseñarle el precio final (TRLGDCU). Mínimo, 49 €. El **músico paga un 0 % el año 1**. Desde el mes 13 paga un **5 % solo si el cliente se lo trajo Musikeeo** y el bolo es de 300 € o más (0 % con Pro). A 10 % + IVA, una boda aguanta un CAC de 34 €; con el 5 % del músico, de 62 €.
**Garantía:** si el artista cancela a menos de 30 días del bolo o no aparece, se ofrece un sustituto de igual nivel que el cliente acepte, o se devuelve el 100 % (caché y gestión) en 5 días hábiles. Tope: 3.000 € por bolo. El sustituto solo se promete donde hay banquillo.
**Coste:** un 1,5 % del volumen de bodas pagado dentro, unos 13,5 € por boda (hipótesis: 1 incidencia cada 100 bodas × 120 % del caché + 0,3 % de contracargos). Confianza: media.

**D3.** Se esconde **hasta aceptar la propuesta** (como ya hace `fuga.ts`), no hasta pagar: el día del bolo hace falta WhatsApp. **Mercado: no se esconde nunca.**
Con quien insiste: el año 1 no se castiga. Al 3.er intento en el mismo chat sale la tarjeta «Envía la propuesta». Si el mismo número aparece en 5 o más chats en 7 días, se revisa a mano. Con la Reserva protegida, lo que se cierra fuera no suma reseñas.
Revisión en el mes 6: si menos del 20 % de los chats con el contacto tapado acaba en propuesta, se deja solo el aviso. Confianza: alta.

**D4.** **Pro sí**, cuando haya 150 propuestas aceptadas al mes (hacia el mes 13): **7,99 €/mes o 69 €/año**. Incluye:
- 0 % de comisión al músico;
- cobrar a sus propios clientes con factura (solo paga el coste del cobro, un 2,5 %);
- estadísticas y dossier o rider en PDF;
- Cancionero en la nube y compartido con la banda.

El Pro **no baja la comisión del cliente**: una banda con 10 bodas al año de Musikeeo genera unos 900 € de comisión de clientes frente a 69 € de Pro.
**Cancionero:** dentro del Pro, sin plan aparte. Gratis para siempre: todo en el móvil, modo escenario, pedal, imprimir y 3 audios al mes. Con Pro: la nube, compartir con la banda (acordes y orden; la letra no, por derechos) y audios sin límite. Confianza: media.

**D5.** Gratis hasta 4 bolos publicados al mes. **Sala: 29 €/mes + IVA** (bolos ilimitados, agenda de temporada, 3 usuarios, facturas agrupadas y prioridad en sustitutos urgentes). **Grupo o agencia: 79 €/mes** (hasta 5 locales). Se enciende con 30 salas que publiquen 2 o más bolos al mes durante 3 meses. En el modelo, un 5 % de conversión. Confianza: baja.

**D6.**
- Destacado: 1,99 € (3 días) o 4,99 € (7 días), desde ya.
- Comisión de venta: no.
- Protección al comprador: 5 % + 0,70 €, la paga el comprador, solo con envíos y 200 o más ventas al mes.
- Plan de tienda: **39 €/mes**, con 300 anuncios activos en Barcelona.
- 0 horas de desarrollo en el Mercado durante 6 meses.

Confianza: media.

**D7.**
- **Afiliados de Thomann:** sí, ya. Esperar menos de 1.000 €/año (piden 500 visitas al día).
- **«Destacado en bodas»:** a 19 €/mes, solo cuando haya 1.000 búsquedas de boda al mes en Barcelona.
- **Promocionado:** solo con 50.000 usuarios activos al mes.
- **Pago por contacto:** nunca (se cobraría dos veces y quema a los músicos).
- **Seguro por bolo:** no como producto propio; un enlace a un socio en el año 2.
- **Entradas:** no (Sofar ganaba 176 $ por concierto).

Confianza: alta.

**D8.** **Día 1:** solo destacados del Mercado y afiliados. Cada cobro se enciende con un número:

| Cobro | Se enciende cuando… |
|---|---|
| Reserva protegida opcional para eventos | 40 o más propuestas aceptadas al mes durante 2 meses + dictamen laboral y fiscal |
| Comisión obligatoria en los clientes que trae Musikeeo | el 35 % o más elige pagar dentro sin estar obligado (con menos del 20 %: se pasa a un modelo de visibilidad) |
| 5 % al músico + Pro | 150 propuestas aceptadas al mes |
| Plan Sala | lo de D5 |
| Tiendas | lo de D6 |

Confianza: media.

**D9.** Seguimos si se cumple; cambiamos si cae por debajo del umbral.

| Métrica | Seguimos | Cambiamos |
|---|---|---|
| Propuestas aceptadas al mes en Barcelona, a los 6 meses | 40 o más | menos de 15 |
| Bolos con 3 o más postulaciones en 72 h | 60 % o más | menos del 30 % |
| CAC por cliente nuevo contratado | 40 € o menos | más de 80 € (se paran los anuncios) |
| Pagado dentro en eventos | 40 % o más | menos del 20 % |
| Salas que vuelven a publicar en 60 días | 50 % o más | — |
| Usuarios del Cancionero que siguen a las 4 semanas | 25 % o más | — |
| Horas del fundador en captar gente y operar | 60 % o más | — |

Confianza: alta.

**D10.**
- **Escenario base que se enseña:** el **conservador corregido**.
- **Mezcla que se enseña:** comisión ~80 %, suscripciones ~15 %, destacados ~5 %.
- **Cifra que se enseña:** «rentable si el CAC es de 40 € o menos», con la prueba del piloto.

Correcciones al modelo:

| Hipótesis | Hoy | Corregida |
|---|---|---|
| Contrataciones al mes en el año 5 | 9.500 | 4.750 |
| Postulaciones destacadas por bolo cerrado | 4 | 0,5 |
| Pagado dentro | 75 % en todo | bodas 60 %; salas 50/30 %; bares 40/30 % (≈46 % del volumen) |
| Comisión a consumidores | 10 % sin IVA | 10 % + IVA, o dividir entre 1,21 |
| Plan Sala | 39 € y 12 % de conversión | 29 € y 5 % |
| Fondo de garantía en bodas | 0,5 % | 1,5 % |
| Atención al cliente | no está | 4 € por bolo pagado |
| Stripe | 1,8 % | +1,35 € fijos por bolo |
| Captar un perfil (pesimista hoy) | 5 € | 2 €, si el Cancionero trae músicos solos |

Resultado, con el CAC de un cliente a 40 € y el de un perfil a 5 €: año 5 con **1,53 M€ de ingresos y 286 k€ de margen (19 %)**. Cubre 10 k€ al mes desde el mes 41 y 25 k€ desde el 56. Con el perfil a 2 €, el margen sube a 321 k€ (21 %) y los 25 k€ se cubren desde el mes 54. Con un CAC de 60 € en bodas y salas, no se cubre nunca. Confianza: media.

## Lo que cambiaría del plan actual (máx. 5)
1. 90 días de foco: una ciudad, una métrica y 7 productos congelados en 2. Las reglas de Firestore, desplegadas hoy.
2. Se cobra solo por eventos de 300 € o más con un cliente nuevo. Los bares repiten gratis.
3. La demanda llega por los músicos y por fincas y planners, no por anuncios a parejas.
4. El músico paga un 5 % solo cuando Musikeeo le trae el cliente, y el Pro lo quita. El Pro nunca baja la comisión del cliente.
5. Fuera la postulación destacada como línea de ingresos y fuera el 10 % sin IVA a los consumidores.

## Riesgos principales (máx. 3) y cómo vigilarlos
1. **Dispersión:** propuestas aceptadas por semana, y % del tiempo del fundador en operación.
2. **CAC:** coste por cliente nuevo contratado, por segmento, cada mes. Si pasa de 40 € dos meses seguidos, se cambia de canal.
3. **Fugas y legalidad:** % pagado dentro por segmento y % de músicos con alta. Dictamen laboral antes del 25-may-2027.

## Números que he calculado
Scripts en `/tmp/claude-0/-home-user-musikeeo/0a27ca47-7998-5168-80df-8fe7bcc8b9ed/scratchpad/consejo/v5-diablo/` (`premortem.py`, `sens.py`, `propuesta.py`, `palancas.py`, `d10.py`). Mi copia por segmentos reproduce el modelo oficial: año 5 con 4,47 M€ de ingresos y 1,96 M€ de margen; cubre 25 k€/mes desde el mes 29 y 50 k€/mes desde el 37.

**Margen por bolo en el modelo oficial:**

| Bolo | Margen tras captarlo | CAC máximo para no perder |
|---|---|---|
| Boda | +2,6 € | 43 € |
| Bar | +5,3 € | — |
| Sala o empresa | +35 € | 181 € |

**De dónde sale el margen del año 5 (oficial):** la comisión, menos el cobro y la captación, deja 806 k€; el resto deja 1.158 k€. Solo la postulación destacada son **715 k€**: el 16 % de los ingresos y el 36 % del margen.

**Un cambio cada vez sobre el modelo oficial:**

| Cambio | Margen del año 5 | Cubre 25 k€ / 50 k€ al mes desde el mes |
|---|---|---|
| Postulación 0,5 por bolo | 1,34 M€ | 34 / 41 |
| IVA dentro del 10 % en bodas | 1,70 M€ | — |
| Atención de 6 € por bolo | 1,56 M€ | — |
| Pagado dentro por segmento | 1,01 M€ | 37 / 46 |
| CAC 80/50/60 | 0,80 M€ | 39 / 49 |
| CAC 150/60/80 | −1,14 M€ | nunca |

**Sin la seed:** la caja se acaba en el mes 29 (conservador) o en el 32 (base).

**CAC máximo para no perder dinero en el año 5:**
- modelo oficial: 92 €;
- mi propuesta con 10 % + IVA: 30 €;
- con el 5 % del músico: 54 €.

**Equivalencia del volumen base:** 26.952 bodas y particulares en el año 5 equivalen al 18 % de las bodas con música de España (INE: 175.364 bodas; el 87 % contrata DJ).

**Stripe:** 1,5 % + 0,25 € por tarjeta del Espacio Económico Europeo ([Quipu](https://getquipu.com/blog/comisiones-stripe/)). Connect: 2 € por cuenta activa y 0,25 % + 0,10 € por pago, según [Sharetribe (ene-2024)](https://sharetribe.com/help/en/articles/8803821-stripe-s-processing-fees); para España no lo he podido confirmar.
