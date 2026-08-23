import { Injectable } from '@nestjs/common';
import { User } from '../domain/entities/user.entity';
import { CreateUserDto } from '../infrastructure/dto/create-user.dto';
import { UpdateUserDto } from '../infrastructure/dto/update-user.dto';

@Injectable()
export class UsersService {
  create(createUserDto: CreateUserDto) {
    // Caso de uso: cria um User valido via a factory do dominio.
    // Aqui voce conterá a logica de negocio de criar usuario (validar,
    // hash da senha, persistir via repository) quando existir.
    const user = User.create({
      name: createUserDto.name,
      email: createUserDto.email,
      password: createUserDto.password,
      role: createUserDto.role,
    });

    return {
      id: user.getId(),
      name: user.getName(),
      email: user.getEmail(),
      role: user.getRole(),
    };
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user with ${JSON.stringify(updateUserDto)}`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
