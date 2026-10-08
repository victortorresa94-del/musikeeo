# Musikeeo — Cómo gana dinero

> 8 de octubre de 2026. Complementa a `docs/LANZAMIENTO.md`.

## La idea en una frase

Cobrar una comisión por cada contratación que se **paga dentro de Musikeeo**, y conseguir que pagar dentro sea **mejor para las dos partes** que pagar por fuera. No se puede impedir que la gente se pase el WhatsApp; se puede hacer que no les compense.

## 1. Por qué la gente se va por fuera (y cómo evitarlo)

Todas las plataformas de este tipo (Airbnb, Fiverr, Wallapop, Thumbtack) lo sufren. Lo que funciona no es prohibir, es dar algo que solo existe si se paga dentro:

| Para el músico | Para quien contrata |
|---|---|
| **Cobro garantizado.** El dinero está retenido antes del bolo; nada de «te pago la semana que viene» ni de salas que pagan a 90 días | **Garantía de bolo.** Si el artista no se presenta, se devuelve el dinero y Rodrigo busca un sustituto |
| **Factura hecha.** Musikeeo prepara la factura con su IVA y su retención (o la hace un socio tipo cooperativa de artistas para quien no es autónomo) | **Factura legal** sin perseguir a nadie |
| **Reseñas que cuentan.** Solo las contrataciones pagadas dentro suman reseñas y suben en Explorar | **Reseñas verificadas**: sabes que ese bolo pasó de verdad |
| Agenda y recordatorios automáticos | Todo el historial en un sitio (contrato, rider, chat, pago) |

### Mecánicas concretas en la app

1. **Datos de contacto ocultos hasta reservar.** En perfiles de artistas y en bolos no se enseña teléfono, email ni WhatsApp. Se habla por el chat de Musikeeo. Al confirmar la reserva, se desbloquean.
2. **Aviso suave en el chat.** Si alguien escribe un número de teléfono, un email o la palabra «WhatsApp» antes de reservar, sale un aviso: «Si cerráis el trato por fuera perdéis la garantía de cobro y de bolo». No se bloquea; se avisa.
3. **Botón «Reservar» dentro del chat.** El músico envía una propuesta (fecha, sitio, precio, horas) y el otro la acepta y paga en dos toques. Si reservar es más fácil que pasarse el número, se reserva dentro.
4. **El Mercado se queda como está** (WhatsApp permitido). En la compraventa de segunda mano la comisión casi nunca funciona; ahí se gana con anuncios destacados y tiendas (punto 3).

## 2. La comisión

**Propuesta: 10 % que paga quien contrata**, como «gastos de gestión y garantía». El músico recibe el 100 % de su caché.

- Por qué al que contrata: el músico es el que más fácilmente se va por fuera y el que más necesitas al principio. Una sala o unos novios que pagan 1.500 € aceptan 150 € a cambio de la garantía; un músico que ve que le quitan 150 € no vuelve.
- Bolo de boda de 1.500 € → el cliente paga 1.650 €. Musikeeo ingresa 150 €. Stripe se lleva aproximadamente un 1,5–2 % más las comisiones de Connect (hay que confirmarlo en la tarifa vigente de Stripe para España), unos 25–35 €. Quedan unos 115–125 €.
- **Clientes que repiten**: una sala que ya conoce a la banda tiende a contratarla por fuera. Para retenerla, bájale la comisión (5 % desde la tercera reserva con el mismo artista) y dale herramientas de sala (punto 3).

### Cómo se cobra técnicamente

- **Stripe Connect** (cuentas «Express» para músicos y técnicos). El dinero lo custodia Stripe, no Musikeeo, así que no hace falta licencia de entidad de pago.
- Flujo: el cliente paga al reservar → Stripe retiene → 24–48 h después del bolo se transfiere al artista, y Musikeeo se queda su parte.
- Cancelaciones: política simple y fija (por ejemplo, devolución completa hasta 30 días antes, 50 % hasta 7 días, nada después). Que la elija el artista entre 2–3 opciones, como en Airbnb.
- Lo fiscal (IVA cultural del 10 %, retención del 15 % cuando paga una empresa a un autónomo, músicos sin alta) se tiene que revisar con un asesor antes de activar pagos. Es justo lo que da valor: si Musikeeo lo resuelve, nadie quiere hacerlo por fuera.

## 3. Otras fuentes de ingreso

| Producto | Para quién | Precio orientativo | Cuándo |
|---|---|---|---|
| **Musikeeo Pro** | Músicos y técnicos | 7–9 €/mes | Cuando haya demanda real (gente contratando) |
| | Sale primero en Explorar, estadísticas de visitas, dossier/rider en PDF, Rodrigo sin límite, insignia Pro | | |
| **Plan Sala** | Salas, bares, promotores, agencias de bodas | 29–49 €/mes | Con 10–20 salas activas |
| | Bolos ilimitados, agenda de la temporada, varias personas en la cuenta, facturas agrupadas, comisión reducida | | |
| **Anuncio destacado** | Mercado | 1,99–4,99 € por anuncio | Desde el principio (es fácil) |
| **Tiendas** | Tiendas de instrumentos y alquiler | 29–79 €/mes | Cuando el Mercado tenga tráfico |
| | Catálogo, ficha de tienda verificada, contactos de clientes | | |
| **Alquiler con fianza** | Alquiler de equipo entre usuarios | 10 % del alquiler | Fase 2, con Stripe ya montado |

Más adelante: seguro por bolo, venta de entradas para salas pequeñas, financiación de equipo con tiendas.

## 4. En qué orden

1. **Lanzamiento (ahora): gratis y sin comisión.** Lo único que importa es que haya artistas, bolos y gente contratando en Barcelona. Cobrar antes de eso mata el mercado.
   Lo que sí se hace ya: contacto solo por el chat en artistas y bolos (no enseñar WhatsApp ahí) y anuncios destacados en el Mercado.
2. **Cuando haya unas 30–50 contrataciones al mes por el chat:** activar «Reserva protegida» con Stripe Connect, opcional y con el 10 % al cliente. Medir qué porcentaje elige pagar dentro.
3. **Cuando la reserva protegida funcione:** Plan Sala y Musikeeo Pro.
4. **Después:** tiendas, alquiler con fianza, seguros.

## 5. Qué hay que cambiar en la app para prepararlo (sin cobrar todavía)

- Quitar el WhatsApp de los perfiles de artista y de los bolos (dejarlo en el Mercado).
- Aviso en el chat cuando se comparte un teléfono o email.
- Propuesta de bolo dentro del chat (fecha, sitio, precio) aunque de momento no tenga pago: así se mide cuántas contrataciones hay y se tiene el flujo listo para enchufar Stripe.
- Reseñas solo tras una propuesta aceptada.
