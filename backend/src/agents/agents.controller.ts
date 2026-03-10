import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email?: string;
  };
}

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async listAgents(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    if (userId == null) {
      throw new UnauthorizedException();
    }
    const agents = await this.agentsService.listAgentsForUser(userId);
    return { agents };
  }

  @UseGuards(JwtAuthGuard)
  @Get('tools')
  async listAvailableTools(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    if (userId == null) {
      throw new UnauthorizedException();
    }
    const tools = await this.agentsService.listAvailableToolsForUser(userId);
    return { tools };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createAgent(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateAgentDto,
  ) {
    const userId = req.user?.userId;
    if (userId == null) {
      throw new UnauthorizedException();
    }
    const agent = await this.agentsService.createAgentForUser({
      userId,
      name: body.name,
      systemPrompt: body.systemPrompt,
      toolIds: body.toolIds,
    });

    return { agent };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateAgent(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAgentDto,
  ) {
    const userId = req.user?.userId;
    if (userId == null) {
      throw new UnauthorizedException();
    }
    const agent = await this.agentsService.updateAgentForUser({
      agentId: id,
      userId,
      name: body.name,
      systemPrompt: body.systemPrompt,
      toolIds: body.toolIds,
    });

    return { agent };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteAgent(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = req.user?.userId;
    if (userId == null) {
      throw new UnauthorizedException();
    }
    await this.agentsService.deleteAgentForUser({
      agentId: id,
      userId,
    });

    return { success: true };
  }
}
