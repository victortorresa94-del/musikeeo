# Plan: Rodrigo con cerebro

> Idea de Víctor, 11-nov-2026. Es un plan: **no está construido**. A él ya no le hace falta para sus bolos, pero es una buena baza para el lanzamiento.

## Qué es

Hoy Rodrigo es un chat que sabe de Musikeeo en general. La idea es que se acuerde de **cada músico** y pueda **hacer cosas por él**, igual que Aura con su cerebro:

- Sabe sus canciones, sus repertorios, sus grupos (Lady Jarana, Cataleya…), quién canta cada tema, sus estilos y sus gustos.
- Por chat monta y ordena repertorios: «hazme 90 minutos para una boda, que empiece suave, que Mafe no cante dos seguidas y nada en el mismo tono dos veces».
- Por chat mete canciones con su ficha: «añade Bamboléo en Em, canta Víctor, rumba, energía 4».
- Si el músico lo conecta, aprende de su Spotify qué escucha y qué toca, para sugerir canciones y estilos.

## Qué hay hoy

- **Rodrigo** en el chat flotante y en `/rodrigo`. El camino es `rodrigoEngine.ts` → `POST /api/chat` (Vercel) → Kimi (Moonshot). El prompt está en `api/chat.ts` y la conexión con Kimi en `api/_kimi.ts`.
- **Sin memoria:** cada petición lleva el historial que manda el móvil, con un tope de unos 6000 caracteres. No sabe nada del usuario.
- **Borradores con «Publicar»:** Rodrigo escribe bloques `[CREAR_ANUNCIO]`, `[PUBLISH_EVENT]` y `[CREAR_PERFIL]`. El móvil los enseña como tarjeta y no se guarda nada hasta que la persona pulsa (`src/services/rodrigoActions.ts`). Es la base buena: **Rodrigo propone y la persona confirma**.
- **El cancionero tiene ya los datos que hacen falta:** ficha (tono, capo, canta, proyectos, estilo, energía, estado), duración y bpm. Las cuentas de lógica están en `src/lib/biblioteca.ts`: filtrar, duración del set, reparto de voces y tonos seguidos.

## Qué faltaría

1. **Herramientas sobre el cancionero.** Hay dos caminos, y empezaríamos por el segundo:
   - *Llamadas a funciones* (*function calling*): Kimi devuelve «buscar_canciones», «crear_repertorio», «ordenar_repertorio» o «guardar_ficha».
   - Más bloques de borrador, como los que ya hay: `[CREAR_REPERTORIO]` y `[GUARDAR_CANCION]`, que salen como tarjeta con «Aplicar».

   Lo que ya tiene el móvil lo hace el móvil: filtrar, ordenar, calcular la duración y el aviso de mismo tono. Rodrigo solo decide.
2. **Contexto por usuario.**
   - Al abrir el chat, el móvil manda un **resumen compacto** del cancionero: títulos, tono, quién canta, estilo, energía y duración, sin letras. Las letras son suyas y privadas y no hacen falta.
   - Con 300 canciones caben unos 15-20 k caracteres. Hay que subir los topes de `/api/chat` solo para este modo.
3. **Memoria (el «cerebro»).**
   - Un documento `users/{uid}/rodrigo/memoria` con lo que Rodrigo aprende: «Víctor prefiere abrir con rumba», «en bodas, nada de Català».
   - Rodrigo propone qué recordar y la persona lo ve y lo puede borrar en Ajustes.
   - Habría que añadirlo a `firestore.rules` y a la política de privacidad.
4. **Spotify (opcional).**
   - Entrar con Spotify (OAuth con PKCE) y leer canciones guardadas, artistas favoritos y listas.
   - Ojo, hay que comprobarlo antes de empezar: Spotify recortó en 2024 parte de su API para apps nuevas (características de audio y recomendaciones). Además, una app en modo desarrollo solo admite unos pocos usuarios hasta que la aprueban. Puede que solo sirva para «qué artistas escucha».
   - Alternativa sin Spotify: el catálogo de Apple que ya usamos para portadas, duración y muestra.
5. **Coste y plan Pro.**
   - Cada conversación con contexto pesa más: unos 5-10 k tokens de entrada.
   - Hay que medirlo con Kimi y decidir si va en el **plan Pro (7,99 €)** o en **Cancionero Pro (24,99 €/año)**, con unas cuantas peticiones gratis al mes.
   - Mantener el límite por IP que ya tiene `/api/chat` y añadir uno por usuario.
6. **Sin cobertura:** Rodrigo necesita red. El cancionero y Tocar siguen funcionando sin él.

## Orden propuesto

1. `[CREAR_REPERTORIO]` con el resumen del cancionero. Es lo que más luce en una demo: «hazme el set del sábado».
2. `[GUARDAR_CANCION]` con ficha.
3. Memoria por usuario.
4. Spotify, si su API lo permite.

Antes de maquetar, se sueña en Aura Studio la tarjeta del repertorio propuesto.
