import { exec } from 'child_process';
import fs from 'fs';

console.log("Starting build...");
exec('npm run build', { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    console.log("Build finished. Code:", error ? error.code : 0);
    const log = `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
    fs.writeFileSync('build_debug.txt', log);
});
