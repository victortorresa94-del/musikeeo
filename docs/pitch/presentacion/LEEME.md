# Dossier para inversores (Musikeeo)

- `presentacion.html`: las 27 láminas (1920×1080). Sale en PDF con `node docs/pitch/presentacion/pdf.cjs salida.pdf`.
- Láminas 4-6: «¿Por qué el mundo necesita Musikeeo?» (10 problemas, a quién le pasa, un caso y qué hace Musikeeo, con «Ya» o «En camino») y «Por qué sabemos que va a funcionar». Los casos son situaciones típicas, salvo los de Víctor, que son reales.
- Las láminas de rentabilidad (R0-R9) salen del modelo del plan de cobro (`docs/DECISIONES-COBRO.md`), no se teclean:
  1. `cd docs/pitch && python3 rentabilidad_consejo.py` → `rentabilidad_consejo.json` (usa `modelo_consejo.py`)
  2. `cd presentacion && python3 rentable.py ../rentabilidad_consejo.json rentable.html && python3 montar.py`
- El modelo antiguo (`modelo_financiero.py` y `rentabilidad.py`, 4,47 M€ en el año 5) queda solo como histórico: estaba inflado.
- Los móviles (`img/mock-*.png`) son imágenes ya montadas sobre el color de su lámina: el visor de PDF del iPhone pinta las sombras CSS como bloques grises.
- No pide una cantidad ni da una valoración: enseña las previsiones, de dónde sale el margen y cómo se mide.
