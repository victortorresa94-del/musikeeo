// Direct API client for Google Generative AI v1 (stable)
// The SDK defaults to v1beta which is deprecated, so we use fetch directly

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";
const BASE_URL = "https://generativelanguage.googleapis.com/v1";

if (!API_KEY) {
    console.warn("⚠️ VITE_GOOGLE_API_KEY is not set in .env.local");
}

export interface GenerateContentResponse {
    candidates: Array<{
        content: {
            parts: Array<{ text: string }>;
        };
    }>;
}

export async function generateContent(
    prompt: string,
    modelName: string = "gemini-1.5-flash"
): Promise<string> {
    const url = `${BASE_URL}/models/${modelName}:generateContent?key=${API_KEY}`;

    console.log("📤 Calling Gemini v1 API:", modelName);

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
            }
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        console.error("❌ API Error:", error);
        throw new Error(error.error?.message || `API Error: ${response.status}`);
    }

    const data: GenerateContentResponse = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("📥 Response received:", text.substring(0, 100) + "...");
    return text;
}

// Convenience exports for different models
export const geminiFlash = (prompt: string) => generateContent(prompt, "gemini-1.5-flash");
export const geminiPro = (prompt: string) => generateContent(prompt, "gemini-1.5-pro");

export interface ChatMessage {
    role: string;
    content: string;
}

export async function generateChatContent(
    messages: ChatMessage[],
    modelName: string = "gemini-1.5-flash"
): Promise<string> {
    const url = `${BASE_URL}/models/${modelName}:generateContent?key=${API_KEY}`;

    // Convert OpenAI-style messages to Gemini format
    // Gemini roles: 'user', 'model' (assistant -> model)
    // System messages in v1/v1beta are often best handled as a preamble in the first user message or systemInstruction if available in the version.
    // We will merge system prompt into the first user message to be safe and simple with v1.

    let contents = [];
    let pendingSystemMessage = "";

    for (const msg of messages) {
        if (msg.role === 'system') {
            pendingSystemMessage += msg.content + "\n\n";
        } else if (msg.role === 'user') {
            let text = msg.content;
            if (pendingSystemMessage) {
                text = pendingSystemMessage + "User: " + text;
                pendingSystemMessage = "";
            }
            contents.push({
                role: 'user',
                parts: [{ text: text }]
            });
        } else if (msg.role === 'assistant') {
            contents.push({
                role: 'model',
                parts: [{ text: msg.content }]
            });
        }
    }

    // Handles case where only system message exists or leading system message logic needs safety
    if (pendingSystemMessage) {
        // If we have a dangling system message, just add it as a user message to prime context
        contents.push({
            role: 'user',
            parts: [{ text: pendingSystemMessage + "Please acknowledge." }]
        });
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                }
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("❌ API Error:", error);
            throw new Error(error.error?.message || `API Error: ${response.status}`);
        }

        const data: GenerateContentResponse = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        return text;
    } catch (error) {
        console.error("Gemini Chat Request Failed:", error);
        throw error;
    }
}
