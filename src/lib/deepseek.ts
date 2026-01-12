const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || "";
const BASE_URL = "https://api.deepseek.com/chat/completions";

if (!API_KEY) {
    console.warn("⚠️ VITE_DEEPSEEK_API_KEY is not set in .env.local");
}

export async function generateDeepSeekContent(
    messages: { role: string; content: string }[],
    modelName: string = "deepseek-chat"
): Promise<string> {

    // Safety check to avoid sending empty requests if key is missing
    if (!API_KEY) {
        throw new Error("Missing VITE_DEEPSEEK_API_KEY");
    }

    try {
        const response = await fetch(BASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: modelName,
                messages: messages,
                stream: false
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("DeepSeek API Error:", errorText);
            throw new Error(`DeepSeek API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
    } catch (error) {
        console.error("DeepSeek Request Failed:", error);
        throw error;
    }
}
