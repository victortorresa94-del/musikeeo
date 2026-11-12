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
| 1 | Subir .json en PC e iPhone; varios a la vez; pegar una copia | sesión 2 (pasa de la 1 a las 00:40) | **Bloquea todo lo demás**. Probado en producción (00:25): uno va; dos a la vez salen «Sin título»; «Cargar documento» no acepta .json |
| 2 | Importador de copias: artista, «Otras versiones», tonoAlt, no juntar «(versión …)», y notas, ⭐, hueco y hoja del bolo | sesión 2 | Para `actualizar-tonos.json` |
| 3 | Enlace del grupo de lujo: longitud para WhatsApp, QR, iPhone/Android, oscuro, sin red | sesión 2 | Lo que verán los músicos |
| 4 | Rediseño (se construye el mejor concepto): cabecera del repertorio, ajustes por momentos, listas personalizadas, PC a lo ancho | sesión 1 | Usabilidad |
| 5 | Legal: avisos de derechos, cláusula, «solo para tu grupo» | sesión 2 | Antes de abrir |
| 6 | Teleprompter: negrita por tiempo + «Escuchar» opcional | sesión 1 | Después del rediseño |
| 7 | Comprobar que la importación encaja con etiquetas, favorita, tonoAlt y notas | sesiones 1 y 2 | Notion y tonos |
| 8 | Que la página no se quede en blanco si se abre durante un despliegue (recarga una vez) | chat principal | ✅ 1878c39, probado en local con piezas rotas a propósito |

### Guía para Víctor por la mañana (se completa cuando esté probado)

1. Abre musikeeo.com → Cancionero. Si no ves lo nuevo, cierra la app del todo y vuelve a abrirla.
2. Si te quedó un repertorio con las 166 canciones, ábrelo y toca «Borrar repertorio» (las canciones no se borran).
3. Toca **Importar → Abrir archivos** y sube, **uno a uno** (por «Cargar documento» de Nueva canción no entran: probado el 12-nov a las 00:25):
   1. `Lady-Jarana-Palleja-12h30.json`;
   2. `Cataleya-Palleja-19h00.json`;
   3. `actualizar-tonos.json`;
   4. si quieres, `Notion-1-completar-tus-canciones.json`.
4. Abre el repertorio, revisa el orden y los tonos en **Cifrado**, y mira el aviso del hueco (Lady Jarana suma 64 de 60 min).
5. **Compartir con el grupo** → manda el enlace (por defecto sin letra). Pide a cada músico que lo **abra una vez con cobertura**: luego le funciona sin red, también si lo vuelve a abrir desde WhatsApp. Probado en producción el 12-nov a las 00:50 con los dos sets.
6. Antes del bolo, abre el repertorio una vez con cobertura: después funciona sin red.

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

## 10. Teleprompter 🔧 (sesión 1; decidido: negrita por tiempo + «Escuchar» opcional en Safari con red)

*«Y si te pudiera escuchar, ya sería la polla, para que fuera interpretando la canción y se fuera poniendo en negrita
mientras cantas cada parte, para que sea rollo teleprompter.»*

Primero se investiga qué se puede hacer en iPhone/Safari y sin red, se le explica en 5 líneas y luego se construye.

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

## 14. Rediseño de ajustes, menús, filtros y botones 🔧 (sesión 1)

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

## 19. LaCuerda en «Falta la letra», y pegar bien 🔧 (sesión 1)

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
- Revisión legal en marcha: va a `docs/LEGAL-CANCIONERO.md`.

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

## 21c. Listas personalizadas y el Cancionero a lo ancho en PC 🔧 (sesión 1, 12-nov)

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

### Decisión pendiente: los botones de webs en «Falta la letra»

El informe legal (`docs/LEGAL-CANCIONERO.md`) recomienda no mandar a copiar de webs concretas. Opciones:
- dejarlo así hasta lanzar;
- un buscador neutro;
- quitarlos.

Víctor aún no ha elegido; mientras tanto se queda como está.

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

- **Desplegar las reglas de Firestore** desde su PC (ver §5). Sin esto el mapa no guarda y el cancionero no pasa a la cuenta.
- **Borrar el repertorio** que se llenó con las 166 canciones e importar los dos archivos de los sets desde Cancionero → Importar.
- **Importar sus papeles del Drive** (§18): ya caen en su tono. Se descargan de las carpetas de Drive y se suben por Importar → Abrir archivos (Word/PDF).
- **Contestar las dudas de Pallejà** (§12) y mirar el rediseño (§14): se construyó la mezcla recomendada mientras dormía; si prefiere otra, se cambia.
- **Decir sí o no a pegar el enlace** de webs de acordes cuando le expliquen el riesgo (§19).
