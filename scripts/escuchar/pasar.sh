#!/bin/bash
# Pasa el corpus por el motor (src/lib/escuchar.ts) en 4 procesos y deja los .lab, .tempo.txt y
# .tono.txt para evaluar.py. Uso: scripts/escuchar/pasar.sh <salida> [guitarset|sintetico|otros]
# Con AJUSTES='{"nitidez":20}' se prueban otros valores de AJUSTES_ESCUCHA sin tocar el código
set -e
AQUI=$(cd "$(dirname "$0")" && pwd)
SALIDA=$(mkdir -p "$1" && cd "$1" && pwd); SUB=${2:-}
"$AQUI/../../node_modules/.bin/esbuild" "$AQUI/cli.ts" --bundle --platform=node --outfile="$AQUI/.cli.cjs" --log-level=warning
find "$AQUI/$SUB" -name '*.wav' | sort > "$SALIDA/lista.txt"
split -n r/4 "$SALIDA/lista.txt" "$SALIDA/trozo."
for t in "$SALIDA"/trozo.*; do BASE=$AQUI xargs -a "$t" node --max-old-space-size=4096 "$AQUI/.cli.cjs" "$SALIDA" > "$t.log" 2>&1 & done
wait
cat "$SALIDA"/trozo.*.log | sort > "$SALIDA/registro.txt"; rm "$SALIDA"/trozo.*
echo "$(wc -l < "$SALIDA/registro.txt") archivos en $SALIDA"
