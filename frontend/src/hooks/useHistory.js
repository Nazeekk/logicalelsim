import { useState, useCallback } from 'react';

export const useHistory = () => {
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  const takeSnapshot = useCallback((nodes, edges) => {
    setPast((prev) => [
      ...prev,
      { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) },
    ].slice(-50));
    
    setFuture([]);
  }, []);

  const undo = useCallback((currentNodes, currentEdges) => {
    if (past.length === 0) return null;
    
    const previous = past[past.length - 1];
    setPast((prev) => prev.slice(0, -1));
    setFuture((prev) => [
      { nodes: JSON.parse(JSON.stringify(currentNodes)), edges: JSON.parse(JSON.stringify(currentEdges)) },
      ...prev,
    ]);
    return previous;
  }, [past]);

  const redo = useCallback((currentNodes, currentEdges) => {
    if (future.length === 0) return null;
    
    const next = future[0];
    setFuture((prev) => prev.slice(1));
    setPast((prev) => [
      ...prev,
      { nodes: JSON.parse(JSON.stringify(currentNodes)), edges: JSON.parse(JSON.stringify(currentEdges)) },
    ]);
    return next;
  }, [future]);

  return { takeSnapshot, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0 };
};