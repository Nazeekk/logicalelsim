import { create } from 'zustand';
import api from '../api/axios';

export const useCircuitStore = create((set, get) => ({
  circuits: [],
  currentCircuit: null,
  isLoading: false,
  error: null,

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
        const { width, height, selected, dragging, positionAbsolute, resizing, ...rest } = node;
        return rest;
      });

      const cleanEdges = edges.map((edge) => {
        const { selected, animated, style, ...rest } = edge;

        if (rest.data) delete rest.data.value;
        return rest;
      });

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
