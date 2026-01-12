import { generateContent } from "../lib/gemini";

export const aiService = {
    /**
     * General chat interaction for the AI Assistant
     */
    async chat(message: string, context: string = "") {
        try {
            const prompt = `
            Actúa como un asistente inteligente experto en la industria musical para la app "Musikeeo".
            Tu tono debe ser profesional pero cercano, "cool" y motivador.
            
            Contexto actual: ${context}
            
            Usuario dice: "${message}"
            
            Responde de manera concisa y útil. Usa español.
            `;

            const text = await generateContent(prompt);
            return text;
        } catch (error: any) {
            console.error("❌ Error in AI chat:", error);
            return `Error: ${error?.message || "No se pudo conectar con la IA."}`;
        }
    },

    /**
     * Matchmaking: Suggest connections based on profiles
     */
    async getMatchmakingSuggestions(userProfile: any, goal: string) {
        try {
            const prompt = `
            Analiza el siguiente perfil de músico y su objetivo actual:
            Perfil: ${JSON.stringify(userProfile)}
            Objetivo: "${goal}"

            Sugiere 3 tipos de perfiles (ej: "Productor de Jazz", "Dueño de Sala en BCN") con los que debería conectar y por qué.
            Devuelve la respuesta en formato JSON array con objetos { "role": string, "reason": string }.
            `;

            const text = await generateContent(prompt, "gemini-1.5-pro");
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("Error in matchmaking:", error);
            return [];
        }
    },

    /**
     * Event Creation: Generate rich descriptions and details
     */
    async generateEventDetails(basicInfo: string) {
        try {
            const prompt = `
            Genera una descripción atractiva y profesional para un evento musical basado en esto: "${basicInfo}".
            Incluye un título sugerido, una descripción larga y tags relevantes.
            Formato JSON: { "title": string, "description": string, "tags": string[] }
            `;

            const text = await generateContent(prompt);
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("Error generating event details:", error);
            return null;
        }
    },

    /**
     * Poster Generation: Creates a prompt for an image generator
     */
    async generatePosterPrompt(eventDetails: any) {
        try {
            const prompt = `
            Describe visualmente un poster/cartel para el siguiente evento:
            Título: ${eventDetails.title}
            Descripción: ${eventDetails.description}
            
            Crea un "prompt" detallado en inglés optimizado para generadores de imágenes como Midjourney o DALL-E. 
            El estilo debe ser moderno, vibrante y acorde al género musical.
            Solo devuelve el prompt.
            `;

            return await generateContent(prompt);
        } catch (error) {
            console.error("Error generating poster prompt:", error);
            return "A dynamic music concert poster design, high quality, vibrant colors.";
        }
    }
};
