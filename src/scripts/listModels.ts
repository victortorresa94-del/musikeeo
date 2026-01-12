import { genAI } from "../lib/gemini";

// Script to list available models
async function listModels() {
    try {
        console.log("Listing available models...");
        const models = await genAI.listModels();
        for await (const model of models) {
            console.log(`Model: ${model.name}`);
            console.log(`  - Supported methods: ${model.supportedGenerationMethods?.join(", ")}`);
        }
    } catch (error: any) {
        console.error("Error listing models:", error?.message || error);
    }
}

listModels();
