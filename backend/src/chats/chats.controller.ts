import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatsService } from './chats.service';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateConversationAgentsDto } from './dto/update-conversation-agents.dto';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email?: string;
  };
}

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('conversations')
  async listConversations(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    if (userId == null) throw new UnauthorizedException();
    const list = await this.chatsService.listConversationsForUser(userId);
    return { conversations: list };
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations/:id')
  async getConversation(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const userId = req.user?.userId;
    if (userId == null) throw new UnauthorizedException();
    return this.chatsService.getConversationWithMessages(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('conversations')
  async createConversation(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    if (userId == null) throw new UnauthorizedException();
    return this.chatsService.createConversationForUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('conversations/:id')
  async deleteConversation(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const userId = req.user?.userId;
    if (userId == null) throw new UnauthorizedException();
    return this.chatsService.deleteConversationForUser(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('conversations/:id/messages')
  async sendMessage(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: SendMessageDto,
    @Res({ passthrough: false }) res: Response,
  ) {
    const userId = req.user?.userId;
    if (userId == null) throw new UnauthorizedException();
    await this.chatsService.streamCompletion(id, userId, body.content, res);
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations/:id/agents')
  async getConversationAgents(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const userId = req.user?.userId;
    if (userId == null) throw new UnauthorizedException();
    return this.chatsService.getConversationAgents(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('conversations/:id/agents')
  async updateConversationAgents(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateConversationAgentsDto,
  ) {
    const userId = req.user?.userId;
    if (userId == null) throw new UnauthorizedException();
    return this.chatsService.updateConversationAgents(id, userId, body.agentIds);
  }
}
