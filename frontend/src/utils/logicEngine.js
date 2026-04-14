export const evaluateCircuit = (nodes, edges) => {
  const nodeMap = new Map();
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node, data: { ...node.data } });
  });

  nodes.forEach(node => {
    if (node.type !== 'switch') {
      nodeMap.get(node.id).data.value = false;
    }
  });

  const evaluatedEdges = edges.map(edge => ({
    ...edge,
    data: { ...edge.data, value: false },
    style: { stroke: '#94a3b8', strokeWidth: 2 }, 
    animated: false,
  }));
  
  let changed = true;
  let iterations = 0;
  const MAX_ITERATIONS = 100;

  while (changed && iterations < MAX_ITERATIONS) {
    changed = false;
    iterations++;

    evaluatedEdges.forEach(edge => {
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);

      if (!sourceNode || !targetNode) return;

      const sourceValue = sourceNode.data.value;

      if (edge.data.value !== sourceValue) {
        edge.data.value = sourceValue;
        
        if (sourceValue) {
          edge.style = { stroke: '#fbbf24', strokeWidth: 3, filter: 'drop-shadow(0 0 5px rgba(251, 191, 36, 0.5))' }; // Жовтий, світиться
          edge.animated = true;
        } else {
          edge.style = { stroke: '#94a3b8', strokeWidth: 2 };
          edge.animated = false;
        }
        changed = true;
      }

      if (targetNode.type === 'bulb' && sourceValue === true) {
        if (targetNode.data.value !== true) {
          targetNode.data.value = true;
          changed = true;
        }
      }
    });
  }

  return {
    evaluatedNodes: Array.from(nodeMap.values()),
    evaluatedEdges: evaluatedEdges,
  };
};