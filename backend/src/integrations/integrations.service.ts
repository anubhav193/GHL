import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NangoService } from '../nango/nango.service';
import { INTEGRATION_ACTIONS_BY_UNIQUE_KEY } from './integrations.actions.config';

export interface IntegrationListItem {
  id: number;
  uniqueKey: string;
  name: string | null;
  provider: string;
  logoUrl: string | null;
  actionsEnabled: number;
  status: 'connected' | 'disconnected';
  connectionId: string | null;
}

@Injectable()
export class IntegrationsService implements OnModuleInit {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly nango: NangoService,
  ) {}

  async onModuleInit() {
    await this.refreshIntegrationsFromNango();
  }

  async refreshIntegrationsFromNango() {
    try {
      const [configs, scriptsConfigs] = await Promise.all([
        this.nango.listIntegrations(),
        this.nango.getScriptsConfig(),
      ]);

      this.logger.log(
        `Fetched ${configs.length} integration config(s) from Nango during startup sync.`,
      );

      const actionsByUniqueKey = new Map<
        string,
        { actionKey: string; actionName: string; description?: string }[]
      >();

      for (const cfg of scriptsConfigs) {
        const keys = [cfg.providerConfigKey, cfg.provider].filter(
          (k): k is string => Boolean(k),
        );

        const fromActions =
          cfg.actions?.map((action) => ({
            actionKey: action.name,
            actionName: action.name,
            description: action.description,
          })) ?? [];

        const fromSyncs =
          cfg.syncs?.map((sync) => ({
            actionKey: sync.name,
            actionName: sync.name,
            description: sync.description,
          })) ?? [];

        const entries = [...fromActions, ...fromSyncs];

        if (entries.length === 0 || keys.length === 0) continue;

        for (const key of keys) {
          const existing = actionsByUniqueKey.get(key) ?? [];
          actionsByUniqueKey.set(key, [...existing, ...entries]);
        }
      }

      const seenUniqueKeys = new Set<string>();

      for (const config of configs) {
        const uniqueKey = config.unique_key;
        seenUniqueKeys.add(uniqueKey);

        const displayName = config.display_name || config.provider || uniqueKey;

        const integration = await this.prisma.client.integration.upsert({
          where: { uniqueKey },
          update: {
            provider: config.provider,
            displayName,
            logoUrl: config.logo ?? null,
            enabled: true,
          },
          create: {
            uniqueKey,
            provider: config.provider,
            displayName,
            logoUrl: config.logo ?? null,
          },
        });

        const actionConfigs = [
          ...(actionsByUniqueKey.get(uniqueKey) ?? []),
          ...(INTEGRATION_ACTIONS_BY_UNIQUE_KEY[uniqueKey] ?? []),
        ];

        for (const action of actionConfigs) {
          await this.prisma.client.integrationAction.upsert({
            where: {
              integrationId_actionKey: {
                integrationId: integration.id,
                actionKey: action.actionKey,
              },
            },
            update: {
              actionName: action.actionName,
              description: action.description,
              enabled: true,
            },
            create: {
              integrationId: integration.id,
              actionKey: action.actionKey,
              actionName: action.actionName,
              description: action.description,
            },
          });
        }
      }

      if (seenUniqueKeys.size > 0) {
        await this.prisma.client.integration.updateMany({
          where: {
            uniqueKey: {
              notIn: Array.from(seenUniqueKeys),
            },
          },
          data: {
            enabled: false,
          },
        });
      }
    } catch (error) {
      this.logger.error('Failed to refresh integrations from Nango', error);
    }
  }

  async getIntegrationsForUser(params: {
    userId: number;
    forceRefreshConnections?: boolean;
  }): Promise<IntegrationListItem[]> {
    const { userId, forceRefreshConnections } = params;

    if (forceRefreshConnections) {
      await this.refreshConnectionsFromNangoForUser(userId);
    }

    const [integrations, connections, actionsByIntegration] = await Promise.all(
      [
        this.prisma.client.integration.findMany({
          where: { enabled: true },
        }),
        this.prisma.client.integrationConnection.findMany({
          where: { userId },
        }),
        this.prisma.client.integrationAction.groupBy({
          by: ['integrationId'],
          where: { enabled: true },
          _count: { _all: true },
        }),
      ],
    );

    const actionsCountMap = new Map<number, number>();
    for (const group of actionsByIntegration) {
      actionsCountMap.set(group.integrationId, group._count._all);
    }

    return integrations.map((integration) => {
      const activeConnection = connections.find(
        (conn) =>
          conn.integrationId === integration.id && conn.status === 'CONNECTED',
      );

      const actionsEnabled = actionsCountMap.get(integration.id) ?? 0;

      return {
        id: integration.id,
        uniqueKey: integration.uniqueKey,
        name: integration.displayName ?? integration.uniqueKey,
        provider: integration.provider,
        logoUrl: integration.logoUrl,
        actionsEnabled,
        status: activeConnection ? 'connected' : 'disconnected',
        connectionId: activeConnection?.nangoConnectionId ?? null,
      };
    });
  }

  async createConnectSessionForUser(params: {
    userId: number;
    integrationId: number;
  }) {
    const { userId, integrationId } = params;

    const [user, integration] = await Promise.all([
      this.prisma.client.user.findUnique({
        where: { id: userId },
      }),
      this.prisma.client.integration.findUnique({
        where: { id: integrationId },
      }),
    ]);

    if (!user || !integration) {
      throw new Error('User or integration not found');
    }

    return this.nango.createConnectSession({
      userId: user.id,
      email: user.email,
      allowedIntegrations: [integration.uniqueKey],
    });
  }

  async disconnectIntegrationForUser(params: {
    userId: number;
    integrationId: number;
    nangoConnectionId: string;
  }) {
    const { userId, integrationId, nangoConnectionId } = params;

    const existing = await this.prisma.client.integrationConnection.findFirst({
      where: {
        userId,
        integrationId,
        nangoConnectionId,
      },
    });

    if (!existing) {
      return;
    }

    await this.nango.deleteConnection({
      connectionId: existing.nangoConnectionId,
      providerConfigKey: existing.providerConfigKey ?? '',
    });

    await this.prisma.client.integrationConnection.delete({
      where: {
        id: existing.id,
      },
    });
  }

  private async refreshConnectionsFromNangoForUser(userId: number) {
    const connections = await this.nango.listConnectionsForUser(userId);

    const prisma = this.prisma.client;

    const integrations = await prisma.integration.findMany({
      where: {
        uniqueKey: {
          in: connections.map((c) => c.provider_config_key),
        },
      },
    });

    const integrationByUniqueKey = new Map(
      integrations.map((i) => [i.uniqueKey, i]),
    );

    const existingConnections = await prisma.integrationConnection.findMany({
      where: { userId },
    });

    const existingByKey = new Map(
      existingConnections.map((conn) => [`${conn.integrationId}`, conn]),
    );

    for (const conn of connections) {
      const integration = integrationByUniqueKey.get(conn.provider_config_key);
      if (!integration) {
        continue;
      }

      const key = `${integration.id}`;
      const existing = existingByKey.get(key);

      if (existing) {
        await prisma.integrationConnection.update({
          where: { id: existing.id },
          data: {
            nangoConnectionId: conn.connection_id,
            providerConfigKey: conn.provider_config_key,
            provider: conn.provider,
            status: 'CONNECTED',
          },
        });
      } else {
        await prisma.integrationConnection.create({
          data: {
            userId,
            integrationId: integration.id,
            nangoConnectionId: conn.connection_id,
            providerConfigKey: conn.provider_config_key,
            provider: conn.provider,
          },
        });
      }
    }

    const activeKeys = new Set(connections.map((c) => c.provider_config_key));

    const integrationIdsToDisconnect = new Set<number>();
    for (const existing of existingConnections) {
      const integration = integrations.find(
        (i) => i.id === existing.integrationId,
      );
      if (!integration) continue;
      if (!activeKeys.has(integration.uniqueKey)) {
        integrationIdsToDisconnect.add(existing.integrationId);
      }
    }

    if (integrationIdsToDisconnect.size > 0) {
      await prisma.integrationConnection.updateMany({
        where: {
          userId,
          integrationId: {
            in: Array.from(integrationIdsToDisconnect),
          },
        },
        data: {
          status: 'DISCONNECTED',
        },
      });
    }
  }
}
