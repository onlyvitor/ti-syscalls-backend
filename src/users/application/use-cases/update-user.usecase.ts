import { ForbiddenError } from 'src/shared/application/errors/forbidden.error';
import { BadRequestException } from '../errors/bad-request.error';
import { NotFoundException } from '../errors/not-found.error';
import { UsersAlreadyExistError } from 'src/users/domain/errors/users-already-exist.error';
import { UserRepository } from 'src/users/domain/repositories/user.repository';
import { UserRole } from 'src/users/domain/entities/user.entity';
import { Email } from 'src/users/domain/value-objects/email.vo';
import { toOutputUserDto } from 'src/users/presentation/user-presenter';
import { OutputUserDto } from 'src/users/presentation/outputuser.dto';
import { Actor } from '../types/actor';

export type UpdateUserUseCaseInput = {
  id: string;
  actor: Actor;
  name?: string;
  email?: string;
  role?: UserRole;
};

export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: UpdateUserUseCaseInput): Promise<OutputUserDto> {
    const user = await this.userRepository.findById(input.id);
    if (!user) {
      throw new NotFoundException(input.id);
    }

    const isSelf = input.actor.id === user.getId();
    const isAdmin = input.actor.role === UserRole.ADMIN;

    if (!isSelf && !isAdmin) {
      throw new ForbiddenError('You can only update your own user');
    }

    if (!isAdmin && input.role !== undefined) {
      throw new ForbiddenError('Only admins can change roles');
    }

    if (
      input.name === undefined &&
      input.email === undefined &&
      input.role === undefined
    ) {
      throw new BadRequestException(
        'At least one field is required to update',
        input,
      );
    }

    if (
      input.role !== undefined &&
      !Object.values(UserRole).includes(input.role)
    ) {
      throw new BadRequestException(
        `Invalid role: ${String(input.role)}`,
        input,
      );
    }

    if (input.email !== undefined) {
      const email = Email.create(input.email);
      const userWithEmail = await this.userRepository.findByEmail(email);
      if (userWithEmail && userWithEmail.getId() !== user.getId()) {
        throw new UsersAlreadyExistError(
          `User with email ${email.valueOf()} already exists`,
          input,
        );
      }
    }

    if (input.name !== undefined) {
      user.updateName(input.name);
    }

    if (input.email !== undefined) {
      user.updateEmail(input.email);
    }

    if (input.role !== undefined) {
      user.assignRole(input.role);
    }

    await this.userRepository.update(user);

    return toOutputUserDto(user);
  }
}
