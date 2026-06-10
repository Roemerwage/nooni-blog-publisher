
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars manually
const envPath = path.resolve(__dirname, '../.env.local');
let API_KEY = process.env.VITE_API_KEY;

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/VITE_API_KEY=(.*)/);
    if (match) {
        API_KEY = match[1].trim();
    }
}

if (!API_KEY) {
    console.error("ERROR: VITE_API_KEY not found in .env.local or environment");
    process.exit(1);
}

const CONCURRENCY_LIMIT = 2;
// Candidate models to try in order
const CANDIDATE_MODELS = [
    "gemini-2.0-flash",
    "gemini-flash-latest",
    "gemini-flash-lite-latest"
];

async function getWorkingModel(apiKey) {
    console.log("Testing available models...");
    for (const model of CANDIDATE_MODELS) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        try {
            const payload = {
                contents: [{ parts: [{ text: "Hello" }] }]
            };
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok || response.status === 429) {
                console.log(`✅ Model '${model}' is working.`);
                return model;
            } else {
                console.log(`❌ Model '${model}' rejected: ${response.status}`);
            }
        } catch (e) {
            console.log(`❌ Model '${model}' error: ${e.message}`);
        }
    }
    return null;
}

let SELECTED_MODEL = null;

async function generateDescription(base64Image, mimeType) {
    if (!SELECTED_MODEL) throw new Error("No working model found");

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${SELECTED_MODEL}:generateContent?key=${API_KEY}`;

    const payload = {
        contents: [
            {
                parts: [
                    { text: "Beschrijf deze afbeelding zeer gedetailleerd in het Nederlands. Focus op: 1. De exacte actie (bijv. 'speler slaat backhand volley'). 2. De sfeer/emotie (bijv. 'focus', 'vreugde', 'intensiteit'). 3. Opvallende objecten of kleding (bijv. 'zwart racket met oranje details', 'witte zorgsneakers'). 4. De setting (bijv. 'zonnige blauwe padelbaan', 'klinische ziekenhuisgang'). Wees specifiek en beeldend, zodat een AI later de perfecte match kan maken voor een blog." },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: base64Image
                        }
                    }
                ]
            }
        ]
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 429) throw new Error('RATE_LIMIT');
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        return text ? text.trim().replace(/['"`]/g, '') : "Geen beschrijving";

    } catch (error) {
        if (error.message.includes('API key expired') || error.message.includes('400')) {
            console.error("\nFATAL ERROR: API Key Invalid or Expired.\n");
            process.exit(1);
        }
        throw error;
    }
}

async function processFile(filePath, existingDescription = null) {
    // Skip if we already have a good description (not an error message)
    if (existingDescription &&
        !existingDescription.includes("Kon afbeelding niet analyseren") &&
        existingDescription.length > 20) { // Assume > 20 chars is a valid description
        return existingDescription;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const base64Image = fileBuffer.toString('base64');
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    let retries = 0;
    while (retries < 10) {
        try {
            const description = await generateDescription(base64Image, mimeType);
            return description;
        } catch (error) {
            if (error.message === 'RATE_LIMIT') {
                const waitTime = 5000 * Math.pow(1.5, retries); // Exponential backoff
                process.stdout.write(`\n[429] Rate limit. Backing off for ${Math.round(waitTime / 1000)}s...\n`);
                await new Promise(r => setTimeout(r, waitTime));
                retries++;
            } else {
                console.error(`\nFailed to process ${path.basename(filePath)}: ${error.message}\n`);
                return "Kon afbeelding niet analyseren";
            }
        }
    }
    return "Kon afbeelding niet analyseren (Rate Limit)";
}

// Global results storage
let ALL_ORBIT_RESULTS = [];
let ALL_GOCLOVE_RESULTS = [];

function loadExistingResults() {
    const outputPath = path.resolve(__dirname, '../data/gallery.ts');
    if (fs.existsSync(outputPath)) {
        try {
            const content = fs.readFileSync(outputPath, 'utf-8');
            // Hacky regex parsing because it's a TS file, not JSON
            const orbitMatch = content.match(/export const ORBIT_GALLERY: GalleryImage\[] = (\[.*?]);/s);
            const gocloveMatch = content.match(/export const GOCLOVE_GALLERY: GalleryImage\[] = (\[.*?]);/s);

            if (orbitMatch) ALL_ORBIT_RESULTS = JSON.parse(orbitMatch[1]);
            if (gocloveMatch) ALL_GOCLOVE_RESULTS = JSON.parse(gocloveMatch[1]);

            console.log(`Resumed: Loaded ${ALL_ORBIT_RESULTS.length} Orbit and ${ALL_GOCLOVE_RESULTS.length} GoClove images.`);
        } catch (e) {
            console.error("Failed to load existing results:", e.message);
        }
    }
}

function saveResults() {
    const output = `
import { GalleryImage } from '../types';

export const ORBIT_GALLERY: GalleryImage[] = ${JSON.stringify(ALL_ORBIT_RESULTS, null, 2)};

export const GOCLOVE_GALLERY: GalleryImage[] = ${JSON.stringify(ALL_GOCLOVE_RESULTS, null, 2)};
`;
    const outputPath = path.resolve(__dirname, '../data/gallery.ts');
    fs.writeFileSync(outputPath, output);
    // console.log(`\nPartial results saved`);
}

process.on('SIGINT', () => {
    console.log("\nCaught interrupt signal. Saving results...");
    saveResults();
    process.exit();
});

// Semaphore for concurrency
async function processBatch(files, dirPath, existingResults, resultArr) {
    // Process ALL files. The processFile function will decide whether to skip.
    const toProcess = files;

    if (toProcess.length === 0) return;

    let currentIndex = 0;
    const total = toProcess.length;

    const workers = Array(CONCURRENCY_LIMIT).fill(null).map(async (_, workerId) => {
        while (currentIndex < total) {
            const index = currentIndex++; // Atomic increment
            const file = toProcess[index];
            const filePath = path.join(dirPath, file);

            process.stdout.write(`Worker ${workerId} > [${index + 1}/${total}] ${file.substring(0, 30)}...\r`);

            try {
                // Find existing description if available
                const existingItem = existingResults.find(i => i.filename === file);
                const existingDesc = existingItem ? existingItem.description : null;

                const description = await processFile(filePath, existingDesc);

                // Update or push
                const resultIndex = resultArr.findIndex(i => i.filename === file);
                if (resultIndex !== -1) {
                    resultArr[resultIndex].description = description;
                } else {
                    resultArr.push({ filename: file, description });
                }

                if ((currentIndex + 1) % 5 === 0) saveResults();
            } catch (err) {
                console.error(`Error in worker ${workerId}:`, err);
            }
        }
    });

    await Promise.all(workers);
}

async function main() {
    // 1. Determine working model
    SELECTED_MODEL = await getWorkingModel(API_KEY);
    if (!SELECTED_MODEL) {
        console.error("CRITICAL: No working Gemini model found. Check API key or model availability.");
        process.exit(1);
    }

    loadExistingResults();

    const orbitDir = path.resolve(__dirname, '../public/images/orbit');
    const gocloveDir = path.resolve(__dirname, '../public/images/goclove');

    // Get all images
    const getImages = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png|webp|avif)$/i.test(f)) : [];

    const orbitFiles = getImages(orbitDir);
    const gocloveFiles = getImages(gocloveDir);

    console.log(`\nFound ${orbitFiles.length} Orbit images and ${gocloveFiles.length} GoClove images total.`);

    console.log("\n--- Processing Orbit Images ---");
    await processBatch(orbitFiles, orbitDir, ALL_ORBIT_RESULTS, ALL_ORBIT_RESULTS);

    console.log("\n--- Processing GoClove Images ---");
    await processBatch(gocloveFiles, gocloveDir, ALL_GOCLOVE_RESULTS, ALL_GOCLOVE_RESULTS);

    saveResults();
    console.log(`\nDone!`);
}

main();
