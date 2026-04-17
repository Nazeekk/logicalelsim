/* eslint-disable no-undef */

const circuitsService = require('../../services/circuits');
const circuitsRepository = require('../../repositories/circuits');

jest.mock('../../repositories/circuits');

describe('CircuitsService Coverage', () => {
  const mockUser = 'user123';
  const mockCircuit = { _id: 'c1', userId: mockUser, name: 'Test' };

  beforeEach(() => jest.clearAllMocks());

  test('getUserCircuits should return all user circuits', async () => {
    circuitsRepository.findByUserId.mockResolvedValue([mockCircuit]);
    const res = await circuitsService.getUserCircuits(mockUser);
    expect(res).toHaveLength(1);
    expect(circuitsRepository.findByUserId).toHaveBeenCalledWith(mockUser);
  });

  test('getCircuitById should throw error if not found', async () => {
    circuitsRepository.findById.mockResolvedValue(null);
    await expect(circuitsService.getCircuitById('none', mockUser))
      .rejects.toThrow('Circuit not found');
  });

  test('getCircuitById should throw error if access denied', async () => {
    circuitsRepository.findById.mockResolvedValue({ userId: 1 });
    await expect(circuitsService.getCircuitById('none', mockUser)).rejects.toThrow('Access denied');
  });

  test('createCircuit should call repository', async () => {
    circuitsRepository.create.mockResolvedValue({ name: 'New' });
    const res = await circuitsService.createCircuit(mockUser.userId, 'New');
    expect(res.name).toBe('New');
  });

  test('updateCircuit should call repository', async () => {
    circuitsRepository.findById.mockResolvedValue(mockCircuit);
    circuitsRepository.update.mockResolvedValue({ ...mockCircuit, name: 'New' });

    const res = await circuitsService.updateCircuit('c1', mockUser, { name: 'New' });
    expect(res.name).toBe('New');
  });

  test('deleteCircuit should call repository', async () => {
    circuitsRepository.findById.mockResolvedValue(mockCircuit);
    await circuitsService.deleteCircuit('c1', mockUser);
    expect(circuitsRepository.delete).toHaveBeenCalledWith('c1');
  });
});
