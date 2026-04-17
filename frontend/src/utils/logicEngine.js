export const evaluateCircuit = (nodes, edges, isMacro = false) => {
  const nodeMap = new Map();
  
  nodes.forEach(node => {
    const nodeCopy = JSON.parse(JSON.stringify(node));

    if (nodeCopy.type !== 'switch' && nodeCopy.type !== 'macro') {
      nodeCopy.data.value = nodeCopy.type === 'not' ? true : false;
    }

    if (nodeCopy.type === 'macro' && !nodeCopy.data.macroOutputs) {
      nodeCopy.data.macroOutputs = {};
    }

    // if (node.type === 'switch') {
    // } else if (node.type === 'not') {
    //   nodeCopy.data.value = true;
    // } else {
    //   nodeCopy.data.value = false;
    // }
    
    nodeCopy._inputs = {}; 
    
    nodeMap.set(nodeCopy.id, nodeCopy);
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

      let sourceValue = false;

      if (sourceNode.type === 'macro') {
        sourceValue = sourceNode.data.macroOutputs[edge.sourceHandle || 'out-0'] || false;
      } else {
        sourceValue = sourceNode.data.value;
      }

      if (edge.data.value !== sourceValue) {
        edge.data.value = sourceValue;
        if (!isMacro) {
          if (sourceValue) {
            edge.style = { stroke: '#fbbf24', strokeWidth: 3, filter: 'drop-shadow(0 0 5px rgba(251, 191, 36, 0.5))' };
            edge.animated = true;
          } else {
            edge.style = { stroke: '#94a3b8', strokeWidth: 2 };
            edge.animated = false;
          }
        }
 
        changed = true;
      }

      const handleId = edge.targetHandle || 'default';
      targetNode._inputs[handleId] = sourceValue;
    });

    Array.from(nodeMap.values()).forEach(node => {
      if (node.type === 'switch') return;

      let newValue = false;

      if (node.type === 'and') newValue = (node._inputs['a'] || false) && (node._inputs['b'] || false);
      else if (node.type === 'or') newValue = (node._inputs['a'] || false) || (node._inputs['b'] || false);
      else if (node.type === 'not') newValue = !(node._inputs['default'] || false);
      else if (node.type === 'nand') newValue = !((node._inputs['a'] || false) && (node._inputs['b'] || false));
      else if (node.type === 'nor') newValue = !((node._inputs['a'] || false) || (node._inputs['b'] || false));
      else if (node.type === 'xor') newValue = (node._inputs['a'] || false) !== (node._inputs['b'] || false);
      else if (node.type === 'xnor') newValue = (node._inputs['a'] || false) === (node._inputs['b'] || false); 
      else if (node.type === 'bulb') newValue = Object.values(node._inputs).some(val => val === true);

      else if (node.type === 'macro') {
        const internalNodes = node.data.circuit.nodes;
        const internalEdges = node.data.circuit.edges;

        const switches = internalNodes.filter(n => n.type === 'switch').sort((a,b) => a.position.y - b.position.y);
        const bulbs = internalNodes.filter(n => n.type === 'bulb').sort((a,b) => a.position.y - b.position.y);

        switches.forEach((sw, i) => {
          sw.data.value = node._inputs[`in-${i}`] || false;
        });

        const { evaluatedNodes } = evaluateCircuit(internalNodes, internalEdges, true);

        bulbs.forEach((bulb, i) => {
          const evaluatedBulb = evaluatedNodes.find(n => n.id === bulb.id);
          const outVal = evaluatedBulb ? evaluatedBulb.data.value : false;
          
          if (node.data.macroOutputs[`out-${i}`] !== outVal) {
            node.data.macroOutputs[`out-${i}`] = outVal;
            changed = true;
          }
        });
        
        return;
      }

      if (node.type !== 'macro' && node.data.value !== newValue) {
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