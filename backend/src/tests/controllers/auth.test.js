/* eslint-disable no-undef */

const authController = require('../../controllers/auth');
const authService = require('../../services/auth');

jest.mock('../../services/auth');

describe('AuthController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: { email: 'email', password: 'password' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('register should return user and token', async () => {
    authService.register.mockResolvedValue([]);
    await authController.register(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('register should throw 400 error', async () => {
    authService.register.mockRejectedValue(new Error('Fail'));
    await authController.register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Fail' });
  });

  test('login should return user and token', async () => {
    authService.login.mockResolvedValue([]);
    await authController.login(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('login should throw 401 error', async () => {
    authService.login.mockRejectedValue(new Error('Fail'));
    await authController.login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Fail' });
  });
});
