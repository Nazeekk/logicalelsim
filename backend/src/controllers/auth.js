const authService = require('../services/auth');

class AuthController {
  async register(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.register(email, password);
      
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  }
}

module.exports = new AuthController();