# Cómo cobra Musikeeo: decisiones del consejo

> 25 de octubre de 2026.
> - **Quién opinó:** 10 expertos (agentes de IA, cada uno por su lado):
>   - 5 de finanzas, matemáticas y monetización: matemático, precios, economista de plataformas, director financiero y jefe de monetización;
>   - 5 de viabilidad: socio de fondo, fundador de un marketplace de músicos en España, abogado fiscal y laboral, estratega de arranque y abogado del diablo.
> - **Quién decidió:** Claude, como presidente, tras leer los 10 informes.
> - **Dónde está cada cosa:** el encargo y los informes, en `docs/pitch/consejo/`; las referencias de otras plataformas, en `docs/REFERENCIAS-MONETIZACION.md`.
> - **Validez:** donde contradiga a `docs/MONETIZACION.md`, manda este documento.

## En una frase

**Cobramos el primer encuentro y la herramienta de cada día, nunca la repetición.**
- La comisión de la primera contratación paga lo que cuesta conseguir al cliente.
- El margen sale de los locales (la primera vez y el Plan Sala), de las tiendas y de la visibilidad.

## Lo que encontró el consejo

1. **El modelo de hoy estaba inflado.**
   - **Postulación destacada:**
     - la línea «4 postulaciones destacadas por bolo» daba 715 k€ en el año 5, el 16 % de los ingresos y el 36 % del margen;
     - es cobrar a quien busca trabajo, y en bares y salas se parece a una agencia de colocación, que no puede cobrar al trabajador;
     - **sale del modelo y del producto** (10 de 10).
   - **Volumen:** 9.500 contrataciones al mes en el año 5 serían el 15 % de todas las bodas con música de España. Como referencia, GigPig (Reino Unido) hace unos 5.000 bolos al mes con 3.000 locales: 60.000 en 2025 según BusinessCloud.
2. **Lo que decide si es rentable es lo que cuesta conseguir unos novios.**
   - Una boda no repite: su comisión tiene que pagar su captación.
   - Cada 10 € más por pareja quitan unos 250 k€ al margen del año 5.
   - A 80–100 € por pareja, se pierde dinero con cualquier precio.
   - Explica entre el 30 y el 70 % de la incertidumbre del modelo (Monte Carlo de 5.000 tiradas).
   - **Tope: 50 € por pareja.** Se capta a través de fincas, wedding planners y los propios músicos, no con anuncios.
3. **Los bares no pagarán comisión por repetir.** Repiten cada semana, pagan en mano y ya tienen el teléfono: cobrarles cada bolo es lo que hundió a Homejoy. Ganar o perder ese cobro cambia menos del 5 % de los ingresos, pero pone en juego la mitad de los bolos.
4. **IVA.**
   - A un particular hay que enseñarle el precio final con IVA.
   - Un «10 % con IVA incluido» deja a Musikeeo un 8,3 %.
   - La parte del músico es suya y Musikeeo cobra en su nombre: si no, todo el caché tributaría al 21 %.
5. **Esconder el contacto funciona y es legal**, si:
   - lo hace el móvil;
   - no se guarda lo oculto;
   - se avisa a quien escribe;
   - cualquier medida contra alguien la revisa una persona.

   Según el modelo del economista, vale unos 445 k€ de ingresos en el año 5.

## Las decisiones

**D1 · Bares y salas.**
- **Comisión:** 10 % + IVA (mínimo 15 €) **solo la primera vez que un local contrata a un artista que encontró en Musikeeo**. Se cobra al local **al aceptar la propuesta**, aunque el caché vaya en mano.
- **Repetir con ese artista:** 0 %.
- **Pagar el caché por la app:** si el local quiere, paga un 2 % + IVA (lo que cuesta el cobro y la factura). Con Plan Sala va incluido.
- **Excepción:** si el cliente lo trae el propio músico, 0 %.
- **Votos:** 9 de 10 por cobrar solo la primera vez. El fundador prefería 0 % siempre en los bares.
- **Cómo se decidió:**
  - en bares la primera vez se cobra **barrio a barrio**, solo cuando el barrio ya funciona (D8);
  - si menos del 40 % de los bolos de bar llevan factura, los bares dejan de pagar comisión y solo pagan el Plan Sala.

**D2 · Bodas y particulares.**
- **Quién paga:** el cliente paga «gestión y garantía», metida en el precio final con IVA. **El músico cobra el 100 % de su caché.**
- **Cuánto:**
  - **lanzamiento:** 10 % + IVA (el cliente ve un 12,1 %) durante 6 meses, con fecha de fin anunciada. Al 10 % una boda deja 0 € si conseguir a la pareja cuesta 50 €: **mientras dure, no se pagan anuncios para captar novios**, solo fincas, planners y músicos;
  - **después:** **12 % + IVA** (14,5 %). No es opcional: con el 10 % las bodas no pagan su captación. Si la prueba A/B muestra que paga dentro 5 puntos menos, se compensa con fincas y planners, no bajando el precio;
  - mínimo 25 € y tope de 300 €.
- **Pagos:**
  - **señal del 30 % al reservar**, que funciona como arras: si cancelan los novios, la pierden; si cancela el artista, devuelve el doble;
  - la señal incluye toda la parte de Musikeeo;
  - el resto se cobra 30 días antes, porque Stripe solo retiene el dinero 90 días;
  - el músico cobra 48 h después del bolo si no hay queja.
- **Garantía:**
  - si el artista cancela o no aparece, un sustituto del mismo formato en 48 h, con Musikeeo pagando hasta un 30 % de diferencia (o hasta 300 €), o la devolución del 100 % en 5 días hábiles;
  - el sustituto solo se promete en estilos con banquillo; si no, devolución;
  - no se llama «seguro»;
  - fondo: 1 % del volumen de bodas.
- **Músico:** 0 % de comisión. Si en el mes 13 conseguir una pareja cuesta más de 50 €, se estudia un 5 % al músico solo cuando Musikeeo le trajo el cliente (lo proponían el socio de fondo y el abogado del diablo).

**D3 · Contacto escondido en el chat** (ya está en la app).
- **Regla única:** teléfonos, emails, @usuarios y enlaces a WhatsApp, Telegram, Instagram, Facebook, TikTok, X y Linktree se ocultan **hasta que Musikeeo cobra su parte**:
  - hoy, sin pagos: al aceptar la propuesta;
  - con la Reserva protegida: en bodas, al pagar la señal; en locales, al cobrar la primera vez.
- YouTube, Spotify y SoundCloud se ven siempre: enseñan la música.
- **Excepciones:** el Mercado sigue abierto; las tiendas con plan enseñan su teléfono; el Instagram del perfil se queda, porque es el portafolio. Se mide cuánta fuga va por ahí.
- **Quien insiste:**
  - el primer año no se castiga a nadie: se oculta y se avisa;
  - con la Reserva protegida, escalones:
    - al 3.er intento en 30 días, aviso por email;
    - al 5.º, 30 días sin destacados;
    - si se prueba que el trato se cerró fuera, ese bolo no da reseña y se suspenden los cobros;
  - **siempre lo decide una persona**, con los motivos por escrito;
  - a los novios no se les penaliza nunca.
- **Premio, no castigo:** solo los bolos de dentro dan reseña verificada, garantía y cobro en 48 h.

**D4 · Músicos y técnicos.**
- **Musikeeo Pro:** 7,99 €/mes o 69 €/año + IVA.
  - **Incluye:** facturas con IVA y retención hechas (también de bolos de fuera), estadísticas, dossier y rider en PDF, Rodrigo sin límite y Cancionero Pro.
  - **«Cobra a tus propios clientes»:** el cliente paga un 4 % (2 % si el músico es Pro), sin coste de captación para Musikeeo.
- **El Pro NO baja la comisión de los clientes que trae Musikeeo** (8 de 10): perdonaría cientos de euros a cambio de 69 €.
- **Pro Fundadores:** 300 plazas a 49 €/año para siempre, en preventa desde ya. Sirve para validar el precio con dinero de verdad.
- **Cancionero:**
  - **gratis para siempre:** lo que hoy es gratis (todo lo del móvil, modo escenario, pedal, la copia en tu cuenta) y sacar acordes de 3 audios al mes;
  - **Cancionero Pro:** 2,99 €/mes o 24,99 €/año, y también dentro de Musikeeo Pro. Incluye repertorios que edita toda la banda (leerlos es gratis), audios sin límite y PDF sin marca;
  - **es para atraer músicos, no para ganar dinero:** unos 20–35 k€ en el año 5;
  - **en la versión de pago**, las portadas de Apple van con «Escuchar en Apple Music» o se quitan, por sus condiciones.

**D5 · Plan Sala.**
- **Gratis:** hasta 3 bolos publicados al mes.
- **Local, 29 €/mes o 290 €/año + IVA:**
  - bolos ilimitados y agenda de la temporada;
  - **una sola factura al mes** con todos los artistas, cobrados por SEPA;
  - repetir sin coste;
  - «SOS sustituto» con prioridad;
  - cartel y story automáticos;
  - 3 usuarios;
  - **las altas de los músicos que no son autónomos, a través de una gestoría colaboradora.** Es lo que de verdad le quita el miedo a una inspección: multas de 3.750 a 12.000 € por trabajador.
- **Sala o promotor, 69 €/mes:** varios escenarios y 5 usuarios.
- **Grupo, 149 €/mes:** 3 o más locales.
- **Locales fundadores:** los 30 primeros, 12 meses gratis.
- **Objetivo:** que lo pague el 20 % de los locales activos.

**D6 · Mercado y tiendas.**
- **Destacar:** 1,99 € (3 días), 3,99 € (7) o 6,99 € (15), con la etiqueta «Destacado». Como mucho 1 de cada 6 resultados.
- **Comisión de venta:** ninguna. Ni Wallapop ni Vinted cobran al vendedor.
- **Protección al comprador:** 5 % + 0,70 € (tope de 25 €), la paga el comprador. **Solo con envío pagado por la app.**
- **Tiendas:** 49 €/mes con ficha verificada, teléfono y 10 destacados; Tienda Plus a 99 €/mes. Las 20 primeras, 3 meses gratis.
- **Desarrollo:** 0 horas en el Mercado durante los próximos 6 meses. No paga las cuentas: Wallapop vive del envío protegido, no de destacar.

**D7 · Lo demás.**
- **Sí:**
  - **«Destacado en bodas»:** 29 €/mes o 199 € la temporada; como mucho 5 por formato y provincia, marcados. Es dinero que no depende de cobrar dentro, y bodas no es relación laboral, así que es legal cobrar visibilidad al músico.
  - **«Promocionado»:** solo con 30.000 usuarios al mes, marcado y diciendo quién paga.
  - **Afiliados de Thomann:** cuando haya 500 visitas al día, avisando de que el enlace es de afiliado (también si lo recomienda Rodrigo). Es poco dinero.
  - **Seguro por bolo:** a través de un corredor, desde 200 reservas protegidas al mes.
- **No:**
  - **pago por contacto:** nunca (10 de 10). Quema a los músicos y es cobrar dos veces;
  - **entradas:** no antes del año 3 (Sofar ganaba 176 $ por concierto);
  - **publicidad de Google (AdSense):** nunca.
- **Nuevo, del fundador:** **mesa de eventos de empresa.**
  - Empresas, hoteles y agencias del Mobile World Congress (1–4 de marzo de 2027).
  - 12 % de gestión, facturado por Musikeeo, que el artista factura su caché aparte; se cobra por transferencia, así que no hace falta Stripe.
  - Lo vende Víctor por teléfono con grupos de su red que facturan.
  - **Es el primer euro posible.**

**D8 · Orden y disparadores.**
- Cada cobro se enciende cuando se cumple su número dos meses seguidos, no en una fecha.
- **Marcha atrás:** si al encender un cobro las propuestas aceptadas caen más de un 20 %, o los avisos de contacto suben más de un 50 %, se apaga en ese segmento.
- Un 10 % de cuentas, elegidas al azar, no ve ningún cobro opcional durante 12 meses, para comparar.

| Cuándo | Qué se enciende | Disparador | Mes previsto |
|---|---|---|---|
| Ya | Contacto escondido, destacados del Mercado, preventa Pro Fundadores, mesa de eventos de empresa | — | 0–2 |
| Antes del primer euro con pagos | Lo de «Antes del primer euro», más abajo | — | 1–4 |
| Reserva protegida (bodas, particulares, eventos) | 6 semanas al 0 % para medir; luego 10 % + IVA | 40 propuestas aceptadas al mes | 4–5: hay que llegar a la temporada de reservas |
| Cancionero Pro | Repertorios de banda | Hecho, y 1.000 usuarios a la semana con un 25 % que sigue a los 30 días | 4–7 |
| Primera vez en salas | 10 % + IVA | El 25 % o más paga dentro en esas 6 semanas | 7 |
| Primera vez en bares, barrio a barrio | 10 % + IVA | El barrio tiene 50 bolos al mes, el 75 % se cubre en 72 h y hay 4 postulantes por bolo | 8 (Gràcia) |
| Plan Sala de pago | — | 30 locales con 2 bolos al mes o más | 11–12 |
| Musikeeo Pro | — | 150 contrataciones al mes | 13 |
| 12 % en bodas | — | Pasados 6 meses de lanzamiento y con la prueba A/B a favor | ~11 |
| Destacado en bodas | — | 150 peticiones de boda al mes en la provincia | 15 |
| Protección del Mercado | — | Envío integrado y 150 ventas al mes | 20 o más |
| Promocionado | — | 30.000 usuarios al mes | 30 o más |

**D9 · Qué medir desde ya.**

| Métrica | Seguimos | Cambiamos |
|---|---|---|
| Propuestas aceptadas al mes en Barcelona | 40 o más a los 6 meses | menos de 15 |
| Bolos con 3 postulantes o más en 72 h | 60 % o más | menos del 30 % |
| Coste por pareja de boda conseguida | 50 € o menos | más de 70 €: se cortan los anuncios |
| Bodas pagadas dentro | 60 % o más a los 12 meses | menos del 40 % a los 6: se vive de «Destacado en bodas» |
| Contactos ocultados cada 100 chats con propuesta | 15 o menos | 25 o más: falta valor dentro |
| Locales que repiten en 60 días | 50 % o más | menos del 25 % |
| Plan Sala entre locales con 3 bolos al mes o más | 30 % o más | menos del 15 % |
| Cancionero: siguen a los 30 días / pasan a Pro | 25 % / 2–3 % | menos del 15 % / menos del 1 % |
| Bolos de bar con factura (se pregunta en la propuesta) | 40 % o más | menos: bares solo con Plan Sala |
| Fuga declarada («¿se hizo el bolo?» a los 30 días) | menos del 25 % | más del 30 % |
| Coste de la garantía | 1 % o menos | más del 1,5 % |
| Tiempo de Víctor en vender y operar | 60 % o más | — |

- **En la app hay que guardar:**
  - propuestas enviadas, aceptadas y pagadas;
  - avisos de contacto mostrados: solo el número de avisos, nunca el texto;
  - «¿con factura?» en cada propuesta.

**D10 · Previsiones para el inversor.** Las cifras están en la sección siguiente.
- **Base:** el plan de este documento con un 60 % del volumen de hoy.
- **Ambicioso:** el volumen del modelo de hoy, con Europa desde el año 4.
- **Conservador:** el 35 % del volumen de hoy.
- **Se enseña:**
  - lo que deja cada bolo;
  - el margen de contribución;
  - desde qué mes se cubre una estructura fija;
  - las 3 palancas: coste por pareja, cobro dentro y Plan Sala.
- **Se quita:** los múltiplos de valoración y la postulación destacada.

## Previsiones (plan del consejo)

Calculado con `docs/pitch/modelo_consejo.py`: el modelo por segmentos del matemático, con las decisiones de arriba. «Margen» es el margen de contribución: ingresos menos el cobro (Stripe, Connect, disputas), la garantía, la atención al cliente y lo que cuesta conseguir cada cliente. Sin estructura fija.

| | Año 1 | Año 2 | Año 3 | Año 4 | Año 5 | Cubre 10 / 25 / 50 k€ al mes |
|---|---|---|---|---|---|---|
| **Base** (5.700 contrataciones al mes en el año 5) | 27 k€ | 117 k€ | 447 k€ | 1,06 M€ | **1,96 M€** | mes 30 / **41** / 53 |
| margen | 13 k€ | 35 k€ | 133 k€ | 340 k€ | **669 k€ (34 %)** | |
| **Conservador** (35 % del volumen de hoy) | 24 k€ | 72 k€ | 259 k€ | 607 k€ | 1,13 M€ | mes 37 / 49 / no llega |
| margen | 14 k€ | 25 k€ | 79 k€ | 196 k€ | 388 k€ (34 %) | |
| **Ambicioso** (volumen de hoy, Europa desde el año 4) | 32 k€ | 185 k€ | 722 k€ | 1,72 M€ | 3,21 M€ | mes 25 / 36 / 45 |
| margen | 11 k€ | 50 k€ | 208 k€ | 549 k€ | 1,09 M€ (34 %) | |

- **Frente al modelo de hoy** (4,47 M€ de ingresos y 1,96 M€ de margen en el año 5), los ingresos bajan a menos de la mitad y el margen a un tercio. Ese modelo estaba inflado: la postulación destacada, 75 % pagado dentro en todo, el volumen, el IVA y Stripe por debajo de lo real.
- **Por qué el base es el 60 % del volumen de hoy:** GigPig, el más parecido en Europa, hace unos 60.000 bolos al año con 3.000 locales ([BusinessCloud](https://businesscloud.co.uk/news/fast-growing-gigpig-set-to-make-14-5m-from-60000-gigs-in-2025/)), unos 5.000 al mes.
- **El margen del año 1 es positivo** solo por la preventa de Pro Fundadores (300 × 49 €) y la mesa de eventos: es una hipótesis.

**De dónde sale el dinero en el año 5 (base)**

| Comisión | Suscripciones | Visibilidad | Mercado |
|---|---|---|---|
| **77 %** | **17 %** | **4 %** | **3 %** |
| Bodas y particulares 56 %, salas y eventos 14 %, bares 7 % | Plan Sala 9 %, tiendas 6 %, Pro y Cancionero Pro 2 % | Destacado en bodas 3 %, Promocionado 1 % | Protección al comprador 2 %, destacados 1 % |

- **Lo que se ve en el margen**:
  - La comisión de bodas apenas paga lo que cuesta conseguir a los novios.
  - El margen sale de los locales (la primera vez y el Plan Sala), de las tiendas y de la visibilidad.
  - Pro y Cancionero Pro son pequeños (unos 40 k€): sirven para atraer y retener a los músicos, no para pagar las cuentas.
- **Ingresos por bolo:** son el 7,5 % de lo que se contrata.

**Lo que deja cada bolo pagado dentro**

| Bolo | Comisión | Menos cobro, garantía y atención | Menos lo que cuesta conseguirlo |
|---|---|---|---|
| Boda de 800 € al 12 % | 95 € | 65 € | **15 €** (pareja a 50 €) |
| Boda de 800 € al 10 % | 80 € | 50 € | **0 €**: por eso el 10 % es solo de lanzamiento y **sin pagar anuncios para captar novios mientras dure** |
| Bar, primera vez (220 €) | 23 € | 22 € | conseguir el local cuesta 90 €: se paga con unas 4 primeras veces |
| Sala o evento, primera vez (1.000 €) | 100 € | 98 € | conseguir la sala cuesta 80 € |

**Incertidumbre** (5.000 futuros posibles, con los valores dudosos en sus rangos: volumen ×0,6–1,7, pareja a 31–80 €, bodas pagadas dentro del 50 al 85 %, Plan Sala del 10 al 30 %…)

| Año 5 | Pesimista (P10) | Normal (P50) | Optimista (P90) |
|---|---|---|---|
| Ingresos | 1,11 M€ | 1,88 M€ | 3,22 M€ |
| Margen | 161 k€ | 518 k€ | 1,04 M€ |

- **Riesgo de perder dinero en el año 5:** un 4 %.
- **Estructura de 25 k€ al mes:** se cubre hacia el mes 46 en el caso normal; en el 18 % de los casos, no en 5 años.
- **Lo que más pesa** es lo que cuesta conseguir unos novios, seguido del volumen.

**Las palancas** (margen del año 5, base)

| Caso | Margen | Cubre 25 / 50 k€ al mes |
|---|---|---|
| Pareja a 30 € (fincas, planners, músicos) | **898 k€** | mes 37 / 48 |
| Plan (pareja a 50 €) | 669 k€ | mes 41 / 53 |
| Pareja a 70 € (anuncios) | 440 k€ | mes 49 / no llega |
| Plan Sala al 12 % en lugar del 20 % | 602 k€ | mes 43 / 55 |
| Nadie paga dentro y se sigue gastando en captar | −458 k€ | no llega |

**Qué decir al inversor:** «Es rentable por bolo desde el primer día y por cliente si conseguir unos novios cuesta 50 € o menos. Con solo España llega a unos 2 M€ de ingresos y 670 k€ de margen en el año 5; con Europa, a más de 3 M€. Estas son las tres palancas y así las medimos». No se piden cantidades ni se enseñan múltiplos de valoración.

## Antes del primer euro (abogado)

- [ ] **Una SL** como titular. Hoy figura Víctor como persona física. Tampoco se puede facturar la mesa de eventos sin SL o sin alta como autónomo.
- [ ] **Dictamen de un asesor laboral y fiscal** sobre el flujo: IVA del 10 % del caché, retención del 15 % (o 7 %) cuando paga una empresa, y cobrar en nombre del artista (`on_behalf_of`).
- [ ] **Alta en el modelo 040** (DAC7). Cada enero, modelo 238 con lo que cobra cada uno, y avisar al músico desde el primer cobro. Sin NIF y datos completos no se le paga.
- [ ] **Stripe Connect** (Express): Musikeeo nunca toca el dinero del artista.
- [ ] **Acuerdo de autofacturación** con cada artista.
- [ ] **Evaluación por escrito del interés legítimo** del chat (una página).
- [ ] **Condiciones según el Reglamento P2B:**
  - qué influye en el orden de Explorar (también lo que se paga);
  - por qué se limita cerrar tratos fuera;
  - 30 días de aviso para cerrar una cuenta profesional.
- [ ] **Antes de aceptar una propuesta, la ficha del profesional:** identidad y si es profesional o particular. Cancelación igual para las dos partes.
- [ ] **18 años** para cobrar y contratar (hoy se admiten 14).
- [ ] **Suscripciones:** botón de baja (obligatorio en la UE desde el 19-jun-2026).
- [ ] **VeriFactu:** desde el 1-ene-2027 para la SL.
- [ ] **No recomendar cooperativas de facturación** (caso Factoo). Para quien no es autónomo: alta por quien contrata (vía Plan Sala y gestoría) o hacerse autónomo (tarifa plana de 80 €/mes).

## Qué está hecho en la app (25-oct)

- **Propuesta de bolo** en el chat (fecha, sitio, caché) que el otro acepta con un toque.
- **Contacto escondido hasta aceptar la propuesta**, probado con dos cuentas en el emulador:
  - qué se oculta: teléfonos de España y con prefijo, emails, @usuarios y enlaces a WhatsApp, Telegram y redes, también en las notas de la propuesta;
  - cómo: lo hace el móvil y el chat queda marcado como libre al aceptar;
  - archivos: `src/lib/fuga.ts`, `src/lib/propuesta.ts` y `src/pages/messages/Messages.tsx`.
- **Política de privacidad y condiciones** al día con la regla del chat.

## Pendiente en la app (sin prisa, en orden)

1. Contar en Firestore propuestas, aceptaciones y avisos (solo el número), y preguntar «¿con factura?» en la propuesta.
2. Regla de Firestore de respaldo: rechazar teléfonos en los chats sin propuesta aceptada. El abogado lo recomienda; el móvil ya lo hace.
3. «Cobra a tus propios clientes» y la Reserva protegida con Stripe Connect, cuando estén la SL y el dictamen.
4. Repertorios de banda en el Cancionero, que es la base del Cancionero Pro.
