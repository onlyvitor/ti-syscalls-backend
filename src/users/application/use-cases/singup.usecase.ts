export type SingUpUseCaseInput = {
  name: string;
  email: string;
  password: string;
};

export type SingUpUseCaseOutput = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export class SingUpUseCase {
  async execute(input: SingUpUseCaseInput): Promise<SingUpUseCaseOutput> {
    // Implementation for signing up a user
  }
}
