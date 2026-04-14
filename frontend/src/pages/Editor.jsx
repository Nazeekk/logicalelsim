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

import { useCircuitStore } from '../store/circuitStore';
import { evaluateCircuit } from '@/utils/logicEngine';

const nodeTypes = {
  switch: SwitchNode,
  bulb: BulbNode,
};

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchCircuitById, currentCircuit, saveCircuitData, clearCurrentCircuit, isLoading } = useCircuitStore();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const toggleNodeValue = useCallback((nodeId) => {
    setNodes((nds) => {
      const newNodes = nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, value: !node.data.value } };
        }
        return node;
      });
      
      setEdges((eds) => {
        const { evaluatedNodes, evaluatedEdges } = evaluateCircuit(newNodes, eds);
        setTimeout(() => setNodes(evaluatedNodes), 0); 
        return evaluatedEdges;
      });

      return newNodes;
    });
  }, [setNodes, setEdges]);

  const addNode = (type) => {
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
      
      const { evaluatedNodes, evaluatedEdges } = evaluateCircuit(initialNodes, initialEdges);
      
      setNodes(evaluatedNodes);
      setEdges(evaluatedEdges);
    }
  }, [currentCircuit]);

  useEffect(() => {
    useCircuitStore.setState({ toggleNodeValue });
  }, [toggleNodeValue]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );

  const onEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => {
        const newEdges = applyEdgeChanges(changes, eds);
        
        const isDeleteEvent = changes.some(change => change.type === 'remove');
        if (isDeleteEvent) {
          const { evaluatedNodes, evaluatedEdges } = evaluateCircuit(nodes, newEdges);
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
      setEdges((eds) => {
        const newEdges = addEdge(connection, eds);
        const { evaluatedNodes, evaluatedEdges } = evaluateCircuit(nodes, newEdges);
        setTimeout(() => setNodes(evaluatedNodes), 0);
        return evaluatedEdges;
      });
    },
    [nodes, setNodes, setEdges],
  );

  const handleSave = async () => {
    setIsSaving(true);
    await saveCircuitData(id, nodes, edges);
    setIsSaving(false);
  };

  if (isLoading && !currentCircuit) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col h-screen">
      <nav className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-slate-300 hover:text-white transition"
          >
            ← Back
          </button>
          <span className="text-slate-400">|</span>
          <h1 className="text-white font-medium truncate max-w-[200px]">
            {currentCircuit?.name || 'Loading...'}
          </h1>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition"
        >
          {isSaving ? 'Saving...' : 'Save Circuit'}
        </button>
      </nav>

      <main className="flex-1 w-full h-full bg-slate-900 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#475569" gap={16} />
          <Controls className="bg-slate-800 border-slate-700 fill-white" />
          
          <Panel position="top-left" className="bg-slate-800 p-3 rounded-xl border border-slate-700 shadow-xl flex flex-col gap-2">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 px-1">Elements</div>
            
            <button 
              onClick={() => addNode('switch')}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition text-sm text-left border border-slate-600"
            >
              <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
              Switch (Input)
            </button>
            
            <button 
              onClick={() => addNode('bulb')}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition text-sm text-left border border-slate-600"
            >
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              Bulb (Output)
            </button>
          </Panel>
        </ReactFlow>
      </main>
    </div>
  );
};

export default Editor;