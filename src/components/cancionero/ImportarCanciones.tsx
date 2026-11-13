import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { ClipboardPaste, FileUp, Loader2 } from 'lucide-react';
import { Switch } from '../ui/switch';
import { cn } from '../../lib/utils';
import { useCancionero } from '../../hooks/useCancionero';
import { almacenCanciones } from '../../services/cancioneroService';
import { catalogoService } from '../../services/catalogoService';
import { leerCancion, lineasDeLetra, separarCanciones } from '../../lib/acordes';
import { leerSetlist, type CancionImportada } from '../../lib/setlist';
import { leerCopia, mismoTitulo, sacarFicha, unirFichas, type Copia } from '../../lib/biblioteca';
import { aNotas, notasDeTexto, unirNotas } from '../../lib/notas';
import { claveTitulo } from '../../lib/buscarCanciones';
import { cancionDelPapel, partesDeMix, tituloDePapel, tonoDelPapel } from '../../lib/papeles';
import { leerPortapapeles } from '../../lib/pegado';
import { norm } from './utilidades';
import { esIconoDeApp } from './estilo';
import { idDeYouTube, leerMarcas, type Marca } from '../../lib/seguir';
import type { Cancion } from '../../types/cancionero';

// El vídeo de Escuchar de una copia (si es de YouTube) con sus marcas
function videoDeCopia(youtube: unknown, marcas: unknown): { youtube?: string; marcas?: Marca[] } {
    const id = typeof youtube === 'string' ? idDeYouTube(youtube) : null;
    return id ? { youtube: id, marcas: leerMarcas(marcas) } : {};
}

// Solo rellena: si ya tenías vídeo se queda el tuyo; las marcas van con su vídeo
function conVideo(c: Cancion, t: CancionImportada): Partial<Cancion> {
    if (!t.youtube || (c.youtube && c.youtube !== t.youtube)) return {};
    const marcas = c.ajustes.marcas?.length || !t.marcas ? null : t.marcas;
    return { youtube: t.youtube, ...(marcas ? { ajustes: { ...c.ajustes, marcas } } : {}) };
}

const AYUDA = `Pega el setlist del bolo, una línea por tema:

Hace calor — G
Bamboléo — Em (capo 3)

Cada tema sale como una ficha con su tono (y luego le pegas los acordes).

O canciones enteras con sus acordes, separadas por una línea con ---`;

const letra = (texto: string) => lineasDeLetra(leerCancion(texto));

// El nombre con el que entra un papel: sin el número de la carpeta y, si es un mix de canciones
// que ya tienes, «Mix: Tu Calorro + Por la raja de tu falda» (con sus nombres de verdad)
function nombreDePapel(titulo: string, canciones: Cancion[]): string {
    const partes = partesDeMix(titulo);
    if (partes.length > 1) {
        const suyas = partes.map(p => cancionDelPapel(p, canciones));
        if (suyas.every(Boolean)) return `Mix: ${suyas.map(c => c!.titulo).join(' + ')}`.slice(0, 120);
    }
    return tituloDePapel(titulo);
}

// Word (.docx, también un Google Docs descargado como Word), PDF, texto y ChordPro
const ACEPTA = [
    '.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.pdf', 'application/pdf',
    '.txt', 'text/plain', '.cho', '.chopro', '.chordpro', '.crd', '.pro',
    '.json', 'application/json',
].join(',');

// Con qué canción del cancionero se junta lo que llega: si ya está, se reutiliza; una ficha
// del setlist (sin artista) o una chuleta de acordes sin letra se rellena con la canción entera
// Si el título exacto no está, vale el mismo sin lo de entre paréntesis («Hace calor (Mucho
// mejor)» = «Hace calor»), pero solo si es inequívoco: dos versiones no se juntan en una
const ES_VERSION = /\(\s*versi[oó]n\b/i;

function emparejar(canciones: Cancion[], t: CancionImportada, unica: boolean): { ya?: Cancion; rellena?: Cancion } {
    // Una versión solo se junta con la misma versión (Bamboléo de Víctor no rellena el de Cataleya)
    const casa = (c: Cancion) => norm(c.version ?? '') === norm(t.version ?? '')
        && (t.ficha || !c.artista || !t.artista || norm(c.artista) === norm(t.artista));
    let c = canciones.find(c => norm(c.titulo) === norm(t.titulo) && casa(c));
    // «Bamboléo (versión Mafe)» es otra canción: nunca se junta por parecido con «Bamboléo» (ni al revés)
    if (!c && ES_VERSION.test(t.titulo)) return {};
    const sinVersiones = canciones.filter(x => !ES_VERSION.test(x.titulo));
    if (!c && unica) {
        const parecidas = sinVersiones.filter(x => mismoTitulo(x.titulo, t.titulo) && casa(x));
        if (parecidas.length === 1) c = parecidas[0];
    }
    // Un papel de tu Drive: «1 - MUCHO MEJOR» = «Hace Calor (Mucho mejor)», «Orgulli» = «Orgullo»,
    // «LA MADRE» = «La madre de José». Un mix («TU CALORRO + LA RAJA») no rellena las fichas sueltas
    if (!c && unica && !t.version && partesDeMix(t.titulo).length === 1) c = cancionDelPapel(t.titulo, sinVersiones.filter(casa)) ?? undefined;
    if (!c) return {};
    if (!t.ficha && c.texto.trim() !== t.texto.trim() && (!c.artista || (letra(t.texto) >= 8 && letra(c.texto) < 8))) return { rellena: c };
    return { ya: c };
}

// Un repertorio entero de golpe: el setlist (una ficha por tema) o canciones enteras, pegado o
// en archivos (Word, PDF, .txt, ChordPro). Lo que ya está en el cancionero no se duplica: una
// ficha se une a la canción del mismo título (que ya trae sus acordes).
// Con repertorioId (desde un repertorio) todo lo importado entra al final de ese repertorio.
// Una copia del cancionero (.json) trae canciones con su ficha y sus repertorios
export function ImportarCanciones({ abierto, onCerrar, repertorioId, textoInicial }: { abierto: boolean; onCerrar: () => void; repertorioId?: string; textoInicial?: string }) {
    const navigate = useNavigate();
    const { canciones, repertorios, bolos, nuevaCancion, guardarVarias, crearRepertorio, guardarRepertorio, crearBolo, guardarBolo } = useCancionero();
    const destino = repertorios.find(r => r.id === repertorioId);
    // Desde «Nueva canción» con una copia (.json): llega ya puesta
    const [texto, setTexto] = useState(textoInicial ?? '');
    // Hacer un repertorio con lo importado: de entrada solo con un setlist; canciones o papeles
    // sueltos van a Canciones (rellenar una ficha nunca la mete en un repertorio)
    const [conRepertorioElegido, setConRepertorio] = useState<boolean | null>(null);
    const [nombre, setNombre] = useState('');
    const [leyendo, setLeyendo] = useState(false);
    const archivoRef = useRef<HTMLInputElement>(null);

    const copia: Copia | null = useMemo(() => leerCopia(texto), [texto]);
    const encontradas: CancionImportada[] = useMemo(() => {
        if (copia) return copia.canciones.map(c => ({
            // Una chuleta (acordes y notas, sin letra) cuenta como ficha: nunca pisa la letra que ya tengas
            titulo: c.titulo.slice(0, 120), artista: (c.artista ?? '').slice(0, 120), texto: c.texto ?? '', ficha: letra(c.texto ?? '') < 8,
            datos: c.ficha, bpm: c.bpm, duracion: c.duracion, portada: c.portada, version: c.version?.slice(0, 40),
            notas: aNotas(c.notas), favorita: c.favorita || undefined,
            spotify: typeof c.spotify === 'string' && /^https:\/\/open\.spotify\.com\//.test(c.spotify) ? c.spotify.slice(0, 300) : undefined,
            ...videoDeCopia(c.youtube, c.ajustes?.marcas),
        }));
        // {tono: …} {canta: …} {grupo: …}: a la ficha del tema
        return (leerSetlist(texto) ?? separarCanciones(texto)).map(t => {
            const { ficha, texto: resto } = sacarFicha(t.texto);
            const limpio = { ...t, titulo: 'ficha' in t && t.ficha ? t.titulo : nombreDePapel(t.titulo, canciones) };
            return ficha ? { ...limpio, texto: resto, datos: ficha } : limpio;
        });
    }, [texto, copia, canciones]);
    const esSetlist = encontradas.some(t => t.ficha);
    const conRepertorio = conRepertorioElegido ?? esSetlist;
    const parejas = useMemo(() => {
        const veces = new Map<string, number>();
        for (const t of encontradas) { const k = claveTitulo(t.titulo); veces.set(k, (veces.get(k) ?? 0) + 1); }
        return encontradas.map(t => emparejar(canciones, t, veces.get(claveTitulo(t.titulo)) === 1));
    }, [encontradas, canciones]);
    // Una biblioteca entera no es un repertorio: con muchas, el interruptor empieza apagado
    const muchas = encontradas.length > 40;
    // Desde un repertorio: una copia del cancionero NUNCA entra en él (va a Canciones con sus
    // propios repertorios); muchas canciones (una biblioteca) solo si se pide
    const [meterEnDestino, setMeterEnDestino] = useState(false);
    const aDestino = !!destino && !copia && (!muchas || meterEnDestino);

    // ---- Los repertorios de una copia que ya tienes: su orden manda, salvo que elijas el del archivo ----
    const [soloOrden, setSoloOrden] = useState(false);
    const [ordenArchivo, setOrdenArchivo] = useState<Set<string>>(new Set());
    // La canción tuya que corresponde al tema i de la copia (dentro de un repertorio, también por título)
    const tuyaDe = (i: number, dentro?: string[]): string | undefined => {
        const p = parejas[i];
        const id = p?.ya?.id ?? p?.rellena?.id;
        if (id && (!dentro || dentro.includes(id))) return id;
        const t = encontradas[i];
        if (!t || !dentro) return id;
        return canciones.find(c => dentro.includes(c.id) && norm(c.titulo) === norm(t.titulo) && norm(c.version ?? '') === norm(t.version ?? ''))?.id ?? id;
    };
    const conOtroOrden = useMemo(() => {
        if (!copia) return [];
        return copia.repertorios.flatMap(r => {
            const ya = repertorios.find(x => norm(x.nombre) === norm(r.nombre));
            if (!ya) return [];
            const delArchivo = [...new Set(r.canciones.map(i => tuyaDe(i, ya.canciones)).filter((id): id is string => !!id && ya.canciones.includes(id)))];
            const mio = ya.canciones.filter(id => delArchivo.includes(id));
            return delArchivo.join('|') !== mio.join('|') ? [ya] : [];
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [copia, repertorios, parejas, encontradas, canciones]);

    // «Solo el orden»: no toca canciones ni fichas; reordena tus repertorios como en la copia
    const soloReordenar = () => {
        if (!copia) return;
        let hechos = 0;
        const sinEncontrar: string[] = [];
        for (const r of copia.repertorios) {
            const ya = repertorios.find(x => norm(x.nombre) === norm(r.nombre));
            if (!ya) continue;
            const orden: string[] = [];
            for (const i of r.canciones) {
                const id = tuyaDe(i, ya.canciones);
                if (id && ya.canciones.includes(id)) { if (!orden.includes(id)) orden.push(id); }
                else if (encontradas[i]) sinEncontrar.push(encontradas[i].titulo);
            }
            // Las tuyas que no están en la copia, al final (no se quita nada)
            const resto = ya.canciones.filter(id => !orden.includes(id));
            const nuevo = [...orden, ...resto];
            if (nuevo.join('|') !== ya.canciones.join('|')) { guardarRepertorio({ ...ya, canciones: nuevo }); hechos++; }
        }
        setTexto('');
        onCerrar();
        toast.success(hechos ? `Orden puesto en ${hechos} ${hechos === 1 ? 'repertorio' : 'repertorios'}` : 'Ya estaban en ese orden', {
            description: [
                'Canciones y fichas, sin tocar.',
                sinEncontrar.length && `No están en tu repertorio (no las he añadido): ${[...new Set(sinEncontrar)].join(', ')}.`,
            ].filter(Boolean).join(' '),
            duration: sinEncontrar.length ? 12000 : 5000,
        });
    };

    const pegar = async () => {
        try {
            const t = await leerPortapapeles();
            if (t.trim()) setTexto(t); else toast('No hay nada copiado.');
        } catch {
            toast('Mantén pulsado el recuadro y elige «Pegar».');
        }
    };

    // Word, PDF, .txt y ChordPro: cada archivo pasa a texto en la caja (y de ahí, lo de siempre:
    // emparejar con lo que ya hay y guardar todo de una vez). El lector de documentos (con
    // mammoth y pdf.js, cada uno en su trozo) se descarga solo la primera vez que se abre algo
    const abrir = async (lista: FileList | null) => {
        const archivos = lista ? [...lista] : [];
        if (!archivos.length || leyendo) return;
        setLeyendo(true);
        const textos: string[] = [];
        const fallos: string[] = [];
        try {
            const { textoDeArchivo } = await import('../../lib/documentos');
            // Uno detrás de otro: varios PDF a la vez se comen la memoria del iPhone
            for (const f of archivos) {
                try {
                    const t = (await textoDeArchivo(f, x => !!leerSetlist(x))).trim();
                    if (t) textos.push(t); else fallos.push(`«${f.name}»: está vacío.`);
                } catch (e) {
                    fallos.push(`«${f.name}»: ${e instanceof Error ? e.message : 'no se pudo leer.'}`);
                }
            }
        } catch {
            fallos.push('No se pudo cargar el lector de documentos. Mira la conexión y vuelve a probar.');
        } finally {
            setLeyendo(false);
        }
        if (textos.length) {
            setTexto(t => [t.trim(), ...textos].filter(Boolean).join('\n---\n'));
            if (!nombre && archivos.length === 1) setNombre(archivos[0].name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim());
            if (textos.join('\n').split('\n---\n').length > 40) setConRepertorio(false);
        }
        if (fallos.length === 1) toast.error(`No se pudo abrir ${fallos[0]}`);
        else if (fallos.length > 1) toast.error(`No se pudieron abrir ${fallos.length} archivos`, { description: fallos.join('\n') });
    };

    const importar = () => {
        if (copia && soloOrden) { soloReordenar(); return; }
        // Los colores, iconos y columnas propias que trae la copia (lo tuyo no se pisa)
        catalogoService.mezclar(copia?.catalogo);
        const corta = (t: CancionImportada) => t.ficha || t.texto.split('\n').length <= 25;
        let nuevas = 0, rellenas = 0, conFicha = 0, conNotas = 0;
        const aGuardar: Cancion[] = [];
        const movidas: string[] = [], revisar: string[] = [], repetidas: string[] = [];
        let ids: string[];
        // Lo que se sabe de la grabación solo rellena lo que falta
        const extra = (c: Cancion, t: CancionImportada): Cancion => ({
            ...c, ficha: unirFichas(c.ficha, t.datos), artista: c.artista || t.artista,
            bpm: c.bpm ?? t.bpm, duracion: c.duracion ?? t.duracion, portada: c.portada ?? t.portada,
            // Las notas que llegan se AÑADEN a las que había (sin repetir líneas)
            notas: t.notas ? unirNotas(c.notas, t.notas) : c.notas,
            favorita: c.favorita || t.favorita || undefined,
            spotify: c.spotify ?? t.spotify,
            ...conVideo(c, t),
        });
        try {
            ids = encontradas.map((t, i) => {
                const { ya, rellena } = parejas[i];
                if (ya && copia) {
                    // De una copia (o de «actualizar tonos»): la ficha que llega manda (las etiquetas se
                    // suman), el artista que llega sustituye, bpm y duración solo si faltan. El texto:
                    // a una chuleta se le añaden al final las líneas nuevas; una canción con letra NO se
                    // toca y las líneas nuevas van a sus notas
                    const llega = t.texto.trim();
                    let base: Cancion = { ...ya, artista: t.artista || ya.artista };
                    let notasExtra: string | undefined;
                    // Nunca se borra una línea al importar: solo se añaden las que no estaban
                    // (comparadas sin espacios de más), al final de la chuleta o en las notas
                    if (llega && llega !== ya.texto.trim()) {
                        const plano = (l: string) => l.replace(/\s+/g, ' ').trim().toLowerCase();
                        const ya_ = new Set(ya.texto.split('\n').map(plano).filter(Boolean));
                        const nuevasLineas = llega.split('\n').map(l => l.trimEnd()).filter(l => l.trim() && !ya_.has(plano(l)));
                        if (!ya.texto.trim()) base = { ...base, texto: t.texto };
                        else if (nuevasLineas.length && letra(ya.texto) < 8) base = { ...base, texto: `${ya.texto.trimEnd()}\n${nuevasLineas.join('\n')}` };
                        else if (nuevasLineas.length) notasExtra = notasDeTexto(nuevasLineas.join('\n'));
                    }
                    const actualizada = extra(base, t);
                    if (notasExtra) {
                        const antes = actualizada.notas;
                        actualizada.notas = unirNotas(antes, notasExtra);
                        if (actualizada.notas !== antes) conNotas++;
                    }
                    if (JSON.stringify(actualizada) !== JSON.stringify(ya)) { conFicha++; aGuardar.push(actualizada); }
                    return ya.id;
                }
                if (ya) {
                    // Ya estaba: se queda su letra, y la ficha que llega se suma a la suya
                    const sinTexto = !ya.texto.trim() && t.texto.trim();
                    if (t.datos || sinTexto || t.bpm || t.duracion || t.notas || t.favorita || (!ya.artista && t.artista)) {
                        conFicha++;
                        aGuardar.push(extra(sinTexto ? { ...ya, texto: t.texto, artista: ya.artista || t.artista } : ya, t));
                    }
                    return ya.id;
                }
                if (rellena) {
                    // El mismo tema en varios papeles (el Doc de julio, el Word de septiembre…): se
                    // queda el más completo, no el último
                    const otro = aGuardar.findIndex(c => c.id === rellena.id);
                    if (otro !== -1 && letra(aGuardar[otro].texto) >= letra(t.texto)) { repetidas.push(rellena.titulo); return rellena.id; }
                    if (otro !== -1) { aGuardar.splice(otro, 1); repetidas.push(rellena.titulo); } else rellenas++;
                    // En el tono de su ficha, sin reescribir el papel; si es dudoso, se marca
                    const tono = t.ficha ? null : tonoDelPapel(t.texto, rellena.ficha?.tono, rellena.ficha?.capo);
                    const ajustes = { ...rellena.ajustes, ajustar: corta(t), ...(tono && !tono.revisar ? { semitonos: tono.semitonos } : {}) };
                    let ficha = rellena.ficha;
                    if (tono?.revisar) ficha = { ...ficha, etiquetas: [...new Set([...(ficha?.etiquetas ?? []), 'Revisar tono'])] };
                    if (tono?.revisar) revisar.push(rellena.titulo);
                    else if (tono?.semitonos) movidas.push(`${rellena.titulo} (${tono.de} → ${tono.a})`);
                    aGuardar.push(extra({ ...rellena, ficha, artista: t.artista || rellena.artista, texto: t.texto, ajustes }, t));
                    return rellena.id;
                }
                nuevas++;
                // Lo corto (fichas y chuletas de acordes) se ve entero y grande: «que quepa»
                const nueva = extra({ ...nuevaCancion(t, corta(t) ? { ajustar: true } : {}), ...(t.version ? { version: t.version } : {}) }, t);
                aGuardar.push(nueva);
                return nueva.id;
            });
            // La misma canción dos veces en lo importado: se guarda una vez (la última versión)
            const unicas = [...new Map(aGuardar.map(c => [c.id, c])).values()];
            guardarVarias(unicas);
        } catch (e) {
            toast.error(`No se pudo importar: ${e instanceof Error ? e.message : 'error desconocido'}`);
            return;
        }
        setTexto('');
        onCerrar();
        const aviso = [conFicha && `${conFicha} ${conFicha === 1 ? 'actualizada' : 'actualizadas'}`, nuevas && `${nuevas} ${nuevas === 1 ? 'nueva' : 'nuevas'}`, rellenas && `${rellenas} fichas completadas`, conNotas && `${conNotas} con notas añadidas`].filter(Boolean).join(' · ') || 'Ya las tenías';
        // Las que siguen sin letra (para completarlas luego): al rellenar fichas, se dice cuáles
        const sinLetra = rellenas ? almacenCanciones.estado().items.filter(c => !c.version && letra(c.texto) < 8) : [];
        // Lo que se hizo con el tono de cada papel
        if (movidas.length || revisar.length || repetidas.length) {
            toast(`${movidas.length ? `${movidas.length} en su tono` : ''}${movidas.length && revisar.length ? ' · ' : ''}${revisar.length ? `${revisar.length} con «Revisar tono»` : ''}`.trim() || 'Papeles repetidos', {
                description: [
                    movidas.length && `Puestas en su tono: ${movidas.join(', ')}.`,
                    revisar.length && `Revisa el tono (no lo he movido): ${revisar.join(', ')}.`,
                    repetidas.length && `Venían repetidas; me quedo con el papel más completo: ${[...new Set(repetidas)].join(', ')}.`,
                ].filter(Boolean).join(' '),
                duration: 12000,
            });
        }
        if (sinLetra.length) {
            toast(`${sinLetra.length} ${sinLetra.length === 1 ? 'canción sigue' : 'canciones siguen'} sin letra`, {
                description: sinLetra.slice(0, 6).map(c => c.titulo).join(' · ') + (sinLetra.length > 6 ? '…' : ''), duration: 9000,
            });
        }
        // Desde un repertorio: todo al final de ese, sin repetir
        if (destino && aDestino) {
            const faltan = [...new Set(ids)].filter(id => !destino.canciones.includes(id));
            guardarRepertorio({ ...destino, canciones: [...destino.canciones, ...faltan] });
            toast.success(`${aviso} · ${faltan.length} en «${destino.nombre}»`);
            return;
        }
        // Una copia trae sus repertorios: el que ya existe con ese nombre se pone al día
        // Los bolos de la copia: el que ya existe (mismo nombre y fecha) se pone al día; si no, se crea
        const importarBolos = (idsRep: string[]) => {
            for (const b of copia?.bolos ?? []) {
                const sets = b.sets.map(s => ({ repertorioId: idsRep[s.repertorio], ...(s.hora ? { hora: s.hora } : {}) })).filter(s => s.repertorioId);
                const datos = { titulo: b.titulo, fecha: b.fecha ?? '', lugar: b.lugar, direccion: b.direccion, contacto: b.contacto, telefono: b.telefono, notas: b.notas, horario: b.horario ?? [], sets };
                const ya = bolos.find(x => norm(x.titulo) === norm(b.titulo) && x.fecha === (b.fecha ?? ''));
                if (ya) guardarBolo({ ...ya, ...Object.fromEntries(Object.entries(datos).filter(([, v]) => v !== undefined)) });
                else crearBolo(datos);
            }
        };
        if (copia?.repertorios.length) {
            const idsRep: string[] = [];
            for (const r of copia.repertorios) {
                const lista = [...new Set(r.canciones.map(i => ids[i]).filter(Boolean))];
                const ya = repertorios.find(x => norm(x.nombre) === norm(r.nombre));
                // Los extras (la recámara): se suman a los tuyos, sin repetir ni pisar el set
                const extrasCopia = [...new Set((r.extras ?? []).map(i => ids[i]).filter(Boolean))];
                const setFinal = ya ? [...ya.canciones, ...lista] : lista;
                const extras = [...new Set([...(ya?.extras ?? []), ...extrasCopia])].filter(id => !setFinal.includes(id));
                // El icono de la copia, solo si es uno de la app y el tuyo no tiene ya uno elegido
                const icono = esIconoDeApp(r.icono) && !ya?.icono ? r.icono : undefined;
                const extraRep = { ...(r.notas ? { notas: unirNotas(ya?.notas, r.notas) } : {}), ...(r.hueco ? { hueco: r.hueco } : {}), ...(extras.length ? { extras } : {}), ...(icono ? { icono } : {}) };
                if (ya) {
                    // Tu orden manda: lo nuevo de la copia va al final. Con «Usar el del archivo», al revés.
                    // Nunca se quita nada de tu repertorio
                    const canciones = ordenArchivo.has(ya.id)
                        ? [...lista, ...ya.canciones.filter(id => !lista.includes(id))]
                        : [...ya.canciones, ...lista.filter(id => !ya.canciones.includes(id))];
                    guardarRepertorio({ ...ya, ...extraRep, canciones, fecha: r.fecha || ya.fecha });
                    idsRep.push(ya.id);
                }
                else {
                    const nuevo = crearRepertorio(r.nombre, lista);
                    // Sin fecha: no es de hoy, es uno antiguo (va a «Archivados», no a «Próximo bolo»)
                    if ((r.fecha ?? '') !== nuevo.fecha || Object.keys(extraRep).length) guardarRepertorio({ ...nuevo, ...extraRep, fecha: r.fecha ?? '' });
                    idsRep.push(nuevo.id);
                }
            }
            importarBolos(idsRep);
            const total = new Set(ids).size;
            toast.success(`${total} ${total === 1 ? 'canción' : 'canciones'} en tu cancionero · ${copia.repertorios.length} ${copia.repertorios.length === 1 ? 'repertorio' : 'repertorios'}`, { description: aviso });
            navigate('/cancionero?ver=repertorios');
            return;
        }
        // Si ya hay un repertorio con estas mismas canciones (se rellenaron sus fichas), se abre ese
        const mismo = repertorios.find(r => r.canciones.length === ids.length && r.canciones.every((c, i) => c === ids[i]));
        // Si solo se completaron fichas, no hace falta otro repertorio: se abre el que ya las tiene
        const contiene = nuevas ? undefined : repertorios.find(r => ids.every(id => r.canciones.includes(id)));
        if (destino || copia) {
            // Desde un repertorio sin meterlas en él, o una copia sin repertorios: a Canciones
            toast.success(`${aviso} · en Canciones`);
            if (destino) navigate('/cancionero');
            return;
        }
        if (conRepertorio && !muchas && ids.length > 1) {
            const r = mismo ?? contiene ?? crearRepertorio(nombre.trim() || `Bolo ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`, ids);
            toast.success(aviso);
            navigate(`/cancionero/repertorio/${r.id}`);
        } else {
            toast.success(aviso);
        }
    };

    return createPortal(
        <AnimatePresence>
            {abierto && (
                <motion.div className="fixed inset-0 z-[95] flex items-end md:items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <button aria-label="Cerrar" className="absolute inset-0 bg-black/50" onClick={onCerrar} />
                    <motion.div role="dialog" aria-modal="true" aria-label="Importar canciones"
                        initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                        className="relative w-full md:max-w-lg lg:max-w-2xl max-h-[92dvh] overflow-y-auto overscroll-contain bg-sheet rounded-t-[22px] md:rounded-[22px] border border-hairline shadow-e3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                        <div className="sticky top-0 z-10 bg-sheet px-4 pt-2 pb-2">
                            <div className="mx-auto h-1 w-9 rounded-full bg-fill-strong md:hidden" />
                            <div className="mt-2 flex items-center justify-between">
                                <button onClick={onCerrar} className="w-[70px] text-left text-[15px] text-muted-foreground active:opacity-60">Cancelar</button>
                                <p className="font-semibold text-[16px] text-foreground">Importar canciones</p>
                                <button onClick={importar} disabled={!encontradas.length || leyendo}
                                    className="w-[70px] text-right text-[15px] font-semibold text-foreground disabled:opacity-30 active:opacity-60">Importar</button>
                            </div>
                        </div>
                        <div className="px-4">
                            <div className="flex gap-2">
                                <button onClick={pegar} className="pulsable h-9 px-3.5 rounded-full bg-fill text-[14px] font-semibold text-foreground flex items-center gap-1.5">
                                    <ClipboardPaste className="h-4 w-4" /> Pegar lo copiado
                                </button>
                                <button onClick={() => archivoRef.current?.click()} disabled={leyendo} aria-busy={leyendo}
                                    className="pulsable h-9 px-3.5 rounded-full bg-fill text-[14px] font-semibold text-foreground flex items-center gap-1.5 disabled:opacity-60">
                                    {leyendo ? <><Loader2 className="h-4 w-4 animate-spin" /> Leyendo…</> : <><FileUp className="h-4 w-4" /> Abrir archivos</>}
                                </button>
                            </div>
                            {/* Word y PDF con su tipo y su extensión: el iPhone filtra por las dos */}
                            <input ref={archivoRef} type="file" multiple className="hidden" aria-label="Abrir archivos (Word, PDF o texto)"
                                accept={ACEPTA} onChange={e => { void abrir(e.target.files); e.target.value = ''; }} />
                            <textarea value={texto} onChange={e => setTexto(e.target.value)} placeholder={AYUDA} wrap="off" spellCheck={false} aria-label="Canciones"
                                className={cn('mt-3 w-full rounded-2xl bg-fill p-4 font-mono text-[13px] leading-[1.45] text-foreground placeholder:text-muted-foreground resize-y focus:outline-none', encontradas.length ? 'h-[16dvh]' : 'h-[34dvh]')} />

                            {encontradas.length > 0 && (
                                <>
                                    {copia && copia.repertorios.some(r => repertorios.some(x => norm(x.nombre) === norm(r.nombre))) && (
                                        <div className="mt-3 rounded-2xl bg-fill px-4 py-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-[15px] font-semibold text-foreground">Solo el orden de los repertorios</p>
                                                <Switch checked={soloOrden} onCheckedChange={setSoloOrden} aria-label="Solo el orden de los repertorios" />
                                            </div>
                                            <p className="mt-1 text-[13px] text-muted-foreground">
                                                {soloOrden ? 'No toca canciones ni fichas: solo pone tus repertorios en el orden de la copia.' : 'Para recuperar el orden de un repertorio sin cambiar las fichas.'}
                                            </p>
                                        </div>
                                    )}
                                    {!soloOrden && conOtroOrden.map(r => (
                                        <div key={r.id} className="mt-3 rounded-2xl bg-pastel-mantequilla px-4 py-3">
                                            <p className="text-[14px] font-semibold text-pastel-mantequilla-ink">«{r.nombre}» ya lo tienes con otro orden</p>
                                            <div className="mt-2 p-1 rounded-full bg-sheet grid grid-cols-2 gap-1" role="radiogroup" aria-label={`Orden de ${r.nombre}`}>
                                                {([[false, 'Mantener el mío'], [true, 'Usar el del archivo']] as const).map(([v, n]) => {
                                                    const activo = ordenArchivo.has(r.id) === v;
                                                    return (
                                                        <button key={n} role="radio" aria-checked={activo}
                                                            onClick={() => setOrdenArchivo(o => { const x = new Set(o); if (v) x.add(r.id); else x.delete(r.id); return x; })}
                                                            className={cn('h-9 rounded-full text-[14px] font-semibold', activo ? 'bg-foreground text-background' : 'text-foreground')}>{n}</button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                    <p className="mt-3 text-[13px] font-semibold text-muted-foreground">
                                        {encontradas.length === 1 ? '1 canción' : `${encontradas.length} ${esSetlist ? 'fichas del setlist' : 'canciones'}`}
                                    </p>
                                    <ol className="mt-1 rounded-2xl bg-fill divide-y divide-hairline overflow-hidden">
                                        {encontradas.map((t, i) => (
                                            <li key={i} className="px-4 py-2 flex items-center gap-3">
                                                <span className="w-5 text-[13px] font-semibold text-muted-foreground tabular-nums">{i + 1}</span>
                                                <span className="flex-1 min-w-0 truncate text-[15px] text-foreground">
                                                    {t.titulo}{t.artista && <span className="text-muted-foreground"> · {t.artista}</span>}
                                                </span>
                                                {parejas[i]?.ya ? <span className="text-[12px] text-muted-foreground">{t.datos ? 'suma la ficha' : 'ya la tienes'}</span>
                                                    : parejas[i]?.rellena && <span className="text-[12px] text-muted-foreground">rellena la ficha</span>}
                                            </li>
                                        ))}
                                    </ol>
                                    {(copia || aDestino) && (
                                        <p className="mt-3 px-1 text-[14px] text-muted-foreground">
                                            {destino && aDestino ? `Entran al final de «${destino.nombre}».`
                                                : `Copia del cancionero${copia!.repertorios.length ? ` con ${copia!.repertorios.length} ${copia!.repertorios.length === 1 ? 'repertorio' : 'repertorios'}` : ''}. Lo que ya tienes no se duplica: se le suma la ficha.`}
                                        </p>
                                    )}
                                    {destino && !copia && muchas && (
                                        <div className="mt-3 rounded-2xl bg-fill px-4 py-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-[15px] font-semibold text-foreground">Meterlas también en «{destino.nombre}»</p>
                                                <Switch checked={meterEnDestino} onCheckedChange={setMeterEnDestino} aria-label={`Meterlas también en ${destino.nombre}`} />
                                            </div>
                                            <p className="mt-1 text-[13px] text-muted-foreground">Apagado: van a tu cancionero (Canciones) y el repertorio no cambia.</p>
                                        </div>
                                    )}
                                    {!copia && !destino && encontradas.length > 1 && !muchas && (
                                        <div className="mt-3 rounded-2xl bg-fill px-4 py-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-[15px] font-semibold text-foreground">Hacer un repertorio con ellas</p>
                                                <Switch checked={conRepertorio} onCheckedChange={setConRepertorio} aria-label="Hacer un repertorio con ellas" />
                                            </div>
                                            {conRepertorio && (
                                                <input value={nombre} onChange={e => setNombre(e.target.value.slice(0, 120))} placeholder="Nombre (p. ej. Boda Marta y Jordi)" aria-label="Nombre del repertorio"
                                                    className="mt-2 w-full h-11 rounded-xl bg-sheet px-3 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none" />
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            <button onClick={importar} disabled={!encontradas.length || leyendo}
                                className="pulsable mt-4 w-full h-[52px] rounded-[14px] bg-primary text-primary-foreground font-semibold text-[16px] disabled:opacity-40">
                                {copia && soloOrden ? 'Poner el orden' : encontradas.length > 1 ? `Importar ${encontradas.length} canciones` : 'Importar'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}
