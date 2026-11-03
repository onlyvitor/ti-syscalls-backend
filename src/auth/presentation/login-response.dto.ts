import { OutputUserDto } from 'src/users/presentation/outputuser.dto';

export class LoginResponseDto {
  accessToken!: string;
  user!: OutputUserDto;
}
