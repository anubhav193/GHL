export interface IntegrationActionConfig {
  actionKey: string;
  actionName: string;
  description?: string;
  /** Optional override for whether this entry should be treated as an action or sync. Defaults to "action". */
  type?: 'action' | 'sync';
}

export const INTEGRATION_ACTIONS_BY_UNIQUE_KEY: Record<
  string,
  IntegrationActionConfig[]
> = {
  // Example configuration:
  // 'slack-nango-community': [
  //   {
  //     actionKey: 'send_message',
  //     actionName: 'Send message',
  //     description: 'Post a message to a Slack channel.',
  //   },
  // ],
};
