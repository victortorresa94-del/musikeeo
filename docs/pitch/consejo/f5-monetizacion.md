# f5-monetización · Jefe de monetización (Wallapop, Vinted, Airbnb)

## Veredicto en 3 líneas
- **Con poco tráfico da dinero:**
  - la comisión de bodas y eventos (108 € por boda al 12 %);
  - lo que se vende a mano a locales y tiendas.
- **Necesitan escala:** publicidad, Promocionado, afiliados, Pro y Cancionero Pro. Para dar 10 k€/mes necesitan entre 36.000 perfiles y 400.000 usuarios activos.
- **Bares que repiten:** cobrarles o no mueve menos del 5 % de los ingresos. Se decide por la fuga, no por el dinero.
- **Corrección del modelo:** el año 5 da 3,9 M€ con 1,54 M€ de margen (40 %), no 4,47 M€. La postulación destacada estaba inflada 8 veces.

## A. Qué cobro da dinero pronto y cuál necesita escala
Volumen necesario para ingresar **10.000 €/mes** con cada cobro. Es un cálculo mío: `trafico.py`.

| Cobro | € por unidad | Hace falta |
|---|---|---|
| Comisión de bodas al 12 % (900 €) | 108 € | **93 bodas pagadas dentro al mes**. Unas 155 contratadas, en el mes 19 del modelo base |
| Comisión de bar, 1.ª vez (250 €) | 25 € | 400 bolos al mes |
| Plan Sala (media de 35 €) | 35 € | 286 locales pagando, es decir, unos 1.430 activos si paga el 20 % |
| Plan de tienda | 49 € | 205 tiendas |
| Destacado en bodas | 29 € | 345 músicos |
| Musikeeo Pro (7 € efectivos) | 7 € | 1.430 Pro, es decir, **35.700 perfiles** si paga el 4 % |
| Cancionero Pro (24,99 €/año) | 2,1 € | 4.760 suscriptores, es decir, **159.000 usuarios activos** si paga el 3 % |
| Destacados del Mercado | 3 € | 3.330 al mes, es decir, 167.000 anuncios publicados al mes si destaca el 2 % |
| Publicidad programática (AdSense y similares) | 0,64–1,91 € por 1.000 páginas | **5,2–15,7 M de páginas al mes, es decir, 130.000–390.000 usuarios activos** |
| Promocionado nativo (8 € por cada 1.000 vistas) | 8 € | 1,25 M de impresiones, es decir, 625.000 páginas de resultados al mes (1 de cada 10 tarjetas, 20 tarjetas por página) |
| Afiliados de Thomann | 0,16 € por clic | 63.500 clics, es decir, 2,1 M de sesiones al mes (3,5 % de un pedido de 180 €; compra el 2,5 % de los clics; hace clic el 3 % de las sesiones) |

**Hipótesis de la publicidad:**
- **Cuánto paga el anunciante (CPM, lo que se paga por cada 1.000 anuncios vistos):** 0,5–1,5 € en display abierto en España. No encontré un dato público fiable. El display no vídeo bajó un 3 % en 2025 según IAB Spain ([Autoritas](https://autoritas.substack.com/p/la-publicidad-digital-en-espana-supera)). En Europa occidental el precio bajó un 9 % en 2023 ([Opti Digital vía ExchangeWire](https://www.exchangewire.com/blog/2024/02/22/opti-digital-barometer-fluctuations-in-ecpm-across-western-europe-in-2023/)). Como techo para un anuncio segmentado: Meta cobra en España una mediana de unos 7,6 € ([Superads](https://www.superads.ai/facebook-ads-costs/cpm-cost-per-mille/spain)).
- **Relleno:** 85 %. Lo normal es un 80–90 % ([Sevio, 2026](https://blog.sevio.com/ad-fill-rate/)); en 2019, el 63 % de los editores llenaba el 80 % o más ([AdMonsters](https://admonsters.com/downloadpdf/playbook/admonsters-playbook-fill-rate-survey)).
- **Uso:** 1,5 anuncios por página y 40 páginas por usuario al mes.

**Conclusión:**
- **Dan dinero pronto:** la comisión de alto importe (bodas y eventos) y lo B2B vendido a mano (Plan Sala y tiendas).
- **Necesita escala todo lo que se paga por mirar:** publicidad, Promocionado, afiliados y destacados.
- **Pro y Cancionero Pro:** fidelizan, pero son pequeños.

## B. Cómo se enciende cada cobro
**1. Reserva protegida opcional (bolos)**
- **Cuándo:**
  - ≥40 propuestas aceptadas al mes, dos meses seguidos (hacia el mes 5);
  - Stripe Connect montado;
  - visto bueno del asesor fiscal.
- **Para quién y en qué orden:** primero bodas, particulares y salas o eventos. Los bares entran a la vez que el Plan Sala.
- **Cómo se ve:**
  - El botón amarillo de la Propuesta es «Reservar con garantía», marcado por defecto.
  - Debajo, en gris: «Lo pagamos por fuera». Así no hay garantía, la reseña no sale como verificada y no suma en Explorar.
  - El precio total se ve desde la ficha: «1.008 € (caché 900 € + 108 € de gestión y garantía)».
- **Arranque:** 6 semanas con la gestión a 0 %, para medir la adopción sin precio. Después, 12 % en bodas y 10 % en salas.
- **Grupo de control:** el 20 % de los músicos, sorteados, sigue 8 semanas sin el botón.
- **Éxito:** ≥25 % paga dentro a las 6 semanas y ≥35 % a los 3 meses.
- **Guardas (frente al control):**
  - la aceptación de propuestas no baja más de un 10 %;
  - los contactos ocultados no suben más de 5 puntos;
  - las reclamaciones no pasan del 2 % de las reservas.

**2. Protección al comprador (Mercado)**
- **Cuándo:** solo con el envío integrado y ≥150 ventas declaradas al mes (hacia el mes 18–24). En mano, el comprador prueba el ampli: ahí la protección no aporta.
- **Cómo:**
  - Botón «Comprar con envío y protección».
  - El comprador paga 5 % + 0,70 € (tope de 25 €) más el envío. El vendedor no paga nada.
  - El dinero se libera 48 h después de la entrega.
  - En mano sigue siendo gratis y con el chat abierto.
- **Prueba:** la mitad de los anuncios, sorteados, enseña el botón durante 8 semanas.
- **Éxito:** ≥15 % de las ventas con protección.
- **Guardas:**
  - los contactos por anuncio no bajan más de un 10 %;
  - los anuncios nuevos no bajan;
  - las disputas no pasan del 2 %;
  - el fraude no pasa del 0,5 % del dinero.

**3. Destacados (Mercado)**
- **Cuándo:** con ≥300 anuncios activos.
- **Precio:** 1,99 € por 3 días, 3,99 € por 7 y 7,99 € por 15. Wallapop cobra 2,49–29,99 €.
- **Reglas:**
  - como mucho, 1 de cada 6 resultados;
  - solo en su categoría y zona;
  - etiqueta «Destacado».
- **Prueba:** el 10 % de los compradores ve el orden sin destacados.
- **Qué se mide (incrementalidad):** cuánto es nuevo y cuánto se come a otro. Se calcula como los contactos que gana el destacado menos los que pierden los demás anuncios.
- **Éxito:**
  - el destacado consigue ≥1,5 veces los contactos de uno normal;
  - ≥25 % de quienes destacan vuelve a comprar.
- **Guardas:**
  - los contactos por búsqueda no bajan más de un 5 %;
  - la venta a 30 días de los anuncios no destacados no baja más de un 10 %.

**4. «Promocionado» (tiendas y marcas)**
- **Cuándo:** en el año 3, con ≥50.000 usuarios activos, ≥1 M de tarjetas vistas al mes y ≥20 tiendas de pago. Antes da menos de 1.000 €/mes.
- **Cómo:**
  - Tarjeta nativa con la etiqueta «Promocionado» en Mercado, Explorar y Feed: 1 de cada 10–12.
  - Autoservicio para las tiendas con plan.
  - Se cobra por clic (0,25–0,50 €) o por cada 1.000 vistas (6–10 €).
  - Como mucho 3 impactos al día por persona.
  - **Nunca AdSense.**
- **Prueba:** el 10 % de los usuarios no lo ve nunca. El sorteo se hace antes de la subasta, como Instacart ([Instacart](https://tech.instacart.com/how-instacart-measures-the-true-value-of-advertising-the-methodology-of-ad-incrementality-aac6c58e627c)).
- **Guardas:**
  - las sesiones por usuario no bajan más de un 2 %;
  - la retención a 30 días no baja más de 1 punto;
  - las denuncias no pasan del 0,3 % de las impresiones.

## C. Cómo se mide que no hace daño
- **Grupo de control permanente:**
  - El 10 % de las cuentas (por uid; los invitados, por dispositivo) no ve durante 12 meses ningún cobro opcional: ni destacados en el orden, ni Promocionado, ni avisos de Pro, ni postulación destacada.
  - Mide el efecto acumulado en la retención.
- **Con poco volumen no hay potencia estadística:**
  - Para ver que la aceptación cae del 60 % al 50 % hacen falta **388 propuestas por grupo**. Del 60 % al 54 %, 1.068.
  - Con 100 propuestas al mes solo se ven efectos grandes.
  - Por eso: umbrales escritos antes de lanzar, un mínimo de 8 semanas y lanzamiento por segmentos (bodas antes que bares). El segmento que aún no tiene el cobro hace de control.
- **No enseñar dos precios a la vez a clientes del mismo músico:** se percibe como injusto. Se sortea por músico o por semanas alternas.
- **Ojo con la canibalización:** eBay apagó sus anuncios de marca en buscadores y casi todo el tráfico le llegó igual por los resultados normales. Lo pagado se comía lo gratis ([Blake, Nosko y Tadelis, 2015](https://www.nber.org/papers/w20171)). Los destacados y el Promocionado pueden hacer lo mismo con lo orgánico.

## D. Qué aprendió Wallapop al pasar de gratis a cobrar
1. **Estuvo años gratis, y lo primero que cobró fue la visibilidad.**
   - En 2017 ingresó 1,4 M€ y perdió 10 M€; en 2018 ingresó 6,9 M€ ([Metrópoli Abierta](https://metropoliabierta.elespanol.com/economia/20221115/wallapop-pierde-millones-desde-su-fundacion/718678276_0.html)).
   - La visibilidad sigue siendo un complemento: 22 M€ de 101 M€ en 2024 ([Ara](https://es.ara.cat/economia/tecnologia/wallapop-pierde-25-millones-euros-pese-mejorar-ingresos_1_5492123.html)).
2. **El dinero llegó con un servicio nuevo que paga el comprador.**
   - Envíos con protección: 74 M€, el 73 % de los ingresos de 2024 (Ara).
   - No cobró la venta en mano, que no puede controlar: creó una venta mejor, a distancia y protegida.
   - El vendedor nunca paga, así que la oferta no se fue.
3. **Es lento, y lo opcional deja fuera casi todo.**
   - Llevaba 162 M€ de pérdidas acumuladas hasta 2023 ([Metrópoli Abierta](https://metropoliabierta.elespanol.com/economia/20240424/el-agujero-de-wallapop-pierde-millones-desde-su-lanzamiento/850165097_0.html)). Llegó al equilibrio en España en 2024 e ingresó 116 M€ en 2025 ([elEconomista](https://www.eleconomista.es/retail-consumo/noticias/14010816/08/26/Wallapop-eleva-ventas-un-15-y-pierde-28-millones-por-su-plan-de-incentivos.html)).
   - Vinted, donde todo se paga dentro, ingresó 813 M€ con 76,7 M€ de beneficio en 2024 ([Sharetribe](https://sharetribe.com/how-to-build/how-does-vinted-make-money), fuente secundaria).

**Qué significa para Musikeeo:**
- El Mercado no pagará las cuentas.
- La comisión la paga quien contrata, y se cobra por algo que por fuera no existe: garantía y factura.
- El pago dentro va marcado por defecto y, en bodas, acaba siendo la única vía.

## Decisiones
**D1. Bares y salas que repiten: (e).**
- **La regla:**
  - 10 % la primera vez que un local contrata a un artista que encontró en Musikeeo;
  - al repetir con ese artista, 5 % sin plan y **0 % con Plan Sala (29 €/mes)**;
  - 0 % si el cliente lo trae el propio músico.
- **Por qué:** desde 3 bolos repetidos al mes, el plan sale más barato que la comisión (3 × 12,5 € = 37,5 € > 29 €). Así la comisión sirve para vender el plan.
- **Año 5 por opción** (`d1.py`):

  | Opción | Ingresos | Margen |
  |---|---|---|
  | (a) | 4,14 M€ | 1,74 M€ |
  | (e) | 4,07 M€ | 1,72 M€ |
  | (b) | 3,96 M€ | 1,65 M€ |
  | (d) | 3,31 M€ | 1,20 M€ |

- **Lo que no recoge el modelo:** (a) cobra 12,5 € en cada repetición para siempre (Homejoy). Con eso arriesga el 55 % de los bolos, que es lo que mantiene activos a los músicos.
- **Confianza:** media.

**D2. Bodas y particulares.**
- **Quién paga:** el cliente, **12 % (mínimo 15 €, tope 250 €)**. El músico, 0 %.
- **Lo que deja una boda de 900 €:** 108 € de ingreso. Menos Stripe (~17,5 €; 1,5 % + 0,25 € por tarjeta, [Quipu](https://getquipu.com/blog/comisiones-stripe/)) y el fondo (9 €), quedan **unos 81 € de margen**.
- **Frente al 10 %:** +364 k€ de margen en el año 5. Si por ello pagan dentro 5 puntos menos, +219 k€.
- **Referencia:** GigSalad y Cueup cobran al cliente un 10–12 %.
- **Garantía:**
  - si el artista cancela o no aparece, sustituto del mismo formato en 48 h (24 h si faltan menos de 7 días), y Musikeeo paga hasta un 30 % de diferencia de caché;
  - si no hay sustituto o no se acepta, se devuelve el 100 % en 5 días hábiles;
  - señal del 30 % al aceptar y resto 14 días antes. El dinero se libera 48 h después del bolo; se puede reclamar hasta entonces. Hay que confirmar con Stripe cuánto tiempo se puede retener.
- **Coste de la garantía:**
  - hipótesis: cancela el 2 % de los artistas; la mitad se sustituye (+180 €) y la otra mitad se devuelve (125 €). Salen 3 € por boda;
  - con contracargos y atención, unos 8 €: **fondo del 1 %**.
- **Confianza:** media-alta.

**D3. Contacto escondido.**
- **Ya:** hasta aceptar la propuesta.
- **En bodas y particulares:** cuando la Reserva protegida lleve 3 meses con ≥50 % pagando dentro y la aceptación no caiga, **hasta pagar la señal** (+243 k€ en el año 5, calculado con el 10 %).
- **En bares y salas:** siempre hasta aceptar. Se gana con el Plan Sala.
- **Excepciones:** el Mercado sigue abierto (como Wallapop); los chats entre músicos; las fichas de tienda con plan (teléfono y web visibles). En el chat, las @ y los enlaces se esconden igual que el teléfono; el Instagram del perfil se queda (es su portafolio).
- **Con quien insiste:**
  - siempre se oculta, con un aviso;
  - al 3.º intento, aviso fuerte de que se pierde la garantía;
  - con 5 en 30 días o con trucos (números en letra, fotos), revisión a mano y castigo:
    - el contratante no puede publicar bolos durante 14 días;
    - el músico baja en Explorar 30 días.
  - Sin expulsiones el primer año.
- **Confianza:** media.

**D4. Músicos y técnicos.**
- **Pro:** sí, a **7,99 €/mes o 69 €/año**, desde ≥150 contrataciones al mes y ≥1.500 perfiles (hacia el mes 13).
  - Incluye: Cancionero Pro, facturas de cualquier bolo con IVA y retención (también los de fuera; sirve aunque no haya demanda), estadísticas, dossier y rider en PDF, 1 destacado al mes en Explorar y Rodrigo sin límite.
  - Cobrar a un cliente propio por la app cuesta un 2 % para todos (lo que cuesta Stripe; Malt cobra lo mismo).
- **El Pro no baja la comisión de los clientes que llegan por Musikeeo.** A un Pro con 2 bolos al mes le perdonaría 56 €/mes de comisión a cambio de una cuota de 8 €.
- **Cancionero Pro:** aparte, y también dentro del Pro. **24,99 €/año (anual por defecto) o 2,99 €/mes** desde el lanzamiento, por debajo de UG Pro (39,99 €).
  - Gratis: todo lo de tocar, repertorios propios, nube hasta 100 canciones y 3 audios al mes.
  - De pago: repertorios compartidos con la banda, audios sin límite, nube sin límite, importar por lotes e imprimir el cancionero.
  - Se espera un ~3 % de conversión: es para fidelizar, no un pilar.
- **Confianza:** media.

**D5. Plan Sala.**
- **Gratis:** 2 bolos publicados al mes y propuestas sin límite. Comisión del 10 % la 1.ª vez y del 5 % al repetir.
- **Bar, 29 €/mes:**
  - bolos sin límite;
  - 0 % al repetir;
  - agenda de la temporada;
  - **una sola factura al mes** (se cobra por SEPA, a 0,35 € por cargo, y se paga a los músicos);
  - 2 usuarios.
- **Sala/Promotor, 59 €/mes:** varios escenarios, 5 usuarios, rider y técnicos, estadísticas y 2 bolos destacados al mes.
- **Grupo, 129 €/mes:** 3 o más locales.
- **Pago anual:** 2 meses gratis.
- **Cuándo:** con ≥40 locales que publican ≥2 bolos al mes.
- **Objetivo:** que pague el 20 % de los locales activos, con una media de 35 €.
- **Confianza:** media.

**D6. Mercado y tiendas.**
- **Destacados:** 1,99, 3,99 o 7,99 €.
- **Protección al comprador:** 5 % + 0,70 € (tope de 25 €), solo con envío.
- **Comisión de venta:** **no**. Ni Wallapop ni Vinted cobran al vendedor.
- **Tienda:**
  - 49 €/mes: ficha verificada con teléfono y web, 200 artículos y 10 destacados al mes;
  - Tienda Plus a 99 €/mes: catálogo sin límite, carga por CSV y crédito para Promocionado;
  - 3 meses gratis para las 20 primeras.
- **Confianza:** alta.

**D7. Lo demás.**
- **Promocionado:** sí, en el año 3 (ver B4). Nunca publicidad programática.
- **«Destacado en bodas»:** sí, con ≥150 peticiones de boda al mes en la ciudad (mes 15–19).
  - 29 €/mes, como mucho 3 por formato y zona, en rotación.
  - Es el plan B si las bodas no pagan dentro: Bodas.net cobra la visibilidad, no el trato.
- **Pago por contacto:** no. Quema la oferta y choca con la comisión.
- **Afiliados de Thomann:** sí, en el Cancionero y en Rodrigo (cuerdas, cejillas, pedales), desde 500 visitas al día.
  - Es calderilla: unos 70 €/mes con 15.000 visitas.
  - Nunca para productos que venden las tiendas que pagan plan.
- **Seguro por bolo:** sí, con una aseguradora, desde ≥200 reservas protegidas al mes. Vale más como argumento de la garantía que como ingreso.
- **Entradas para salas pequeñas:** no en 5 años (Sofar ganaba 176 $ por concierto).
- **Confianza:** alta.

**D8. Orden y disparadores.**
- **Día 1** (0 % de comisión):
  - contacto oculto hasta aceptar la propuesta;
  - Cancionero Pro;
  - destacados del Mercado, con ≥300 anuncios;
  - plan de tienda vendido a mano.
- **Después, cada cobro con su número:**

  | Disparador | Qué se enciende | Mes previsto |
  |---|---|---|
  | ≥40 propuestas aceptadas al mes, dos meses seguidos | Reserva protegida para bodas, particulares y salas (6 semanas a 0 %) | ~5 |
  | ≥25 % paga dentro durante esas 6 semanas | Gestión al 12 % en bodas y al 10 % en salas | ~7 |
  | ≥40 locales con ≥2 bolos al mes | Plan Sala, y los bares entran en la Reserva protegida | ~12 |
  | ≥150 contrataciones al mes y ≥1.500 perfiles | Pro | ~13 |
  | Bodas: ≥50 % paga dentro durante 3 meses | Contacto oculto hasta pagar la señal | ~13 |
  | ≥150 peticiones de boda al mes | Destacado en bodas | — |
  | Envío integrado y ≥150 ventas al mes | Protección al comprador | ~18–24 |
  | ≥200 reservas protegidas al mes | Seguro | — |
  | ≥50.000 usuarios activos y ≥20 tiendas de pago | Promocionado | ~30+ |

**D9. Métricas** (qué valor dice «seguimos» y cuál «cambiamos»):
1. **Propuestas aceptadas al mes:** seguimos si crecen ≥15 % al mes durante 6 meses; cambiamos si crecen <5 % durante 3 meses.
2. **Aceptación de propuestas:** seguimos con ≥40 %; cambiamos con <25 %.
3. **Contactos ocultados por cada 100 chats de contratación:** seguimos con ≤15; con ≥25 falta valor dentro.
4. **Bodas pagadas dentro:** ≥35 % a los 3 meses y ≥60 % a los 12. Con <20 % a los 3 meses, se baja al 10 % y se tira de Destacado en bodas.
5. **Repeticiones de un local:** ≥50 % se hacen dentro. Si el local sigue activo y sus repeticiones desaparecen, se está fugando.
6. **Plan Sala:** ≥30 % de los locales con ≥3 bolos al mes paga el plan; con <15 %, se revisa el precio.
7. **Bolos publicados:** ≥5 postulaciones por bolo y ≥60 % de bolos cubiertos. Por debajo de 3 postulaciones, nada de postulación destacada.
8. **Cancionero:** retención a 30 días ≥25 % y conversión a Pro ≥2 % a los 90 días.
9. **Encuesta a los 30 días** a quien aceptó y no pagó dentro: «¿Lo cerrasteis por fuera?».

**D10. Previsiones para el inversor.**
- **Escenario base:** mi caso corregido a volumen ×1. Enseñar también el conservador; el ambicioso, no.

  | | Base | Conservador |
  |---|---|---|
  | Ingresos del año 5 | 3,89 M€ | 1,96 M€ |
  | Margen del año 5 | 1,54 M€ (40 %) | 0,79 M€ |
  | Cubre 25 k€/mes desde el mes | 32 | 39 |
  | Cubre 50 k€/mes desde el mes | 39 | 49 |

- **Mezcla del año 5:** comisión 79 %, suscripciones 16 % y visibilidad 5 %. Sin publicidad.
- **Correcciones:**

  | Hipótesis | Hoy | Corrección | Efecto | Tipo |
  |---|---|---|---|---|
  | Postulación destacada por contratación | 4 | 0,5 | −626 k€ de ingresos en el año 5 (casi todo margen) | Optimista |
  | Pagado dentro | 75 % para todos | Bodas 75 %, salas 65 %, bares 55 %, repetir con comisión 30 % (55 % del total) | — | Optimista |
  | Fondo de garantía en bodas | 0,5 % | 1 % | — | Optimista |
  | Precio efectivo del Pro | 8 € | 7 € | — | Optimista |
  | Captar una boda | 40 € | 70 € | Se queda como sensibilidad | Optimista |
  | Descuento del 5 % al repetir | Se aplica también a bodas | Por segmento, la comisión media es 9,1 %, no 8,5 % | — | Pesimista |
  | Plan Sala | 12 % | 20 % | — | Pesimista |
  | Comisión de bodas | 10 % | 12 % | — | Pesimista |

## Lo que cambiaría del plan actual
1. Bodas y particulares al 12 % con tope, en vez de un 10 % igual para todos.
2. En bares, 0 % al repetir con Plan Sala. Entran en la Reserva protegida cuando haya Plan Sala (hacia el mes 12), no en el mes 7.
3. En el modelo, postulación destacada de 0,5 por contratación y pagado dentro por segmento.
4. El Pro no baja comisiones: vende facturas, estadísticas y Cancionero Pro.
5. Grupo de control del 10 % y umbrales escritos antes de encender cada cobro.

## Riesgos principales y cómo vigilarlos
1. **El 79 % de los ingresos depende de que se pague dentro.** Es más que hoy, porque quito la postulación inflada.
   - Se vigila: bodas pagadas dentro a los 3 y a los 12 meses (35 % y 60 %).
   - Plan B: Destacado en bodas.
2. **El coste de captar clientes.** Con 61 € de media (bodas a 70 €), el margen del año 5 cae de 1,54 a 0,78 M€, y la estructura de 50 k€/mes no se cubre hasta el mes 50.
   - Se vigila: el coste por boda contratada, por canal y cada mes. Tope: 60 €.
3. **Más confianza, más fugas (Gu y Zhu).**
   - Se vigila: contactos ocultados por cada 100 chats y la encuesta de fuga.
   - Se responde con valor (factura, garantía, agenda), no con castigos.

## Números que he calculado
Todo está en `/tmp/claude-0/-home-user-musikeeo/0a27ca47-7998-5168-80df-8fe7bcc8b9ed/scratchpad/consejo/f5-monetizacion/`:
- **`modelo_f5.py`:** copia del modelo hecha por segmentos.
- **`desglose.py`:** en el modelo de hoy, la postulación destacada da 715 k€ en el año 5, el 16 % de los ingresos y más que todas las suscripciones juntas (527 k€).
- **`corregido.py`, paso a paso (año 5):**

  | Paso | Ingresos |
  |---|---|
  | Hoy, por segmentos (el modelo de hoy da 4,47 M€ porque aplica el 5 % de repetir también a las bodas) | 4,70 M€ |
  | Postulación corregida | 4,07 M€ |
  | Pagado dentro por segmento | 3,51 M€ |
  | D1 (e) | 3,44 M€ |
  | Fondo de garantía y precio del Pro | 3,42 M€ |
  | Cancionero Pro y Destacado en bodas | 3,53 M€ |
  | Bodas al 12 % (`final.py`) | **3,89 M€** |

- **Sensibilidades (`palancas.py` y `final.py`):**

  | Caso | Ingresos del año 5 | Margen del año 5 | Cubre 50 k€/mes desde el mes |
  |---|---|---|---|
  | Bodas, solo la única vía | +243 k€ | — | — |
  | Bodas pagan dentro como mucho un 60 % | 3,46 M€ | 1,22 M€ | 43 |
  | Captar un cliente cuesta 61 € | — | 0,78 M€ | 50 |

- **Potencia y tráfico (`trafico.py`):** las tablas A y C.
