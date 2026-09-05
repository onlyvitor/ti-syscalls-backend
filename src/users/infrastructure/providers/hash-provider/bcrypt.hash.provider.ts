import bcrypt from 'node_modules/bcryptjs';
import { HashProvider } from 'src/shared/application/providers/hash.provider';

export class BcryptHashProvider implements HashProvider {
  async generateHash(payload: string): Promise<string> {
    const hashed = await bcrypt.hash(payload, 12);
    return hashed;
  }

  async compareHash(payload: string, hashed: string): Promise<boolean> {
    const isValid = await bcrypt.compare(payload, hashed);
    return isValid;
  }
}
