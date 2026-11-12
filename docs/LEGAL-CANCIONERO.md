# Cancionero de Musikeeo: ¿es legal?

Para Víctor · 12-nov-2026 · Derecho español y de la UE (LatAm, aparte)

## En corto

- **Hoy, el riesgo para Musikeeo es bajo.** Guardar lo que pega cada usuario te hace «almacén»: no respondes mientras no sepas que es ilícito y lo quites cuando te avisen [[2]](https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758) [[3]](https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32022R2065).
- **Para el usuario, zona gris.** La copia privada exige que la fuente sea lícita, que se respeten las condiciones de la web y que el uso no sea profesional [[1]](https://www.boe.es/buscar/act.php?id=BOE-A-1996-8930). Ultimate Guitar y LaCuerda prohíben copiar [[6]](https://www.ultimate-guitar.com/about/tos.htm) [[7]](https://lacuerda.net/Extras/legal.php).
- **Tres arreglos baratos ya:** no mandar a copiar de webs concretas, abrir un canal de avisos (lo exige el Reglamento de Servicios Digitales, la DSA) y añadir una cláusula en las condiciones. Sin ellos, y con un Cancionero Pro de pago, os acercáis a «cooperar» en la infracción [[1]](https://www.boe.es/buscar/act.php?id=BOE-A-1996-8930).
- **Compartir con la banda:** con solo acordes, el riesgo es muy bajo; con letra, bajo. Si el usuario lo publica en redes, la infracción es suya.
- **Un buscador público necesita licencia** (art. 17 de la Directiva 2019/790 y art. 73 del RDL 24/2021) [[10]](https://eur-lex.europa.eu/legal-content/ES/TXT/HTML/?uri=CELEX:32019L0790) [[15]](https://papelea.com/es/leyes/real-decreto-ley-24-2021/libro-cuarto_titulo-iv_capitulo-1%C2%BA). El orden: solo acordes, después letras de un proveedor con licencia y, por último, un acuerdo con SGAE y las editoras. Antes, una SL.

## A. Hoy: el cancionero privado

**El usuario.** El art. 31.2 de la Ley de Propiedad Intelectual (TRLPI) permite copiar sin permiso si se cumplen a la vez tres condiciones [[1]](https://www.boe.es/buscar/act.php?id=BOE-A-1996-8930):

1. Copia una persona física, para su uso privado, «no profesional ni empresarial».
2. Copia de una fuente lícita, sin vulnerar «las condiciones de acceso a la obra».
3. La copia no se usa en grupo ni con lucro.

Que esté en la nube da igual, según el Tribunal de Justicia de la UE (TJUE) en el caso Strato (2022) [[5]](https://www.cuatrecasas.com/es/spain/propiedad-intelectual/art/ue-sentencia-tjue-limite-de-copia-privada-en-la-nube-y-compensacion-equitativa). El problema son las condiciones de las webs:

- **Ultimate Guitar** prohíbe reproducir su contenido en cualquier «medio, memoria o dispositivo», aunque deja imprimirlo [[6]](https://www.ultimate-guitar.com/about/tos.htm).
- **LaCuerda** dice que es de «exclusivo uso privado», pero prohíbe «la reproducción, distribución, copia» [[7]](https://lacuerda.net/Extras/legal.php).
- **Cifra Club** no deja leer su aviso legal de forma automática: revísalo a mano [[8]](https://www.cifraclub.com.br/aviso-legal.html).

Copiar de UG o de LaCuerda incumple la condición 2. Usarlo en bolos pagados incumple la 1. El riesgo es del usuario, y es remoto.

**Musikeeo.** Musikeeo aloja las copias. No responde de ellas mientras no sepa que son ilícitas; cuando lo sepa, tiene que retirarlas con diligencia (art. 16 de la LSSI [[2]](https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758); art. 6 de la DSA). La DSA no obliga a vigilar, pero sí, sea cual sea el tamaño de la empresa, a tener un canal de avisos y a motivar cada retirada (arts. 16 y 17) [[3]](https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32022R2065). Como no difunde nada al público, no es una «plataforma en línea» [[4]](https://cms.law/en/esp/publication/el-reglamento-de-servicios-digitales-reglamento-ue-2022-2065-cuestiones-generales-y-regulacion-de-la-responsabilidad) y tampoco le afecta el art. 17 de la Directiva [[10]](https://eur-lex.europa.eu/legal-content/ES/TXT/HTML/?uri=CELEX:32019L0790).

El peligro está en el art. 138 del TRLPI, que hace responsable a quien «induzca a sabiendas» la infracción, a quien «coopere» con ella y a quien tenga un «interés económico directo» en ella [[1]](https://www.boe.es/buscar/act.php?id=BOE-A-1996-8930). Tres cosas os acercan a eso:

- «Falta la letra» enlaza a UG y a Cifra Club y ofrece «Pegar aquí».
- El recorte automático entiende el formato de UG.
- El Cancionero Pro será de pago.

**Qué hacer:**

1. Cambiar el texto, por ejemplo a «Pega tu letra y tus acordes (los tuyos o los que tengas derecho a usar)», y quitar esos enlaces.
2. En las condiciones, que el usuario garantice tener derecho a lo que guarda y que podáis retirarlo.
3. Poner un formulario de avisos de derechos, con respuesta motivada y un punto de contacto (arts. 11, 12, 16 y 17 de la DSA).
4. No descargar nada de esas webs desde el servidor.

**Compartir con el grupo.** El repertorio va dentro del enlace, detrás de «#», y esa parte no llega a vuestros servidores (`src/lib/compartir.ts`). Quien lo envía es el usuario.

- **Solo acordes.** Una progresión básica no se protege por sí sola. Así lo dijo un tribunal de EE. UU. en el caso Sheeran (2024) [[11]](https://law.justia.com/cases/federal/appellate-courts/ca2/23-905/23-905-2024-11-01.html), y es lo que defiende Chordify [[12]](https://support.chordify.net/hc/en-us/articles/360001420738-Does-this-not-infringe-copyright). Pero el cifrado completo sí reproduce parte de la obra (art. 10.1.b del TRLPI), y en 2006 las editoras persiguieron webs de tablaturas [[13]](https://www.cardozoaelj.com/wp-content/uploads/2012/07/Myers.pdf). Riesgo muy bajo.
- **Con letra.** Es «utilización colectiva» y deja de ser copia privada [[1]](https://www.boe.es/buscar/act.php?id=BOE-A-1996-8930). Aun así, cinco músicos difícilmente son «público» para el TJUE [[14]](https://legalblogs.wolterskluwer.com/copyright-blog/cjeu-reha-training-v-gema-court-of-justice-of-the-european-union-c-11715-31-may-2016/).
- **Qué hacer.** Dejar «sin letra» por defecto, avisar al activarla («solo para tu grupo, no lo publiques») y que Google no indexe `/grupo`.

## B. Futuro: un buscador público de canciones

**Por qué cambia todo.** Un catálogo público con letras o cifrados que suben los usuarios, organizado y promocionado con ánimo de lucro, es una «plataforma para compartir contenidos» [[10]](https://eur-lex.europa.eu/legal-content/ES/TXT/HTML/?uri=CELEX:32019L0790). Para eso necesitas permiso previo de los titulares ([art. 73 RDL 24/2021](https://www.boe.es/buscar/act.php?id=BOE-A-2021-17910) [[15]](https://papelea.com/es/leyes/real-decreto-ley-24-2021/libro-cuarto_titulo-iv_capitulo-1%C2%BA)).

Sin ese permiso respondes y pierdes el escudo de la LSSI, salvo que demuestres «mayores esfuerzos» en tres cosas:

- conseguir la licencia;
- bloquear lo que te notifiquen;
- retirarlo rápido y evitar que vuelva.

Si tienes menos de 3 años en la UE y facturas menos de 10 M€, basta con intentar la licencia y retirar. Pero si pasas de 5 millones de visitantes al mes, también tienes que impedir que vuelva [[10]](https://eur-lex.europa.eu/legal-content/ES/TXT/HTML/?uri=CELEX:32019L0790).

**Cómo lo hacen otros:**

- **Ultimate Guitar:** licencias con miles de editoras (Sony/ATV, EMI, Hal Leonard, Peermusic…) y con la Harry Fox Agency; bloquea lo no autorizado [[16]](https://www.ultimate-guitar.com/article/blog/licensing).
- **Songsterr:** dice tenerlo todo con licencia y paga un porcentaje de sus ingresos [[17]](https://www.songsterr.com/a/wa/terms).
- **Cifra Club:** solo publica las letras de la lista de UBEM, las editoras de Brasil [[9]](https://www.maisgoias.com.br/entretenimento/musica/roberto-carlos-quer-retirada-de-letras-de-sites-de-cifras-e-nega-que-seja-censura/).
- **Chordify:** saca los acordes del audio y retira lo que le piden [[12]](https://support.chordify.net/hc/en-us/articles/360001420738-Does-this-not-infringe-copyright). **LaCuerda** no anuncia licencias [[7]](https://lacuerda.net/Extras/legal.php).
- **LyricFind** compra derechos para mostrar letras y los revende [[18]](http://www.marketplace.org/story/2019/07/09/song-lyrics-are-a-big-business-online-heres-how-it-works/). **Musixmatch** gratis solo da un fragmento; la letra entera exige contrato [[19]](https://freeapihub.com/apis/musixmatch) (en 2015, mínimo 25.000 $/año [[20]](https://redmine.audacious-media-player.org/issues/502)), mostrar el copyright y un script de seguimiento [[21]](https://jentic.com/apis/musixmatch.com/musixmatch.md).

Sin licencia, las editoras de EE. UU. cerraron webs de tablaturas en 2006 [[13]](https://www.cardozoaelj.com/wp-content/uploads/2012/07/Myers.pdf) y fueron a por 50 webs de letras en 2013 [[22]](https://prnewswire.com/news-releases/nmpa-takes-action-against-top-50-unlicensed-lyric-sites-231482741.html).

**Opciones, de menos a más coste:**

| Opción | Riesgo | Coste | Qué hace falta |
|---|---|---|---|
| **1. Solo acordes y estructura.** Letra solo de artistas de Musikeeo o de dominio público | Bajo-medio | Bajo | Nada de letras ajenas. Permiso escrito del artista. Dominio público: autor muerto hace más de 70 años (otro plazo si murió antes del 7-12-1987) [[1]](https://www.boe.es/buscar/act.php?id=BOE-A-1996-8930). Retirar y bloquear lo que notifiquen. Dejar constancia de que pediste licencia |
| **2. Letras de LyricFind o Musixmatch**, con los acordes de los usuarios encima | Bajo | Medio-alto | Contrato comercial. Mostrar la letra sin guardarla. Confirmar que permiten poner acordes encima y que cubren el catálogo en español |
| **3. Acuerdo con SGAE y las editoras** (como UG con la Harry Fox Agency o Cifra Club con UBEM) | Mínimo | Alto | SL, abogado, reparto de ingresos e informes. No hemos encontrado una tarifa pública de SGAE: hay que preguntar |

Descartado: un catálogo abierto, sin licencia, con letras subidas por usuarios.

## Qué preguntar a un abogado de propiedad intelectual

1. ¿Copiar de UG o LaCuerda vulnera las «condiciones de acceso» del art. 31.2.b? ¿Y si quien copia es músico profesional?
2. Con «Falta la letra» y el Cancionero Pro de pago, ¿hay riesgo por el art. 138? Que revise los textos de la app y las condiciones.
3. ¿Qué aviso basta para compartir con letra?
4. Un buscador de solo acordes, ¿ya es una «plataforma para compartir contenidos»? ¿Desde cuándo cuentan los 3 años? ¿Qué son «mayores esfuerzos»?
5. ¿Quién licencia en España las letras y los cifrados: SGAE, cada editora o los dos? ¿Y en LatAm?
6. Como persona física respondes con tu patrimonio: ¿SL y seguro antes de abrir el buscador?

> Esto es una orientación con fuentes públicas, no asesoramiento jurídico vinculante. Antes de abrir el buscador o de cobrar el Cancionero Pro, valídalo con un abogado de propiedad intelectual.

## Fuentes

1. TRLPI (RDL 1/1996), texto consolidado del BOE: arts. 10, 26, 31.2-3 y 138, y disposición transitoria 4.ª. https://www.boe.es/buscar/act.php?id=BOE-A-1996-8930
2. LSSI (Ley 34/2002), art. 16, texto vigente desde el 23-01-2025. https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758
3. Reglamento (UE) 2022/2065 (DSA), arts. 6, 8, 11, 12, 16 y 17. https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32022R2065
4. CMS, sobre la DSA (qué es «difusión al público»). https://cms.law/en/esp/publication/el-reglamento-de-servicios-digitales-reglamento-ue-2022-2065-cuestiones-generales-y-regulacion-de-la-responsabilidad
5. Cuatrecasas sobre la sentencia del TJUE C-433/20 (Strato, 2022). https://www.cuatrecasas.com/es/spain/propiedad-intelectual/art/ue-sentencia-tjue-limite-de-copia-privada-en-la-nube-y-compensacion-equitativa
6. Condiciones de Ultimate Guitar (§6.2-6.4; última actualización, 24-08-2026). https://www.ultimate-guitar.com/about/tos.htm
7. Aviso legal de LaCuerda. https://lacuerda.net/Extras/legal.php
8. Aviso legal de Cifra Club (no se dejó leer de forma automática). https://www.cifraclub.com.br/aviso-legal.html
9. Mais Goiás: Cifra Club, UBEM y Roberto Carlos. https://www.maisgoias.com.br/entretenimento/musica/roberto-carlos-quer-retirada-de-letras-de-sites-de-cifras-e-nega-que-seja-censura/
10. Directiva (UE) 2019/790, art. 2.6, art. 17 y considerandos 62-67. https://eur-lex.europa.eu/legal-content/ES/TXT/HTML/?uri=CELEX:32019L0790
11. Structured Asset Sales contra Sheeran, Tribunal de Apelación del 2.º Circuito de EE. UU., 2024. https://law.justia.com/cases/federal/appellate-courts/ca2/23-905/23-905-2024-11-01.html
12. Chordify: «Does this not infringe copyright?». https://support.chordify.net/hc/en-us/articles/360001420738-Does-this-not-infringe-copyright
13. Myers, «Possible solutions to the guitar tablature problem», Cardozo AELJ (2012). https://www.cardozoaelj.com/wp-content/uploads/2012/07/Myers.pdf
14. Kluwer Copyright Blog sobre la sentencia del TJUE C-117/15 (Reha Training). https://legalblogs.wolterskluwer.com/copyright-blog/cjeu-reha-training-v-gema-court-of-justice-of-the-european-union-c-11715-31-may-2016/
15. RDL 24/2021, art. 73. https://papelea.com/es/leyes/real-decreto-ley-24-2021/libro-cuarto_titulo-iv_capitulo-1%C2%BA · BOE: https://www.boe.es/buscar/act.php?id=BOE-A-2021-17910
16. Ultimate Guitar, sobre sus licencias. https://www.ultimate-guitar.com/article/blog/licensing
17. Condiciones de Songsterr. https://www.songsterr.com/a/wa/terms
18. Marketplace (2019), sobre el negocio de las letras. http://www.marketplace.org/story/2019/07/09/song-lyrics-are-a-big-business-online-heres-how-it-works/
19. FreeAPIHub, ficha de la API de Musixmatch. https://freeapihub.com/apis/musixmatch
20. Hilo de Audacious (2015) con la respuesta de Musixmatch sobre su licencia mínima. https://redmine.audacious-media-player.org/issues/502
21. Jentic, preguntas frecuentes sobre la API de Musixmatch (condiciones para mostrar letras). https://jentic.com/apis/musixmatch.com/musixmatch.md
22. NMPA (2013), contra las 50 webs de letras sin licencia. https://prnewswire.com/news-releases/nmpa-takes-action-against-top-50-unlicensed-lyric-sites-231482741.html

Nota: musixmatch.com y lyricfind.com no dejan que las herramientas automáticas lean sus páginas, así que sus condiciones salen de fuentes de terceros. Confírmalas con su equipo comercial.
