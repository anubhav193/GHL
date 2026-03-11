import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Nango } from '@nangohq/node';

interface NangoIntegrationConfig {
  unique_key: string;
  provider: string;
  display_name?: string;
  logo?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface NangoListIntegrationsResponse {
  data: NangoIntegrationConfig[];
}

interface NangoConnection {
  id: number;
  connection_id: string;
  provider: string;
  provider_config_key: string;
  created: string;
  metadata?: Record<string, unknown> | null;
  tags?: Record<string, string>;
  errors?: Array<{ type: string; log_id: string }>;
}

interface NangoListConnectionsResponse {
  connections: NangoConnection[];
}

interface NangoScriptActionConfig {
  name: string;
  description?: string;
  json_schema?: Record<string, unknown>;
  returns?: string[];
}

interface NangoScriptSyncConfig {
  name: string;
  description?: string;
  json_schema?: Record<string, unknown>;
  returns?: string[];
}

interface NangoScriptsConfig {
  providerConfigKey: string;
  provider?: string;
  actions?: NangoScriptActionConfig[];
  syncs?: NangoScriptSyncConfig[];
}

@Injectable()
export class NangoService {
  private readonly nango: Nango;
  private readonly host: string;
  private readonly secretKey: string;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('NANGO_SECRET_KEY');
    const host = 'https://api.nango.dev';

    this.secretKey = secretKey ?? '';
    this.host = host.replace(/\/+$/, '');

    this.nango = new Nango({
      secretKey: this.secretKey,
      host: this.host,
    });
  }

  async listIntegrations(): Promise<NangoIntegrationConfig[]> {
    const response = await fetch(`${this.host}/integrations`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `Failed to list integrations from Nango: ${response.status} ${response.statusText} ${body}`,
      );
    }

    const json = (await response.json()) as NangoListIntegrationsResponse;
    return json.data ?? [];
  }

  async createConnectSession(params: {
    userId: number;
    email?: string | null;
    organizationId?: string | null;
    allowedIntegrations?: string[];
  }) {
    const { userId, email, organizationId, allowedIntegrations } = params;

    const tags: Record<string, string> = {
      end_user_id: String(userId),
    };

    if (email) {
      tags.end_user_email = email;
    }

    if (organizationId) {
      tags.organization_id = organizationId;
    }

    const { data } = await this.nango.createConnectSession({
      tags,
      allowed_integrations: allowedIntegrations,
    } as any);

    return data;
  }

  async listConnectionsForUser(userId: number): Promise<NangoConnection[]> {
    const { connections } = (await this.nango.listConnections({
      tags: { end_user_id: String(userId) },
    })) as NangoListConnectionsResponse;

    return connections ?? [];
  }

  async deleteConnection(params: {
    connectionId: string;
    providerConfigKey: string;
  }) {
    const { connectionId, providerConfigKey } = params;

    await this.nango.deleteConnection(providerConfigKey, connectionId);
  }

  async getScriptsConfig(): Promise<NangoScriptsConfig[]> {
    const result = await this.nango.getScriptsConfig('nango');

    // In 'nango' format this should already be an array of config objects.
    return (result as any as NangoScriptsConfig[]) ?? [];
  }

  async triggerAction(params: {
    integrationKey: string;
    connectionId: string;
    actionName: string;
    input: Record<string, unknown>;
  }): Promise<unknown> {
    const { integrationKey, connectionId, actionName, input } = params;
    // The Node SDK returns the action result directly.
    return this.nango.triggerAction(integrationKey, connectionId, actionName, input as any);
  }

  async listRecords(params: {
    providerConfigKey: string;
    connectionId: string;
    model: string;
    cursor?: string;
    limit?: number;
  }): Promise<unknown> {
    const { providerConfigKey, connectionId, model, cursor, limit } = params;

    return this.nango.listRecords({
      providerConfigKey,
      connectionId,
      model,
      cursor,
      limit,
    } as any);
  }
}
