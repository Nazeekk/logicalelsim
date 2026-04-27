const macroMemoryCache = new Map();

export const clearSimulationCache = () => {
  macroMemoryCache.clear();
};

export class Simulator {
  constructor(nodes, edges, getTemplate) {
    const { flatNodes, flatEdges } = compileCircuit(nodes, edges, getTemplate);

    this.nodesMap = new Map();
    this.adjacencyList = new Map();

    flatNodes.forEach((node) => {
      const initialValue = node.isInternal && node.type === 'switch' ? false : node.value;

      this.nodesMap.set(node.id, {
        type: node.type,
        value: initialValue,
        label: node.label || '',
        inputs: {},
        outputs: {},
        originalId: node.originalId,
        innerOutputs: node.innerOutputs || [],
        isInternal: node.isInternal,
      });
      this.adjacencyList.set(node.id, []);
    });

    flatEdges.forEach((edge) => {
      if (this.adjacencyList.has(edge.source)) {
        this.adjacencyList.get(edge.source).push({
          targetId: edge.target,
          targetHandle: edge.targetHandle || 'default',
          sourceHandle: edge.sourceHandle || 'default',
          handleId: edge.targetHandle,
          edgeId: edge.id,
          originalEdgeId: edge.originalId,
        });
      }
    });

    this.syncAllInputs();
    this.evaluateAll();
  }

  syncAllInputs() {
    this.nodesMap.forEach((node, id) => {
      const targets = this.adjacencyList.get(id) || [];
      targets.forEach((t) => {
        const targetNode = this.nodesMap.get(t.targetId);
        if (targetNode) {
          targetNode.inputs[t.targetHandle] = (node.type === 'data_rom')
            ? (node.outputs?.[t.sourceHandle] || false)
            : node.value;
        }
      });
    });
  }

  setInputValue(nodeId, value) {
    const node = this.nodesMap.get(nodeId);
    if (node?.value !== value) {
      node.value = value;

      const targets = this.adjacencyList.get(nodeId) || [];
      targets.forEach((t) => {
        const targetNode = this.nodesMap.get(t.targetId);
        if (targetNode) targetNode.inputs[t.handleId] = value;
      });

      this.evaluate(targets.map((t) => t.targetId));
    }
  }

  evaluateAll() {
    this.evaluate(Array.from(this.nodesMap.keys()));
  }

  evaluate(startNodeIds) {
    const activeQueue = new Set(startNodeIds);
    let iterations = 0;
    const MAX_ITERATIONS = 1000;

    while (activeQueue.size > 0 && iterations < MAX_ITERATIONS) {
      iterations++;
      const currentNodes = Array.from(activeQueue);
      activeQueue.clear();

      for (const nodeId of currentNodes) {
        const node = this.nodesMap.get(nodeId);
        if (!node || node.type === 'macro_dummy') continue;

        let changed = false;

        if (node.type === 'data_rom') {
          if (!node.memory || node.label !== node.lastLabel) {
            const bytes = (node.label || '')
              .replace(/[^0-9A-Fa-f\s]/gi, '')
              .trim()
              .split(/\s+/);

            node.memory = bytes.map((h) => parseInt(h, 16) || 0);

            node.progLength = bytes.length;
            node.lastLabel = node.label;
            if (!node.outputs) node.outputs = {};
          }

          let addr = 0;
          for (let i = 0; i < 8; i++) {
            if (node.inputs[`A${i}`] === true) addr |= (1 << i);
          }

          const byteValue = node.memory[addr] || 0;

          for (let i = 0; i < 8; i++) {
            const bitValue = (byteValue & (1 << i)) !== 0;
            const handleId = `out-${i}`;
            if (node.outputs[handleId] !== bitValue) {
              node.outputs[handleId] = bitValue;
              changed = true;
            }
          }

          const isEnd = addr > node.progLength && node.progLength > 0;
          if (node.outputs['end'] !== isEnd) {
            node.outputs['end'] = isEnd;
            changed = true;
          }
        }
        else {
          let newValue = node.value;

          if (node.type === 'switch') {
            const inputsArray = Object.values(node.inputs);
            if (node.isInternal) {
              newValue = inputsArray.some((v) => v === true);
            } else {
              newValue = inputsArray.length > 0 ? inputsArray.some((v) => v === true) : node.value;
            }
          }
          else if (node.type === 'clock' || node.type === 'constant') newValue = node.value;
          else if (node.type === 'and') newValue = (node.inputs['a'] || false) && (node.inputs['b'] || false);
          else if (node.type === 'or') newValue = (node.inputs['a'] || false) || (node.inputs['b'] || false);
          else if (node.type === 'not') newValue = !(node.inputs['default'] || false);
          else if (node.type === 'nand') newValue = !((node.inputs['a'] || false) && (node.inputs['b'] || false));
          else if (node.type === 'nor') newValue = !((node.inputs['a'] || false) || (node.inputs['b'] || false));
          else if (node.type === 'xor') newValue = (node.inputs['a'] || false) !== (node.inputs['b'] || false);
          else if (node.type === 'xnor') newValue = (node.inputs['a'] || false) === (node.inputs['b'] || false);
          else if (node.type === 'bulb') newValue = Object.values(node.inputs).some((v) => v === true);

          else if (node.type === 'hex') {
            const b0 = node.inputs['in-0'] ? 1 : 0;
            const b1 = node.inputs['in-1'] ? 2 : 0;
            const b2 = node.inputs['in-2'] ? 4 : 0;
            const b3 = node.inputs['in-3'] ? 8 : 0;
            newValue = b0 + b1 + b2 + b3;
          }

          else if (node.type === 'display8bit') {
            let val = 0;
            for (let i = 0; i < 8; i++) {
              if (node.inputs[`in-${i}`] === true) {
                val |= (1 << i);
              }
            }
            newValue = val;
          }

          else if (node.type === 'logger') {
            const currentClk = node.inputs['clk'] === true;

            if (currentClk && !node.lastClkState) {
              if (!node.logs) node.logs = [];

              const newEntry = {
                step: node.logs.length,
                time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }),
                signals: {},
              };

              Object.keys(node.inputs).forEach((key) => {
                if (key !== 'clk' && key.startsWith('in-')) {
                  newEntry.signals[key] = node.inputs[key];
                }
              });

              node.logs = [newEntry, ...node.logs].slice(0, 500);
              changed = true;
            }

            node.lastClkState = currentClk;
            newValue = currentClk;
          }

          if (newValue !== node.value) {
            node.value = newValue;
            changed = true;
          }
        }

        if (changed || iterations === 1) {
          const targets = this.adjacencyList.get(nodeId) || [];
          for (const targetInfo of targets) {
            const targetNode = this.nodesMap.get(targetInfo.targetId);
            if (targetNode) {
              const signal = (node.type === 'data_rom') ? node.outputs[targetInfo.sourceHandle] : node.value;

              if (targetNode.inputs[targetInfo.handleId] !== signal) {
                targetNode.inputs[targetInfo.handleId] = signal;
                activeQueue.add(targetInfo.targetId);
              }
            }
          }
        }
      }
    }

    if (iterations >= MAX_ITERATIONS) {
      console.warn('⚠️ Paradox/Oscillation detected in fast engine!');
    }
  }

  getVisualState() {
    const visualNodesValues = {};
    const activeEdges = new Set();
    const visualMacroOutputs = {};

    this.nodesMap.forEach((node, id) => {
      if (node.type === 'macro_dummy' && node.originalId) {
        const outputs = {};
        node.innerOutputs.forEach((out) => {
          const internalBulb = this.nodesMap.get(out.id);
          outputs[out.key] = internalBulb ? internalBulb.value : false;
        });
        visualMacroOutputs[node.originalId] = outputs;
      }
      else if (node.type === 'data_rom' && node.originalId) {
        visualMacroOutputs[node.originalId] = node.outputs;
        visualNodesValues[node.originalId] = false;
      }
      else if (node.type === 'logger' && node.originalId) {
        visualMacroOutputs[node.originalId] = { logs: node.logs || [] };
        visualNodesValues[node.originalId] = false;
      }
      else if (node.originalId) {
        visualNodesValues[node.originalId] = node.value;
      }

      const targets = this.adjacencyList.get(id) || [];
      targets.forEach((t) => {
        const isOn = (node.type === 'data_rom') ? node.outputs[t.sourceHandle] : node.value;
        if (isOn && t.originalEdgeId) activeEdges.add(t.originalEdgeId);
      });
    });

    return { visualNodesValues, activeEdges, visualMacroOutputs };
  }
}

export const compileCircuit = (nodes, edges, getTemplate, prefix = 'root') => {
  let flatNodes = [];
  let flatEdges = [];
  const edgeRemap = new Map();
  const isInternal = prefix !== 'root';

  const sortByIndexOrY = (a, b) => {
    const matchA = (a.data?.label || '').match(/^(\d+):/);
    const matchB = (b.data?.label || '').match(/^(\d+):/);
    if (matchA && matchB) return parseInt(matchA[1]) - parseInt(matchB[1]);
    return (a.position?.y || 0) - (b.position?.y || 0);
  };

  nodes.forEach((node) => {
    const prefixedId = !isInternal ? node.id : `${prefix}_${node.id}`;

    if (node.type !== 'macro') {
      flatNodes.push({
        id: prefixedId,
        originalId: !isInternal ? node.id : null,
        type: node.type,
        label: node.data?.label || '',
        value: node.data?.value || false,
        isInternal: isInternal,
      });
    } else {
      const template = getTemplate(node.data.templateId);
      if (!template) return;

      const { flatNodes: innerNodes, flatEdges: innerEdges } = compileCircuit(
        template.data.nodes,
        template.data.edges,
        getTemplate,
        prefixedId,
      );

      flatNodes.push(...innerNodes);
      flatEdges.push(...innerEdges);

      const innerSwitches = template.data.nodes.filter((n) => n.type === 'switch').sort(sortByIndexOrY);
      const innerBulbs = template.data.nodes.filter((n) => n.type === 'bulb').sort(sortByIndexOrY);

      flatNodes.push({
        id: prefixedId + '_dummy_macro',
        originalId: !isInternal ? node.id : null,
        type: 'macro_dummy',
        innerOutputs: innerBulbs.map((b, idx) => ({ key: `out-${idx}`, id: `${prefixedId}_${b.id}` })),
      });

      innerSwitches.forEach((sw, index) => {
        edgeRemap.set(`${node.id}-in-${index}`, `${prefixedId}_${sw.id}`);
      });
      innerBulbs.forEach((bulb, index) => {
        edgeRemap.set(`${node.id}-out-${index}`, `${prefixedId}_${bulb.id}`);
      });
    }
  });

  edges.forEach((edge) => {
    let sourceId = !isInternal ? edge.source : `${prefix}_${edge.source}`;
    let targetId = !isInternal ? edge.target : `${prefix}_${edge.target}`;

    const sourceMacroKey = `${edge.source}-${edge.sourceHandle}`;
    if (edgeRemap.has(sourceMacroKey)) sourceId = edgeRemap.get(sourceMacroKey);

    const targetMacroKey = `${edge.target}-${edge.targetHandle}`;
    if (edgeRemap.has(targetMacroKey)) targetId = edgeRemap.get(targetMacroKey);

    flatEdges.push({
      id: !isInternal ? edge.id : `${prefix}_${edge.id}`,
      originalId: !isInternal ? edge.id : null,
      source: sourceId,
      target: targetId,
      sourceHandle: edge.sourceHandle || 'default',
      targetHandle: edge.targetHandle || 'default',
    });
  });

  return { flatNodes, flatEdges };
};
