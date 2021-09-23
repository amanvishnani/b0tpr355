const fs = require('fs').promises;
const path = require('path');

module.exports = class FileManager {

    #id = 0;

    constructor() {
        this.fileIndex = {};
        this.fileMap = {
            isRoot: true,
            children: []
        };
        this.pathSeperator = path.sep // OS Specific
    }

    static async newInstance(directories) {
        const instance = new this();
        await instance.init(directories);
        return instance;
    }

    _getUniqueId() {
        return this.#id++;
    }

    async init(directories) {
        for (const dir of directories) {
            try {
                const filePath = path.resolve(dir);
                const dirStat = await fs.lstat(filePath);
                if(dirStat.isDirectory()) {
                    const dirName = path.basename(filePath);
                    this.addDirectory(dirName, filePath);
                } 
            } catch (error) {
                if(error.code === 'ENOENT') {
                    console.log(`Invalid folder path: ${dir}. Skipping!`)
                } else if(error.code === 'ENOTDIR') {
                    console.log(`Not a folder: ${dir}. Skipping!`)
                } else {
                    console.log(error)
                }
            }
        }
        // console.log(this.fileMap);
    }

    addDirectory(folderName, path, node = this.fileMap) {
        this.addChild(folderName, path, true, node)
    }

    addChild(name, absolutePath, isDirectory, node = this.fileMap) {
        const id = this._getUniqueId();
        let child = {
            isDirectory,
            absolutePath,
            name,
            id
        }

        if(isDirectory) {
            child.isExpanded = false,
            child.children = []
        }
        node.children.push(child);
        this.fileIndex[id] = child;
    }

    async expandPath(dirPath, node = this.fileMap) {
        const childrenWithPath = node.children.filter(child => dirPath.startsWith(child.absolutePath));
        for (const child of childrenWithPath) {
            if (child.absolutePath === dirPath) {
                // Reached node that was supposed to be expanded
                const dirItems = await fs.readdir(dirPath, { withFileTypes: true });
                for (const item of dirItems) {
                    const filePath = path.resolve(`${dirPath}${this.pathSeperator}${item.name}`);
                    if(item.isDirectory()) {
                        this.addDirectory(item.name, filePath, child);
                    } else {
                        this.addChild(item.name, filePath, false, child)
                    }
                }
                child.isExpanded = true;
            } else if(dirPath.startsWith(child.absolutePath) && (node.isExpanded || node.isRoot === true)) {
                // Traverse down the tree recursively
                await this.expandPath(dirPath, child);
            } else {
                // Ideally parent should be expanded first
                continue;
            }
        }
    }

    async collapsePath(dirPath, node = this.fileMap) {
        const childrenWithPath = node.children.filter(child => dirPath.startsWith(child.absolutePath));
        for (const child of childrenWithPath) {
            if (child.absolutePath === dirPath) {
                // Reached node that was supposed to be collapsed
                this.collapseNode(child);
            } else if(dirPath.startsWith(child.absolutePath) && (node.isExpanded || node.isRoot === true)) {
                // Traverse down the tree recursively
                await this.collapsePath(dirPath, child);
            } else {
                // Ideally parent should be collapsed first
                continue;
            }
        }
    }

    /**
     * Closes all children by removing from fileIndex
     * Updating child to empty array
     * @param {*} node 
     */
    collapseNode(node) {
        if(node.children && node.isExpanded) {
            for (const child of node.children) {
                this.collapseNode(child);
                delete this.fileIndex[child.id];
            }
            node.children = [];
            node.isExpanded = false;
        }
    }
}