import { TreeView, TreeItem } from '@mui/lab';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DescriptionIcon from '@mui/icons-material/Description';
import './App.css';

import { io } from "socket.io-client";
import { useEffect, useState, useRef } from 'react';

function App() {

  const [tree, setTree] = useState(null);
  const [expanded, setExpanded] = useState([]);
  const socket = useRef(null);

  // On init
  useEffect(() => {
    socket.current = io();
    socket.current.on('message', _ => {
      console.log(_);
      setTree(_)
    });
    return () => {
      
    }
  }, []); // Comp did mount

  // Set expanded from server
  useEffect(() => {
    let localExpanded = []
      function calculateExpanded(node, localExpanded) {
        if(node == null) {
          return;
        }
        if(node.isRoot) {
          for (const child of node.children) {
            calculateExpanded(child, localExpanded);
          }
        } else if(node?.isExpanded === true) {
          localExpanded.push(`${node.id}`);
          if( node.children ) {
            for (const child of node.children) {
              calculateExpanded(child, localExpanded);
            }
          }
        }
      }
      calculateExpanded(tree, localExpanded);
      // console.log(localExpanded)
      setExpanded(localExpanded);
    return () => {
      
    }
  }, [tree])

  function getIcon(node) {
    if(node.isDirectory) {
      if(node.isExpanded) {
        return <ExpandMoreIcon></ExpandMoreIcon>
      } else {
        return <ChevronRightIcon></ChevronRightIcon>
      }
    } else {
      return <DescriptionIcon></DescriptionIcon>;
    }
  }

  function renderTree(tree) {
    if( tree === null) {
      return null;
    } else if (tree.children) {
      let subTree =  <>{tree.children.map(child => {
        return <TreeItem key={`${child.id}`} nodeId={`${child.id}`} label={child.name} icon={getIcon(child)} onClick={_ => handelClick(child)}>
          {renderTree(child)}
        </TreeItem>
      })}</>;
      return subTree;
    }
  }

  function handelClick(node) {
    // console.log(node);
    if (node.isExpanded) {
      socket.current.emit('collapse', node);
    } else if(node.isDirectory) {
      socket.current.emit('expand', node);
    } 
  }

  return (
    <div className="App">
      <header className="App-header">
      <TreeView
        aria-label="file system navigator"
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        expanded={expanded}
        sx={{ height: 240, flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
      >
        {
          renderTree(tree)
        }
      </TreeView>
      </header>
    </div>
  );
}

export default App;
