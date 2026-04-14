const circuitsService = require('../services/circuits');

class CircuitsController {
  async getAll(req, res) {
    try {
      const circuits = await circuitsService.getUserCircuits(req.user.id);
      res.status(200).json(circuits);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getOne(req, res) {
    try {
      const circuit = await circuitsService.getCircuitById(req.params.id, req.user.id);
      res.status(200).json(circuit);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  async create(req, res) {
    try {
      const circuit = await circuitsService.createCircuit(req.user.id, req.body.name);
      res.status(201).json(circuit);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async update(req, res) {
    try {
      const circuit = await circuitsService.updateCircuit(
        req.params.id, 
        req.user.id, 
        req.body,
      );
      res.status(200).json(circuit);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async delete(req, res) {
    try {
      await circuitsService.deleteCircuit(req.params.id, req.user.id);
      res.status(200).json({ message: 'Circuit deleted successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new CircuitsController();