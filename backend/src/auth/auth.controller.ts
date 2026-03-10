import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AUTH_COOKIE_NAME } from './jwt.constants';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email?: string;
  };
  cookies?: Record<string, string>;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() body: CreateUserDto, @Req() req: AuthenticatedRequest) {
    const cookies = req.cookies;
    const hasAuthCookie = !!cookies?.[AUTH_COOKIE_NAME];

    if (hasAuthCookie) {
      throw new BadRequestException('You are already logged in.');
    }

    return this.authService.signup(body);
  }

  @Post('login')
  async login(
    @Body() body: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, user } = await this.authService.login(body);

    res.cookie(AUTH_COOKIE_NAME, accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { user };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user?.userId;

    if (!userId) {
      // Guard should normally prevent this, but be defensive
      return null;
    }

    const user = await this.authService.findUserById(userId);

    // Issue a fresh token and reset the cookie to enable sliding expiration
    const { accessToken } = await this.authService.issueAuthToken(user);

    res.cookie(AUTH_COOKIE_NAME, accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.cookie(AUTH_COOKIE_NAME, '', {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 0,
    });

    return { success: true };
  }
}
