import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Public } from 'src/auth/infrastructure/decorators/public.decorator';
import { CurrentUser } from 'src/auth/infrastructure/decorators/current-user.decorator';
import type { AuthTokenPayload } from 'src/auth/application/providers/token.provider';
import { UsersService } from './users.service';
import { CreateUserDto } from '../presentation/create-user.dto';
import { UpdateUserDto } from '../presentation/update-user.dto';
import { SearchUsersQueryDto } from '../presentation/search-users.query.dto';
import { Actor } from '../application/types/actor';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(@Query() searchUsersQuery: SearchUsersQueryDto) {
    return this.usersService.search(searchUsersQuery);
  }

  @Get(':id')
  findOne(
    @CurrentUser() currentUser: AuthTokenPayload,
    @Param('id') id: string,
  ) {
    return this.usersService.findOne(id, this.toActor(currentUser));
  }

  @Patch(':id')
  update(
    @CurrentUser() currentUser: AuthTokenPayload,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(
      id,
      updateUserDto,
      this.toActor(currentUser),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() currentUser: AuthTokenPayload,
    @Param('id') id: string,
  ) {
    return this.usersService.remove(id, this.toActor(currentUser));
  }

  private toActor(currentUser: AuthTokenPayload): Actor {
    return {
      id: currentUser.sub,
      role: currentUser.role,
    };
  }
}
