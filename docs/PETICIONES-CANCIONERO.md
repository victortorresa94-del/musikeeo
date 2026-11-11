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

## 10. Teleprompter 🔧 (sesión 1)

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

Antes de construir se sueñan 3 conceptos en Aura Studio para que elija.

## 15. Editor rico «con la potencia de Aura notas» 🔧 (sesión 2)

*«NO PUEDO EDITAR esto, debería poder cambiarlo a mi gusto, poner negritas, títulos… ponle la potencia de Aura notas, te paso el repo.»*

- Se trae de `victortorresa94-del/aura-project-2` (Tiptap: `src/components/notes/BlockEditor.tsx`, `MobileFormatToolbar`, `SlashCommand`, `Callout`).
- Va en la canción y en una «hoja del bolo» de cada repertorio.

## 16. Vista con todo el set y los acordes debajo, y tipos de vista 🔧 (sesión 2, HOY)

*«Quiero poder tener una vista donde vea todas las canciones en orden y con sus acordes debajo, como una forma de ver el
reper entero para el en vivo, porque en verdad es la que yo uso más, para no tener que entrar en cada canción y solo
entrar a las que no me sé. Deberían ser distintos tipos de vista aquí.»*

*«Esta vista misma de repertorio es la que debemos añadirle más cositas»* (captura del repertorio de Lady Jarana).

En el repertorio:
- vistas **Lista · Cifrado · Bloques**;
- aviso de tiempo frente al hueco del bolo;
- «Compartir con el grupo» y «Hoja del bolo».

En Canciones: también vistas Lista y Cifrado.

## 17. Compartir el repertorio con los músicos 🔧 (sesión 2)

*«Ya quedaría muy pro enviárselo a los músicos así… si se lo mando a los músicos en un link, sería la polla, desde
donde tengan la partitura, toda la canción, etc.»* (primero que él corrija tonos y orden)

*«¿Ya has hecho que se puedan compartir con los músicos sin que tengan que crear usuario, puedan ver todo, etc.? Y cifrado todo sin letra.»*

- Enlace que se abre sin cuenta y en solo lectura, con cifrado sin letra por defecto.
- Tiene que funcionar aunque no estén desplegadas las reglas: datos en el fragmento # o documento público con `get` público y `list` solo del dueño.

## 18. Letra y acordes de todas las canciones, como en LaCuerda 🔧 (sesión 1)

*«Necesito de todas las canciones poder sacar todo como en LaCuerda, con la letra y acordes de cada parte.»*

**Musikeeo no baja letras de webs** (derechos; regla del Cancionero). Lo que se hace:
- **Sus ~45 papeles de Google Drive**, importados desde el iPhone. La importación tiene que:
  - quitar el número delante («12 - COMO CAMARÓN»);
  - repartir los mixes («TU CALORRO + LA RAJA»);
  - rellenar la ficha sin borrarla.
- **Asistente «Completar letras»** para las que no tienen papel.

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

## 20. Diagramas de acordes 🔧 (sesión 2)

*«Deberíamos tener esa capacidad de poner el acorde y poder verlo.»* (captura de una web con el diagrama de «A» y el botón «Cambiar»)

- Al tocar un acorde sale su diagrama de guitarra en SVG, con «Cambiar» para otras posiciones.
- Respeta tono y cejilla, funciona sin red y aparece también en el enlace para los músicos.

## 21. Organizar por bloques, como en Notion y en las tareas de Aura 🔧 (sesión 2 + chat principal)

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

## 22. Datos de la BBDD a corregir ⏳

Artistas mal en la BBDD:
- La madre de José es de **El Canto del Loco**, no de Sabina.
- Princesas es de **Pereza**.
- La Morocha es de **Luck Ra y BM**.
- Sabré olvidar: no está claro el artista (Joe Arroyo o Carlos Vives).

Se corrige en la próxima copia y en la BBDD maestra del Drive.

## Pendientes de Víctor 👤

- **Desplegar las reglas de Firestore** desde su PC (ver §5). Sin esto el mapa no guarda y el cancionero no pasa a la cuenta.
- **Borrar el repertorio** que se llenó con las 166 canciones e importar los dos archivos de los sets desde Cancionero → Importar.
- **Importar sus papeles del Drive** cuando la sesión 1 avise (§18).
- **Contestar las dudas de Pallejà** (§12) y elegir uno de los 3 conceptos del rediseño (§14).
- **Decir sí o no a pegar el enlace** de webs de acordes cuando le expliquen el riesgo (§19).
