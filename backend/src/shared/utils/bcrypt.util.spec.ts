import * as bcrypt from 'bcrypt';
import { comparePassword, hashPassword } from './bcrypt.util';

jest.mock('bcrypt');

describe('bcrypt.util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('hashes the password with a cost factor of 10', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      const result = await hashPassword('plain-password');

      expect(bcrypt.hash).toHaveBeenCalledWith('plain-password', 10);
      expect(result).toBe('hashed');
    });
  });

  describe('comparePassword', () => {
    it('delegates to bcrypt.compare and returns its result', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await comparePassword('plain-password', 'hashed');

      expect(bcrypt.compare).toHaveBeenCalledWith('plain-password', 'hashed');
      expect(result).toBe(true);
    });
  });
});
