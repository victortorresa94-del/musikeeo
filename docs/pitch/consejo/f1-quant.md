# f1-quant · Matemático aplicado y modelador de marketplaces

## Veredicto en 3 líneas
El modelo de hoy solo sale rentable con sus hipótesis optimistas. Con mis priores, la mediana del margen del año 5 es de 57 k€, y en el 46 % de las tiradas sale negativo.
En mi base, la comisión neta (1,30 M€) solo paga captar a quien contrata (1,30 M€). El beneficio sale del Plan Sala, del Destacado en bodas, del Pro con Cancionero y del Mercado.
Con Treatwell en bares, las bodas al 12 % y esas líneas, la mediana da 3,3 M€ de ingresos y 1,1 M€ de margen, con 25 k€/mes cubiertos en el mes 36. Hoy, en la mediana, no se cubren nunca.

## Decisiones
**D1 · (e): Treatwell con coste de cobro.**
- Quien contrata paga el 10 % la primera vez con cada artista.
- Al repetir, 0 % de comisión; si se paga dentro, un 2,5 % de «coste de cobro» (con un 0 % puro, Musikeeo pagaría un ~2,4 % de Stripe en cada bar).
- Plan Sala obligatorio desde el 4.º bolo al mes.

La (b) sola pierde (1,49 M€ de margen frente a 1,96 M€). Con el Plan Sala al 25 % y 45 € empata con la (a) si el **56–58 %** de las primeras contrataciones se paga dentro (al 20 %: 67–69 %; al 12 %: 87–90 %). Gana en el 87–92 % de las tiradas (+130–180 k€). Confianza media-alta.

**D2 · Bodas: 12 % que paga el cliente, dentro del precio total; el músico, 0 %.** Una boda no repite, así que su comisión tiene que pagar su captación. Una boda de 900 € deja:
- con el 10 %, 62,5 € netos, y con un CAC de 55 € necesita que el 84 % se pague dentro;
- con el 12 %, 80 €, y le basta el 65 %.

La competencia cobra más: GigSalad, un 10–12 % al cliente y un 2,5–5 % al artista; Encore, un 20 %.

Garantía:
- Si el artista falla, sustituto del mismo formato e igual o mejor valoración en 48 h (6 h si faltan menos de 7 días). Musikeeo paga hasta +30 % de diferencia.
- Si no hay sustituto, se devuelve el 100 % en 5 días hábiles.
- Señal del 30 % al reservar y el resto 14 días antes; el músico cobra 48 h después del bolo.
- El que cancela con menos de 30 días paga el 15 % de su caché.

Coste: 0,66 % del caché, así que el fondo pasa al 0,8 %. Si el pagado dentro cae más de 18 puntos, se vuelve al 10 %. Confianza media.

**D3 · Contacto escondido hasta el primer pago dentro con esa persona**, no hasta aceptar: entre aceptar y pagar se escapa el trato. Después, libre para siempre con esa persona.
- Mercado: contacto libre desde la primera respuesta.
- Quien insiste: 3 intentos en 30 días, y baja en Explorar 30 días. Si cierra fuera tras una propuesta aceptada, esas reseñas no cuentan; a la segunda, suspensión.
- Más premio que castigo: solo los bolos pagados dentro dan reseñas y cobro en 48 h.

Confianza media.

**D4 · Pro sí: 9,99 €/mes o 79 €/año, con el Cancionero Pro dentro.** Incluye visibilidad, estadísticas, dossier y rider en PDF, Rodrigo sin límite y facturas. **No debe bajar la comisión de sus clientes:** con 5 puntos menos se pierden 282–657 k€ de comisión frente a 167 k€ de Pro, porque los Pro llevan el 15–35 % del volumen.

Cancionero gratis: todo en un dispositivo y 3 audios al mes para sacar acordes. Cancionero Pro aparte, a 2,99 €/mes o 24,99 €/año (Ultimate Guitar Pro: 39,99 €): nube, repertorios con la banda y audios sin límite. Anual por defecto. Confianza media.

**D5 · Plan Sala.** Gratis hasta 3 bolos al mes.
- Bar: 39 €/mes, hasta 12 bolos.
- Sala: 69 €/mes, sin límite y 3 usuarios.
- Grupo: 149 €/mes, varios locales.

Media: 59 €. Incluye agenda, contratos, una factura al mes y pago a los músicos. Espero que lo pague el 25 % de las salas (el 20–25 % hace 4 bolos o más al mes). CeolConnect cobra 159–499 €/mes. Confianza media.

**D6 · Mercado y tiendas.**
- Destacado: 2,99 € (7 días) o 6,99 € (30 días).
- Protección al comprador: 5 % + 0,70 € que paga el comprador, cuando haya Stripe.
- Comisión de venta: no.
- Tiendas: 49 o 99 €.

Confianza alta.

**D7 · Lo demás.**
- Sí:
  - Destacado en bodas: 39 €/mes por provincia, como mucho 5 por formato (396 k€ en el año 5).
  - Promocionado: desde 20.000 usuarios activos.
  - Seguro con aseguradora: desde 300 bolos pagados al mes.
  - Afiliados de Thomann: con 500 visitas al día.
- No: el pago por contacto (choca con la comisión) ni las entradas (hasta el año 4).

**D8 · Orden y disparadores.** Día 1: solo destacados del Mercado. Después (entre paréntesis, el mes en que mi trayectoria llega):
- Reserva protegida: 30 propuestas aceptadas al mes, 2 meses seguidos (mes 5–7).
- Pro: 100 contrataciones al mes (mes 10).
- Plan Sala: 40 salas activas, 15 de ellas con 4 bolos o más (mes 11–13).
- Destacado en bodas: 100 solicitudes de boda al mes.
- Cancionero Pro: 2.000 usuarios activos y retención del 25 % a los 30 días.
- Tiendas: 1.000 anuncios.
- Postulación destacada: 8 postulaciones por bolo.

**D9 · Métricas (seguimos / cambiamos).**
- Comisión neta menos CAC por cohorte: ≥0 / negativa 3 meses.
- CAC por boda pagada: ≤50 € / >70 €.
- Bodas pagadas dentro: ≥70 % / <60 %.
- Primeras contrataciones de bares pagadas dentro: ≥65 % / <55 %.
- Bolos de bar que son la 1.ª vez con ese artista: ≥30 % / <20 %.
- Plan Sala entre salas con 4 bolos o más: ≥50 % / <30 %.
- Propuestas aceptadas y no pagadas: ≤20 % / >35 %.

**D10 · Para el inversor.** Mezcla del año 5: 53 % comisión, 22 % suscripciones y 25 % visibilidad y Mercado (hoy: 71/12/17).

**Base = mi corrección (≈P50):**

| | A1 | A2 | A3 | A4 | A5 |
|---|---|---|---|---|---|
| Ingresos | 12 k€ | 187 k€ | 733 k€ | 1,83 M€ | 3,44 M€ |
| Margen | −11 k€ | 51 k€ | 276 k€ | 745 k€ | 1,43 M€ (42 %) |

Cubre 25 k€/mes desde el mes 32 y 50 k€ desde el 40. El base de hoy pasa a ser el ambicioso, y el P10 (1,95 / 0,31 M€), el conservador.

Hipótesis demasiado optimistas:
- Contrataciones del año 5: de 9.500 a 6.200 al mes. GigPig ronda los 3.300 al mes.
- Ticket: de 558 a 474 € (música de boda en Barcelona: 748 €).
- CAC: de 40 a 55 €.
- Stripe: del 1,8 % al 2,05 %.
- Postulación destacada: de 4 a 1 por bolo. Hoy es el 16 % del año 5.
- Garantía: del 0,5 % al 0,8 % en bodas.

Hipótesis pesimistas: el 5 % de repetidor aplicado a bodas (resta 180 k€) y el Cancionero sin cobrar.

## Lo que cambiaría del plan actual
1. Bares y salas a Treatwell, con un 2,5 % de cobro al repetir y el Plan Sala obligatorio.
2. Bodas al 12 %.
3. En el modelo, 1 postulación destacada por bolo.
4. Captar bodas con fincas y wedding planners al 3 % solo si se paga: +297 k€ de margen y 25 k€/mes desde el mes 30.
5. Destacado en bodas, Cancionero Pro y protección del Mercado: líneas que no dependen de pagar dentro.

## Riesgos principales y cómo vigilarlos
1. **El CAC de bodas.** Explica el 46–69 % de la varianza del margen. Vigilar la comisión neta menos el CAC por cohorte.
2. **El volumen.** Explica el 42–73 % de la varianza; con un CAC malo, crecer no ayuda. Vigilar 100 contrataciones al mes en el mes 10 y 300 en el 18.
3. **Que no se vendan las suscripciones.** Vigilar el Plan Sala y el Destacado en bodas a los 6 meses.

## Números que he calculado
Repliqué el modelo exacto. Monte Carlo de 5.000 tiradas:

| | Ingresos A5 (P10/P50/P90) | Margen A5 | Mes 25 k€ |
|---|---|---|---|
| Hoy, centrado | 2,31 / 4,00 / 7,03 M€ | 0,54 / 1,51 / 3,13 | 25 / 32 / 45 |
| Hoy, mis priores | 1,16 / 1,99 / 3,51 | −0,89 / 0,06 / 0,72 | 41 / nunca / nunca |
| Mi plan, mis priores | 1,95 / 3,27 / 5,69 | 0,31 / 1,12 / 2,33 | 27 / 36 / 55 |

Las 3 variables que más pesan en el margen: el CAC (31–69 %), el volumen (42 %) y el % pagado dentro (6–8 %; con mi plan, el 1 %).

Con 0 % pagado dentro:
- **Hoy:** quedan 1,27 M€ (29 %) y el margen es de −297 k€.
- **Con mi plan:** quedan 1,61 M€ (47 %) y el margen es de +130 k€.

El tope del 50 % no se cumple del todo: en mi base la comisión es el 53 % de los ingresos, y con el Plan Sala al 35 % baja al 50,9 %. No la fuerzo más: volver al 10 % en bodas la deja en el 51 % pero cuesta 170 k€ de margen. Además, lo que importa es el margen, y ese no depende de la comisión: la comisión neta menos el CAC da +3 k€.

Fuentes: Stripe ([Quipu](https://getquipu.com/blog/comisiones-stripe/), [Sharetribe](https://sharetribe.com/help/en/articles/8803821-stripe-s-processing-fees)); lo demás, de `investigacion.md` y `REFERENCIAS-MONETIZACION.md`.
