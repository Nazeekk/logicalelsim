/* eslint-disable no-undef */

const circuitsController = require('../../controllers/circuits');
const circuitsService = require('../../services/circuits');

jest.mock('../../services/circuits');

describe('CircuitsController', () => {
  let req, res;

  beforeEach(() => {
    req = { user: { id: 'u1' }, params: { id: 'c1' }, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('getAll should return circuits', async () => {
    circuitsService.getUserCircuits.mockResolvedValue([]);
    await circuitsController.getAll(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('getAll should throw 500 error', async () => {
    circuitsService.getUserCircuits.mockRejectedValue(new Error('Fail'));
    await circuitsController.getAll(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Fail' });
  });

  test('getOne should return one circuit', async () => {
    circuitsService.getCircuitById.mockResolvedValue({});
    await circuitsController.getOne(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('getOne should throw 404 error', async () => {
    circuitsService.getCircuitById.mockRejectedValue(new Error('Fail'));
    await circuitsController.getOne(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Fail' });
  });

  test('create should return 201', async () => {
    circuitsService.createCircuit.mockResolvedValue({ id: 'new' });
    await circuitsController.create(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('create should throw 400 error', async () => {
    circuitsService.createCircuit.mockRejectedValue(new Error('Fail'));
    await circuitsController.create(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Fail' });
  });

  test('update should return 200', async () => {
    circuitsService.updateCircuit.mockResolvedValue({ id: 'updated' });
    await circuitsController.update(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('update should throw 400 error', async () => {
    circuitsService.updateCircuit.mockRejectedValue(new Error('Fail'));
    await circuitsController.update(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Fail' });
  });

  test('delete should return 200', async () => {
    circuitsService.deleteCircuit.mockResolvedValue({ id: 'deleted' });
    await circuitsController.delete(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('delete should throw 400 error', async () => {
    circuitsService.deleteCircuit.mockRejectedValue(new Error('Fail'));
    await circuitsController.delete(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Fail' });
  });
});
