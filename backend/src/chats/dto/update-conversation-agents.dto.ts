import { IsArray, IsInt } from 'class-validator';

export class UpdateConversationAgentsDto {
  @IsArray()
  @IsInt({ each: true })
  agentIds: number[];
}

