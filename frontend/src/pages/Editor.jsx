import { useEffect, useCallback, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Panel,
  useUpdateNodeInternals,
  reconnectEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';

import SwitchNode from '@/components/editor/nodes/SwitchNode';
import BulbNode from '@/components/editor/nodes/BulbNode';
import ANDNode from '@/components/editor/nodes/ANDNode';
import ORNode from '@/components/editor/nodes/ORNode';
import NOTNode from '@/components/editor/nodes/NOTNode';
import NANDNode from '@/components/editor/nodes/NANDNode';
import NORNode from '@/components/editor/nodes/NORNode';
import XORNode from '@/components/editor/nodes/XORNode';
import XNORNode from '@/components/editor/nodes/XNORNode';
import MacroNode from '@/components/editor/nodes/MacroNode';
import ClockNode from '@/components/editor/nodes/ClockNode.jsx';
import HexDisplayNode from '@/components/editor/nodes/HexDisplayNode.jsx';
import ConstantNode from '@/components/editor/nodes/ConstantNode.jsx';
import DataRomNode from '@/components/editor/nodes/DataRomNode.jsx';
import Display8BitNode from '@/components/editor/nodes/Display8BitNode.jsx';
import LoggerNode from '@/components/editor/nodes/LoggerNode.jsx';

import { useCircuitStore } from '../store/circuitStore';
import { clearSimulationCache, Simulator } from '@/utils/logicEngine';
import toast from 'react-hot-toast';

import { useHistory } from '@/hooks/useHistory';

const nodeTypes = {
  switch: SwitchNode,
  bulb: BulbNode,
  and: ANDNode,
  or: ORNode,
  not: NOTNode,
  nand: NANDNode,
  nor: NORNode,
  xor: XORNode,
  xnor: XNORNode,
  macro: MacroNode,
  clock: ClockNode,
  hex: HexDisplayNode,
  constant: ConstantNode,
  data_rom: DataRomNode,
  display8bit: Display8BitNode,
  logger: LoggerNode,
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
    circuits,
    fetchCircuits,
    renameCircuit,
  } = useCircuitStore();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isMacro, setIsMacro] = useState(false);
  const [category, setCategory] = useState('Custom');

  const { takeSnapshot, undo, redo, canUndo, canRedo } = useHistory();
  const updateNodeInternals = useUpdateNodeInternals();
  const [contextMenu, setContextMenu] = useState(null);
  const [edgeContextMenu, setEdgeContextMenu] = useState(null);

  const [switchTargetId, setSwitchTargetId] = useState(null);
  const [isReplaceMode, setIsReplaceMode] = useState(false);

  const [isSimulating, setIsSimulating] = useState(false);
  const simulatorRef = useRef(null);
  const syncIntervalRef = useRef(null);

  const edgeUpdateSuccessful = useRef(true);
  const updatingEdgeRef = useRef(null);

  const lastRenderTime = useRef(0);
  const pendingUpdateRef = useRef(null);

  const toggleSimulation = useCallback(() => {
    if (isSimulating) {
      setIsSimulating(false);
      clearInterval(syncIntervalRef.current);
      simulatorRef.current = null;
      toast('Simulation stopped', { icon: '🛑' });
    } else {
      try {
        simulatorRef.current = new Simulator(
          nodes,
          edges,
          useCircuitStore.getState().getCircuitTemplate,
        );
        setIsSimulating(true);
        toast('Simulation started!', { icon: '🚀' });

        syncIntervalRef.current = setInterval(() => {
          if (!simulatorRef.current) return;

          const { visualNodesValues, activeEdges, visualMacroOutputs } = simulatorRef.current.getVisualState();

          setNodes((currentNodes) => currentNodes.map((n) => {
            let newData = { ...n.data };
            let isChanged = false;

            if (visualMacroOutputs[n.id]) {
              const currentOutputsStr = JSON.stringify(n.data.macroOutputs || {});
              const newOutputsStr = JSON.stringify(visualMacroOutputs[n.id]);
              if (currentOutputsStr !== newOutputsStr) {
                newData.macroOutputs = visualMacroOutputs[n.id];
                isChanged = true;
              }
            }

            if (visualNodesValues[n.id] !== undefined && visualNodesValues[n.id] !== newData.value) {
              newData.value = visualNodesValues[n.id];
              isChanged = true;
            }

            return isChanged ? { ...n, data: newData } : n;
          }));

          setEdges((currentEdges) => currentEdges.map((e) => {
            const isActive = activeEdges.has(e.id);
            const currentIsActive = e.animated;

            if (isActive !== currentIsActive) {
              return {
                ...e,
                animated: isActive,
                className: isActive ? 'active-wire' : 'inactive-wire',
              };
            }
            return e;
          }));
        }, 35);

      } catch (error) {
        console.error(error);
        toast.error('Failed to compile circuit');
      }
    }
  }, [isSimulating, nodes, edges]);

  const recompileIfSimulating = useCallback((newNodes, newEdges) => {
    if (isSimulating) {
      try {
        simulatorRef.current = new Simulator(
          newNodes,
          newEdges,
          useCircuitStore.getState().getCircuitTemplate,
        );
      } catch (error) {
        console.error('Failed to recompile on the fly:', error);
        setIsSimulating(false);
        toast.error('Simulation stopped due to structural error');
      }
    }
  }, [isSimulating]);

  const onEdgeUpdateStart = useCallback((event, edge) => {
    edgeUpdateSuccessful.current = false;
    updatingEdgeRef.current = edge;
  }, []);

  const onEdgeUpdate = useCallback((oldEdge, newConnection) => {
    edgeUpdateSuccessful.current = true;
    setEdges((els) => {
      const updatedEdges = reconnectEdge(oldEdge, newConnection, els);
      recompileIfSimulating(nodes, updatedEdges);
      return updatedEdges;
    });
  }, [nodes, recompileIfSimulating]);

  const onEdgeUpdateEnd = useCallback((_, edge) => {
    if (!edgeUpdateSuccessful.current) {
      setEdges((eds) => {
        const remainingEdges = eds.filter((e) => e.id !== edge.id);
        recompileIfSimulating(nodes, remainingEdges);
        return remainingEdges;
      });
    }
    updatingEdgeRef.current = null;
    edgeUpdateSuccessful.current = true;
  }, [nodes, recompileIfSimulating]);

  const isValidConnection = useCallback(
    (connection) => {
      if (connection.source === connection.target) {
        return false;
      }

      const isTargetOccupied = edges.some(
        (edge) =>
          edge.target === connection.target &&
          edge.targetHandle === connection.targetHandle &&
          edge.id !== updatingEdgeRef.current?.id,
      );

      return !isTargetOccupied;
    },
    [edges],
  );

  const toggleNodeValue = useCallback((nodeId) => {
    if (isSimulating && simulatorRef.current) {
      const currentNode = nodes.find((n) => n.id === nodeId);
      const newValue = !currentNode?.data?.value;
      simulatorRef.current.setInputValue(nodeId, newValue);
    } else {
      setNodes((nds) => nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, value: !n.data.value } } : n,
      ));
    }
  }, [isSimulating, nodes]);

  const tickClock = useCallback((nodeId, newValue) => {
    if (isSimulating && simulatorRef.current) {
      simulatorRef.current.setInputValue(nodeId, newValue);
    } else {
      setNodes((nds) => nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, value: newValue } } : n,
      ));
    }
  }, [isSimulating]);

  useEffect(() => {
    const flushInterval = setInterval(() => {
      if (pendingUpdateRef.current) {
        setNodes([...pendingUpdateRef.current.nodes]);
        setEdges([...pendingUpdateRef.current.edges]);
        pendingUpdateRef.current = null;
        lastRenderTime.current = performance.now();
      }
    }, 100);
    return () => clearInterval(flushInterval);
  }, [setNodes, setEdges]);

  const updateNodeLabel = useCallback((nodeId, newLabel) => {
    takeSnapshot(nodes, edges);
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, label: newLabel } };
        }
        return node;
      }),
    );
  }, [nodes, edges, takeSnapshot, setNodes]);

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

  const handleMacroAction = useCallback((savedCircuit) => {
    if (isReplaceMode && switchTargetId) {
      // РЕЖИМ ЗАМІНИ
      const inputsCount = savedCircuit.data.nodes.filter((n) => n.type === 'switch').length;
      const outputsCount = savedCircuit.data.nodes.filter((n) => n.type === 'bulb').length;

      setNodes((nds) => {
        const updatedNodes = nds.map((node) => {
          if (node.id === switchTargetId) {
            return {
              ...node,
              data: {
                ...node.data,
                name: savedCircuit.name,
                templateId: savedCircuit._id,
                inputsCount,
                outputsCount,
                macroOutputs: {}, // скидаємо стан виходів
              },
            };
          }
          return node;
        });

        // Перекомпілюємо симуляцію з новими шаблонами
        recompileIfSimulating(updatedNodes, edges);
        return updatedNodes;
      });

      toast.success(`Switched to ${savedCircuit.name}`);
    } else {
      // РЕЖИМ ДОДАВАННЯ (твій старий код addMacro)
      takeSnapshot(nodes, edges);
      const inputsCount = savedCircuit.data.nodes.filter((n) => n.type === 'switch').length;
      const outputsCount = savedCircuit.data.nodes.filter((n) => n.type === 'bulb').length;

      const newNode = {
        id: `macro-${Date.now()}`,
        type: 'macro',
        position: { x: Math.random() * 200 + 300, y: Math.random() * 200 + 100 },
        data: {
          name: savedCircuit.name,
          templateId: savedCircuit._id,
          inputsCount,
          outputsCount,
          macroOutputs: {},
        },
      };

      setNodes((nds) => {
        const newNodes = [...nds, newNode];
        recompileIfSimulating(newNodes, edges);
        return newNodes;
      });
      toast.success(`${savedCircuit.name} imported!`);
    }

    // Скидаємо стани після дії
    setIsReplaceMode(false);
    setSwitchTargetId(null);
    document.getElementById('macro-modal').close();
  }, [isReplaceMode, switchTargetId, nodes, edges, recompileIfSimulating, takeSnapshot]);

  useEffect(() => {
    if (circuits.length === 0) fetchCircuits();
  }, [circuits.length, fetchCircuits]);

  useEffect(() => {
    clearSimulationCache();
    fetchCircuitById(id);
    return () => clearCurrentCircuit();
  }, [id, fetchCircuitById, clearCurrentCircuit]);

  useEffect(() => {
    if (currentCircuit?.data) {
      const initialNodes = currentCircuit.data.nodes || [];
      const initialEdges = currentCircuit.data.edges || [];

      const resetNodes = initialNodes.map((n) => ({
        ...n,
        data: { ...n.data, value: false },
      }));
      const resetEdges = initialEdges.map((e) => ({
        ...e,
        animated: false,
        className: 'inactive-wire',
      }));

      setNodes(resetNodes);
      setEdges(resetEdges);
      setIsSimulating(false);
    }
  }, [currentCircuit]);

  useEffect(() => {
    if (currentCircuit) {
      setTempName(currentCircuit.name);
      setIsMacro(currentCircuit.isMacro || false);
      setCategory(currentCircuit.category || 'Custom');
    }
  }, [currentCircuit]);

  const updateNodeDataLocal = useCallback((nodeId, newData) => {
    takeSnapshot(nodes, edges);
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      }),
    );

    setTimeout(() => {
      setNodes((currentNodes) => {
        recompileIfSimulating(currentNodes, edges);
        return currentNodes;
      });
    }, 0);
  }, [nodes, edges, takeSnapshot, recompileIfSimulating]);

  useEffect(() => {
    useCircuitStore.setState({ toggleNodeValue, updateNodeLabel, tickClock, updateNodeData: updateNodeDataLocal });
  }, [toggleNodeValue, updateNodeLabel, tickClock, updateNodeDataLocal]);

  const onNodesChange = useCallback(
    (changes) => {
      if (changes.some((c) => c.type === 'remove')) {
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
    setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === node.id })));

    setContextMenu({
      id: node.id,
      top: event.clientY,
      left: event.clientX,
    });
  }, []);

  const onEdgeContextMenu = useCallback((event, edge) => {
    event.preventDefault();
    setEdgeContextMenu({ id: edge.id, top: event.clientY, left: event.clientX });
    setContextMenu(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setContextMenu(null);
    setEdgeContextMenu(null);
  }, []);

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
    const selectedNodes = nodes.filter((node) => node.selected);
    if (selectedNodes.length === 0) return;

    const idMap = new Map();
    const newNodes = selectedNodes.map((node) => {
      const newId = `${node.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      idMap.set(node.id, newId);
      return {
        ...node, id: newId,
        position: { x: node.position.x + 40, y: node.position.y + 40 },
        selected: true,
        data: { ...node.data },
      };
    });

    const oldNodesDeselected = nodes.map((n) => ({ ...n, selected: false }));
    const combinedNodes = [...oldNodesDeselected, ...newNodes];

    const internalEdges = edges.filter((edge) => idMap.has(edge.source) && idMap.has(edge.target));
    const newEdges = internalEdges.map((edge) => ({
      ...edge,
      id: `e-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      source: idMap.get(edge.source),
      target: idMap.get(edge.target),
      selected: true,
    }));

    const combinedEdges = [...edges.map((e) => ({ ...e, selected: false })), ...newEdges];

    takeSnapshot(nodes, edges);
    setNodes(combinedNodes);
    setEdges(combinedEdges);

    recompileIfSimulating(combinedNodes, combinedEdges);

    toast.success(`Duplicated ${newNodes.length} items`);
  }, [nodes, edges, takeSnapshot, setNodes, setEdges, recompileIfSimulating]);

  const handleSettingsSubmit = async () => {
    setIsRenaming(false);
    const finalName = tempName.trim() ? tempName : currentCircuit.name;

    await renameCircuit(id, { name: finalName, isMacro, category });
    toast.success('Settings saved!');
  };

  const handleRotate = useCallback(() => {
    const selectedNodes = nodes.filter((node) => node.selected);
    if (selectedNodes.length === 0) return;

    takeSnapshot(nodes, edges);

    setNodes((nds) => {
      const newNodes = nds.map((node) => {
        if (node.selected) {
          const currentRotation = node.data.rotation || 0;
          return {
            ...node,
            data: { ...node.data, rotation: (currentRotation + 90) % 360 },
          };
        }
        return node;
      });

      setTimeout(() => {
        selectedNodes.forEach((n) => updateNodeInternals(n.id));
      }, 210);

      return newNodes;
    });
  }, [nodes, edges, takeSnapshot, setNodes, updateNodeInternals]);

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

      if (event.key === 'r' || event.key === 'R') {
        if (document.activeElement.tagName !== 'INPUT') {
          event.preventDefault();
          handleRotate();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleDuplicate, handleUndo, handleRedo, handleRotate]);

  const onEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => {
        const newEdges = applyEdgeChanges(changes, eds);
        const isDeleteEvent = changes.some((change) => change.type === 'remove');

        if (isDeleteEvent) {
          recompileIfSimulating(nodes, newEdges);
        }
        return newEdges;
      });
    },
    [nodes, recompileIfSimulating],
  );

  const onConnect = useCallback(
    (connection) => {
      takeSnapshot(nodes, edges);
      setEdges((eds) => {
        const newEdges = addEdge(connection, eds);

        recompileIfSimulating(nodes, newEdges);

        return newEdges;
      });
    },
    [nodes, edges, takeSnapshot, recompileIfSimulating],
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
          {isRenaming ? (
            <div className="flex items-center gap-2 bg-slate-800 p-1 rounded border border-slate-600">
              <input
                autoFocus
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="bg-slate-700 text-white px-2 py-1 rounded outline-none border border-slate-500 text-sm w-40"
              />
              <label className="text-xs text-slate-300 flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={isMacro} onChange={(e) => setIsMacro(e.target.checked)} />
                Publish as Macro
              </label>
              {isMacro && (
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-slate-700 text-xs text-white rounded p-1">
                  <option>Custom</option>
                  <option>Arithmetic</option>
                  <option>Memory</option>
                </select>
              )}
              <button onClick={handleSettingsSubmit} className="bg-blue-600 text-xs px-2 py-1 rounded hover:bg-blue-500 text-white">Save</button>
            </div>
          ) : (
            <div className="flex flex-col cursor-text hover:bg-slate-700 px-2 py-1 rounded transition" onDoubleClick={() => setIsRenaming(true)} title="Double click to edit settings">
              <h1 className="text-white font-medium truncate max-w-[200px] leading-tight">
                {currentCircuit?.name || 'Loading...'}
              </h1>
              <span className="text-[10px] text-slate-400">
                {currentCircuit?.isMacro ? `Macro (${currentCircuit.category})` : 'Private Circuit'}
              </span>
            </div>
          )}
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
          snapToGrid={true}
          onEdgeUpdateStart={onEdgeUpdateStart}
          onEdgeUpdate={onEdgeUpdate}
          onEdgeUpdateEnd={onEdgeUpdateEnd}
          edgeUpdaterRadius={10}
          onNodeDragStart={onNodeDragStart}
          onNodeContextMenu={onNodeContextMenu}
          onEdgeContextMenu={onEdgeContextMenu}
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
              onClick={() => addNode('constant')}
              className="bg-slate-700 hover:bg-slate-600 text-red-400 font-bold text-xs py-1.5 rounded transition border border-red-900/50"
            >
              1/0 (VCC)
            </button>

            <button
              onClick={() => addNode('bulb')}
              className='flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition text-sm text-left border border-slate-600'
            >
              <div className='w-3 h-3 rounded-full bg-yellow-400'></div>
              Bulb (Output)
            </button>

            <button
              onClick={() => addNode('clock')}
              className="bg-slate-700 hover:bg-slate-600 text-cyan-400 font-bold text-xs py-1.5 rounded transition border border-cyan-900/50"
            >
              Clock
            </button>

            <button
              onClick={() => addNode('hex')}
              className="bg-slate-700 hover:bg-slate-600 text-red-400 font-bold text-xs py-1.5 rounded transition border border-red-900/50"
            >
              HEX
            </button>

            <button
              onClick={() => addNode('data_rom', { label: '00 00 00 00' })}
              className="bg-slate-700 hover:bg-slate-600 text-blue-400 font-bold text-xs py-1.5 rounded border border-blue-900/50"
            >
              DATA ROM
            </button>

            <button
              onClick={() => addNode('display8bit')}
              className="bg-slate-700 hover:bg-slate-600 text-cyan-400 font-bold text-xs py-1.5 rounded border border-cyan-900/50"
            >
              8-BIT DISPLAY
            </button>

            <button
              onClick={() => addNode('logger')}
              className="bg-slate-700 hover:bg-slate-600 text-fuchsia-400 font-bold text-xs py-1.5 rounded border border-fuchsia-900/50"
            >
              LOGIC ANALYZER
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

            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => addNode('nand')}
                className="bg-slate-700 hover:bg-slate-600 text-cyan-400 text-xs font-bold py-1.5 rounded transition border border-slate-600"
              >
                NAND
              </button>

              <button
                onClick={() => addNode('nor')}
                className="bg-slate-700 hover:bg-slate-600 text-pink-400 text-xs font-bold py-1.5 rounded transition border border-slate-600"
              >
                NOR
              </button>

              <button
                onClick={() => addNode('xor')}
                className="bg-slate-700 hover:bg-slate-600 text-orange-400 text-xs font-bold py-1.5 rounded transition border border-slate-600"
              >
                XOR
              </button>

              <button
                onClick={() => addNode('xnor')}
                className="bg-slate-700 hover:bg-slate-600 text-teal-400 text-xs font-bold py-1.5 rounded transition border border-slate-600"
              >
                XNOR
              </button>
            </div>

            <div className="h-px bg-slate-700 my-2"></div>

            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 px-1">Macro Library</div>
            <button
              onClick={() => {
                setIsReplaceMode(false);
                document.getElementById('macro-modal').showModal();
              }}
              className="w-full bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/50 font-bold px-3 py-2 rounded-lg transition text-sm flex justify-center items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Browse IC Library
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
              onClick={toggleSimulation}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition shadow-lg ${
                isSimulating
                  ? 'bg-red-500/20 text-red-400 border border-red-500 hover:bg-red-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500 hover:bg-emerald-500/40'
              }`}
            >
              {isSimulating ? (
                <><span>🛑</span> Stop Sim</>
              ) : (
                <><span>🚀</span> Run Sim</>
              )}
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
              onClick={handleRotate}
              title="Rotate Selected (R)"
              className="p-2 text-green-400 hover:text-green-300 hover:bg-slate-700 rounded transition"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
              </svg>
            </button>
            <button
              onClick={() => {
                const selectedNodes = nodes.filter((n) => n.selected);
                if(selectedNodes.length > 0 && window.confirm('Delete selected?')) {
                  setNodes((nds) => nds.filter((n) => !n.selected));
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
          {nodes.find((n) => n.id === contextMenu.id)?.type === 'macro' && (
            <>
              <button
                className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-slate-700 flex justify-between items-center"
                onClick={() => {
                  setSwitchTargetId(contextMenu.id);
                  setIsReplaceMode(true);
                  setContextMenu(null);
                  document.getElementById('macro-modal').showModal();
                }}
              >
                Replace Template <span className="text-[10px] bg-blue-900/50 px-1 rounded">Swap</span>
              </button>
              <div className="h-px bg-slate-700 my-1"></div>
            </>
          )}

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
              const nodeId = contextMenu.id;
              setNodes((nds) => nds.filter((n) => n.id !== nodeId));
              setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
              setContextMenu(null);
            }}
          >
            Delete <span className="text-slate-500 text-xs">Del</span>
          </button>
        </div>
      )}

      {edgeContextMenu && (
        <div className="fixed bg-slate-800 border border-slate-700 shadow-2xl rounded-lg py-1 z-50 min-w-[150px]" style={{ top: edgeContextMenu.top, left: edgeContextMenu.left }}>
          <button
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 flex justify-between items-center"
            onClick={() => {
              takeSnapshot(nodes, edges);
              setEdges((eds) => eds.filter((e) => e.id !== edgeContextMenu.id));
              setEdgeContextMenu(null);
            }}
          >
            Delete Wire <span className="text-slate-500 text-xs">Del</span>
          </button>
        </div>
      )}

      <dialog id="macro-modal" className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-0 backdrop:bg-black/60 backdrop:backdrop-blur-sm w-[500px]">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-white font-bold text-lg">Integrated Circuits Library</h2>
          <button onClick={() => document.getElementById('macro-modal').close()} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="p-4 max-h-[400px] overflow-y-auto">
          {['Arithmetic', 'Memory', 'Custom'].map((cat) => {
            const catCircuits = circuits.filter((c) => c._id !== id && c.isMacro && c.category === cat);
            if (catCircuits.length === 0) return null;

            return (
              <div key={cat} className="mb-4">
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{cat}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {catCircuits.map((circuit) => (
                    <button
                      key={circuit._id}
                      onClick={() => {
                        handleMacroAction(circuit);
                        document.getElementById('macro-modal').close();
                      }}
                      className="flex justify-between items-center bg-slate-900 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg transition border border-slate-700 hover:border-blue-500"
                    >
                      <span className="truncate">{circuit.name}</span>
                      <span className="text-[9px] bg-blue-900/50 text-blue-300 px-1.5 rounded border border-blue-800">{isReplaceMode ? 'Replace' : 'Add'}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {circuits.filter((c) => c.isMacro && c._id !== id).length === 0 && (
            <div className="text-center text-slate-500 py-8">
              No macros published yet. <br /> Edit settings of your circuits to publish them.
            </div>
          )}
        </div>
      </dialog>
    </div>
  );
};

export default Editor;
