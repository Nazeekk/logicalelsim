const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usersRepository = require('../repositories/users');
const { jwt: { secret, expiresIn } } = require('../config');

class AuthService {
  generateToken(userId) {
    return jwt.sign({ id: userId }, secret, {
      expiresIn,
    });
  }

  async register(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const existingUser = await usersRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await usersRepository.create({ email, password: hashedPassword });

    return {
      user: { id: user._id, email: user.email },
      token: this.generateToken(user._id),
    };
  }

  async login(email, password) {
    const user = await usersRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    return {
      user: { id: user._id, email: user.email },
      token: this.generateToken(user._id),
    };
  }
}

module.exports = new AuthService();
