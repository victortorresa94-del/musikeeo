
import fs from 'fs';
import path from 'path';
import { generateResponse, createInitialState } from '../src/lib/rodrigoEngine';
import type { ConversationState } from '../src/lib/rodrigoEngine';

// 1. Setup Environment
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            // Join back in case value has = in it (though base64 keys shouldn't usually)
            const value = parts.slice(1).join('=').trim();

            if (key) {
                // Should we set it?
                // If we already have a value and this new one is empty, SKIP it.
                // If we don't have a value, take it (even if empty, though preferable to skip empty keys generally)

                const currentValue = process.env[key];

                if (value) {
                    process.env[key] = value;
                    if (key === 'VITE_DEEPSEEK_API_KEY') {
                        console.log(`✅ Loaded VITE_DEEPSEEK_API_KEY (Length: ${value.length})`);
                    }
                } else {
                    // New value is empty. If we already have one, keep it.
                    if (currentValue) {
                        console.log(`⚠️ Ignored empty duplicate for ${key} (kept existing value)`);
                    }
                }
            }
        }
    });
    console.log("✅ .env.local loaded");
} else {
    console.error("❌ .env.local not found");
    process.exit(1);
}

// 2. Test Runner
async function runTest(scenarioName: string, inputs: string[]) {
    console.log(`\n--------------------------------------------------`);
    console.log(`🧪 TESTING SCENARIO: ${scenarioName}`);
    console.log(`--------------------------------------------------`);

    let state = createInitialState();

    for (const input of inputs) {
        console.log(`\n👤 User: "${input}"`);
        try {
            const { response, newState } = await generateResponse(input, state);
            state = newState;

            console.log(`🤖 Rodrigo: "${response.text}"`);

            if (response.artists.length > 0) {
                console.log(`   [Visual Component: Artist Recommendations]`);
                response.artists.forEach(a => {
                    console.log(`   - 🎵 Artist: ${a.nombre} (${a.formato}) - ${a.precio}`);
                });
            }
            if (response.bolos.length > 0) {
                console.log(`   [Visual Component: Bolo Opportunities]`);
                response.bolos.forEach(b => {
                    console.log(`   - 📅 Bolo: ${b.titulo} (${b.cache})`);
                });
            }

        } catch (error) {
            console.error("❌ Error:", error);
        }
    }
}

// 3. Define Scenarios
async function main() {
    await runTest("Saludo Inicial", ["Hola"]);

    await runTest("Crear Evento - Happy Path", [
        "Quiero buscar un grupo para una boda",
        "En Madrid",
        "Sería para el 15 de agosto",
        "Busco algo de jazz tranquilo para el cóctel",
        "Pues unos 500-800 euros",
        "Si, enséñame opciones"
    ]);

    await runTest("Usuario Caótico", [
        "QUE PASA TIO",
        "necesito musica YA",
        "da igual, para una fiesta loca en bcn"
    ]);
}

main().catch(console.error);
