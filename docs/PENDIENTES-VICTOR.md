# Pendientes de Víctor

> Actualizado el 13 de noviembre de 2026. Lo que solo puedes hacer tú, ordenado por urgencia. Lo demás lo puede hacer Claude.
> Todo el trabajo hasta hoy está en `main` y en musikeeo.com (el Cancionero nuevo, con ficha, filtros y repertorios, desde el 11-nov).

## 1. Esta semana (sin esto, musikeeo.com va a medias)

1. **Desplegar las reglas y los índices de Firestore** desde tu PC, en `C:\Users\Usuario\Desktop\Dev\Musikeeo`:
   ```
   git pull origin main
   firebase deploy --only firestore --project musikeeo-8e766
   ```
   - Hace falta el `git pull` primero: el 25-oct se desplegó una copia vieja y no subió nada.
   - Sin esto, en musikeeo.com no funcionan:
     - las publicaciones del Feed (dan «permiso denegado»), los me gusta y los comentarios;
     - el Cancionero guardado en la cuenta;
     - el enlace del grupo que se actualiza solo (`compartidos`);
     - tus colores, logos y columnas propias en otros dispositivos (`catalogo`);
     - el mapa de musikeers.
   - **Y entra con tu cuenta en el Cancionero**: sin cuenta, el enlace del grupo no se publica en la nube (los músicos ven el que les mandaste, pero no los cambios).
   - Mientras tanto el mapa dice «No se ha podido guardar» y el Cancionero solo se guarda en el móvil (funciona igual, pero no pasa al ordenador).
2. **Antes del bolo del sábado 14 (RTF Pallejà: Lady Jarana 12:30 · Cataleya 19:00):**
   - Cancionero → ⋯ → «Borrar todo y empezar de cero» (descarga antes una copia) e importar `Mi-cancionero.json` (396 canciones, mandado en el chat). Tus canciones no van al repo.
   - Si tenías el orden de los sets a tu gusto: Importar → la copia que descargó «Borrar todo» → «Solo el orden de los repertorios».
   - Comparte el set con los músicos desde el repertorio («Compartir»): el enlace es `/grupo/…` y se pone al día solo cuando estés con cuenta y las reglas desplegadas.
   - Pon el logo de Lady Jarana y de Cataleya: Tabla → «Grupos y colores» → el grupo → «Tu logo».
   - Repasa tonos y orden del repertorio.
   - Pulsa «Poner tempo y duración» en el Cancionero y prueba el botón «Auto» de Tocar con una canción.
   - Las «versión Víctor / Cataleya / Mafe»: «Hacer mi versión» y ponle tu duración.
   - Dime qué versión tocáis de «El toro y la luna» y «La Marina està morena», y si «Marcha» es de Rosario.
   - Clave de CARTO: ✅ hecha (`CARTO_API_KEY` en Vercel, solo Production; si quieres el mapa limpio en las vistas previas, añádela también a Preview).
3. **Dossier, lámina «Equipo»:** el papel de Adrián y de David, en una línea cada uno, y el apellido de David.
4. **Probar en tu iPhone:**
   - **Mapa:** actívalo en tu zona y prueba «Estoy aquí ahora» en un bolo.
   - **«Rellénalo con tu web o tu Instagram»**, en Mi perfil, con tu web de verdad.
   - **Cancionero:** el sonido de «Dame el tono» con el interruptor de silencio, y el pedal.
   - **Sacar acordes** de una canción de 4 minutos que tengas en Archivos.

## 2. Para conseguir el primer euro

5. **Mesa de eventos de empresa** para el Mobile World Congress (1-4 de marzo de 2027):
   - llamar a empresas, hoteles y agencias con grupos de tu red que facturan;
   - Musikeeo cobra un 12 % de gestión, por factura y transferencia, sin necesitar pagos en la app.
6. **Barcelona, barrio a barrio** (`docs/DECISIONES-COBRO.md`):
   - 20-30 perfiles reales de tu red;
   - 15 bares de Gràcia como «locales fundadores»;
   - 10 fincas y 5 wedding planners que traigan bodas.

   El objetivo es que conseguir unos novios cueste 50 € o menos.

## 3. Antes de cobrar dentro de la app (Reserva protegida)

7. **Una SL** como titular de Musikeeo: hoy figuras tú como persona física.
8. **Un asesor laboral y fiscal** que revise:
   - el IVA (10 % del caché y 21 % de la comisión);
   - las retenciones;
   - cobrar en nombre del artista;
   - qué hacer con los músicos que no son autónomos.
9. **El alta como plataforma en Hacienda** (modelo 040, DAC7): cada enero, el modelo 238 con lo que cobra cada uno.
10. **La cuenta de Stripe Connect** a nombre de la SL.

## 4. Cuando quieras (opcional)

11. **Soñar en Aura Studio** el mapa y la pantalla de «Rellénalo con tu web»: se hicieron sin sueño, por ir rápido.
12. **El Firebase de pruebas `musikeeo-pruebas`** y sus secretos (`docs/AGENTES.md` §3), para que los agentes prueben sin tocar nada tuyo.
13. **Las claves `LLM_API_KEY` (Kimi) y `ZEP_API_KEY` (gratis)** como variables del entorno de Claude: para los comentarios con IA de los agentes y para lanzar MiroFish.

14. **Decidir «Rodrigo con cerebro»** para el lanzamiento: plan en `docs/PLAN-RODRIGO-CEREBRO.md` (si va en el plan Pro y si se conecta Spotify).

15. **Rodrigo con Claude:** dices que la clave de Anthropic ya está en Vercel. Cuando toque, Claude comprueba el nombre de la variable y cambia Rodrigo de Kimi a Claude.

Nunca pegues claves en el chat: van directas a Vercel o a la configuración del entorno.
