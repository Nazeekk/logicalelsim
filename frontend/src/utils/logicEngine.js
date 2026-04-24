export const evaluateCircuit = (nodes, edges, isMacro = false, getTemplate = null) => {
  const nodeMap = new Map();

  nodes.forEach((node) => {
    const nodeCopy = JSON.parse(JSON.stringify(node));

    if (nodeCopy.type === 'macro' && !nodeCopy.data.macroOutputs) {
      nodeCopy.data.macroOutputs = {};
    }

    nodeCopy._inputs = {};

    nodeMap.set(nodeCopy.id, nodeCopy);
  });

  const evaluatedEdges = edges.map((edge) => ({
    ...edge,
    data: { ...edge.data },
    style: { ...edge.style },
  }));

  let changed = true;
  let iterations = 0;
  const MAX_ITERATIONS = 50;

  while (changed && iterations < MAX_ITERATIONS) {
    changed = false;
    iterations++;

    Array.from(nodeMap.values()).forEach((n) => n._inputs = {});

    evaluatedEdges.forEach((edge) => {
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

    Array.from(nodeMap.values()).forEach((node) => {
      if (node.type === 'switch' || node.type === 'clock') return;

      let newValue = false;

      if (node.type === 'and') newValue = (node._inputs['a'] || false) && (node._inputs['b'] || false);
      else if (node.type === 'or') newValue = (node._inputs['a'] || false) || (node._inputs['b'] || false);
      else if (node.type === 'not') newValue = !(node._inputs['default'] || false);
      else if (node.type === 'nand') newValue = !((node._inputs['a'] || false) && (node._inputs['b'] || false));
      else if (node.type === 'nor') newValue = !((node._inputs['a'] || false) || (node._inputs['b'] || false));
      else if (node.type === 'xor') newValue = (node._inputs['a'] || false) !== (node._inputs['b'] || false);
      else if (node.type === 'xnor') newValue = (node._inputs['a'] || false) === (node._inputs['b'] || false);
      else if (node.type === 'bulb') newValue = Object.values(node._inputs).some((val) => val === true);

      else if (node.type === 'hex') {
        const newInputs = { ...node._inputs };
        if (JSON.stringify(node.data.inputs) !== JSON.stringify(newInputs)) {
          node.data.inputs = newInputs;
          changed = true;
        }
      }

      else if (node.type === 'macro') {
        if (!getTemplate) return;

        if (!node.data.internalState) {
          const template = getTemplate(node.data.templateId);
          if (!template) return;

          node.data.internalState = {
            nodes: template.data.nodes.map((n) => ({ id: n.id, type: n.type, data: { ...n.data }, position: n.position })),
            edges: template.data.edges.map((e) => ({ source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle, data: { value: false } })),
          };
        }

        const internalNodes = node.data.internalState.nodes;
        const internalEdges = node.data.internalState.edges;

        const sortByIndexOrY = (a, b) => {
          const matchA = (a.data.label || '').match(/^(\d+):/);
          const matchB = (b.data.label || '').match(/^(\d+):/);
          if (matchA && matchB) return parseInt(matchA[1]) - parseInt(matchB[1]);
          return a.position.y - b.position.y;
        };

        const switches = internalNodes.filter((n) => n.type === 'switch').sort(sortByIndexOrY);
        const bulbs = internalNodes.filter((n) => n.type === 'bulb').sort(sortByIndexOrY);

        switches.forEach((sw, i) => {
          const incomingValue = node._inputs[`in-${i}`] || false;
          if (sw.data.value !== incomingValue) sw.data.value = incomingValue;
        });

        const { evaluatedNodes, evaluatedEdges } = evaluateCircuit(internalNodes, internalEdges, true, getTemplate);

        node.data.internalState.nodes = evaluatedNodes;
        node.data.internalState.edges = evaluatedEdges;

        bulbs.forEach((bulb, i) => {
          const evaluatedBulb = evaluatedNodes.find((n) => n.id === bulb.id);
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

  if (iterations >= MAX_ITERATIONS && !isMacro) {
    console.warn('⚠️ Circuit paradox or oscillation detected! Forced to stop.');
  }

  const finalNodes = Array.from(nodeMap.values()).map((n) => {
    const cleanNode = { ...n };
    delete cleanNode._inputs;
    return cleanNode;
  });

  return {
    evaluatedNodes: finalNodes,
    evaluatedEdges: evaluatedEdges,
  };
};
