# Peticiones de Víctor — Cancionero y repertorios

> Lo que ha pedido Víctor, con sus palabras, y en qué punto está cada cosa. **Léelo antes de tocar el Cancionero
> y actualízalo el mismo día** (estado y quién la lleva). Existe porque él lo pidió: *«pon todo en el repo y el
> brain, que no se escape ni una de mis peticiones de hoy»* (11-nov-2026).
>
> Quién trabaja hoy:
> - **Chat principal**, «Lady & Musikeeo» (`session_01Xz8Y5FKc9f4rAYC1FqJKNu`): habla con Víctor y reparte.
> - **Sesión 1**, «Musikeeo · Cancionero y repertorios» (`session_01Xz8Y5BspXc4NpxbPD2PtwC`): importar, rediseño de UI/UX y teleprompter.
> - **Sesión 2**, «Musikeeo · Editor rico y enlace para músicos» (`session_01Xz8Y5E2TVuFeV5VZYeLdBs`): editor rico, vistas Cifrado y Bloques, diagramas y enlace para el grupo.
>
> Contexto: el sábado 14-nov-2026 hay dos bolos en el RTF Pallejà, Lady Jarana a las 12:30 y Cataleya a las 19:00. Todo lo marcado «HOY» es para llegar a ellos.

## 🌙 Plan de la noche del 11 al 12-nov (Víctor duerme)

*«Te dejo por la noche trabajando en todo, estructura bien el plan porque son muchas cosas. Voy a dormir y mañana espero
poder subir ya los reper y gozar y enviárselo a los músicos, y que flipen en colores.»*

**Objetivo al despertar:** subir los repertorios de Pallejà sin problemas, abrirlos en Cifrado y mandar el enlace al grupo.

Las sesiones deciden con criterio; él no contesta hasta mañana. Cada cosa se prueba en un iPhone simulado y sin red, y se sube a `main`.

| # | Qué | Quién | Por qué ahora |
|---|---|---|---|
| 1 | Subir .json en PC e iPhone; varios a la vez; pegar una copia | sesión 2 | ✅ d262c84, probado en producción |
| 2 | Importador de copias: artista, «Otras versiones», tonoAlt, «(versión …)» aparte, notas, ⭐, hueco y hoja del bolo | sesión 2 | ✅ 85498c9, probado en producción con las 166 canciones |
| 3 | Enlace del grupo de lujo: longitud para WhatsApp, QR, iPhone/Android, oscuro, sin red | sesión 2 | ✅ 34bdce4 + 95fcd60 + de31c67. Sin los apuntes de Víctor, con todas las partes y acordes; unos 2.400 caracteres. Probado sin red en producción |
| 4 | Rediseño (se construye el mejor concepto): cabecera del repertorio, ajustes por momentos, listas personalizadas, PC a lo ancho | sesión 1 | ✅ repertorio (C), canción (A), Canciones (B), Tocar limpio, listas personalizadas y menú del Cancionero en PC (31180ba), repertorio a lo ancho en PC con la canción al lado (9e6db10). Probado en producción a 1440 |
| 5 | Legal: avisos de derechos, cláusula, «solo para tu grupo» | sesión 2 | ✅ 7e4be6e |
| 6 | Teleprompter: negrita por tiempo + «Escuchar» opcional | sesión 1 | ✅ «Línea a línea» (e9d8e3d), sin red ni micro. «Escuchar» queda para más adelante |
| 7 | Comprobar que la importación encaja con etiquetas, favorita, tonoAlt y notas | sesiones 1 y 2 | ✅ los cuatro ficheros en producción con sus 166 canciones: nada perdido ni duplicado (91c1a67) |
| 8 | Que la página no se quede en blanco si se abre durante un despliegue (recarga una vez) | chat principal | ✅ 1878c39, probado en local con piezas rotas a propósito |
| 9 | Apuntes («Fuente:», «Otras versiones:», «Tono sin verificar»…) en pequeño y gris en el lector, Tocar y Cifrado; «Rueda» y las partes con coletilla con los acordes grandes | sesión 1 | ✅ 329e96d + ad2d0a5 |
| 10 | «Próximo bolo»: el mismo día va primero el de hora más temprana (Lady 12:30 antes que Cataleya 19:00) | sesión 1 | ✅ 329e96d |
| 11 | Tono de la ficha en Tocar y en «Dame el tono» (Marcha salía en A por leer la rueda; es E), también en canciones sin acordes, y la cejilla de la ficha a la vista en Tocar | sesión 1 | ✅ e96d23f + e669df9. Probado en producción a las 01:30: Marcha E, Tu Calorro E, Sarandonga E, Si antes B, Mi estrella blanca G con «Capo 3 · formas de E», Tusa Bm y 19 días E |

**Cierre (02:30):** el plan de la noche está hecho y probado en producción. Las dos sesiones terminaron y no hay más revisiones programadas. Lo que queda es para después del bolo o necesita a Víctor:
- reordenar las listas y ponerles icono;
- la duración de tu versión midiéndola al grabarte (§8b);
- «Escuchar» en el teleprompter;
- el enlace corto que se actualiza solo (necesita reglas);
- mapear «(versión X)» al campo versión.

La nota de la mañana está en Aura («Buenos días: el Cancionero, listo para Pallejà»), y los ficheros están en el chat.

### Guía para Víctor por la mañana (al día a las 13:55 del 12-nov)

*«Me has enviado 20 archivos. ¿No me puedes enviar uno solo para todas las canciones y luego los dos repers? Mejor borro todo lo que tenía y subo lo nuevo.»*

1. Abre musikeeo.com → Cancionero. Si no ves lo nuevo, cierra la app del todo y vuelve a abrirla.
2. En «Tus canciones», toca **⋯ → Borrar todo y empezar de cero → Borrar todo**. Antes descarga una copia, vacía canciones, repertorios y listas, y abre Importar (d198395).
3. **Abrir archivos** con los tres ficheros, uno a uno o de golpe. Con el 2 y el 3 sale «Ya las tenías», pero el repertorio se crea igual.
   1. `1-Todas-mis-canciones.json`: las 397 canciones (BBDD, tonos actualizados y las dos partes de Notion).
   2. `2-Repertorio-Lady-Jarana-Palleja.json`: 18 temas, hueco de 60 min.
   3. `3-Repertorio-Cataleya-Palleja.json`: 17 temas, hueco de 60 min.

   Se generaron con la propia app (sus importaciones de la noche y «Guardar una copia») y se probaron en producción con un móvil con datos viejos, borrando todo y subiéndolos: 397 canciones, 2 repertorios y nada duplicado.
4. Revisa el orden y los tonos en **Cifrado**. Lady Jarana suma 64 min para 60.
5. **Compartir** → Enviar (sin letra por defecto). Cada músico lo abre una vez con cobertura y luego le funciona sin red.
6. Antes del bolo, abre los dos repertorios una vez con cobertura.

Arreglo de paso: en un iPhone de 390 px, el ⋯ de «Tus canciones» se salía de la pantalla (x = 393); ahora «Elegir» va solo con su icono en el móvil.

Estado: ✅ hecho y en musikeeo.com · 🔧 en marcha (quién) · ⏳ pendiente · 👤 lo tiene que hacer Víctor

## 1. El cancionero como lo tenía en Notion, «al siguiente nivel» ✅

*«Necesito un sitio donde tener mi reper como lo tenía en Notion, que lo tenía todo organizado por tonos, cantante,
letra dentro… pero al siguiente nivel y actualizado a las cosas que he ido necesitando… bien adaptado a móvil, muy
pensado para yo poder ver y organizar y elegir canciones para reper… y donde tener mis repertorios. En Musikeeo.»*

Hecho:
- **Ficha de cada canción**: tono que suena, capo/formas, quién canta, grupo, estilo, energía, estado y tempo.
- **Biblioteca**: filtros, agrupar y elegir varias canciones para llevarlas a un repertorio.
- **Repertorio**: duración, reparto de voces y aviso de tono repetido seguido.
- **Copia de seguridad** en .json.

Su BBDD tiene 166 canciones: 61 confirmadas, 103 de Notion y 2 extra.
- Copia completa: `cancionero-victor.json`.
- Un archivo por set: `Lady-Jarana-Palleja-12h30.json` y `Cataleya-Palleja-19h00.json`.
- Se le mandaron por el chat. **No van al repo**: es contenido privado suyo.

## 2. Repertorios sin conexión ✅

*«Es importantísimo que funcionen los repertorios sin conexión.»*

Probado con Playwright con la red cortada: inicio, repertorio, Tocar y canción abren. Se arregló además:
- los objetos 3D y los logos ya están en el precache;
- el aviso de cookies ya no tapa la canción en Tocar.

**Toda función nueva tiene que seguir funcionando sin red.**

## 3. Añadir canciones rápido desde el repertorio, e importar PDF ✅

*«Añadir una canción nueva desde aquí no funciona y debería poder, para hacerlo rápido, y también debería poder importar PDFs.»*

En la hoja «Añadir canciones»:
- crear la canción con el título, también sin red;
- añadirla desde el catálogo;
- importar PDF o Word directamente a ese repertorio.

## 4. Acciones claras con su icono 3D y logos de las webs de acordes ✅

*«La UI/UX también podría ser mejor: el icono de LaCuerda, de Google, y las acciones bien claras con su icono 3D.»*

En Nueva canción:
- **Acciones grandes con objeto 3D**: Pegar, Abrir archivo (PDF/Word/texto) y Desde un audio.
- **«Buscar los acordes en»** con logo: Google, LaCuerda, Ultimate Guitar, Cifra Club y Chordify.

## 5. Mapa de musikeers (CARTO) ✅ / 👤

*«Acabo de añadir la CARTO API key… esto no funciona del mapa.»*

- **CARTO** ✅: la clave está en Vercel como `CARTO_API_KEY` y `vite.config.ts` la copia a `VITE_CARTO_KEY`.
- **«No se ha podido guardar»** 👤: faltan las reglas de Firestore. Hay que ejecutar en su PC, en la carpeta de Musikeeo:
  ```
  git pull origin main
  firebase deploy --only firestore --project musikeeo-8e766
  ```
  Esto también hace falta para que el cancionero se guarde en la cuenta. Se le ofreció una GitHub Action que las despliegue sola; no se crea hasta que diga que sí.

## 6. Repertorio para revisar y ordenar mientras se trabaja ✅

*«Dame ni que sea un puto artefacto que pueda mover y ordenar, con sus tonos y acordes. Importante.»*

**Página «Reper Pallejà»** (claude.ai/artifact/SAoGDXZdxkFZUS9eDX5dye):
- ordenar arrastrando, cambiar tonos, banquillo y notas;
- acordes editables (*«que pueda escribir los acordes, aunque sea tipo G - F - Am - C»*);
- duración real de cada tema y total del set, con BPM.

Sus cambios se guardan en la base de datos de la página: colección `sets` y documento `canciones/extra`.

**Página «Cifrado Pallejà»** (claude.ai/artifact/5wqABzzC6Vq8P6YN1fTG87): hoja provisional para los músicos, sin letra.

## 7. Duración real de cada canción ✅

*«Ponme tiempo aproximado de cada canción, según lo que dura cada canción real: eso es súper importante también para hacer repertorios.»*

- Duración del catálogo de Apple en cada fila y en el repertorio, con el total del set.
- Se puede escribir a mano para tu versión.
- Botón «Poner tempo y duración».

## 8. Tus versiones de una canción ✅

*«Hay que poder tener tus versiones: coges una canción original, por ejemplo haces la mitad, la borras, y cuando busques esa canción se busca con todos los ajustes o ediciones que le hayas hecho.»*

«Hacer mi versión» crea una copia unida a la original:
- tiene nombre, tono, cejilla, recortes y duración propios;
- al buscar salen primero tus versiones.

### 8b. La duración de tu versión, inteligente o medida grabándote 🔧 (sesión 1)

*«Si hago mi versión, debería recortarse lo que dura la canción. Debería ser inteligente o poder ajustarlo yo según
cuando grabe, por ejemplo, una canción en vivo. ¿Eso lo hemos implementado, de que me pueda escuchar?»*

- **Ajuste automático**: al recortar una versión, la duración se ajusta sola en proporción a lo que se quita (líneas o compases); se puede corregir a mano.
- **Medir grabándote**: hoy «Sacar acordes de un audio» ya lee una grabación (archivo) y saca duración, tempo y acordes. Falta aplicarlo a una versión y **grabar con el micro dentro de la app**. Para eso hay que abrir `microphone` en `Permissions-Policy` de `vercel.json`, que hoy lo cierra.
- **Respuesta a «¿me puede escuchar?»**: todavía no en directo. El teleprompter (§10) es eso mismo.

## 9. BPM y modo Auto en Tocar ✅ (HOY)

*«Que los bpm de la canción que estemos tocando se vinculen con info de cada tema… cuando le des a "tocar en vivo" vaya
bajando al ritmo en función de los bpm… las canciones más rápidas que bajen más rápido… también poder elegirlo… como modo auto.»*

En Tocar:
- «Auto» baja la hoja según la duración o, si no hay, según el tempo;
- ± para ajustar en directo, que se guarda por canción;
- se para con un toque y se arranca con el pedal.

Tempo de 25 de los 32 temas de los sets, sacado de la muestra de Apple.

## 10. Teleprompter ✅ (sesión 1, en main, 12-nov; decidido: negrita por tiempo + «Escuchar» opcional en Safari con red)

*«Y si te pudiera escuchar, ya sería la polla, para que fuera interpretando la canción y se fuera poniendo en negrita
mientras cantas cada parte, para que sea rollo teleprompter.»*

Primero se investiga qué se puede hacer en iPhone/Safari y sin red, se le explica en 5 líneas y luego se construye.

✅ **Hecho el 12-nov: «Línea a línea» en Tocar** (⋯ → Línea a línea; se recuerda en el móvil).
- La línea que toca cantar sale en negrita, con sus acordes; las demás, apagadas.
- Va por tiempo, como Auto: la marca baja con la hoja, empieza por la primera línea y la última también llega.
- Se corrige tocando una línea (sin parar la hoja) o con el pedal: adelante = siguiente línea; atrás = la anterior. Al final de la canción, el pedal pasa a la siguiente.
- Sin red, sin micro. Con «que quepa» no se usa (no hay que bajar la hoja). Motor en `src/lib/teleprompter.ts`.
- Probado en iPhone 13 simulado: pedal, toque, Auto (de la línea 9 a la 14 en 12 s) y sin red.
- «Escuchar» (Safari con red) queda para después: opcional y solo con cobertura.

## 11. Rodrigo con cerebro (para el lanzamiento, NO hoy) ✅ plan / ⏳

*«Poder hacer todo esto de meter también los repers con Rodrigo, que tenga también su brain como Aura y sepa de ti,
tus canciones, tus gustos, tus estilos… al conectarlo a Spotify también ganaría mucha info… tener la potencia de
Claude o ChatGPT conectado a Musikeeo… para mí no me hace falta, pero para lanzamiento es muy interesante.»*

- El plan está en `docs/PLAN-RODRIGO-CEREBRO.md` y en el brain de Aura (`musikeeo/rodrigo/roadmaps`).
- **Además:** *«debería funcionar con Anthropic Rodrigo, ya le puse la API… quiero probarlo y que funcione, pero no hoy»*. Hay que comprobar el nombre de la variable en Vercel, hacer que `/api/chat` use Claude y probarlo.

## 12. El repertorio de Pallejà, de su lista a mano ✅

Leído de su libreta (11-nov). Está en:
- las notas de Aura: «Lady Jarana · RTF Pallejà 14/11 · 12:30» y «Cataleya · RTF Pallejà 14/11 · 19:00»;
- la página Reper Pallejà;
- los .json de cada set.

Pendiente de confirmar con él:
- «Melendi» en Cataleya: ¿Eres tan dura o Caminando por la vida?
- Mix Don Omar: Dile con Bandolero o con Pobre diabla, y quién canta.
- La Morocha en Lady: la canta Mafe en Abm; ¿quién la canta en Lady?
- Tono de Mafe en 19 días.
- Qué versión tocan de El toro y la luna y de La Marina. **Marcha la toca en E** (*«Marcha la hago en E»*, 11-nov).
- **El set de Lady suma 1 h 4 min y el hueco es de 60 min.**

## 13. Importar sin que el arsenal se convierta en un repertorio ✅

*«Lo he subido como repertorio y ese es TODO MI ARSENAL… esto no es lo que he pedido al inicio.»*

- Una copia .json va siempre a Canciones, más sus repertorios.
- Desde un repertorio, con más de 40 canciones, pregunta antes de meterlas.
- Borrar un repertorio no borra las canciones.

## 14. Rediseño de ajustes, menús, filtros y botones ✅ primera vuelta (sesión 1, en main)

*«Buf, dios mío, todo ese mega popup de ajustes, son todos importantes. Debemos hacer un menú derecho, y un buen menú
inferior para móvil, o también menú izquierdo en móvil quizás que se abra, con todas estas opciones, y mejorar mucho la
organización. Pongámonos en la piel de un músico: esto son 3000 ajustes y debe ser rápido… Tenemos mil skills potentes
en Aura Storage.»*

*«Los filtros y eso de arriba pónmelos en iconos, y lo de Lady y Cataleya son grupos, ponles un iconito o algo… el
UI/UX de lo que son menús, filtros y botones está fatal tío, revisión completa.»*

Plan, ordenado por momentos del músico:
- **En el escenario, siempre a la vista**: siguiente, Auto, tamaño, tono y «dame el tono».
- **Preparando una canción**: barra inferior con 4-5 iconos y hojas cortas.
- **Gestión**: menú lateral o «⋯».
- **Cabecera de Canciones**: filtros con iconos, grupos con su icono y el mantenimiento («Poner portadas», «Poner tempo…») fuera del primer plano.
- **Objetivo**: 1-2 toques para tono, Auto o pasar de canción.

Antes de construir se sueñan 3 conceptos en Aura Studio para que elija. Gasto aprobado: *«sí, o más, las que hagan falta»*.

**Soñado la noche del 12-nov** (Aura Studio, proyecto Musikeeo, lienzo «Cancionero · color», ≈ 0,60 €):
- [0 · Cabecera del repertorio, tres variantes](https://firebasestorage.googleapis.com/v0/b/aether-app-59bd1.firebasestorage.app/o/studio-durable%2Femptuytnlrt3wzuccxgw55gw%2Fmwcsub18_i29r.png?alt=media&token=26b9cf01-d3e5-450c-bd47-c681907fb294):
  1. tarjeta del bolo;
  2. barra compacta;
  3. pestañas con un «Tocar» flotante.
- [A · Barra de herramientas](https://firebasestorage.googleapis.com/v0/b/aether-app-59bd1.firebasestorage.app/o/studio-durable%2Femptuytnlrt3wzuccxgw55gw%2Fmwcs5oe8_fnio.png?alt=media&token=b873f17e-0b3c-49fa-988b-394017241570): en la canción, 5 iconos (Tono, Cejilla, Ver, Tempo, Más), cada uno con una hoja corta.
- [B · Mando flotante](https://firebasestorage.googleapis.com/v0/b/aether-app-59bd1.firebasestorage.app/o/studio-durable%2Femptuytnlrt3wzuccxgw55gw%2Fmwcsakvj_cyi5.png?alt=media&token=d7facf55-a6c3-4f78-8662-1b833f8e8160): Tono ±, Aa, Auto y ⋯, y un panel lateral con «Preparar» y «Gestión». Los filtros son iconos con su número.
- [C · Por momentos](https://firebasestorage.googleapis.com/v0/b/aether-app-59bd1.firebasestorage.app/o/studio-durable%2Femptuytnlrt3wzuccxgw55gw%2Fmwcsrsc2_gkkt.png?alt=media&token=522f0e35-ffb2-4436-b043-611c587ad0e6): «Tocar» grande; la canción en Ensayar · Tocar · Ficha; Tocar en oscuro.

**Lo que se construye esa noche** (Víctor dormía y ya había dicho «las que haga falta»; si no le gusta, se cambia):
- **Repertorio = C.** «Tocar» grande con compartir, una línea con la barra de tiempo y quién canta, «Hoja del bolo» y Lista · Cifrado · Bloques fijo al bajar.
- **Canción = A.**
- **Canciones = B.** Filtros en iconos con número, grupos como avatares y el mantenimiento detrás de ⋯.
- **Tocar**: su barra de ahora, más limpia.

Va después del .json y del importador, y sin romper Tocar, el modo sin red ni el enlace del grupo. Si a las 7:00 no está redondo, se queda en una rama.

✅ **Hecho el 12-nov** (en `main`, probado en iPhone 13 simulado y sin red):
- **Repertorio**: cabecera nueva (C). «Tocar» grande con el micro 3D y compartir al lado; una línea con fecha, temas y duración (en rojo si te pasas del hueco) y su barra; quién canta en píldoras; «Hoja del bolo» se despliega. Fecha, hueco, compartir y borrar, detrás de ⋯. Al bajar, Lista · Cifrado · Bloques se queda arriba con un ▶ amarillo pequeño.
- **Canción**: barra de abajo con 5 botones (Tono · Cejilla · Ver · Bajar/Parar · Más); cada uno abre solo su parte de los ajustes. Fuera la barra de arriba.
- **Canciones**: filtros en iconos redondos (canta, tono, estilo, energía, estado, etiquetas) que al activarse muestran lo elegido; Lady Jarana y Cataleya con su icono y su color. Completar letras, Poner portadas, Poner tempo, Importar y Guardar copia, en ⋯ «Tu cancionero» (punto amarillo si faltan letras).
- **Tocar**: abajo, anterior · **Auto / Bajar sola** (amarillo) · siguiente; encima Tono ± y «Dame el tono»; tamaño, que quepa y la cuenta 1·2·3·4 detrás de ⋯.
- **Toques**: cambiar el tono, 1 (2 si la barra está escondida); Auto, 1; siguiente canción, 1 (o deslizar).
- Cambio respecto a lo anterior: en Tocar, el amarillo pasa de «Dame el tono» a Auto (una sola acción amarilla por pantalla).
- Falta: listas personalizadas y PC a lo ancho (§21c).

## 15. Editor rico «con la potencia de Aura notas» ✅ (sesión 2, en main)

*«NO PUEDO EDITAR esto, debería poder cambiarlo a mi gusto, poner negritas, títulos… ponle la potencia de Aura notas, te paso el repo.»*

- Se trae de `victortorresa94-del/aura-project-2` (Tiptap: `src/components/notes/BlockEditor.tsx`, `MobileFormatToolbar`, `SlashCommand`, `Callout`).
- Va en la canción y en una «hoja del bolo» de cada repertorio.


**Estado (12-nov):**
- ✅ **Formato en la letra:** botones Negrita, Resaltar, Título y Aviso encima del texto. Escriben `**así**`, `==así==`, `# Título` y `> Aviso`, y el motor de acordes los respeta. El tono, la cejilla, «que quepa», Tocar y el modo sin red siguen igual.
- ✅ **Notas de la canción y Hoja del bolo:** editor Tiptap 3 con títulos, negrita, cursiva, subrayado, tachado, colores de fondo y de texto, listas, casillas, avisos en baldosa, enlaces y deshacer. Con «/» sale el menú de bloques. En el móvil, la barra va encima del teclado.
- ✅ **Dónde salen las notas:** en el lector, el escenario, Tocar y el enlace del grupo. Se pintan sin cargar el editor.
- ⚠️ **Aura:** no se pudo añadir el repo de Aura a la sesión (permiso denegado). El editor está hecho desde cero sobre la misma base (Tiptap 3).
- 👤 **Reglas:** Víctor tiene que desplegarlas (campo `notas`) para que se suba a la cuenta.

## 16. Vista con todo el set y los acordes debajo, y tipos de vista ✅ (sesión 2, en main)

*«Quiero poder tener una vista donde vea todas las canciones en orden y con sus acordes debajo, como una forma de ver el
reper entero para el en vivo, porque en verdad es la que yo uso más, para no tener que entrar en cada canción y solo
entrar a las que no me sé. Deberían ser distintos tipos de vista aquí.»*

*«Esta vista misma de repertorio es la que debemos añadirle más cositas»* (captura del repertorio de Lady Jarana).

En el repertorio:
- vistas **Lista · Cifrado · Bloques**;
- aviso de tiempo frente al hueco del bolo;
- «Compartir con el grupo» y «Hoja del bolo».

En Canciones: también vistas Lista y Cifrado.


**Estado (12-nov):**
- ✅ **Selector «Lista · Cifrado · Bloques»** en el repertorio (`?vista=`) y en Canciones.
- ✅ **Cifrado:** el set seguido con tono grande, ficha, notas, partes y avisos, sin letra. Los dibujos de acordes repetidos salen una vez con «(xN)». Tocar un título abre la canción, y al volver la hoja sigue donde estaba.
- ✅ **«En directo»:** pantalla completa, oscuro, Auto con velocidad, tamaño, pedal y pantalla encendida.
- ✅ **Hueco del bolo** (`repertorio.hueco`): «Te pasas 4 min», «Te sobran X» o «Clavado al hueco».
- ✅ **«Compartir con el grupo» y «Hoja del bolo»** en el repertorio.
- ✅ **Lista desplegable:** cada fila (del repertorio y de Canciones) se despliega para ver sus acordes y notas sin salir.

## 17. Compartir el repertorio con los músicos ✅ (sesión 2, en main)

*«Ya quedaría muy pro enviárselo a los músicos así… si se lo mando a los músicos en un link, sería la polla, desde
donde tengan la partitura, toda la canción, etc.»* (primero que él corrija tonos y orden)

*«¿Ya has hecho que se puedan compartir con los músicos sin que tengan que crear usuario, puedan ver todo, etc.? Y cifrado todo sin letra.»*

- Enlace que se abre sin cuenta y en solo lectura, con cifrado sin letra por defecto.
- Tiene que funcionar aunque no estén desplegadas las reglas: datos en el fragmento # o documento público con `get` público y `list` solo del dueño.


**Estado (12-nov):**
- ✅ **El enlace:** `/grupo#…` lleva el set comprimido tras «#», así que no pasa por el servidor. Funciona sin reglas y, una vez abierto, sin red. Cifrado por defecto; con letra solo si se elige.
- ✅ **Página del músico:** oscura, con Lista o Cifrado. El escenario se pasa deslizando, con tono ± y tamaño ±, pedal y diagramas.
- ⏳ **Enlace corto que se actualice solo** (documento público con `get` público): queda para cuando estén las reglas. Hoy, si cambia el set, se reenvía el enlace.


**Noche del 12-nov:**
- ✅ **Set real de 18 temas** (cifrado, notas y hoja del bolo): el enlace tiene 1.723 caracteres.
- ✅ **Producción**: probado en musikeeo.com (redirige a www y conserva el «#»), en iPhone y Android simulados, sin red y en oscuro.
- ✅ **Nuevo**:
  - «Código QR» para el ensayo;
  - longitud del enlace a la vista;
  - «Formas» en la página del músico;
  - aviso «Solo para tu grupo; no lo publiques» con letra;
  - `/grupo` sin indexar.
- 👤 **Víctor**: probar que WhatsApp lo abre entero, mandándoselo a sí mismo.

## 18. Letra y acordes de todas las canciones, como en LaCuerda 🔧 (sesión 1)

*«Necesito de todas las canciones poder sacar todo como en LaCuerda, con la letra y acordes de cada parte.»*

**Musikeeo no baja letras de webs** (derechos; regla del Cancionero). Lo que se hace:
- **Sus ~45 papeles de Google Drive**, importados desde el iPhone. La importación tiene que:
  - quitar el número delante («12 - COMO CAMARÓN»);
  - repartir los mixes («TU CALORRO + LA RAJA»);
  - rellenar la ficha sin borrarla.
- **Asistente «Completar letras»** para las que no tienen papel.

✅ **Los papeles caen en su tono** (sesión 1, b96f65d, 12-nov). Al importarlos, cada papel rellena su ficha y suena en el tono de la ficha: No puedo vivir sin ti de C a G, Sarandonga de C a E… Si el papel ya está en las formas del capo de la ficha, no lo mueve; si hay duda, no lo toca y le pone la etiqueta «Revisar tono». Si el mismo tema llega en varios papeles, se queda el más completo; los mixes con «+» entran como «Mix: …». Al terminar dice cuáles movió, cuáles revisar y cuáles faltan.

Están en estas carpetas de su Drive:
- «2 / Música & Letras»;
- las de los números (Calafell y Cataleya);
- los PDF de LaCuerda.

Sin papel: La Morocha, La Marina, Coti x Coti, Marcha, La tortura, Si antes te hubiera conocido, El toro y la luna, Tusa, Lágrimas negras, 19 días y El Cantante.

## 19. LaCuerda en «Falta la letra», y pegar bien ✅ (sesión 1, en main)

*«¿Por qué no sale LaCuerda aquí en las opciones?»*

*«Me pone el link para que salga y la copie… pero si me pones que cuando lo copie se copie bien, con el mismo color y todo de los acordes. Sería la polla copiar el link de los acordes.»*

**LaCuerda en «Falta la letra»**: volver a ponerla con su logo. En el móvil bloquea copiar, así que hay que buscar cómo.

**Pegar bien**: leer el `text/html` del portapapeles para que cada acorde quede encima de su sílaba, con secciones y tablaturas.

**Pegar el enlace**: el servidor trae la página con las protecciones de `api/_descargar.ts`.
- Solo para su cancionero privado.
- Antes hay que revisar las condiciones de uso de esas webs y decirle el riesgo.

**Decisión de Víctor (11-nov):** no se baja nada de esas webs.
- *«De momento, pues eso: tocará copiar y pegar, y que se pueda pegar bien el formato al menos. Hay que revisar si eso es legal.»*
- Se copia y se pega con formato perfecto, y el enlace se guarda en `ficha.enlace`.
- Revisión legal hecha: `docs/LEGAL-CANCIONERO.md`.

✅ Hecho (11-12-nov): LaCuerda la primera en «Falta la letra», con logo y el truco del móvil («Aa» → «Mostrar lector» para poder copiar); todas las webs con su logo. Al pegar se lee el formato de la web (`lib/pegado.ts`: se queda con el bloque `<pre>` más grande), así cada acorde cae encima de su sílaba. «Su página» abre `ficha.enlace` si la ficha lo tiene. **Completar letras** (en ⋯ de Canciones): va de una en una por las que no tienen letra, primero las del próximo bolo; al pegar, cae en el tono de su ficha y pasa a la siguiente.

### 19b. Buscador propio de canciones escrito por la comunidad ⏳ (plan, sin construir)

*«Tendremos que hacer que la gente pueda usarlo como LaCuerda: necesitamos un buscador propio de canciones donde la gente las vaya escribiendo, como en Cifra Club.»*

Antes de diseñarlo hace falta el informe legal:
- licencias de letras (SGAE, editoras, LyricFind/Musixmatch);
- el art. 17 de la Directiva 2019/790;
- publicar solo acordes frente a letra completa.

## 20. Diagramas de acordes ✅ (sesión 2, en main)

*«Deberíamos tener esa capacidad de poner el acorde y poder verlo.»* (captura de una web con el diagrama de «A» y el botón «Cambiar»)

- Al tocar un acorde sale su diagrama de guitarra en SVG, con «Cambiar» para otras posiciones.
- Respeta tono y cejilla, funciona sin red y aparece también en el enlace para los músicos.


**Estado (12-nov):**
- ✅ **El motor** (`lib/diagramas.ts`): calcula las posturas con una tabla propia y las de siempre van primero.
- ✅ **El dibujo:** SVG con dedos, cejilla, × y ○.
- ✅ **Tocar un acorde** en cualquier hoja abre su diagrama con «Cambiar». Respeta el tono y la cejilla, y funciona sin red y en el enlace del grupo.
- ✅ **«Ver acordes»** en la canción: todos en fila.
- ⏳ **Ukelele y piano:** solo hay guitarra.

## 21. Organizar por bloques, como en Notion y en las tareas de Aura ✅ vista y campos / ⏳ importar Notion (chat principal)

*«Al igual que hacía en Notion, quiero poder organizar por bloques, como hago en Aura con mis tareas, y así poder
organizar según las categorizaciones como "flamencas, rockeras", o por grupo, por cantante, por las que están en el mismo tono…»*

Vista «Bloques» (kanban):
- columnas por estilo, grupo, canta, tono, energía, estado o etiquetas;
- arrastrar a otra columna cambia ese dato de la canción.

Campos nuevos en la ficha:
- `ficha.etiquetas: string[]`, para sus categorías («Apto para»: Bodas, Tardeo, Privados, Samantha…);
- `ficha.enlace?: string`, con la URL de LaCuerda u otra web.

**Su Notion sigue conectado.** *«Revisa bien mi Notion, tío»* (11-nov): se hace una revisión completa de su espacio de Música, con bases de datos, repertorios, letras, enlaces y categorías, y se importa todo lo útil.
- Base de datos «BBDD Canciones», en Música › ordenar › Cataleya Flamenco.
- Campos: Apto para, Recurrencia, Tanda, Ensayar, Mood, Lo canta, Tono, Inicia en, Capo, Rueda, Letra y Comentarios.
- Sus páginas tienen enlaces de LaCuerda.
- Cuando estén los dos campos, el chat principal prepara una importación desde Notion con etiquetas y enlaces.


**Estado (12-nov):**
- ✅ **Vista Bloques** en Canciones y en el repertorio:
  - Columnas por Estilo, Grupo, Canta, Tono, Energía, Estado o Etiquetas; en el set, también por bloque.
  - Cada columna lleva su cuenta y su duración.
  - Arrastrar por el asa (también con el dedo) cambia el dato de la ficha, con Deshacer.
  - «Añadir aquí» crea una canción con ese dato ya puesto.
- ✅ **`ficha.etiquetas` y `ficha.enlace`:** en el editor de la ficha, el lector, los filtros y agrupar (`biblioteca.ts`) y las reglas.
- ✅ **Importar:** las etiquetas se suman a las que ya había. También valen las directivas `{etiquetas:}`, `{apto para:}` y `{enlace:}`.
- ⏳ **La importación de Notion:** la prepara el chat principal.

## 21b. Vista Tabla, versiones favoritas y las dos vistas de la cejilla ✅ (sesión 2, en main)

*«Esa vista completa bien chetada de todas las canciones tipo Notion, que la pueda ordenar por muchas cosas y cambiar
cada cosa… una vista tipo ClickUp como la que tenemos en Aura Business, con los atributos de cada canción cambiables ahí
también, ordenables por grupos.»*

*«Podríamos hacer algo donde guardar versiones que hacemos "favoritas"… a veces la canto en un tono o en otro.»*

*«Meterle cejilla para no tener que ponerla en "G"… poder tener las dos opciones, con cejilla en el 4… las dos vistas.»*

- **Vista Tabla**: cada celda editable, ordenar, agrupar y elegir columnas.
- **Versiones favoritas**: la versión marcada con ⭐ sale por defecto; se pueden guardar tonos alternativos.
- **Cejilla**: conmutador «Suena en G | Formas (cejilla 3)».

### Tonos que dijo él (12-nov) — mandan

- **Fuentes**: mandan las notas más recientes y las de Sant Joan.
- **El Merengue**: Gm.
- **MIX Bad Bunny**: F#m.
- **Mi estrella blanca con Cataleya**: E con cejilla 3, suena G.
- **Vivir mi vida**: «depende», así que hay dos versiones, la suya y la de Cataleya.
- **Nada de esto fue un error**: tiene dudas, así que van las dos opciones (G y A) en la nota.
- **Marcha**: E.

Un agente prepara `actualizar-tonos.json` con estos datos y las fuentes recientes: Lloret 24-oct, el popurrí de octubre y Sant Joan.


**Estado (12-nov, noche):**
- ✅ **Vista Tabla**, en Canciones y en el repertorio:
  - Cada celda se edita en su sitio: lo que se escribe, en la propia celda; lo que se elige, en una hoja con los valores que ya existen o uno nuevo.
  - Se ordena por cualquier columna, se agrupa (con cuántas y lo que duran) y se eligen las columnas.
  - El título queda fijo al deslizar de lado.
  - En el repertorio arranca en el orden del set.
- ✅ **Versiones favoritas** (`cancion.favorita`): «Versiones: Original · Víctor · Cataleya» con ⭐ en la canción. La favorita sale primero al buscar y al añadir.
- ✅ **Tono alternativo** (`ficha.tonoAlt`): «Tono G · también A».
- ✅ **Cejilla**: «Suena en G | Formas (cejilla 3)» en la canción, recordado por canción (también en Tocar). En el Cifrado, «En directo» y el enlace del grupo, «Suena | Formas».
- ⏳ **Títulos «X (versión Mafe)»**: entenderlos como versión de X. Queda para después del bolo (lo decide la sesión 1 en `emparejar()`).

## 21c. Listas personalizadas y el Cancionero a lo ancho en PC ✅ primera vuelta (sesión 1, 12-nov, en main)

*«Eso de aprender es muy importante, porque quiero poder hacerme mis listados dentro de canciones. Debo poder crear mis
listas personalizadas, como esa, la de aprender, o la de X artista… debe ser un auténtico menú súper bien pensado.»*

*«En PC no estamos aprovechando bien el espacio… está optimizado para móvil, y es la regla número uno del UI/UX, para
móvil. Pero en PC podemos sacarle más partido al ancho… y hacer un menú aquí bien guapo.»*

**Listas:**
- Fijas: Todas · Para aprender · Por ensayar · ⭐ Favoritas.
- De grupo.
- «Mis listas», manuales o inteligentes (con un filtro guardado).

**PC a lo ancho:** menú propio del Cancionero a la izquierda, contenido ancho (Tabla por defecto) y panel de la canción a la derecha.

**Móvil:** se queda como está.

✅ **Hecho la noche del 12-nov** (probado en iPhone 13 simulado, en PC a 1440 px y sin red):
- **Listas** (`lib/listas.ts`, `components/cancionero/Listas.tsx`, almacén `musikeeo-listas-v1` y `users/{uid}/listas`, con su regla en `firestore.rules`):
  - fijas: Todas · Para aprender · Por ensayar · Favoritas (salen del estado y de la ⭐ de la ficha);
  - una por grupo (de la ficha: Lady Jarana, Cataleya…);
  - «Mis listas»: manuales («Elegir» → «A una lista», o «Quitar de la lista» dentro de una) o inteligentes (filtros y/o búsqueda → «Guardar como lista»: se llenan solas);
  - en cada lista suya, ⋯: nombre y color, hacer un repertorio con ella, verla en Cifrado, borrarla (con Deshacer). Una canción puede estar en varias.
- **Móvil**: botón «Todas ▾» encima de los filtros, que abre la hoja de listas.
- **PC (≥ 1024 px)**: menú del Cancionero a la izquierda (Canciones, Repertorios, Importar, Sacar de un audio, Completar letras y todas las listas), contenido ancho y la Tabla por defecto.
- Falta: el panel de la derecha con la canción sin cambiar de página, reordenar las listas arrastrando, y poner un icono a cada lista (ahora llevan color).

### Decisión pendiente: los botones de webs en «Falta la letra»

El informe legal (`docs/LEGAL-CANCIONERO.md`) recomienda no mandar a copiar de webs concretas. Opciones:
- dejarlo así hasta lanzar;
- un buscador neutro;
- quitarlos.

Víctor aún no ha elegido; mientras tanto se queda como está.

## 21d. Grupos mal puestos y la canción en el móvil (12-nov, tarde) 🔧

*«En móvil aún no puedo editar una canción. Tampoco puedo cambiarle las características: por ejemplo, esta canción no es de Lady Jarana. Me has puesto un montón de Lady Jarana que NO SON. Además, la UI en móvil deja bastante que desear: todo apelotonado ahí, ocupando toda la página.»*

- **Grupos** ✅ (ficheros v2):
  - **Qué pasó:** «Lady Jarana / Cataleya» de la BBDD de Drive decía de quién es la versión (la de Víctor o la de Mafe), no el grupo. Se tradujo mal al campo Grupo, y Let it be venía además así de Notion.
  - **Regla nueva:** Lady Jarana = la base «Todos los temas Jaraneros» de Notion (32) + el set de Pallejà, en total 33 canciones. Cataleya = la «BBDD Canciones» de Cataleya en Notion (119) + su set de Pallejà, en total 116. El resto queda sin grupo (258). Las «(versión Mafe/Cataleya)» no son de Lady Jarana; las «(versión Víctor)» no son de Cataleya.
  - **Cómo se aplica:** borrar todo y subir los v2. Importar encima no basta, porque una ficha sin grupo no quita el grupo que ya hay.
  - **Probado:** en producción, 397 canciones, 2 repertorios y nada duplicado.
- **Editar en el móvil y la cabecera de la canción** 🔧 (sesión 1): «Editar» a la vista, que «Editar ficha» funcione en el iPhone, las píldoras en una línea y «Falta la letra» plegado.

## 21e. Tocar con todo a la vista y editar la canción ahí mismo (13-nov, víspera del bolo) ✅

*«Los botones que me importan son los del tamaño de letra, que quepa en la pantalla y todo eso. Lo de línea a línea… lo quisiera tener en la pantalla principal. Y lo de dame el tono puede ser un botón más pequeño. Me gustaría tenerlo todo en una misma pantalla. Igual que lo de bajar sola, que es un botón súper grande… para no tener que ir a los tres botoncitos. Y por defecto, en móvil, salen todas las letras y acordes súper gigantes. Y sigo sin poder editar: quiero hacer clic encima y editarla, como una nota, sin ir a otro menú, en vivo o no. Quiero darle a "Tono G" y cambiarle el tono, darle a "Lady Jarana" y cambiarla de grupo, que salga un desplegable, o a "Pop-rock"… Lo más importante para mí es poder editar todo el texto desde la misma vista principal, sin ir a otro menú y sin que se pierda el contexto ni el formato.»*

- **Tocar, una sola barra** ✅ (probado en producción): dos filas, Tono ± · «Dame el tono» pequeño · A− · A+ · que quepa · ⋯ / anterior · Línea · Auto · Bajar · siguiente. Ya no se esconde al bajar, y el lápiz de arriba edita la letra sin salir.
- **Tamaño por defecto en el móvil** ✅: *«Pero ves que en móvil sale gigante, tío. O sea, no tiene que salir tan grande de primeras.»* «Que quepa» con tope de 19 px en el móvil y 28 en tablet/PC, y suelo de 14 px en el móvil (`components/cancionero/medir.ts`: `topeQueQuepa`, `sueloQueQuepa`), en la canción y en Tocar. Vale también para lo ya guardado.
- *«¿Y por qué has usado otra sesión? Tienes que hacerlo tú todo.»* ✅ Desde el 13-nov a mediodía, una sola sesión hace todo el trabajo del Cancionero; no se reparte en otras.
- **Editar el texto ahí mismo** ✅ en la canción (sesión 2, 400ef37; en Tocar 🔧 lo monta la sesión 1): `components/cancionero/EditarEnSitio.tsx`. Tocar la letra (no un acorde) o «Editar» abre el texto tal cual (acordes, partes y formato intactos) en el mismo sitio, con el cursor en la línea tocada y a la altura del dedo. «Listo» guarda con Deshacer y vuelve a pintarla a la misma altura; «Cancelar» pregunta si hay cambios. Sin red, sin la barra de abajo mientras se edita, y la app no se recarga sola con una edición a medias. Props: `{ cancion, onGuardar(texto), onCerrar, lineaInicial? }`.
- **La ficha en su sitio** ✅ (sesión 2, 400ef37): `components/cancionero/FichaEnSitio.tsx`. Cada píldora abre un desplegable junto a ella y se guarda al elegir, con Deshacer. Tono: 12 notas, mayor o menor, y los acordes se mueven a ese tono. Grupo: casillas y «+ Nuevo». Canta, Estilo, Estado y Energía: uno, con «+ Otro». Capo: 0-9 con las formas calculadas. Lo que falta sale como «+ Tono / + Canta / + Grupo / + Estilo». El lápiz sigue llevando a la ficha entera. Probado en un iPhone 13 simulado y sin red.

### 21f. Más del 13-nov (mediodía) ✅

- *«Yo ya me había ordenado el repertorio que tengo cargado y se ha cambiado el orden.»*
  - **Causa:** importar una copia con un repertorio del mismo nombre le ponía el orden del fichero (`ImportarCanciones.tsx`).
  - **Arreglo** ✅: manda el suyo; si los órdenes no coinciden, elegir; y «Solo el orden», para recuperarlo desde una copia sin tocar las fichas.
- *«Una vez editada una canción del reper quiero poder guardarla como "guardar como canción" o "sustituir la canción guardada".»* ✅: «Guardar» o «Guardar como canción nueva» (una versión que la sustituye en ese repertorio).
- *«A todos estos atributos, si no les ponemos un icono, son dificilísimos de identificar.»* ✅: un icono en cada píldora.
- *«Quiero poder quitar canciones de un grupo y tener un listado de todas.»* ✅: en «Elegir», quitar o poner un grupo y borrar en lote; cada lista de grupo con su número.
- *«No tengo 500 canciones, tío, nos hemos flipado… de Lady Jarana tendré como 50 máximo.»*
  - **Página para revisarlas:** https://claude.ai/artifact/4GKkapTqsopXqJ825N2eJf (privada). Están las 397 por origen y la propuesta es quedarse con 194:
    - las 167 del Drive, sin «Orgullo», que es la misma que «Los Barrieros»;
    - 12 de la BBDD de Cataleya;
    - sus 16 propias.
  - **Fuera de entrada:** el tardeo de Víctor Luna (63), la lista de deseos de El Juergueo (70) y los títulos de setlists antiguos (69).
  - Lo que marca se guarda en la base de la página (`revision/actual`) y desde ahí descarga el archivo limpio.
  - Lady Jarana sale con 33. En su móvil salen más porque sigue con los grupos viejos.
- *«Si te paso letras y canciones, ¿me lo puedes organizar como necesito?»* Sí. «Los Barrieros»: estrofa 1 (aviso «sin guitarra»), pre-coro G – C, coro C – G7 – G7 – C, estrofa 2, pre-coro y coro. Va dentro del archivo limpio y en el chat para pegarla.
  - «Rueda 2: G – C» ya se lee como parte con acordes ✅ (`lib/acordes.ts`).

### 21g. Su cancionero entero, limpio (13-nov, 12:45) ✅

*«Sí, tengo muchísimas, pero es eso: hay muchas duplicadas. Mejor dame un JSON de todas mis canciones. Las de El Juergueo son canciones que me sé, que no toco con el grupo, pero que tengo en la recámara, y Víctor Luna es cuando toco yo solo, más acústico. La gracia de pedirte el formato de Barrieros es que me salga ya con negritas, colores y eso.»*

- **Archivo:** `Mi-cancionero.json`, mandado en el chat: 396 canciones.
  - Grupos: Lady Jarana 33, Cataleya 116, Víctor Luna 164, El Juergueo 83; 91 sin grupo.
  - Las 69 de setlists antiguos llevan la etiqueta «Setlist antiguo».
  - Las etiquetas «Víctor Luna» y «El Juergueo» pasan a ser grupos.
  - «Orgullo» se junta con «Los Barrieros» (El Barrio, tono A).
  - Lleva los dos sets de Pallejà.
- **Duplicadas:** en los datos solo había una de verdad (Orgullo = Los Barrieros). Las que él ve en el móvil vienen de importar varias veces encima. Por eso: Borrar todo y subir el archivo.
- **«Los Barrieros» con formato:**
  - partes de color (Estrofa en azul, Pre-coro en rosa, Coro en su baldosa amarilla) y, debajo de cada parte, una fila con sus acordes;
  - el aviso «Sin guitarra» en melocotón, los coros de la banda ==resaltados== y lo que se grita en **negrita**.
  - En A, su tono (su chuleta de Orgullo decía «Tu tono es A»; lo que pegó estaba en C).
- **Arreglo de la app (sesión 2):** una fila de acordes con guiones o barras es el resumen de la parte y ya no se reparte sobre la letra.
- **Probado en producción:** datos viejos → Borrar todo → importar → 396, grupos y sets correctos, sin palabras partidas.
- **Formato para las letras que mande:** `Parte:` en su línea, debajo los acordes de la parte con guiones, la letra, `> aviso`, `==coros==` y `**negrita**`.

### 21h. El enlace del grupo siempre al día, y la versión de cada músico (13-nov, tarde) ✅

> *«el enlace de musikeeo que comparto con los músicos… deben tener la opción de "duplicar" la canción y cambiar a la suya para poner sus apuntes… pero la "original" siempre debe estar actualizada al último cambio que lo haga de cada canción, o de orden.»*

- ✅ El enlace es `/grupo/{id}`: el set se publica solo en `compartidos/{id}` al cambiar una canción o el orden (`services/compartidosService.ts`), y el músico lo ve sin recargar.
- ✅ Cada músico puede «Hacer mi versión» de una canción, con sus apuntes. Se guarda en su móvil y le avisa si el original cambió.
- ✅ Sin red, el enlace abre con la última copia que vio.
- ⏳ Para que se actualice de verdad: entrar con su cuenta y desplegar las reglas (`compartidos`).

### 21i. Iconos, logos y colores de cada cosa, y columnas propias (13-nov, tarde) ✅ en musikeeo.com (d055a70)

> *«debería poder añadir un icono a cada grupo y proyecto musical. tanto algunos variados de la app como personalizado, para ponerle mi logo»*
> *«debería poder añadir desde aquí nuevas etiquetas, estilos, colores de cada cosa etc»*
> *«y de la misma forma, características o columnas nuevas y personalizadas a elegir entre check, etiqueta, número, texto..»*

- ✅ **Grupos y colores** (`components/cancionero/Catalogo.tsx`). Se abre desde la Tabla («Grupos y colores»), desde el ⋯ de Canciones y desde el pie de cada desplegable de la ficha. Tiene pestañas Grupos · Estilos · Etiquetas · Canta · Columnas, y en cada una:
  - crear uno nuevo aunque ninguna canción lo lleve todavía;
  - cambiar su color (7 pastel o «Automático»);
  - renombrarlo en todas las canciones o quitarlo, con Deshacer.
- ✅ **Icono o logo de un grupo** (`Aspecto.tsx`): 18 iconos 3D de la app o «Tu logo». El logo se guarda a 128 px y sale en la píldora, en la lista del grupo, en los filtros y en la cabecera de la Tabla agrupada.
- ✅ **Columnas propias** (`lib/camposPropios.ts`, `ficha.extra`): casilla, etiquetas, número o texto.
  - Se crean con el «+» de la cabecera de la Tabla, en «Columnas» o en «Grupos y colores».
  - En la Tabla se ordenan, se esconden y se agrupa por ellas (casilla y etiquetas).
  - En la ficha salen como píldoras, y el «+» de las píldoras las pone. Las etiquetas también se cambian ahí, sin ir a la ficha entera.
- ✅ Todo vive en `services/catalogoService.ts`: en el móvil y en `users/{uid}/catalogo/principal`. La copia .json lo lleva y al importarla se añade sin pisar lo tuyo.
- ✅ De paso: «Capo 2» salía dos veces en las filas.
- ⏳ La ficha entera (Editar → ficha) aún no enseña las columnas propias: se cambian en las píldoras y en la Tabla.
- ⏳ Desplegar las reglas (`catalogo` y `ficha.extra`).
- Probado en producción (iPhone 13 simulado, sin cuenta): logo y color de Lady Jarana, columna «Ensayada», y sigue todo al recargar sin red.

### 21j. Guardarlo todo (13-nov, noche) ✅

> *«Guarda todas estas sesiones, prompts y pendientes en brain y repo.»*

- Repo: este documento, `docs/PENDIENTES-VICTOR.md` y el registro de la sesión en `CLAUDE.md`.
- aura Brain: `musikeeo/cancionero` (contexto de las peticiones y decisiones), la bitácora de la sesión y la nota «2026-11-13 · cancionero musikeeo» en la libreta «Claude Code».

### 21k. Crear un bolo y compartirlo (13-nov, noche) ✅

> *«Estaría guay tener una opción de compartir no solo el repertorio —eso quiero dejarlo independiente—, pero también la opción de crear un bolo y compartir bolo… para pasar información, por ejemplo, cuando alguien te contrata… a mis músicos, un link donde puedan acceder al repertorio, al horario de cada cosa y a la ubicación. Como un panel donde puedan ver todo: el título, la duración del concierto, etcétera.»*

- ✅ **El bolo, aparte del repertorio** (`Bolo` en `types/cancionero.ts`, almacén `musikeeo-bolos-v1` / `users/{uid}/bolos`, regla `bolos`). Un bolo tiene:
  - título, fecha, lugar y dirección;
  - uno o varios sets (repertorios), cada uno con su hora de empezar;
  - el horario (llegada, montaje, prueba de sonido, comida… o lo que quieras);
  - contacto con teléfono, y notas.
- ✅ **Dónde se crea:**
  - Repertorios → sección «Bolos» → «Nuevo bolo»;
  - desde un repertorio: ⋯ → «Crear un bolo con este repertorio». El bolo sale con el nombre sin la hora, la fecha y el set a su hora («Lady Jarana · RTF Pallejà 12:30» → set a las 12:30).
  - Pantalla: `pages/cancionero/Bolo.tsx` (`/cancionero/bolo/:id`). Se guarda al escribir.
- ✅ **Compartir el bolo** (`CompartirBolo` en `CompartirGrupo.tsx`): el mismo enlace que se actualiza solo, ahora en `/bolo/{id}` (`lib/compartirBolo.ts`, publicado en `compartidos/{id}` por `compartidosService`).
- ✅ **Lo que ven los músicos** (`pages/cancionero/BoloGrupo.tsx`, oscuro, sin cuenta):
  - el panel con el título, la fecha y el lugar;
  - cuándo empieza y cuánta música hay;
  - cómo llegar (Google Maps, Apple Maps y Waze; sin mapa incrustado, para no meter cookies de terceros);
  - el horario con los sets dentro (hora de empezar y de acabar), los sets con su duración frente al hueco, el contacto (Llamar y WhatsApp) y las notas.
  - Cada set se abre como el enlace del repertorio, con su versión propia, y «‹ El bolo» para volver.
- ✅ La copia .json lleva los bolos, y al importarla los crea o los pone al día.
- Probado con emuladores (iPhone 13): crear desde el repertorio, compartir, el músico lo ve, abre un set y vuelve, y ve un cambio del horario sin recargar. Pruebas en `scripts/importar/bolo.test.ts` (17 casos).
- ⏳ Para que se actualice solo: su cuenta y las reglas desplegadas (`bolos` y `compartidos`).
- ⏳ No se soñó en Aura Studio (prisa por el bolo del 14): sigue el lenguaje del enlace del repertorio.

### 21l. La página del bolo, blanca, y el enlace corto (13-nov, noche) ✅ en la rama

- *«la pagina de compartir el bolo al musico sea blanca»* → ✅ `/bolo/{id}` sale en claro siempre, aunque el móvil del músico tenga el oscuro (`BoloGrupo.tsx`). El enlace del repertorio (`/grupo`) sigue oscuro.
- *«el enlace de compartir es gigante»* → ✅ con la nube al día, «Compartir» da solo `musikeeo.com/bolo/{id}` (o `/grupo/{id}`) y la página lo lee de `compartidos/{id}`. Mientras dice «Abriendo…» y, si en 12 s no llega, «no se puede abrir». **Hoy en musikeeo.com sigue saliendo largo** porque `compartidos` da permiso denegado: faltan las reglas. Con `firebase deploy --only firestore --project musikeeo-8e766` sale corto solo.

### 21m. Extras (la recámara) y añadir canciones por categorías (13-nov, noche) ✅

- *«necesito poder ponerme en el repertorio, extras. canciones que tengo en la recámara»* → ✅ `Repertorio.extras`:
  - sección «Extras» debajo del set: «Al set», ✕ y «Añadir extras»;
  - en cada tema del set, al desplegarlo, «Pasar a extras», con Deshacer;
  - no cuentan en la duración ni en el hueco;
  - en Tocar van al final con la píldora «Extra», y en la lista de Tocar bajo «Extras · en la recámara»;
  - en el enlace del grupo y del bolo, aparte (campo `x`); en la copia .json, también;
  - regla de `repertorios` con `extras`.
- *«cuando voy a añadir canciones al reper quiero una vista mucho mejor que ese popup… por categorías… a ver qué rumbas meto»* → ✅ `ElegirParaSet.tsx`, a pantalla completa:
  - arriba, lo que dura el set frente al hueco, y «Al set / A extras»;
  - «Por» Estilo · Grupo · Canta · Tono · Energía · Estado · Etiquetas · A–Z, que se recuerda;
  - cada grupo es una baldosa de color con su icono que se abre al tocarla;
  - un toque mete la canción en el set o en extras, y otro la saca;
  - se mantienen los filtros, el buscador, «Añadir "…"», el catálogo, Importar y Pegar.
- Lo de Feed, perfil e instalar la app va **después** del bolo (Víctor: *«lo primordial hoy es poderme hacer el reper bien que mañana tengo el concierto»*).

### 21n. Más del 13-nov (noche, mientras prepara el bolo) ✅

- *«ahora no puedo sacarla del repertorio»* → ✅ la ✕ de cada tema se ve también en el móvil, con Deshacer; «Añadir extras» entra con «A extras» marcado; en el selector, un toque en una canción que ya está la saca.
- *«tendría que clicar encima del nombre y se abriría la canción»* → ✅ el nombre siempre abre la canción (en el ordenador ancho, el panel sale tocando el resto de la fila).
- *«créame la categoría bolos… sepáramelo de importar, sacar de un audio, completar letras… las tres grandes vistas»* → ✅ Canciones · Repertorios · Bolos (menú del ordenador y baldosas del móvil, `?ver=bolos`); las herramientas, aparte.
- *«desde la canción dentro de un reper debería poder ir a ver los acordes a cualquiera de las webs»* → ✅ «En webs» junto a «Ver acordes», siempre (`BotonWebs.tsx`); en un mix, cada canción del paréntesis.
- *«poder editar el texto aquí mismo sin que cambie el formato y se convierta en un editor de texto rudimentario… como en Notion»*, *«esta barbaridad de UI/UX para guardar»* y *«cómo voy a saber si se ve negrita si no puedo verlo»* → ✅ `EditorLetra.tsx` (Tiptap, como las Notas):
  - se escribe encima de la hoja con su aspecto: acordes en negrita, partes con su color, apuntes en gris, avisos en su baldosa, [Am] en gris;
  - la **negrita** y el ==resaltado== se ven al ponerlos; el texto sigue siendo plano (`**`, `==`) y lo que no se toca queda igual;
  - «Listo» guarda (con Deshacer), sin preguntar; «Guardar como versión nueva» y «Descartar», en el ⋯;
  - «Alinear» pone letra de máquina para colocar un acorde justo encima de su sílaba (se recuerda);
  - precargado al abrir la canción: en el iPhone el teclado sale al primer toque.
- *«Ábreme un fork»* para meter canciones y probar partituras → sesión aparte «Musikeeo · canciones al Cancionero y partituras».
- *«quiero poder cambiar el color de las etiquetas de las energías y además poder añadir nuevas… igual que en Fiesta [Estilo]… para todas»* → ✅ Energía y Estado como Estilo: «+ Otro», sus colores y «Colores, renombrar o quitar» (pestañas nuevas en «Grupos y colores»). Las cuatro energías de siempre siguen como 1–4; las nuevas, por su nombre (`Energia` en types, `nombreEnergia`/`energiaDeNombre` en `biblioteca.ts`). Filtros, Tabla, Bloques y agrupar las entienden.

### 21o. La víspera, últimas (13-nov, noche) ✅

- *«acabo de copiar la letra directa de Cifra Club y mira cómo se me ha pegado… es importantísimo»* → ✅ lo pegado de fuera en el editor en su sitio entra como TEXTO, línea a línea y con sus espacios (`handlePaste` en `EditorLetra.tsx`, con `textoPegado` + `limpiarTexto`). El HTML de la web metía la fila de acordes y la de la letra en la misma línea. Probado con su «Baile Inolvidable»: queda igual que lo copiado. Una canción sin vista guardada enseña todo, no solo acordes.
- *«Es importantísimo que todo esto funcione sin conexión, y que no se me reinicie la app en directo ni se me salga»* → ✅ (`lib/directo.ts`, `DirectoEnVivo.tsx`, `SiFalla.tsx`):
  - nunca se recarga sola dentro de una canción, un repertorio, Tocar, un bolo o el enlace del grupo;
  - el service worker guarda la versión de ahora y la anterior (la página abierta sigue teniendo su código sin red);
  - Tocar lleva la canción en la dirección (`?n=`); si el iPhone cierra la app, al abrirla (instalada) vuelve a esa canción durante 4 h y lo dice («Seguías aquí · Ir al inicio»);
  - sin «tirar para recargar» en directo;
  - si una canción no se puede pintar, se ve su texto tal cual y Tocar sigue.
  - Probado sin red con la versión de publicar en un iPhone simulado.
- *«en las opciones predeterminadas para el horario del bolo… debería salir obviamente concierto»* → ✅ «+ Concierto», el primero, ya con la hora del primer set y, si tiene hueco, la de acabar; el concierto lleva «hasta» (`HoraBolo.hasta`).
- *«en la página que comparto a los músicos debería destacar mucho más el horario… que ponga más grande de 12:30 a 13:30»* → ✅ tarjeta negra arriba: «CONCIERTO · 12:30 – 13:30» en grande (`cuandoSeToca`); sin «Concierto» en el horario, cada set con su hora (con hueco, exacta; si no, «acaba hacia esa hora»).
- *«quiero poder mover de extras a titulares y viceversa»* → ✅ en la vista Lista, titulares y extras son UNA lista que se arrastra por el asa: lo que se suelta debajo de la raya «Extras» pasa a la recámara y lo de encima, a titulares. Cada fila lleva además su flecha a la vista (↓ a extras, ↑ a titulares) con Deshacer. Los extras van sin número (no son del orden) y con ▷ para tocar desde ahí.
- *«quisiera poder hacer más pequeña la letra desde aquí, y de serie… está como muy grande el texto de las canciones en todas»* → ✅ A− / A+ en la barra del editor en su sitio (en la canción y en Tocar; cambian el tamaño de la canción y quitan «que quepa»); «que quepa» llega como mucho a 18 px en el móvil y 21 en el ordenador (antes 19 y 28), y las canciones nuevas empiezan en 16 / 18 (antes 17 / 19).

## 22. Datos de la BBDD a corregir ⏳

Artistas mal en la BBDD:
- La madre de José es de **El Canto del Loco**, no de Sabina.
- Princesas es de **Pereza**.
- La Morocha es de **Luck Ra y BM**.
- Sabré olvidar: no está claro el artista (Joe Arroyo o Carlos Vives).

Se corrige en la próxima copia y en la BBDD maestra del Drive.

## Legal del Cancionero ✅ (sesión 2, 12-nov)

- ✅ `/avisos-derechos` (art. 16 DSA):
  - formulario que prepara el correo a hola@musikeeo.com;
  - compromiso de retirar lo ilícito y responder motivado;
  - punto de contacto;
  - enlazada desde el pie, las páginas legales y los términos.
- ✅ Términos «7 bis. Cancionero»: contenido con derecho a usarlo, responsabilidad del usuario, Musikeeo no revisa ni publica letras, retirada al recibir aviso.
- ⏳ «Falta la letra»: lo decide Víctor.

## Pendientes de Víctor 👤

- **Hoy, 13-nov (bolo del 14):** Borrar todo e importar `Mi-cancionero.json`; recuperar el orden con «Solo el orden» si hace falta; entrar con su cuenta; poner los logos de los grupos; crear el bolo de Pallejà (desde el repertorio: ⋯ → «Crear un bolo con este repertorio»), rellenar lugar, horario y contacto, y compartirlo con los músicos.
- **Desplegar las reglas de Firestore** desde su PC (ver §5). Sin esto el mapa no guarda y el cancionero no pasa a la cuenta.
- **Borrar el repertorio** que se llenó con las 166 canciones e importar los dos archivos de los sets desde Cancionero → Importar.
- **Importar sus papeles del Drive** (§18): ya caen en su tono. Se descargan de las carpetas de Drive y se suben por Importar → Abrir archivos (Word/PDF).
- **Contestar las dudas de Pallejà** (§12) y mirar el rediseño (§14): se construyó la mezcla recomendada mientras dormía; si prefiere otra, se cambia.
- **Decir sí o no a pegar el enlace** de webs de acordes cuando le expliquen el riesgo (§19).
