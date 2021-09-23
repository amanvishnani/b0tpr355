const MyFileSystem = require('./MyFileSystem')
const [node, fileName, ...directories] = process.argv;

console.log(`${directories.length}`)


async function main() {
    // Root
    const fileSystem = await MyFileSystem.newInstance(directories);
    await fileSystem.expandPath('d:\\Projects\\b0tpr355\\server');
    await fileSystem.expandPath('d:\\Projects\\b0tpr355');
    await fileSystem.expandPath('d:\\Projects\\b0tpr355\\.git');
    console.log(fileSystem.fileIndex)
    await fileSystem.collapsePath('d:\\Projects\\b0tpr355\\.git');
    console.log(fileSystem.fileMap)
    console.log(fileSystem.fileIndex)
}

main();