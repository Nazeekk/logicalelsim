/* eslint-disable no-undef */

const usersRepository = require('../../repositories/users');
const User = require('../../models/user');

jest.mock('../../models/user');

describe('UsersRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  test('findByEmail should call User.findOne', async () => {
    const email = 'test@test.com';
    User.findOne.mockResolvedValue({ email });

    const result = await usersRepository.findByEmail(email);

    expect(User.findOne).toHaveBeenCalledWith({ email });
    expect(result.email).toBe(email);
  });

  test('findById should call User.findById', async () => {
    const id = '1';
    const mockUser = { _id: id, email: 'test@test.com' };

    const selectMock = jest.fn().mockResolvedValue(mockUser);
    User.findById.mockReturnValue({ select: selectMock });

    const result = await usersRepository.findById(id);

    expect(User.findById).toHaveBeenCalledWith(id);
    expect(selectMock).toHaveBeenCalledWith('-password');
    expect(result).toEqual(mockUser);
  });

  test('create should save a new user', async () => {
    const userData = { email: 'new@test.com', password: 'hash' };

    const saveMock = jest.fn().mockResolvedValue(userData);
    User.mockImplementation(() => ({
      save: saveMock,
    }));

    const result = await usersRepository.create(userData);

    expect(saveMock).toHaveBeenCalled();
    expect(result.email).toBe(userData.email);
  });
});
