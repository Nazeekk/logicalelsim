const Circuit = require('../models/circuit');

class CircuitsRepository {
  async findByUserId(userId) {
    return await Circuit.find({ userId }).sort({ updatedAt: -1 });
  }

  async findById(circuitId) {
    return await Circuit.findById(circuitId);
  }

  async create(circuitData) {
    const circuit = new Circuit(circuitData);
    return await circuit.save();
  }

  async update(circuitId, updateData) {
    return await Circuit.findByIdAndUpdate(
      circuitId,
      { $set: updateData },
      { new: true },
    );
  }

  async delete(circuitId) {
    return await Circuit.findByIdAndDelete(circuitId);
  }
}

module.exports = new CircuitsRepository();