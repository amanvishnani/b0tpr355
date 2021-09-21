const fs = require('fs').promises;
const path = require('path');
const [node, fileName, ...directories] = process.argv;

console.log(`${directories.length}`)

// Root
const fileSystem = {}

async function main() {
    for (const dir of directories) {
        try {
            const filePath = path.resolve(dir);
            const dirName = path.basename(filePath);
            fileSystem[dirName] = await fs.readdir(dir, { withFileTypes: true });
        } catch (error) {
            if(error.code === 'ENOENT') {
                console.log(`Invalid folder path: ${dir}. Skipping!`)
            }
        }
    }
    console.log(fileSystem);
}

main();