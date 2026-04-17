/* eslint-disable no-undef */

const circuitsRepository = require('../../repositories/circuits');
const Circuit = require('../../models/circuit');

jest.mock('../../models/circuit');

describe('CircuitsRepository Coverage', () => {
  beforeEach(() => jest.clearAllMocks());

  test('findByUserId should return circuits', async () => {
    const mockSort = jest.fn().mockResolvedValue([]);
    Circuit.find.mockReturnValue({ sort: mockSort });

    await circuitsRepository.findByUserId('u1');
    expect(Circuit.find).toHaveBeenCalledWith({ userId: 'u1' });
    expect(mockSort).toHaveBeenCalledWith({ updatedAt: -1 });
  });

  test('findById should return circuit', async () => {
    Circuit.findById.mockResolvedValue({ name: 'Test' });
    const res = await circuitsRepository.findById('c1');
    expect(res.name).toBe('Test');
  });

  test('create should save circuit', async () => {
    const data = { name: 'New' };
    const saveMock = jest.fn().mockResolvedValue(data);
    Circuit.mockImplementation(() => ({ save: saveMock }));

    await circuitsRepository.create(data);
    expect(saveMock).toHaveBeenCalled();
  });

  test('update should update circuit', async () => {
    Circuit.findByIdAndUpdate.mockResolvedValue({ name: 'Updated' });
    await circuitsRepository.update('c1', { name: 'Updated' });
    expect(Circuit.findByIdAndUpdate).toHaveBeenCalled();
  });

  test('delete should remove circuit', async () => {
    Circuit.findByIdAndDelete.mockResolvedValue(true);
    await circuitsRepository.delete('c1');
    expect(Circuit.findByIdAndDelete).toHaveBeenCalledWith('c1');
  });
});
