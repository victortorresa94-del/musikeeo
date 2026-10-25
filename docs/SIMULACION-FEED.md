# Simulación del Feed «Para ti» con agentes

Generado con `node scripts/agentes/simular-feed.ts --produccion --informe=docs/SIMULACION-FEED.md`. Todo pasa en memoria: ningún agente escribe en Firestore.

- **Agentes:** 8 (8 propios).
- **Catálogo:** sintético (69 artistas, 70 publicaciones, 49 bolos, 47 anuncios, y cada día 3 publicaciones, 1 bolo y 1 anuncio nuevos) + de producción (solo lectura): 9 artistas, 9 bolos abiertos y 7 anuncios.
- **Uso:** una sesión al día durante 14 días; en cada sesión ve 5 vueltas del Feed (grande + bolo + 3 anuncios de la fila del Mercado).
- **Acierto:** de lo que ve, cuánto le interesa de verdad (su gusto oculto ≥ 0.6). **Descubre:** cosas que le interesan y no había visto antes. **Gestos:** me gusta, comentarios, vídeos vistos enteros, perfiles y bolos o anuncios abiertos por sesión. **Variedad:** autores distintos entre las tarjetas grandes.

## Resultado general

### Con su perfil relleno (pone sus estilos)

| Orden | Acierto día 1 | Acierto último día | Acierto medio | Descubre (nuevo que le interesa, por sesión) | Gestos por sesión | Variedad |
|---|---|---|---|---|---|---|
| Algoritmo (aprende) | 31 % | 39 % | 33 % | 2.2 | 11.6 | 84 % |
| Solo perfil y novedad | 31 % | 35 % | 34 % | 1.8 | 11.6 | 88 % |
| Por fecha (como era) | 17 % | 19 % | 18 % | 1.6 | 6.5 | 99 % |
| Al azar | 18 % | 16 % | 17 % | 2.2 | 5.4 | 98 % |
| Techo (sabe el gusto oculto) | 42 % | 36 % | 35 % | 4.5 | 10.9 | 85 % |

### Sin estilos en el perfil (solo rol y ciudad)

| Orden | Acierto día 1 | Acierto último día | Acierto medio | Descubre (nuevo que le interesa, por sesión) | Gestos por sesión | Variedad |
|---|---|---|---|---|---|---|
| Algoritmo (aprende) | 18 % | 34 % | 29 % | 2.1 | 10.6 | 85 % |
| Solo perfil y novedad | 18 % | 25 % | 21 % | 1.5 | 7.7 | 96 % |
| Por fecha (como era) | 17 % | 19 % | 18 % | 1.6 | 6.5 | 99 % |
| Al azar | 18 % | 16 % | 17 % | 2.2 | 5.4 | 98 % |
| Techo (sabe el gusto oculto) | 42 % | 36 % | 35 % | 4.5 | 10.9 | 85 % |

## Por agente (acierto medio de los días)

| Agente | Rol | Algoritmo (aprende) | Solo perfil y novedad | Por fecha (como era) | Al azar | Techo (sabe el gusto oculto) |
|---|---|---|---|---|---|---|
| Javi, rumbero de Gràcia | musician | 43 % | 39 % | 20 % | 20 % | 43 % |
| Marta, DJ de bodas | musician | 36 % | 37 % | 16 % | 15 % | 34 % |
| Marc, técnico de sonido | provider | 41 % | 37 % | 34 % | 29 % | 51 % |
| Nau 9, sala de conciertos | organizer | 24 % | 25 % | 9 % | 9 % | 26 % |
| Laia, organiza bodas | organizer | 26 % | 29 % | 12 % | 15 % | 32 % |
| Sara, guitarrista de jazz | musician | 16 % | 18 % | 7 % | 6 % | 17 % |
| Cordes del Raval, tienda | provider | 48 % | 51 % | 37 % | 33 % | 47 % |
| Lucía, cantante de pop | musician | 28 % | 35 % | 10 % | 14 % | 32 % |

## Lo que el algoritmo ha aprendido de cada agente

| Agente | Le gusta de verdad | Estilos que más suben | Estilos que bajan |
|---|---|---|---|
| Javi, rumbero de Gràcia | rumba, flamenco, guitarra, latino | funk +7.4, flamenco +7.3, rumba +4.2, pop +2.8 | teclados -2.7, bateria -2.7, iluminacion -2.6 |
| Marta, DJ de bodas | dj, bodas, electronica, disco | dj +7.1, reggaeton +5.4, versiones +4.9, bodas +4.6 | iluminacion -3.3, teclados -3.0, guitarra -3.0 |
| Marc, técnico de sonido | sonido, iluminacion, grabacion, rock | grabacion +1.9, sonido +0.4, voz +0.3, versiones +0.2 | guitarra -1.6, acustico -1.4, teclados -1.4 |
| Nau 9, sala de conciertos | rock, indie, soul, funk | indie +8.5, funk +7.8, rock +7.8, flamenco +7.4 | iluminacion -4.3, guitarra -3.9, teclados -3.9 |
| Laia, organiza bodas | bodas, violin, clasica, acustico | versiones +8.4, dj +8.4, bodas +8.4, flamenco +7.4 | iluminacion -4.1, teclados -3.9, guitarra -3.6 |
| Sara, guitarrista de jazz | jazz, bossa, soul, blues | jazz +7.4, flamenco +6.5, violin +4.5, latino +3.3 | teclados -3.8, iluminacion -3.6, guitarra -2.8 |
| Cordes del Raval, tienda | guitarra, bajo, flamenco, rock | flamenco +4.3, funk +4.0, guitarra +2.3, catalana +1.6 | iluminacion -1.8, teclados -1.8, bateria -1.6 |
| Lucía, cantante de pop | pop, acustico, versiones, voz | acustico +8.9, funk +7.6, flamenco +7.6, indie +7.0 | iluminacion -3.9, teclados -3.5, bateria -2.8 |

## Qué ve cada agente arriba del todo (algoritmo), el primer y el último día

**Javi, rumbero de Gràcia** — Guitarra y voz en una banda de rumba y versiones. Busca bolos de fin de semana y alguna cejilla barata.
- Día 1: artista: rumba (valencia) · Porque te va rumba · post: rumba (sevilla) · Porque te va rumba · post: flamenco, funk (barcelona) · En barcelona · post: violin, jazz (madrid) · Vídeos de la escena
- Día 14: post: rumba (sevilla) · Porque te va rumba · post: dj, flamenco (barcelona) · Porque te va flamenco · post: flamenco, funk (barcelona) · Porque te va funk · post: acustico, flamenco (valencia) · Porque te va flamenco

**Marta, DJ de bodas** — Pincha en bodas y eventos de empresa en Girona y la costa. Le interesa equipo de sonido y bolos de boda.
- Día 1: post: dj, bodas (valencia) · Porque te va dj · post: dj, jazz (girona) · Porque te va dj · post: versiones, bodas (barcelona) · Porque te va bodas · post: dj, clasica (girona) · Porque te va dj
- Día 14: post: dj, clasica (girona) · Porque te va dj · post: dj, versiones (barcelona) · Porque te va dj · post: indie, reggaeton (barcelona) · Porque te va bodas · artista: dj, clasica (girona) · Porque te va dj

**Marc, técnico de sonido** — Técnico de FOH freelance con PA propia. Busca bolos donde haga falta técnico y equipo de segunda mano.
- Día 1: post: flamenco (girona) · Vídeos de la escena · post: flamenco (valencia) · Vídeos de la escena · post: versiones, bodas (barcelona) · En barcelona · post: flamenco, funk (barcelona) · En barcelona
- Día 14: post: indie (barcelona) · Vídeos de la escena · post: indie (barcelona) · Vídeos de la escena · post: dj, flamenco (barcelona) · Vídeos de la escena · post: indie (barcelona) · Vídeos de la escena

**Nau 9, sala de conciertos** — Sala de 200 personas en el Poblenou. Programa rock, indie y algo de soul los jueves. Busca bandas, no equipo.
- Día 1: post: indie (barcelona) · Porque te va indie · post: flamenco, funk (barcelona) · En barcelona · artista: rock, funk (valencia) · Porque te va rock · post: electronica, rock (madrid) · Porque te va rock
- Día 14: post: indie (barcelona) · Porque te va indie · post: indie (barcelona) · Porque te va indie · post: flamenco, funk (barcelona) · Porque te va funk · post: electronica, rock (madrid) · Porque te va rock

**Laia, organiza bodas** — Wedding planner en el Maresme. Busca violín para ceremonias, acústico para el cóctel y una banda para el baile.
- Día 1: post: versiones, bodas (barcelona) · Porque te va bodas · post: electronica, clasica (sevilla) · Porque te va bodas · post: dj, bodas (valencia) · Porque te va bodas · post: flamenco, funk (barcelona) · En barcelona
- Día 14: artista: indie, reggaeton (barcelona) · Porque te va bodas · post: salsa, violin (barcelona) · Porque te va bodas · post: dj, flamenco (barcelona) · Porque te va bodas · post: versiones, bodas (barcelona) · Porque te va bodas

**Sara, guitarrista de jazz** — Guitarrista de jazz y bossa en Madrid. Toca en jams y residencias de bar. Mira poco el Mercado.
- Día 1: post: violin, jazz (madrid) · Porque te va jazz · post: jazz, flamenco (sevilla) · Porque te va jazz · post: electronica, rock (madrid) · En madrid · post: violin, jazz (madrid) · Porque te va jazz
- Día 14: post: violin, jazz (madrid) · Porque te va jazz · post: jazz, flamenco (sevilla) · Porque te va jazz · artista: indie, latino (madrid) · Porque te va jazz · post: flamenco, bodas (madrid) · Porque te va flamenco

**Cordes del Raval, tienda** — Tienda de guitarras y luthería. Quiere ver qué se vende en el Mercado y a qué guitarristas seguir.
- Día 1: artista: pop, jazz (barcelona) · Porque te va guitarra · post: flamenco, funk (barcelona) · En barcelona · post: flamenco (valencia) · Vídeos de la escena · artista: rumba, flamenco (barcelona) · Porque te va guitarra
- Día 14: post: dj, flamenco (barcelona) · Porque te va flamenco · artista: flamenco (girona) · Porque te va flamenco · post: flamenco, bodas (madrid) · Porque te va flamenco · post: pop, flamenco (sevilla) · Porque te va flamenco

**Lucía, cantante de pop** — Voz en un dúo acústico de pop y versiones en Valencia. Sube vídeos y quiere bolos en terrazas.
- Día 1: post: acustico, flamenco (valencia) · Porque te va acustico · post: indie, acustico (valencia) · Porque te va acustico · post: acustico (valencia) · Porque te va acustico · artista: pop, folk (valencia) · Porque te va pop
- Día 14: post: acustico, reggaeton (madrid) · Porque te va acustico · post: acustico, flamenco (valencia) · Porque te va acustico · artista: indie, acustico (valencia) · Porque te va acustico · post: acustico (valencia) · Porque te va acustico

