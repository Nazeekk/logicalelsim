/* eslint-disable no-undef */

const authService = require('../../services/auth');
const usersRepository = require('../../repositories/users');
const bcrypt = require('bcryptjs');

jest.mock('../../repositories/users');
jest.mock('bcryptjs');

describe('AuthService Coverage', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('register()', () => {
    test('should throw error if email/password missing', async () => {
      await expect(authService.register('', '')).rejects.toThrow('Email and password are required');
    });

    test('should throw error if user already exists', async () => {
      usersRepository.findByEmail.mockResolvedValue({});
      await expect(authService.register('email', 'pass')).rejects.toThrow('User already exists');
    });

    test('should register successfully', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashed_pass');
      usersRepository.create.mockResolvedValue({ _id: 'id1', email: 't@t.com' });

      const result = await authService.register('t@t.com', 'pass');
      expect(result).toHaveProperty('token');
      expect(usersRepository.create).toHaveBeenCalled();
    });
  });

  describe('login()', () => {
    test('should throw error if user not found', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      await expect(authService.login('no@t.com', 'p')).rejects.toThrow('Invalid credentials');
    });

    test('should throw error if password wrong', async () => {
      usersRepository.findByEmail.mockResolvedValue({ password: 'hash' });
      bcrypt.compare.mockResolvedValue(false);
      await expect(authService.login('t@t.com', 'wrong')).rejects.toThrow('Invalid credentials');
    });

    test('should login successfully', async () => {
      usersRepository.findByEmail.mockResolvedValue({
        _id: 'u1',
        email: 't@t.com',
        password: 'hash',
      });
      bcrypt.compare.mockResolvedValue(true);
      const result = await authService.login('t@t.com', 'hash');
      expect(result).toHaveProperty('token');
    });
  });
});
