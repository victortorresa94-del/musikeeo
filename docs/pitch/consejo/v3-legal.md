# v3-legal · Abogado y asesor fiscal y laboral

> El encargo pedía el análisis legal además de D1–D10, así que paso del límite. Antes de activar los cobros, que revise el flujo un asesor colegiado.

## Veredicto en 3 líneas
- **Cobrar como intermediario es legal y no necesita licencia de pago.** Stripe Connect guarda el dinero, el artista factura y Musikeeo cobra su servicio.
- **Esconder el contacto en el chat también es legal**, con tres condiciones: interés legítimo como base, detectar en el móvil y no guardar lo que se oculta.
- **Tres fallos legales del plan cuestan dinero:**
  1. A los novios hay que enseñarles la comisión con el IVA incluido.
  2. La «postulación destacada» cobra a quien busca trabajo, y es el 16 % de los ingresos del año 5.
  3. En los bares muchos bolos son relación laboral.

  Corregidos, el año 5 da **3,75 M€ de ingresos y 1,17 M€ de margen (31 %)**, en vez de 4,47 M€ y 1,96 M€.

## Lo legal

### 1. Ocultar teléfonos y emails en el chat
- **Se pueden escanear los mensajes.**
  - La base es el interés legítimo (art. 6.1.f del RGPD): evitar fraudes y proteger la garantía. Basta una evaluación escrita de una página, sin pedir consentimiento.
  - El chat es una función accesoria del mercado, no una mensajería tipo WhatsApp (Código Europeo de Comunicaciones Electrónicas, art. 2.5). Por eso no entra el secreto de las comunicaciones de la directiva ePrivacy (confianza media).
  - Airbnb ya lo hace en la UE: analiza los mensajes y bloquea los contactos y los enlaces ([Airbnb](https://www.airbnb.com/help/article/1121)).
- **Mejor en el móvil que en el servidor:**
  - En el móvil, antes de enviar, el número se cambia por «[teléfono oculto]» y Musikeeo nunca lo recibe.
  - De respaldo, una regla de Firestore rechaza teléfonos y emails en los chats de bolo sin propuesta aceptada. Lo comprueba sin guardarlo.
  - Se guarda solo un contador de intentos, sin el texto.
  - Ninguna persona lee un chat salvo que lo denuncie uno de los dos.
  - No pasar los chats por Kimi: sería mandarlos a China.
- **Aviso en el momento a quien envía:** qué se ha ocultado, por qué (cláusula de las Condiciones), que lo hace una máquina y cómo reclamar. Así se cumple el art. 17 del Reglamento de Servicios Digitales (DSA), que obliga también a las microempresas.
- **Política de privacidad:**
  - Añadir: «Ocultamos teléfonos, emails y enlaces de WhatsApp o Telegram en los chats de bolos hasta que se acepta una propuesta, para evitar fraudes. Lo hace tu móvil y no guardamos lo oculto. Solo leemos una conversación si uno de los dos la denuncia. Nunca lo usamos para publicidad ni para entrenar una IA. Base: interés legítimo. Puedes oponerte escribiendo a hola@musikeeo.com».
  - Quitar «WhatsApp opcional».
  - Cuando se cobre, añadir Stripe y la comunicación a Hacienda (DAC7).
- **Condiciones** (Reglamento P2B 2019/1150, que protege a los profesionales que venden en plataformas):
  - por qué se limita cerrar tratos fuera (art. 10);
  - qué influye en el orden de Explorar, incluido lo que se paga (art. 5);
  - las suspensiones van con motivos por escrito, y cerrar una cuenta profesional exige 30 días de aviso salvo que incumpla una y otra vez (art. 4).
- **Castigar a quien insiste se puede, por escalones:**
  1. Ocultar y avisar.
  2. Al tercer intento en 30 días, un email.
  3. Al quinto, 30 días sin Destacado.
  4. Si una denuncia prueba que el trato se cerró fuera, se suspenden los cobros y el chat de bolos.

  Lo decide siempre una persona. Si lo decidiera la máquina sola, entraría el art. 22 del RGPD (decisiones automáticas) y haría falta una evaluación de impacto. A los novios no se les multa nunca: sería una cláusula abusiva (TRLGDCU, arts. 82–85).

### 2. El músico que no es autónomo
- **Boda o fiesta privada: no es relación laboral especial.** El RD 1435/1985, después del RDL 5/2022, excluye las actuaciones «en un ámbito privado» ([Pérez-Llorca](https://www.perezllorca.com/wp-content/uploads/2022/03/nota-juridica-aspectos-claves-del-real-decreto-5-2022-de-22-de-mayo-sobre-la-relacion-laboral-especial-de-los-artistas.pdf)).
  - Es trabajo por cuenta propia: alta en Hacienda (modelo 037) y declararlo en la renta.
  - Alta como autónomo, si toca a menudo. La regla de «si no llegas al salario mínimo no hace falta alta» sale de sentencias de 1997 y 2007: algunos jueces la aplican, pero la Seguridad Social no.
- **Bar o sala (es un espectáculo público): es relación laboral especial**, que desde 2022 cubre también a los técnicos.
  - Quien contrata da de alta al músico ese día.
  - Si no lo hace, la multa es de 3.750 a 12.000 € por cada trabajador ([Ayuda T Pymes](https://ayudatpymes.com/gestron/cual-es-la-sancion-por-no-dar-de-alta-a-un-trabajador)).
  - Si Musikeeo junta a ese trabajador con quien lo emplea, se parece a una agencia de colocación, y una agencia de colocación no puede cobrar al trabajador ([Consumer](https://www.consumer.es/?p=226876), [RD 1796/2010](https://boe.gob.es/boe/dias/2010/12/31/pdfs/BOE-A-2010-20151.pdf)). Por eso hay que **quitar la postulación destacada**.
- **Hacienda lo va a ver.** Desde que Musikeeo cobre, informará cada enero de lo que gana cada uno en la app, desde el primer euro: la DAC7 no tiene mínimo para los servicios. Hay que decírselo al músico cuando active los cobros.
- **Ser autónomo cuesta poco al principio:** tarifa plana de 80 €/mes; los artistas que ganan menos de 3.000 € al año tienen una base reducida (unos 161 €/mes en 2023, [Garrigues](https://www.garrigues.com/es_ES/noticia/nuevo-estatuto-artista-incluye-novedades-jubilacion-desempleo-proteccion-social)). Aun así, el 88 % de los músicos gana menos del salario mínimo (Unión de Músicos y SGAE, 2022, [Deia](https://www.deia.eus/musica/2022/05/03/88-musicos-gana-salario-minimo-1702888.amp.html)).
- **Tres formas de cobrar en la app:**
  1. **Autónomo:** cobra dentro y Musikeeo le hace la factura.
  2. **«Me da de alta quien contrata»** (bares, salas y empresas): el alta la hace una gestoría. El sueldo va por nómina y Musikeeo cobra a la sala solo su comisión.
  3. **Una cooperativa de verdad.**
- **Factoo es el aviso.** En 2017 la descalificaron: tenía más de 5.000 «socios» que en realidad eran autónomos. En 2018 entró en concurso. A muchos socios los dieron de alta como autónomos con efecto hacia atrás, con recargos y sanciones ([elDiario.es](https://www.eldiario.es/economia/empleo-cierra-cooperativa-autonomos-factoo_1_3234434.html), [Autónomos y Emprendedor](https://www.autonomosyemprendedor.es/articulo/autonomos/cooperativistas-factoo-manos-administrador-concursal/20180710151501016991.html)).
  - El que paga es el músico.
  - Musikeeo no debe recomendar cooperativas de facturación ni cobrarles comisión.
  - Smart Ibérica es otra figura («impulso empresarial», que solo existe en la ley andaluza): estudiarla antes de enlazarla.

### 3. Facturas e IVA
| Qué | Quién factura | IVA | Retención de IRPF |
|---|---|---|---|
| Caché de un artista persona física | El artista. Musikeeo puede hacerla en su nombre con acuerdo previo (RD 1619/2012, art. 5) | **10 %** si quien contrata organiza la actuación, también unos novios (DGT V1864-23 y V3339-23, [Iberley](https://iberley.es/practicos/caso-practico-tipo-iva-aplicable-cantante-facturas-ventas-91819)); 21 % si el artista es una sociedad | 15 %, o 7 % en los primeros años o con menos de 15.000 € de ingresos ([Hacienda](https://www.hacienda.gob.es/Documentacion/Publico/GabineteMinistro/Notas%20Prensa/2023/CONSEJO-DE-MINISTROS/24-01-23-Retenciones-IRPF-Estatuto-Artista.pdf)). Solo si paga una empresa, y la ingresa quien contrata |
| Técnico de sonido | El técnico | 10 % el servicio a un organizador; 21 % el alquiler de equipo | Igual |
| Servicio de Musikeeo, Pro, Plan Sala, tiendas, destacados | Musikeeo SL | 21 % | — |
| Artista dado de alta por la sala | Nómina | — | Mínimo 2 % |

- **Musikeeo cobra en nombre del artista** (en Stripe, `on_behalf_of`). Si vendiera el espectáculo en nombre propio, se consideraría que el servicio lo presta ella (art. 11.Dos.15.º de la Ley del IVA) y todo el caché iría al 21 %.
- **A los novios, el precio total con IVA desde el primer momento.** Airbnb tuvo que aceptarlo ante la Comisión Europea ([Abogacía](https://www.abogacia.es/actualidad/noticias/normas-de-la-ue-en-materia-de-consumo-airbnb-se-compromete-a-cumplir-con-las-exigencias-de-la-comision-europea-y-autoridades-competentes/)).
- **Efectivo como mucho 1.000 €** si una de las partes es profesional (Ley 11/2021). Es un buen argumento para pagar dentro en las bodas.

### 4. Lo que hace falta el día que Musikeeo cobre
- **Una SL antes de cobrar.** Hoy el titular es Víctor como persona física.
- **Stripe Connect:**
  - Musikeeo solo recibe su comisión, así que no presta servicios de pago (PSD2) ni tiene obligaciones de blanqueo. La identidad la verifica Stripe.
  - El nuevo reglamento europeo de pagos estrecha la excepción de «agente comercial» ([Adyen](https://www.adyen.com/en_AE/knowledge-hub/psd3)): nunca tocar el dinero.
  - Stripe retiene el dinero como mucho 90 días ([Stripe](https://docs.stripe.com/connect/manual-payouts)), así que una boda se cobra en dos partes: señal al reservar y el resto 30 días antes.
- **DAC7 (informar a Hacienda):**
  - Alta en el modelo 040 antes de cobrar.
  - Pedir a cada artista NIF, dirección, fecha de nacimiento e IBAN, y comprobar el NIF. Si no los da, no se le paga.
  - Modelo 238 cada enero, y avisar a cada artista de lo que se ha informado ([Pérez-Llorca](https://perezllorca.com/wp-content/uploads/2024/02/Nota-Juridica-Aprobado-el-desarrollo-reglamentario-de-la-transposicion-de-la-DAC-7-y-los-modelos-040-y-238.pdf)).
  - En el Mercado solo cuentan los vendedores con 30 ventas o más de 2.000 €.
  - Riesgo bajo pero real: que una propuesta aceptada con caché cuente como importe «conocido» aunque no se pague dentro.
- **VeriFactu** (registro de facturas de Hacienda): desde el 1-ene-2027 para la SL y desde el 1-jul-2027 para las facturas de los autónomos ([Garrigues](https://www.garrigues.com/es_ES/noticia/retrasa-entrada-vigor-verifactu)).
- **Consumo:**
  - Antes de aceptar, enseñar los datos del profesional: identidad, dirección, teléfono y email (TRLGDCU, art. 97.1).
  - Decir si quien ofrece es profesional o particular.
  - Un bolo con fecha no tiene 14 días para desistir (art. 103.l), pero la cancelación tiene que ser simétrica para las dos partes (art. 87.2).
  - Las suscripciones llevan un botón para desistir, obligatorio en la UE desde el 19-jun-2026 ([OCU](https://www.ocu.org/consumo-familia/compras-online/noticias/boton-desistimiento-directiva)).
  - Para cobrar y contratar, mayores de 18 años (hoy la app admite desde los 14).
- **Directiva europea del trabajo en plataformas** (se traspone antes del 2-dic-2026, [Cuatrecasas](https://www.cuatrecasas.com/es/spain/laboral/art/plataformas-digitales-europa-vision-iberica)). Musikeeo queda fuera mientras el músico ponga su precio, pueda decir que no y ninguna máquina reparta bolos ni castigue.

## Decisiones
- **D1 · Bares y salas que repiten.**
  - La opción (a) es legal tal cual.
  - Mi voto, por negocio y no por ley, es la (e):
    - 10 % + IVA la primera vez con cada artista;
    - 3 % al repetir;
    - 0 % para quien tenga el Plan Sala.
  - Así cada cobro se corresponde con un servicio real: el pago, la factura o el alta.
  - Comisión media: 6,9 %. Con el Plan Sala al 20 %, el año 5 da 4,0 M€ de ingresos y 1,50 M€ de margen, frente a los 4,47 M€ y 1,96 M€ de hoy. Solo compensa si se paga más dentro de la app.
  - La (b), con un 0 % al repetir, no compensa ni con el Plan Sala al 35 %: 1,26 M€ de margen.
  - Confianza baja.
- **D2 · Bodas y particulares.**
  - **Paga el cliente un 12 % con IVA incluido** (9,9 % neto), visible desde el primer precio.
  - **Cobro en dos partes:**
    - al reservar, la comisión y una señal del 30 % como arras penitenciales (Código Civil, art. 1454): si cancelan los novios, la pierden; si cancela el artista, devuelve el doble;
    - el resto, 30 días antes del bolo, retenido hasta 48 h después.
  - **Si falla el artista,** devolución del 100 % en 5 días hábiles, o un sustituto en 48 h. Si el sustituto cuesta más, Musikeeo pone la diferencia, hasta 200 €.
  - No llamarlo «seguro».
  - Coste estimado: 0,7 % del volumen de bodas (hipótesis: un 1,5 % de cancelaciones por parte del artista, más fraude).
  - Confianza media.
- **D3 · Contacto en el chat.**
  - **Oculto hasta que se acepta una propuesta**, que con la Reserva protegida es lo mismo que pagar.
  - En la pantalla de aceptar, la ficha del profesional (la ley obliga a darla antes de que el consumidor quede obligado). Por eso «nunca» no es legal.
  - El Mercado queda libre. Las direcciones no se ocultan.
  - A quien insiste, los escalones del punto 1.
  - Confianza alta.
- **D4 · Pro para músicos y técnicos.**
  - **Pro sí: 8 €/mes o 79 €/año + IVA.**
  - Incluye facturas con IVA y retención ya hechas, dossier, estadísticas, Rodrigo sin límite y el Cancionero Pro.
  - No rebaja la comisión de sus clientes.
  - **Cancionero Pro aparte: 2,99 €/mes o 24,99 €/año.**
    - Gratis, todo lo que funciona en el móvil.
    - De pago, la nube, compartir con la banda y sacar acordes sin límite.
  - Apple solo deja usar sus portadas y muestras para promocionar su tienda y junto a su insignia ([Apple](https://performance-partners.apple.com/search-api)). En la versión de pago, añadir «Escuchar en Apple Music» o quitarlas.
  - Confianza media.
- **D5 · Plan Sala.**
  - **39 €/mes + IVA por local; 89 €/mes para varios locales o una agencia.**
  - Gratis: 2 bolos publicados al mes.
  - Incluye:
    - repetir con el mismo artista al 0 %;
    - agenda;
    - contratos tipo;
    - facturas agrupadas;
    - **las altas de los artistas con una gestoría colaboradora** (lo que permite pagar dentro a quien no es autónomo).
  - Confianza media.
- **D6 · Mercado y tiendas.**
  - **Destacar un anuncio:** 2,99 € 7 días o 4,99 € 15 días, con la etiqueta «Destacado».
  - **Protección al comprador:** 5 % + 0,70 € con IVA incluido, solo si se paga dentro.
  - **Sin comisión** por la venta.
  - **Plan de tienda:** 49 €/mes + IVA.
  - Decir siempre si vende un particular o una tienda.
  - Confianza media.
- **D7 · Lo demás.**
  - **«Promocionado»: sí**, a partir de 20.000 usuarios al mes. Con su etiqueta y diciendo quién paga (art. 20 de la LSSI). Sin anuncios personalizados a menores.
  - **«Destacado en bodas»: sí**, desde enero.
  - **Pago por contacto: no.** En los bolos de sala sería cobrar a quien busca trabajo.
  - **Afiliados: sí**, cuando haya tráfico, avisando de que es un enlace de afiliado, también cuando lo recomiende Rodrigo, que además debe decir que es una IA (Reglamento europeo de IA, art. 50).
  - **Seguro por bolo:** a partir del año 3 y solo a través de un corredor de seguros, porque venderlos exige registro.
  - **Entradas: no**, antes del año 3.
- **D8 · Orden y disparadores.**
  - **Antes del primer euro:**
    - una SL;
    - Condiciones y Privacidad nuevas;
    - alta en el modelo 040;
    - Stripe Connect;
    - acuerdo de facturación con cada artista;
    - la evaluación por escrito del interés legítimo;
    - edad mínima de 18 años.
  - **El día 1** solo se cobran los destacados del Mercado.
  - **Disparadores (opinión):**
    - Reserva protegida: 40 propuestas aceptadas al mes, dos meses seguidos.
    - Plan Sala: 20 salas con 2 bolos al mes o más.
    - Pro: 100 contrataciones al mes.
- **D9 · Métricas que hay que vigilar.**
  - **Datos DAC7 completos al cobrar:** 100 %. Sin ellos, no se paga.
  - **Músicos de bar que son autónomos:** si son menos del 50 %, abrir la vía del alta antes de subir el pago dentro.
  - **Mensajes ocultados que se reclaman:** menos del 2 %.
  - **Cancelaciones del artista:** menos del 2 %.
  - **Contracargos:** menos del 0,5 %.
- **D10 · Para el inversor.**
  - **Escenario base:** el de hoy con las tres correcciones legales.
    - Bodas al 12 % con IVA incluido.
    - Stripe al 2,2 % del caché, no al 1,98 %: también cobra sobre el IVA y por cada cuenta activa.
    - Sin postulación destacada.
  - **Resultados:**
    - Año 3: 0,79 M€.
    - Año 5: 3,75 M€ y 1,17 M€ de margen.
    - Una estructura fija de 25 k€ al mes se cubre desde el mes 36, y una de 50 k€ desde el 44.
  - **Mezcla del año 5:** 85 % comisión, 14 % suscripciones, 1 % destacados.
  - **Demasiado optimista:** que el 75 % se pague dentro. En los bares, sin altas, no pasará del 50 %, y el total queda en un 65 %: un margen de 0,88 M€.

## Lo que cambiaría del plan actual
1. Comisión a los consumidores con IVA incluido y dentro del precio total: 12 %.
2. Quitar la postulación destacada.
3. Cobrar en nombre del artista, con la señal como arras y el resto 30 días antes.
4. Tener la SL, el modelo 040 y las Condiciones y Privacidad nuevas antes del primer cobro.
5. Separar la comisión del caché: con alta laboral, la sala paga la comisión y el sueldo va por nómina.

## Riesgos principales
1. **Que se considere relación laboral:** bolos con músicos sin alta, o que Musikeeo fije precios o castigue de forma automática. Vigilar el porcentaje de autónomos y que todo castigo lo revise una persona.
2. **IVA o DAC7 mal hechos.** Que el asesor revise el flujo antes de activarlo, y tener el 100 % de los datos.
3. **Consumo:** precio sin IVA, cancelación desigual entre las partes o faltan los datos del profesional. Vigilar las reclamaciones.

## Números que he calculado (`legal.py`, sobre una copia del modelo)

Año 5:

| Caso | Ingresos | Margen | Cubre 25 / 50 k€ al mes |
|---|---|---|---|
| Hoy | 4,47 M€ | 1,96 M€ | mes 29 / 37 |
| Bodas con IVA incluido (8,26 % neto) | 4,20 M€ | 1,70 M€ | 31 / 37 |
| Sin postulación destacada (715 k€) | 3,75 M€ | 1,25 M€ | 35 / 42 |
| Stripe real (2,4 % boda, 2,25 % bar, 2,1 % sala) | 4,47 M€ | 1,88 M€ | 30 / 37 |
| **Recomendado** | **3,75 M€** | **1,17 M€** | **36 / 44** |
| Recomendado, con el 65 % pagado dentro | 3,33 M€ | 0,88 M€ | 37 / 48 |

El coste de Stripe sale de su tarifa pública: 1,5 % + 0,25 € por tarjeta, 0,25 % + 0,10 € por cada pago y 2 € por cuenta activa (las cifras de Connect están por confirmar).
