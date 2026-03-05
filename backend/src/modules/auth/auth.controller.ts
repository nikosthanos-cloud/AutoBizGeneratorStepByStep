import { Body, Controller, Post } from '@nestjs/common';
import { AuthService, type LoginDto, type LoginResponse } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(dto);
  }
}
