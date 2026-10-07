// Rodrigo AI Response Engine - Powered by DeepSeek
// Motor de conversación inteligente basado en el prompt profesional

import { callRodrigoChat } from './openrouter';
import { RODRIGO_INITIAL_MESSAGE } from './rodrigoPrompt';

// ===========================================
// TYPES & INTERFACES
// ===========================================

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ConversationState {
    messages: Message[];
    userRole: 'unknown' | 'organizer' | 'musician';
    turnCount: number;
}

export interface ArtistRecommendation {
    nombre: string;
    formato: string;
    estilo: string;
    porQueEncaja: string;
    precio: string;
    link: string;
}

export interface BoloOpportunity {
    titulo: string;
    fecha: string;
    ubicacion: string;
    formatoBuscado: string;
    cache: string;
    link: string;
}

export interface EventDraft {
    title: string;
    date: string;
    time: string;
    location: string;
    description: string;
    type: string;
    genres: string[];
    budget: string;
}

// Borrador de anuncio del mercado que Rodrigo prepara para que el usuario lo publique
export interface ListingDraft {
    titulo: string;
    tipo: string;       // venta | alquiler | prestamo
    categoria: string;  // guitarras, bajos, teclados, bateria, viento, accesorios, pa_sonido, iluminacion, recording, partituras, otros
    estado: string;     // nuevo | como_nuevo | bueno | aceptable
    precio: string;
    unidad: string;     // dia | semana | total (solo alquiler)
    ciudad: string;
    descripcion: string;
    urgente: string;
}

// Borrador de perfil de artista
export interface ProfileDraft {
    nombre: string;
    ciudad: string;
    formato: string;    // solista, dúo, banda, DJ…
    generos: string[];
    bio: string;
    precioDesde: string;
    extras: string[];   // equipo propio, viaja, idiomas…
}

export interface ParsedResponse {
    text: string;
    artists: ArtistRecommendation[];
    bolos: BoloOpportunity[];
    publishEvent?: EventDraft;
    listingDraft?: ListingDraft;
    profileDraft?: ProfileDraft;
}

// ===========================================
// RESPONSE PARSING
// ===========================================

function parsePublishEvent(content: string): EventDraft | undefined {
    const regex = /\[PUBLISH_EVENT\]([\s\S]*?)\[\/PUBLISH_EVENT\]/;
    const match = regex.exec(content);

    if (!match) return undefined;

    const block = match[1];
    return {
        title: extractField(block, 'Título') || 'Evento Nuevo',
        date: extractField(block, 'Fecha') || '',
        time: extractField(block, 'Hora') || '',
        location: extractField(block, 'Ubicación') || '',
        description: extractField(block, 'Descripción') || '',
        type: extractField(block, 'Tipo') || 'gig',
        genres: extractField(block, 'Géneros').split(',').map(g => g.trim()).filter(Boolean),
        budget: extractField(block, 'Presupuesto') || '',
    };
}

const list = (v: string) => v.split(',').map(x => x.trim()).filter(Boolean);

function parseListingDraft(content: string): ListingDraft | undefined {
    const m = /\[CREAR_ANUNCIO\]([\s\S]*?)\[\/CREAR_ANUNCIO\]/.exec(content);
    if (!m) return undefined;
    const b = m[1];
    return {
        titulo: extractField(b, 'Título') || 'Anuncio',
        tipo: extractField(b, 'Tipo') || 'venta',
        categoria: extractField(b, 'Categoría') || 'otros',
        estado: extractField(b, 'Estado') || 'bueno',
        precio: extractField(b, 'Precio') || '0',
        unidad: extractField(b, 'Unidad') || 'dia',
        ciudad: extractField(b, 'Ciudad'),
        descripcion: extractField(b, 'Descripción'),
        urgente: extractField(b, 'Urgente') || 'no',
    };
}

function parseProfileDraft(content: string): ProfileDraft | undefined {
    const m = /\[CREAR_PERFIL\]([\s\S]*?)\[\/CREAR_PERFIL\]/.exec(content);
    if (!m) return undefined;
    const b = m[1];
    return {
        nombre: extractField(b, 'Nombre artístico') || extractField(b, 'Nombre'),
        ciudad: extractField(b, 'Ciudad'),
        formato: extractField(b, 'Formato'),
        generos: list(extractField(b, 'Géneros')),
        bio: extractField(b, 'Bio'),
        precioDesde: extractField(b, 'Precio desde'),
        extras: list(extractField(b, 'Extras')),
    };
}

function parseArtists(content: string): ArtistRecommendation[] {
    const artists: ArtistRecommendation[] = [];
    const artistRegex = /\[ARTISTA\]([\s\S]*?)\[\/ARTISTA\]/g;
    let match;

    while ((match = artistRegex.exec(content)) !== null) {
        const block = match[1];
        const artist: ArtistRecommendation = {
            nombre: extractField(block, 'Nombre') || 'Artista',
            formato: extractField(block, 'Formato') || '',
            estilo: extractField(block, 'Estilo') || '',
            porQueEncaja: extractField(block, 'Por qué encaja') || '',
            precio: extractField(block, 'Precio orientativo') || '',
            link: extractField(block, 'Link') || '/discover',
        };
        artists.push(artist);
    }

    return artists;
}

function parseBolos(content: string): BoloOpportunity[] {
    const bolos: BoloOpportunity[] = [];
    const boloRegex = /\[BOLO\]([\s\S]*?)\[\/BOLO\]/g;
    let match;

    while ((match = boloRegex.exec(content)) !== null) {
        const block = match[1];
        const bolo: BoloOpportunity = {
            titulo: extractField(block, 'Título') || 'Evento',
            fecha: extractField(block, 'Fecha') || '',
            ubicacion: extractField(block, 'Ubicación') || '',
            formatoBuscado: extractField(block, 'Formato buscado') || '',
            cache: extractField(block, 'Caché') || '',
            link: extractField(block, 'Link') || '/eventos',
        };
        bolos.push(bolo);
    }

    return bolos;
}

function extractField(block: string, fieldName: string): string {
    // Solo la línea del campo: si viene vacío no se come la siguiente
    const regex = new RegExp(`^[ \\t]*${fieldName}:[ \\t]*(.*)$`, 'im');
    const match = block.match(regex);
    return match ? match[1].trim() : '';
}

function cleanResponseText(content: string): string {
    // Remove the structured blocks from the text
    let cleaned = content
        .replace(/\[ARTISTA\][\s\S]*?\[\/ARTISTA\]/g, '')
        .replace(/\[BOLO\][\s\S]*?\[\/BOLO\]/g, '')
        .replace(/\[PUBLISH_EVENT\][\s\S]*?\[\/PUBLISH_EVENT\]/g, '')
        .replace(/\[CREAR_ANUNCIO\][\s\S]*?\[\/CREAR_ANUNCIO\]/g, '')
        .replace(/\[CREAR_PERFIL\][\s\S]*?\[\/CREAR_PERFIL\]/g, '')
        .trim();

    // Clean up extra newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    return cleaned;
}

export function parseResponse(content: string): ParsedResponse {
    return {
        text: cleanResponseText(content),
        artists: parseArtists(content),
        bolos: parseBolos(content),
        publishEvent: parsePublishEvent(content),
        listingDraft: parseListingDraft(content),
        profileDraft: parseProfileDraft(content),
    };
}

// ===========================================
// RESPONSE GENERATION
// ===========================================

export async function generateResponse(
    userMessage: string,
    state: ConversationState
): Promise<{ response: ParsedResponse; newState: ConversationState }> {

    try {
        const rawResponse = await callRodrigoChat(
            userMessage,
            state.messages.map(m => ({ role: m.role, content: m.content }))
        );
        const parsedResponse = parseResponse(rawResponse);

        // Update state with new messages
        const newState: ConversationState = {
            ...state,
            messages: [
                ...state.messages,
                { role: 'user', content: userMessage },
                { role: 'assistant', content: rawResponse }
            ],
            turnCount: state.turnCount + 1,
        };

        // Detect user role from conversation (Keep existing logic)
        if (rawResponse.toLowerCase().includes('busco bolos') ||
            rawResponse.toLowerCase().includes('soy músico') ||
            userMessage.toLowerCase().includes('soy músico') ||
            userMessage.toLowerCase().includes('busco bolos')) {
            newState.userRole = 'musician';
        } else if (rawResponse.toLowerCase().includes('evento') ||
            userMessage.toLowerCase().includes('evento') ||
            userMessage.toLowerCase().includes('boda') ||
            userMessage.toLowerCase().includes('fiesta')) {
            newState.userRole = 'organizer';
        }

        return { response: parsedResponse, newState };
    } catch (error) {
        console.error('Error generating Rodrigo response:', error);

        // Fallback response
        const fallbackResponse: ParsedResponse = {
            text: 'Perdona, estoy teniendo un momento de "baja cobertura" mental. ¿Me lo puedes repetir?',
            artists: [],
            bolos: [],
        };

        return {
            response: fallbackResponse,
            newState: {
                ...state,
                messages: [
                    ...state.messages,
                    { role: 'user', content: userMessage },
                    { role: 'assistant', content: fallbackResponse.text }
                ],
                turnCount: state.turnCount + 1,
            }
        };
    }
}

// ===========================================
// INITIAL STATE
// ===========================================

export function createInitialState(): ConversationState {
    return {
        messages: [],
        userRole: 'unknown',
        turnCount: 0,
    };
}

// Re-export for backwards compatibility
export { RODRIGO_INITIAL_MESSAGE };
