
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');

const SOURCES = [
    {
        name: 'orbit',
        path: path.join(ROOT, 'Fotos Orbit Padel'),
        dest: path.join(ROOT, 'public/images/orbit')
    },
    {
        name: 'goclove',
        path: path.join(ROOT, 'Fotos GoClove/afbeeldingen'),
        dest: path.join(ROOT, 'public/images/goclove')
    }
];

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach(function (file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, arrayOfFiles);
        } else {
            if (IMAGE_EXTENSIONS.includes(path.extname(file).toLowerCase())) {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
}

async function sync() {
    for (const source of SOURCES) {
        console.log(`\n--- Syncing ${source.name} ---`);
        if (!fs.existsSync(source.path)) {
            console.warn(`Source path not found: ${source.path}`);
            continue;
        }

        if (!fs.existsSync(source.dest)) {
            fs.mkdirSync(source.dest, { recursive: true });
        }

        const files = getAllFiles(source.path);
        console.log(`Found ${files.length} images in ${source.path}`);

        let copied = 0;
        let skipped = 0;

        files.forEach(file => {
            const fileName = path.basename(file);
            const destPath = path.join(source.dest, fileName);

            // Simple collision handling: if file exists and is different size, we could rename, 
            // but for now, we'll just copy if it's missing or different.
            if (!fs.existsSync(destPath)) {
                fs.copyFileSync(file, destPath);
                copied++;
            } else {
                const sourceStat = fs.statSync(file);
                const destStat = fs.statSync(destPath);
                if (sourceStat.size !== destStat.size) {
                    // If sizes differ, it might be a different image with same name.
                    // To be simple, we skip if name exists to avoid clutter, 
                    // but if we want maximum variety, we could append a suffix.
                    // Let's just copy anyway if size differs to be safe.
                    fs.copyFileSync(file, destPath);
                    copied++;
                } else {
                    skipped++;
                }
            }
        });

        console.log(`Copied ${copied} new/updated images. Skipped ${skipped} identical ones.`);
    }
}

sync().catch(console.error);
