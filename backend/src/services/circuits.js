const circuitsRepository = require('../repositories/circuits');

class CircuitsService {
  async getUserCircuits(userId) {
    return await circuitsRepository.findByUserId(userId);
  }

  async getCircuitById(circuitId, userId) {
    const circuit = await circuitsRepository.findById(circuitId);

    if (!circuit) throw new Error('Circuit not found');
    if (circuit.userId.toString() !== userId) throw new Error('Access denied');

    return circuit;
  }

  async createCircuit(userId, name) {
    const defaultData = { nodes: [], edges: [] };
    return await circuitsRepository.create({
      userId,
      name,
      data: defaultData,
    });
  }

  async updateCircuit(circuitId, userId, updateData) {
    await this.getCircuitById(circuitId, userId);

    return await circuitsRepository.update(circuitId, updateData);
  }

  async deleteCircuit(circuitId, userId) {
    await this.getCircuitById(circuitId, userId);

    return await circuitsRepository.delete(circuitId);
  }
}

module.exports = new CircuitsService();
