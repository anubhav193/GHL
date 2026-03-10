import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  systemPrompt!: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  toolIds?: number[];
}
