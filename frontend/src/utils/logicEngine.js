export const evaluateCircuit = (nodes, edges) => {
  const nodeMap = new Map();
  
  nodes.forEach(node => {
    const nodeCopy = { ...node, data: { ...node.data } };

    if (node.type === 'switch') {
    } else if (node.type === 'not') {
      nodeCopy.data.value = true;
    } else {
      nodeCopy.data.value = false;
    }
    
    nodeCopy._inputs = {}; 
    
    nodeMap.set(node.id, nodeCopy);
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
          edge.style = { stroke: '#fbbf24', strokeWidth: 3, filter: 'drop-shadow(0 0 5px rgba(251, 191, 36, 0.5))' };
          edge.animated = true;
        } else {
          edge.style = { stroke: '#94a3b8', strokeWidth: 2 };
          edge.animated = false;
        }
        changed = true;
      }

      const handleId = edge.targetHandle || 'default';
      targetNode._inputs[handleId] = sourceValue;
    });

    Array.from(nodeMap.values()).forEach(node => {
      if (node.type === 'switch') return;

      let newValue = false;

      if (node.type === 'and') {
        const inA = node._inputs['a'] || false;
        const inB = node._inputs['b'] || false;
        newValue = inA && inB;
      }

      else if (node.type === 'or') {
        const inA = node._inputs['a'] || false;
        const inB = node._inputs['b'] || false;
        newValue = inA || inB;
      }

      else if (node.type === 'not') {
        const inDefault = node._inputs['default'] || false;
        newValue = !inDefault;
      }

      else if (node.type === 'bulb') {
        newValue = Object.values(node._inputs).some(val => val === true);
      }

      if (node.data.value !== newValue) {
        node.data.value = newValue;
        changed = true;
      }
    });
  }

  const finalNodes = Array.from(nodeMap.values()).map(n => {
    const cleanNode = { ...n };
    delete cleanNode._inputs;
    return cleanNode;
  });

  return {
    evaluatedNodes: finalNodes,
    evaluatedEdges: evaluatedEdges,
  };
};