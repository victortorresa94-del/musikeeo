# Pendientes de Víctor

> 26 de octubre de 2026. Lo que solo puedes hacer tú, ordenado por urgencia. Lo demás lo puede hacer Claude.
> Todo el trabajo hasta hoy está en `main` y en musikeeo.com.

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
     - el mapa de musikeers.
2. **Crear la clave gratuita de CARTO**, el fondo del mapa:
   - créala en carto.com/basemaps/apikey, con una cuenta gratis (hasta 1 millón de teselas al mes);
   - ponla en Vercel → Settings → Environment Variables como `VITE_CARTO_KEY` (Production y Preview);
   - vuelve a desplegar.

   Sin ella, el mapa sale con la marca de agua «API key required».
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

Nunca pegues claves en el chat: van directas a Vercel o a la configuración del entorno.
