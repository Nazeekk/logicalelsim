/* eslint-disable no-undef */

const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth');
const circuitsRoutes = require('../routes/circuits');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/circuits', circuitsRoutes);

describe('API Integration Tests', () => {

  test('GET /api/circuits should return 401 if no token provided', async () => {
    const response = await request(app).get('/api/circuits');
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe('Unauthorized: No token provided');
  });

  test('POST /api/auth/register should validate input', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: '', password: '' });

    expect(response.statusCode).toBe(400);
  });
});
