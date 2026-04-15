import { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import SwitchNode from '@/components/editor/nodes/SwitchNode';
import BulbNode from '@/components/editor/nodes/BulbNode';
import ANDNode from '@/components/editor/nodes/ANDNode';
import ORNode from '@/components/editor/nodes/ORNode';
import NOTNode from '@/components/editor/nodes/NOTNode';

import { useCircuitStore } from '../store/circuitStore';
import { evaluateCircuit } from '@/utils/logicEngine';
import toast from 'react-hot-toast';

import { useHistory } from '@/hooks/useHistory';

const nodeTypes = {
  switch: SwitchNode,
  bulb: BulbNode,
  and: ANDNode,
  or: ORNode,
  not: NOTNode,
};

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    fetchCircuitById,
    currentCircuit,
    saveCircuitData,
    clearCurrentCircuit,
    isLoading,
  } = useCircuitStore();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const { takeSnapshot, undo, redo, canUndo, canRedo } = useHistory();
  const [contextMenu, setContextMenu] = useState(null);

  const isValidConnection = useCallback(
    (connection) => {
      if (connection.source === connection.target) {
        return false;
      }

      const isTargetOccupied = edges.some(
        (edge) =>
          edge.target === connection.target &&
          edge.targetHandle === connection.targetHandle,
      );

      return !isTargetOccupied;
    },
    [edges],
  );

  const toggleNodeValue = useCallback(
    (nodeId) => {
      takeSnapshot(nodes, edges);
      setNodes((nds) => {
        const newNodes = nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, value: !node.data.value } };
          }
          return node;
        });

        setEdges((eds) => {
          const { evaluatedNodes, evaluatedEdges } = evaluateCircuit(
            newNodes,
            eds,
          );
          setTimeout(() => setNodes(evaluatedNodes), 0);
          return evaluatedEdges;
        });

        return newNodes;
      });
    },
    [setNodes, setEdges],
  );

  const addNode = (type) => {
    takeSnapshot(nodes, edges);
    const newNode = {
      id: `${type}-${Date.now()}`,
      type: type,
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: { value: false },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  useEffect(() => {
    fetchCircuitById(id);
    return () => clearCurrentCircuit();
  }, [id, fetchCircuitById, clearCurrentCircuit]);

  useEffect(() => {
    if (currentCircuit?.data) {
      const initialNodes = currentCircuit.data.nodes || [];
      const initialEdges = currentCircuit.data.edges || [];

      const { evaluatedNodes, evaluatedEdges } = evaluateCircuit(
        initialNodes,
        initialEdges,
      );

      setNodes(evaluatedNodes);
      setEdges(evaluatedEdges);
    }
  }, [currentCircuit]);

  useEffect(() => {
    useCircuitStore.setState({ toggleNodeValue });
  }, [toggleNodeValue]);

  const onNodesChange = useCallback(
    (changes) => {
      if (changes.some(c => c.type === 'remove')) {
        takeSnapshot(nodes, edges);
      }

      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [nodes, edges, takeSnapshot],
  );

  const onNodeDragStart = useCallback(() => {
    takeSnapshot(nodes, edges);
  }, [nodes, edges, takeSnapshot]);


  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    setNodes(nds => nds.map(n => ({ ...n, selected: n.id === node.id })));
    
    setContextMenu({
      id: node.id,
      top: event.clientY,
      left: event.clientX,
    });
  }, []);

  const onPaneClick = useCallback(() => setContextMenu(null), []);

  const handleUndo = useCallback(() => {
    const previous = undo(nodes, edges);
    if (previous) {
      setNodes(previous.nodes);
      setEdges(previous.edges);
      toast('Undo', { icon: '↩️' });
    }
  }, [nodes, edges, undo]);

  const handleRedo = useCallback(() => {
    const next = redo(nodes, edges);
    if (next) {
      setNodes(next.nodes);
      setEdges(next.edges);
      toast('Redo', { icon: '↪️' });
    }
  }, [nodes, edges, redo]);

  const handleDuplicate = useCallback(() => {
    const selectedNodes = nodes.filter(node => node.selected);
    if (selectedNodes.length === 0) return;

    takeSnapshot(nodes, edges);

    const idMap = new Map();
    const newNodes = selectedNodes.map(node => {
      const newId = `${node.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      idMap.set(node.id, newId);
      
      return {
        ...node,
        id: newId,
        position: { x: node.position.x + 40, y: node.position.y + 40 },
        selected: true,
        data: { ...node.data },
      };
    });

    const internalEdges = edges.filter(
      edge => idMap.has(edge.source) && idMap.has(edge.target),
    );

    const newEdges = internalEdges.map(edge => ({
      ...edge,
      id: `e-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      source: idMap.get(edge.source),
      target: idMap.get(edge.target),
      selected: true,
    }));

    setNodes(nds => [
      ...nds.map(n => ({ ...n, selected: false })), 
      ...newNodes,
    ]);
    
    setEdges(eds => {
      const updatedEdges = [
        ...eds.map(e => ({ ...e, selected: false })),
        ...newEdges,
      ];
      
      const { evaluatedNodes, evaluatedEdges } = evaluateCircuit([...nodes, ...newNodes], updatedEdges);
      setTimeout(() => setNodes(evaluatedNodes), 0);
      return evaluatedEdges;
    });

    toast.success(`Duplicated ${newNodes.length} nodes & ${newEdges.length} connections`);
  }, [nodes, edges, takeSnapshot, setNodes, setEdges]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      if (ctrlOrCmd && event.key === 'd') {
        event.preventDefault();
        handleDuplicate();
      }

      if (ctrlOrCmd && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
      }
      
      if ((ctrlOrCmd && event.key === 'y') || (ctrlOrCmd && event.shiftKey && event.key === 'Z')) {
        event.preventDefault();
        handleRedo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleDuplicate, handleUndo, handleRedo]);

  const onEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => {
        const newEdges = applyEdgeChanges(changes, eds);

        const isDeleteEvent = changes.some(
          (change) => change.type === 'remove',
        );
        if (isDeleteEvent) {
          const { evaluatedNodes, evaluatedEdges } = evaluateCircuit(
            nodes,
            newEdges,
          );
          setTimeout(() => setNodes(evaluatedNodes), 0);
          return evaluatedEdges;
        }

        return newEdges;
      });
    },
    [nodes, setNodes],
  );

  const onConnect = useCallback(
    (connection) => {
      takeSnapshot(nodes, edges);
      setEdges((eds) => {
        const newEdges = addEdge(connection, eds);
        const { evaluatedNodes, evaluatedEdges } = evaluateCircuit(
          nodes,
          newEdges,
        );
        setTimeout(() => setNodes(evaluatedNodes), 0);
        return evaluatedEdges;
      });
    },
    [nodes, setNodes, setEdges],
  );

  const handleSave = async () => {
    setIsSaving(true);
    const savePromise = saveCircuitData(id, nodes, edges);

    toast.promise(savePromise, {
      loading: 'Saving circuit...',
      success: 'Circuit saved successfully!',
      error: 'Failed to save.',
    });

    await savePromise;
    setIsSaving(false);
  };

  if (isLoading && !currentCircuit) {
    return (
      <div className='min-h-screen bg-slate-900 flex items-center justify-center text-white'>
        Loading...
      </div>
    );
  }

  return (
    <div className='min-h-screen flex flex-col h-screen'>
      <nav className='bg-slate-800 border-b border-slate-700 px-4 py-3 flex justify-between items-center z-10 shrink-0'>
        <div className='flex items-center gap-4'>
          <button
            onClick={() => navigate('/dashboard')}
            className='text-slate-300 hover:text-white transition'
          >
            ← Back
          </button>
          <span className='text-slate-400'>|</span>
          <h1 className='text-white font-medium truncate max-w-[200px]'>
            {currentCircuit?.name || 'Loading...'}
          </h1>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className='bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition'
        >
          {isSaving ? 'Saving...' : 'Save Circuit'}
        </button>
      </nav>

      <main className='flex-1 w-full h-full bg-slate-900 relative'>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStart={onNodeDragStart}
          onNodeContextMenu={onNodeContextMenu}
          onPaneClick={onPaneClick}
          isValidConnection={isValidConnection}
          panOnScroll={true}
          selectionOnDrag={true}
          panOnDrag={[1, 2]}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background color='#475569' gap={16} />
          <Controls className='bg-slate-800 border-slate-700 fill-white' />

          <Panel
            position='top-left'
            className='bg-slate-800 p-3 rounded-xl border border-slate-700 shadow-xl flex flex-col gap-2'
          >
            <div className='text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 px-1'>
              Elements
            </div>

            <button
              onClick={() => addNode('switch')}
              className='flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition text-sm text-left border border-slate-600'
            >
              <div className='w-3 h-3 rounded-sm bg-emerald-500'></div>
              Switch (Input)
            </button>

            <button
              onClick={() => addNode('bulb')}
              className='flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition text-sm text-left border border-slate-600'
            >
              <div className='w-3 h-3 rounded-full bg-yellow-400'></div>
              Bulb (Output)
            </button>

            <div className='h-px bg-slate-700 my-1'></div>

            <button
              onClick={() => addNode('and')}
              className='flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition text-sm text-left border border-slate-600 font-bold'
            >
              <span className='text-blue-400'>AND</span> Gate
            </button>

            <button
              onClick={() => addNode('or')}
              className='flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition text-sm text-left border border-slate-600 font-bold'
            >
              <span className='text-purple-400'>OR</span> Gate
            </button>

            <button
              onClick={() => addNode('not')}
              className='flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition text-sm text-left border border-slate-600 font-bold'
            >
              <span className='text-rose-400'>NOT</span> Gate
            </button>

            <div className="h-px bg-slate-700 my-1"></div>

            <button 
              onClick={() => {
                if(window.confirm('Clear the entire board?')) {
                  setNodes([]);
                  setEdges([]);
                }
              }}
              className="flex items-center justify-center gap-2 bg-red-900/50 hover:bg-red-800/80 text-red-200 px-3 py-2 rounded-lg transition text-sm font-bold border border-red-800/50"
            >
              Clear Board
            </button>
            
            <div className="text-[10px] text-slate-500 text-center mt-2">
              Select item & press Del to remove
            </div>
          </Panel>
          <Panel position="top-center" className="bg-slate-800 p-1.5 rounded-lg border border-slate-700 shadow-xl flex gap-1 mt-2">
            <button 
              onClick={handleUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className={`p-2 rounded transition ${canUndo ? 'text-slate-200 hover:text-white hover:bg-slate-700' : 'text-slate-600 cursor-not-allowed'}`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
            </button>
            <button 
              onClick={handleRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              className={`p-2 rounded transition ${canRedo ? 'text-slate-200 hover:text-white hover:bg-slate-700' : 'text-slate-600 cursor-not-allowed'}`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
                />
              </svg>
            </button>
            <div className="w-px bg-slate-700 mx-1 my-1"></div>
            <button 
              onClick={handleDuplicate}
              title="Duplicate Selected (Ctrl+D)"
              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-slate-700 rounded transition"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
            <button 
              onClick={() => {
                const selectedNodes = nodes.filter(n => n.selected);
                if(selectedNodes.length > 0 && window.confirm('Delete selected?')) {
                  setNodes(nds => nds.filter(n => !n.selected));
                }
              }}
              title="Delete Selected (Del)"
              className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-700 rounded transition"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </Panel>
        </ReactFlow>
      </main>
      {contextMenu && (
        <div 
          className="fixed bg-slate-800 border border-slate-700 shadow-2xl rounded-lg py-1 z-50 min-w-[150px]"
          style={{ top: contextMenu.top, left: contextMenu.left }}
        >
          <button 
            className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 flex justify-between items-center"
            onClick={() => { handleDuplicate(); setContextMenu(null); }}
          >
            Duplicate <span className="text-slate-500 text-xs">Ctrl+D</span>
          </button>
          <div className="h-px bg-slate-700 my-1"></div>
          <button 
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 flex justify-between items-center"
            onClick={() => {
              takeSnapshot(nodes, edges);
              setNodes(nds => nds.filter(n => n.id !== contextMenu.id));
              setContextMenu(null);
            }}
          >
            Delete <span className="text-slate-500 text-xs">Del</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Editor;
