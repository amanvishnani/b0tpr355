const fs = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');

module.exports = class FileManager {

    #id = 0;
    #watcher = null;
    #subscribers = []

    constructor() {
        this.fileIndex = {};
        this.fileMap = {
            isRoot: true,
            children: [],
            id: this._getUniqueId()
        };
        this.pathSeperator = path.sep // OS Specific
        this.directories = [];
    }

    static async newInstance(directories) {
        const instance = new this();
        await instance.init(directories);
        return instance;
    }

    _getUniqueId() {
        return this.#id++;
    }

    getNode(absolutePath) {
        for (const node of Object.values(this.fileIndex)) {
            if(node.absolutePath === absolutePath) {
                return node;
            }
        }
        return null;
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
                this.directories.push(dir);
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
        this.watchDirectories();
    }

    addDirectory(folderName, folderPath, node = this.fileMap) {
        this.addChild(folderName, folderPath, true, node)
    }

    addChild(name, absolutePath, isDirectory, node = this.fileMap) {
        const id = this._getUniqueId();
        let child = {
            isDirectory,
            absolutePath,
            name,
            id,
            parentId: node.id
        }

        if(isDirectory === true) {
            child.isExpanded = false;
            child.children = [];
        }
        node.children.push(child);
        this.fileIndex[id] = child;
    }

    async expandPath(dirPath, node = this.fileMap) {
        const childrenWithPath = node.children.filter(child => dirPath.startsWith(child.absolutePath));
        for (const child of childrenWithPath) {
            if (child.absolutePath === dirPath) {
                // Reached node that was supposed to be expanded]
                const dirItems = await fs.readdir(dirPath, { withFileTypes: true });
                for (const item of dirItems) {
                    const filePath = path.resolve(path.join(dirPath, item.name));
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

    unlinkNode(node) {
        const nodePath = node.absolutePath;
        if(node.isDirectory) {
            for (const childNode of node.children) {
                this.unlinkNode(childNode);
            }
        }
        console.log(`File/Directory removed -> ${nodePath}`);
        const parentNode = this.fileIndex[node.parentId];
        parentNode.children = parentNode.children.filter(child => child.absolutePath !== nodePath);
        delete this.fileIndex[node.id];
    }

    async _handelAdd(nodePath) {
        const filePath = path.resolve(nodePath);
        const dirname = path.dirname(filePath);
        const basename = path.basename(filePath);
        const dirNode = this.getNode(dirname);
        if(dirNode === null || !dirNode.isExpanded) {
            // Don't index yet. We're not rendering
            return false;
        }

        let stat = await fs.stat(filePath);
        if(stat.isDirectory()) {
            this.addDirectory(basename, filePath, dirNode);
        } else {
            this.addChild(basename, filePath, false, dirNode);
        }
        console.log(`File/Dir Added -> ${path.resolve(filePath)}`);
        return true;
    }

    watchDirectories() {
        this.#watcher = chokidar.watch(this.directories)
        this.#watcher.on('add', async (filePath) => {
            const result = await this._handelAdd(filePath);
            if(result) {
                this.notifyChange();
            }
        });

        this.#watcher.on('addDir', async (filePath) => {
            const result = await this._handelAdd(filePath);
            if(result) {
                this.notifyChange();
            }
        });

        this.#watcher.on('unlink', (filePath) => {
            this._handelUnlinkEvent(filePath);
        });

        this.#watcher.on('unlinkDir', (filePath) => {
            this._handelUnlinkEvent(filePath);
        });
    }

    _handelUnlinkEvent(filePath) {
        const nodePath = path.resolve(filePath);
        const node = this.getNode(nodePath)
        if (node) {
            this.unlinkNode(node);
            this.notifyChange()
        }
    }

    subscribe(socket) {
        this.#subscribers.push(socket);
        socket.on('expand', async (node) => {
            await this.expandPath(node.absolutePath)
            socket.emit('message', this.fileMap);
        });
    
        socket.on('collapse', async (node) => {
            await this.collapsePath(node.absolutePath)
            socket.emit('message', this.fileMap);
        });
    }

    unsubscribe(socket) {
        this.#subscribers = this.#subscribers.filter(sock => sock.id !== socket.id);
    }

    notifyChange() {
        for (const sock of this.#subscribers) {
            sock.emit('message', this.fileMap);
        }
    }

}