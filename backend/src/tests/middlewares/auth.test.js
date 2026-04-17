/* eslint-disable no-undef */

const authMiddleware = require('../../middlewares/auth');
const jwt = require('jsonwebtoken');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('should return 401 if no authorization header', () => {
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: No token provided' });
  });

  test('should return 401 if invalid token format', () => {
    req.headers.authorization = 'InvalidFormat token123';
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('should call next() and add user to req if token is valid', () => {
    const userPayload = { id: 'user123' };
    const token = jwt.sign(userPayload, process.env.JWT_SECRET);
    req.headers.authorization = `Bearer ${token}`;

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toMatchObject(userPayload);
  });

  test('should return 401 if token is expired or invalid', () => {
    req.headers.authorization = 'Bearer wrong-token';
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
