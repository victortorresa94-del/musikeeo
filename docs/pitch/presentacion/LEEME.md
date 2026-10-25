# Dossier para inversores (Musikeeo)

- `presentacion.html`: las 24 láminas (1920×1080). Sale en PDF con `node docs/pitch/presentacion/pdf.cjs salida.pdf`.
- Las láminas de rentabilidad salen del modelo, no se teclean:
  1. `cd docs/pitch && python3 rentabilidad.py modelo_financiero.py` → `rentabilidad.json`
  2. `cd presentacion && python3 rentable.py ../rentabilidad.json rentable.html && python3 montar.py`
- Los móviles (`img/mock-*.png`) son imágenes ya montadas sobre el color de su lámina: el visor de PDF del iPhone pinta las sombras CSS como bloques grises.
- No pide una cantidad: enseña las previsiones de ingresos y desde cuándo es rentable.
