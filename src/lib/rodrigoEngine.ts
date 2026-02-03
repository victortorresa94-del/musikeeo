// Rodrigo AI Response Engine - Powered by DeepSeek
// Motor de conversación inteligente basado en el prompt profesional

import { generateDeepSeekContent } from './deepseek';
import { RODRIGO_SYSTEM_PROMPT, RODRIGO_INITIAL_MESSAGE } from './rodrigoPrompt';

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

export interface ParsedResponse {
    text: string;
    artists: ArtistRecommendation[];
    bolos: BoloOpportunity[];
    publishEvent?: EventDraft;
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
            link: extractField(block, 'Link') || '/events',
        };
        bolos.push(bolo);
    }

    return bolos;
}

function extractField(block: string, fieldName: string): string {
    const regex = new RegExp(`${fieldName}:\\s*(.+?)(?:\\n|$)`, 'i');
    const match = block.match(regex);
    return match ? match[1].trim() : '';
}

function cleanResponseText(content: string): string {
    // Remove the structured blocks from the text
    let cleaned = content
        .replace(/\[ARTISTA\][\s\S]*?\[\/ARTISTA\]/g, '')
        .replace(/\[BOLO\][\s\S]*?\[\/BOLO\]/g, '')
        .replace(/\[PUBLISH_EVENT\][\s\S]*?\[\/PUBLISH_EVENT\]/g, '')
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
        publishEvent: parsePublishEvent(content)
    };
}

// ===========================================
// RESPONSE GENERATION
// ===========================================

export async function generateResponse(
    userMessage: string,
    state: ConversationState
): Promise<{ response: ParsedResponse; newState: ConversationState }> {

    // Build messages array
    const messages: { role: string; content: string }[] = [
        { role: 'system', content: RODRIGO_SYSTEM_PROMPT },
        ...state.messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage }
    ];

    try {
        // Switch to DeepSeek
        const rawResponse = await generateDeepSeekContent(messages);
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
