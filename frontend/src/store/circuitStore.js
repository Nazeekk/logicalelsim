import { create } from 'zustand';
import api from '../api/axios';

export const useCircuitStore = create((set, get) => ({
  circuits: [],
  currentCircuit: null,
  isLoading: false,
  error: null,

  duplicateCircuit: async (id) => {
    set({ isLoading: true });
    try {
      const originalRes = await api.get(`/circuits/${id}`);
      const original = originalRes.data;

      if (!original || !original.data) throw new Error('Source circuit empty');

      const createRes = await api.post('/circuits', {
        name: `${original.name} (Copy)`,
        isMacro: original.isMacro || false,
        category: original.category || 'Custom',
      });
      const newCircuit = createRes.data;

      await api.put(`/circuits/${newCircuit._id}`, {
        data: original.data,
      });

      const duplicatedWithData = { ...newCircuit, data: original.data };

      set((state) => ({
        circuits: [duplicatedWithData, ...state.circuits],
        isLoading: false,
      }));

      return duplicatedWithData;
    } catch (error) {
      console.error('Duplication failed:', error);
      set({
        error: error.response?.data?.message || 'Failed to duplicate',
        isLoading: false,
      });
      return null;
    }
  },

  updateNodeData: (nodeId, newData) => {
    set((state) => ({
      currentCircuit: {
        ...state.currentCircuit,
        data: {
          ...state.currentCircuit.data,
          nodes: state.currentCircuit.data.nodes.map((node) =>
            node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node,
          ),
        },
      },
      circuits: state.circuits.map((c) =>
        c._id === state.currentCircuit?._id
          ? { ...c, data: { ...c.data, nodes: c.data.nodes.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n ) } }
          : c,
      ),
    }));
  },

  getCircuitTemplate: (circuitId) => {
    return get().circuits.find((c) => c._id === circuitId);
  },

  fetchCircuits: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get('/circuits');
      set({ circuits: response.data, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch circuits',
        isLoading: false,
      });
    }
  },

  createCircuit: async (name) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/circuits', { name });
      set((state) => ({
        circuits: [response.data, ...state.circuits],
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to create circuit',
        isLoading: false,
      });
      return null;
    }
  },

  deleteCircuit: async (id) => {
    try {
      await api.delete(`/circuits/${id}`);
      set((state) => ({
        circuits: state.circuits.filter((circuit) => circuit._id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete circuit:', error);
    }
  },

  fetchCircuitById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/circuits/${id}`);
      set({ currentCircuit: response.data, isLoading: false });
    } catch(error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch circuit',
        isLoading: false,
      });
    }
  },

  saveCircuitData: async (id, nodes, edges) => {
    try {
      const cleanNodes = nodes.map((node) => {
        return {
          id: node.id,
          type: node.type,
          position: node.position,
          data: {
            name: node.data.name,
            label: node.data.label,
            value: node.data.value,
            rotation: node.data.rotation,
            templateId: node.data.templateId,
            inputsCount: node.data.inputsCount,
            outputsCount: node.data.outputsCount,
            frequency: node.data.frequency,
            memory: node.data.memory,
            asmCode: node.data.asmCode,
            isaText: node.data.isaText,
            archMode: node.data.archMode,
            signalNames: node.data.signalNames,
          },
        };
      });

      const cleanEdges = edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      }));

      await api.put(`/circuits/${id}`, {
        data: { nodes: cleanNodes, edges: cleanEdges },
      });
    } catch (error) {
      console.error('Failed to save circuit:', error);
      throw error;
    }
  },

  clearCurrentCircuit: () => set({ currentCircuit: null }),

  renameCircuit: async (id, updateData) => {
    try {
      await api.put(`/circuits/${id}`, updateData);

      set((state) => ({
        currentCircuit: { ...state.currentCircuit, ...updateData },
        circuits: state.circuits.map((c) => c._id === id ? { ...c, ...updateData } : c),
      }));
    } catch (error) {
      console.error('Failed to rename circuit:', error);
    }
  },
}));
