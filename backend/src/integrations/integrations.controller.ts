import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IntegrationsService } from './integrations.service';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email?: string;
  };
}

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async listIntegrations(
    @Req() req: AuthenticatedRequest,
    @Query('force') force?: string,
  ) {
    const userId = req.user?.userId;

    if (!userId) {
      return [];
    }

    const items = await this.integrationsService.getIntegrationsForUser({
      userId,
      forceRefreshConnections: force === '1' || force === 'true',
    });

    return { integrations: items };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/connect-session')
  async createConnectSession(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = req.user?.userId;

    if (!userId) {
      return null;
    }

    const session = await this.integrationsService.createConnectSessionForUser({
      userId,
      integrationId: id,
    });

    return { session };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/connections/:connectionId')
  async disconnectIntegration(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Param('connectionId') connectionId: string,
  ) {
    const userId = req.user?.userId;

    if (!userId) {
      return { success: false };
    }

    await this.integrationsService.disconnectIntegrationForUser({
      userId,
      integrationId: id,
      nangoConnectionId: connectionId,
    });

    return { success: true };
  }
}
