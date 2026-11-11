# Tempo de canciones del catálogo (src/lib/tempo.ts)

Saca el bpm de la muestra de 30 s de Apple con el motor de «Sacar acordes», igual que el botón
«Poner tempo y duración» del Cancionero, pero desde el ordenador y para una lista.

```bash
node_modules/.bin/esbuild scripts/tempo/cli.ts --bundle --platform=node --outfile=scripts/tempo/.cli.cjs --log-level=warning
node scripts/tempo/.cli.cjs lista.json > tempos.json   # necesita ffmpeg
```

`lista.json`: `[{ "titulo": "Bamboléo", "artista": "Gipsy Kings", "buscar": "título en Apple si es otro" }]`.
Solo da un tempo si las dos mitades de la muestra coinciden (`fiable`); si no, `null`. Las listas
de canciones de cada músico no van al repo.
