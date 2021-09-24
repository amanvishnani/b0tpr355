# File Viewer App written in Node.js & React 

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).


## Quick start

1. Install dependencies `npm install`
2. run `npm start`

## Available Scripts

In the project directory, you can run:

### 1. `npm run-script start-react`

Runs the react app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### 2. `npm run-script start-node`

Runs the Node.js backend service in the development mode on [http://localhost:5000](http://localhost:5000) \
Open  to view it in the browser.

### 3. `npm start`

Runs Backend service and react app concurrently

## Modifying list of directoreies

Run backend service with the following command \
`node ./server/index.js directory1 [...directory2]`

# Tach Stack
1. React (Frontend App)
2. Node.js Backend service
3. Material UI for Tree component
4. Chokidar for watching file changes
5. Socket.io for Push-based architecture


# Solution Design

The FileManager class is the main domain class
1. It is responsible for managing the state of the current tree
2. Watching folders when they are expanded
3. Unwatching folders when they are collapsed
4. Notifying web clients of any changes.

The application uses push based architecture, which means: the server notify the clients of any changes to the file system using WebSockets.
