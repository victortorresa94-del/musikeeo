# Medir «Sacar acordes» (src/lib/escuchar.ts)

El motor que saca los acordes de un audio se afina midiendo con grabaciones cuyos acordes se
saben. Aquí están las herramientas; el corpus (unos 350 MB) se descarga y se genera, no va en el repo.

```bash
cd scripts/escuchar
pip install --break-system-packages numpy scipy mir_eval remotezip   # una vez
python3 preparar_guitarset.py && python3 generar_sintetico.py && python3 preparar_otros.py && python3 construir_manifest.py
./pasar.sh /tmp/salida                       # todo el corpus por el motor (4 procesos, ~1 min)
python3 evaluar.py /tmp/salida               # acordes (mir_eval), tempo y tono por subconjunto
python3 confusion.py /tmp/salida guitarset   # qué errores de raíz comete y en qué estilo
AJUSTES='{"nitidez":25}' ./pasar.sh /tmp/prueba guitarset   # probar otros AJUSTES_ESCUCHA sin tocar el código
```

## Resultados (25-oct-2026, valores de AJUSTES_ESCUCHA de entonces)

| Subconjunto | raíz | mayor/menor (majmin) | tono exacto | tempo bien |
|---|---|---|---|---|
| GuitarSet (guitarra real sola, 60 tomas) | 0,751 | 0,705 | 75 % | 65 % (+13 % a la mitad) |
| Sintético (grupo: batería, bajo, acordes, melodía) | 0,859 | 0,860 | 100 % | 83 % (+13 % doble o mitad) |
| Schubert, Winterreise 1933 (voz y piano) | 0,709 | 0,703 | 79 % | — |

Un detector ingenuo (croma contra plantillas de tríadas) saca 0,84 / 0,62 / 0,64 de majmin: el
sintético es fácil para cualquiera; lo que cuenta son las grabaciones reales. En GuitarSet la
métrica limpia es la raíz (la partitura no siempre dice lo que se toca). Lo que más subió: quitar
el «sus4» del vocabulario, armónicos más fuertes en el modelo de nota (0,8) y limpiar el fondo
del espectro en un margen estrecho (2/3 de semitono): de 0,56 a 0,70 en GuitarSet.

---

# Corpus de evaluación de acordes (Musikeeo)

Corpus para medir un reconocedor automático de acordes (audio → acordes en el
tiempo). Todo el audio es WAV PCM 16 bit, mono, 22050 Hz. Cada `nombre.wav`
lleva al lado `nombre.lab` en formato MIREX (`inicio<TAB>fin<TAB>etiqueta`,
sintaxis Harte que lee mir_eval, `N` = sin acorde) que cubre el fichero entero,
sin huecos. `construir_manifest.py` comprueba todo eso (114 ficheros, 0 errores).

| Subconjunto | Ficheros | Minutos | Qué es | Licencia |
|---|---|---|---|---|
| `guitarset/` | 60 | 30,5 | Guitarra acústica real (tomas de acompañamiento) | CC BY 4.0 |
| `sintetico/` | 30 | 38,2 | Banda sintetizada con verdad exacta | CC0 (generado) |
| `otros/` | 24 | 68,6 | Voz y piano reales, grabación de 1933 | Dominio público (audio), CC BY 3.0 (anotaciones) |
| **Total** | **114** | **137,3** | | |

Ocupa 349 MB. `manifest.json` lista cada fichero con fuente, licencia, duración
y, donde se sabe, tono (`A:min`, `Eb:maj`), tempo (BPM de negra) y compás.

## guitarset/

GuitarSet (Xi et al., ISMIR 2018), Zenodo 3371780. Solo se bajó `annotation.zip`
(39 MB) y, de `audio_mono-mic.zip` (657 MB), las 60 tomas elegidas, leídas con
peticiones HTTP Range (`remotezip`), sin bajar el zip entero. Remuestreo 44,1 kHz
→ 22050 Hz con soxr (ffmpeg).

- **Selección equilibrada:** 6 intérpretes (00–05) × 5 estilos (BN = bossa nova,
  Funk, SS = cantautor, Rock, Jazz) × 2 = 60 tomas `comp` (sin solos): 10 por
  intérprete y 12 por estilo. Cada estilo tiene 6 partituras (3 progresiones × 2
  tempos); al intérprete *p* en el estilo *s* le tocan la (p+s) mod 6 y la
  (p+s+3) mod 6, así cada partitura sale exactamente 2 veces, con intérpretes distintos.
- **Referencia:** la anotación **instructed** (acordes de la partitura): en el
  JAMS es la **primera** anotación con namespace `chord` (índice 0). La índice 1
  es la **performed** (transcrita de lo que se tocó) y no se usa. Va escrito en
  el manifest (`chord_annotation`).
- Además: `.beats.txt` (del `beat_position`), tempo, tono (`key_mode`) y compás
  en el manifest. Todas en 4/4, tempos 68–200 BPM, 40 en mayor y 20 en menor.
- Atribución (CC BY 4.0): *Q. Xi, R. M. Bittner, J. Pauwels, X. Ye, J. P. Bello,
  "GuitarSet: A Dataset for Guitar Transcription", Proc. 19th ISMIR, París, 2018.
  Datos: https://zenodo.org/records/3371780, CC BY 4.0. Cambios: 60 tomas "comp"
  de audio_mono-mic remuestreadas a 22050 Hz; acordes "instructed" del JAMS
  pasados a .lab; beat_position a .beats.txt.*

**Rarezas de GuitarSet:**
- El vocabulario de la partitura es pobre: solo `maj`, `min`, `7` y `hdim7`, y
  con sostenidos aunque el tono sea con bemoles (`D#:maj` en Mi bemol). mir_eval
  trata igual las enarmónicas.
- Lo que se toca es más rico que la partitura, sobre todo en Jazz, Funk y bossa
  nova: novenas, sexta, sus2, quintas al aire (`(1,5)`), voicings sin
  fundamental. La anotación performed conserva SIEMPRE la raíz y los tiempos de
  la instructed (acuerdo de raíz 1,000), pero la calidad cambia: acuerdo
  `majmin` 0,661 en total (SS 0,847, Rock 0,626, BN 0,632, Funk 0,607, Jazz
  0,509) y `sevenths` 0,484. O sea: en este subconjunto `root` es la métrica
  limpia, y `majmin`/`sevenths` castigan también acordes bien oídos pero
  "decorados".
- Los acordes van pegados a la rejilla del metrónomo: empiezan en 0, cubren el
  fichero entero y no hay `N`. Se toca desde el primer segundo (< 0,92 s).
- Tempos de bossa nova y jazz rápidos (hasta 200 BPM): espera errores ×½.
- Algunos nombres llevan `#` (`03_SS1-100-C#_comp`): en una URL hay que
  escribirlo `%23`.
- En algunas tomas la partitura describe mal lo que suena. Con la transcripción
  de notas del propio GuitarSet (`note_midi`): de mediana, el 88 % del tiempo de
  nota cae en notas del acorde instructed (94,5 % con el performed), pero en 11
  de las 60 tomas baja del 70 %: `05_Jazz1-130-D` 33 %, `03_Jazz1-200-B` 37 %,
  `03_Funk1-114-Ab` 42 %, `05_BN3-154-E` 56 %, `03_Jazz3-137-Eb` 59 %… (con el
  performed, 66–97 %). No es transposición: desplazar los acordes ±6 semitonos
  no lo arregla. Son voicings de jazz, notas de paso y rasgueos apagados. En esas
  tomas, un reconocedor que acierte lo que suena puede salir mal parado.

## sintetico/

30 canciones de 64–89 s generadas con `generar_sintetico.py` (numpy/scipy, sin
soundfonts). Semilla fija `20261025`; cada canción usa su propio generador
`default_rng([20261025, i])`, así que se reproduce igual con cualquier número de
procesos (tarda ~12 s con 4 CPU).

- **Banda:** batería de ruido filtrado y barridos (bombo, caja, aro, charles,
  ride, crash, toms, palmas, cajón, shaker, escobillas), con redobles al final de
  sección y crash al entrar el estribillo; bajo aditivo (raíces, quintas,
  octavas, boogie, walking, notas de paso cromáticas o por tono antes del cambio
  —409 en total— e inversiones); guitarra Karplus-Strong con retardo
  fraccionario (rasgueo pop, ventilador de rumba con golpe apagado, corcheas con
  palm mute y distorsión en rock, arpegios), piano aditivo (bloques, pulso,
  arpegios, vals, charleston, shuffle) y colchón de cuerdas en baladas; melodía
  de seno o sierra con vibrato que usa apoyaturas en parte fuerte, notas de paso
  y bordaduras (en el puente de los blues, un solo con escala de blues). Reverb
  por convolución y limitador a −1 dBFS (RMS ≈ −15 dBFS). Voicings con
  conducción de voces e inversiones.
- **Estilos:** 8 pop, 6 rumba, 5 rock, 4 balada, 3 flamenco-pop, 2 blues, 2 jazz.
  Las 12 tónicas (2–3 veces cada una), 17 en mayor y 13 en menor, 73–157 BPM,
  26 en 4/4 y 4 en 3/4 (dos baladas, un pop, un vals de jazz). Swing en blues
  y jazz.
- **Progresiones:** I–V–vi–IV, vi–IV–I–V, I–vi–IV–V, I–IV–V–IV, I–bVII–IV–I,
  canon (I–V/3–vi–iii–IV–I/3–IV–V), IV–V–iii–vi, IV–I–V–vi, ii–V–I, I–vi–ii–V,
  IV–iii–ii–V, rumba I–V7 e I–IV–V7–I; en menor cadencia andaluza
  (i–bVII–bVI–V), i–iv–V7–i, iv–i–V–i, i–bVI–bIII–bVII, i–bVII–bVI–bVII,
  i–iv–bVII–bIII, frigio V–bVI (Mi–Fa en La menor), iv7–V7–i, i–V7, bVI–bVII–i;
  y blues de 12 compases (normal y con cambio rápido). Cada sección tiene su
  progresión; el estribillo es distinto de la estrofa.
- **Ritmo armónico:** cambios cada 4 o 2 pulsos, a veces el último acorde se
  parte en dos (V→Vsus4–V, o X→X–V) y salen cambios de 1–2 pulsos; en 3/4,
  cada 3 pulsos o 2+1. **Anticipaciones** sincopadas (336): el acorde entra
  media parte antes y la etiqueta empieza ahí, que es cuando suena.
- **Vocabulario (por tiempo):** maj 39 %, min 23 %, 7 16,5 % (la mitad, los
  blues), min7 6 %, maj7 4 %, sus4 3 %, inversiones 2 % (`C:maj/3`, `C:maj/5`,
  `G:7/3`), N 5,6 %.
- **Silencio y final:** 0,4–2 s de `N` al principio (7 canciones con cuenta de
  palillos de un compás, que es `N` en acordes y parte de la `intro` en
  secciones) y 1,8–3,2 s al final. El último acorde dura un compás; su
  relajación y la cola de reverb (hasta ~1,5 s) caen ya en la `N` final.
- **Afinación:** 11 de 30 canciones están desafinadas entre 13 y 32 cents
  respecto a La 440 (`tuning_cents` en el manifest); las etiquetas no cambian.
- **Secciones:** `nombre.secciones.lab` con `silencio`, `intro`, `estrofa`,
  `estribillo`, `puente`, `final`. Las repeticiones son idénticas en acordes y
  melodía; cambia algo la batería (la primera estrofa va más ligera). Estructuras:
  intro–estrofa–estribillo–(estrofa–estribillo)–(puente)–estribillo–final y,
  en blues, coros de 12 compases.
- **Pulsos:** `nombre.beats.txt` (`tiempo<TAB>número de pulso en el compás`),
  incluida la cuenta de palillos. En el manifest: tono, tempo, compás, estilo,
  swing, estructura con tiempos, progresión de cada sección, afinación,
  instrumentos y segundos por calidad de acorde.

**Comprobación numérica del audio** (`verificar_croma.py`), ya que no se puede
escuchar:
- Croma medio de cada tramo de acorde ≥ 0,9 s contra las 24 tríadas: raíz
  correcta en el 95,4 % de los 1114 tramos y mayor/menor correcto en el
  95,0 % (96,1 % del tiempo). El peor fichero es `s11_jazz` (77 %, acordes con
  séptima y novena en la melodía). Con lo mismo, GuitarSet da 69,7 % y otros
  77,9 %.
- Afinación medida por picos espectrales: a menos de 1,2 cents de
  `tuning_cents` en las 30 canciones (error medio 0,4).
- Pulsos: el flujo espectral en los pulsos anotados es 8,5 veces (mediana;
  mínimo 2,0) el de 0,27 pulsos después.

**Ojo:** lo sintético es más fácil que la música real. Una línea base ingenua
(plantillas de croma fotograma a fotograma + mediana) saca `majmin` 0,841 aquí,
frente a 0,615 en GuitarSet y 0,635 en otros. Sirve sobre todo para lo que
exige verdad exacta: fronteras y anticipaciones, `N`, inversiones y séptimas,
tempo, tono, pulsos y secciones repetidas, y como prueba de regresión. No hay
voz con letra ni mezcla de estudio real.

## otros/

Schubert Winterreise Dataset v2.1 (Weiß et al., 2020), Zenodo 10839767: los 24
lieder de *Winterreise* en la grabación **HU33** (Gerhard Hüsch, barítono, y
Hanns Udo Müller, piano, 1933). Voz y piano reales; nada que ver con el pop,
pero es la única fuente que encontré con grabaciones reales, acordes alineados
al audio y licencia clara.

- **Licencia:** el audio de HU33 es **Public Domain Mark 1.0** (fichero
  `03_ExtraMaterial/license_HU33.txt` del dataset, copiado en
  `otros/LICENCIA_HU33.txt`); las anotaciones, CC BY 3.0.
- **Descartado:** la otra grabación del dataset (SC06, Scarlata/Denk 2006): su
  fichero de licencia dice CC BY-NC-ND 3.0 mientras el README y Zenodo dicen
  CC BY 3.0 sin redistribuirla modificada. No es una licencia clara. También
  se descartaron IDMT-SMT-Chords (CC BY-NC-ND), IDMT-SMT-Chord-Sequences (CC BY,
  pero sintetizado desde MIDI) y JAAH (audio comercial).
- **Atribución:** *C. Weiß, F. Zalkow, V. Arifi-Müller, M. Müller, H. V. Koops,
  A. Volk, H. G. Grohganz, "Schubert Winterreise dataset: A multimodal scenario
  for music analysis", ACM Journal on Computing and Cultural Heritage (JOCCH),
  2020. https://zenodo.org/records/10839767, CC BY 3.0.*
- **Conversión:** columna `shorthand` de `ann_audio_chord`. El bajo viene como
  nota (`B:dim7/C`) y se pasa a grado (`B:dim7/b2`) para mir_eval; `N` antes de
  la primera etiqueta y después de la última. El audio ya venía en mono a
  22050 Hz y se copia tal cual. Tono global de `ann_audio_globalkey.csv`;
  secciones de `ann_audio_structure` (letras I, A, B, A2… más `silencio`); sin
  tempo ni compás (rubato).
- **Rarezas:** grabación de 78 rpm con ruido y poco ancho de banda; afinación
  entre +2 y +14 cents según la canción; el lied n.º 1 lleva una repetición
  artificial que añadieron los autores para que cuadre con la partitura. Mucha
  inversión (29 % del tiempo), disminuidos y novenas: `majmin` y `sevenths`
  excluyen lo que no está en su vocabulario. Por duración, este subconjunto
  pesa la mitad del TOTAL: para un número de "pop" usa `--sub`.

## Evaluador

```bash
cd acordes-corpus
python3 evaluar.py <dir_estimaciones> [--sub guitarset|sintetico|otros]... [--corpus DIR] [--por-fichero]
```

Para cada referencia `<sub>/<nombre>.lab` busca `<dir_estimaciones>/<sub>/<nombre>.lab`
(la misma ruta relativa). Si falta o no se puede leer, puntúa 0 y se lista al final.

- **Acordes** (mir_eval.chord): `root`, `majmin`, `mirex`, `thirds`,
  `sevenths`. Medias ponderadas por duración al estilo MIREX (WCSR): tiempo
  acertado / tiempo evaluable sumando todos los ficheros. `majmin` y `sevenths`
  no cuentan los tramos cuya referencia está fuera de su vocabulario (sus4,
  hdim7, dim…). La estimación se recorta o se rellena con `N` hasta cubrir la
  referencia.
- **Segmentación:** `seg` = min(overseg, underseg) = 1 − distancia de Hamming
  direccional en el peor sentido (con acordes iguales seguidos fundidos),
  ponderada por la duración del fichero. `overseg` y `underseg`, en el JSON.
- **Tempo** (si existe `<nombre>.tempo.txt`, un número en BPM): correcto si está
  a ≤ 4 % del real; los ×2 y ×½ se cuentan aparte; el resto, «otro». Real del
  manifest (guitarset y sintetico).
- **Tono** (si existe `<nombre>.tono.txt`: `A:min`, `Eb:maj`, `A minor` o `Am`):
  puntuación MIREX de mir_eval.key (1 exacto, 0,5 quinta, 0,3 relativo,
  0,2 paralelo) y porcentaje de exactos.
- **Secciones** (si existe `<nombre>.secciones.lab` y hay referencia: sintetico y
  otros): F de fronteras con ventana de 3 s (`mir_eval.segment.detection`,
  `trim=True`, que no cuenta el principio ni el final del fichero; sí el inicio y
  el fin de la música). Las etiquetas no importan. También F a 0,5 s en el JSON.
- **Pulsos** (extra: si existe `<nombre>.beats.txt`, 1.ª columna): F-measure de
  mir_eval.beat (70 ms; ignora los primeros 5 s).
- Imprime una tabla por subconjunto y el TOTAL, y lo guarda todo (también por
  fichero) en `<dir_estimaciones>/resultados.json`.

**Prueba de cordura** (`python3 probar_evaluador.py <salida>`):

| Estimación | root | majmin | mirex | thirds | sevenths | seg | tempo | tono | secciones F@3s | pulsos F |
|---|---|---|---|---|---|---|---|---|---|---|
| Las referencias | 1,000 | 1,000 | 1,000 | 1,000 | 1,000 | 1,000 | 100 % correcto | 1,000 | 1,000 | 1,000 |
| Todo `N` (tempo ×2, tono C:maj) | 0,030 | 0,033 | 0,030 | 0,030 | 0,033 | 0,075 | 100 % en ×2 | 0,103 | – | – |
| Línea base de croma, guitarset | 0,668 | 0,615 | 0,595 | 0,596 | 0,568 | 0,681 | | | | |
| Línea base de croma, sintetico | 0,856 | 0,841 | 0,823 | 0,838 | 0,629 | 0,828 | | | | |
| Línea base de croma, otros | 0,654 | 0,635 | 0,600 | 0,598 | 0,516 | 0,603 | | | | |

Con todo `N` solo puntúan los tramos `N` de la referencia (5,6 % del sintético,
3 % de otros y nada en GuitarSet).

## Regenerar

```bash
pip install --break-system-packages numpy scipy mir_eval remotezip
cd acordes-corpus
python3 preparar_guitarset.py --descargas /ruta/descargas   # ~150 MB de descargas, 1-2 min
python3 generar_sintetico.py --procesos 4                   # ~12 s; --solo 3,7 rehace solo esas
python3 preparar_otros.py                                   # ~170 MB, 2-3 min
python3 construir_manifest.py                               # junta los _meta.json y valida
python3 verificar_croma.py                                  # comprobación de croma
python3 probar_evaluador.py /tmp/prueba-evaluador                    # prueba de cordura del evaluador
```

Los `_meta.json` de cada carpeta son intermedios: los junta `construir_manifest.py`.
