import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsInt, Min } from "class-validator";
import { ProfileOverview } from "../profile/dtos";
import { AgentOverview } from "../agents/dtos";
import { WorkspaceOverview } from "../workspace/dtos";
import { ProjectOverview } from "../projects/dtos";
import { BasePaginationDto } from "../common/page";

export class CreateModelUsageDto {
  @ApiPropertyOptional({ example: 1000, description: "Model token count" })
  @IsOptional()
  @IsInt()
  @Min(0)
  model_token_count?: number;

  @ApiPropertyOptional({ example: 500, description: "User token count" })
  @IsOptional()
  @IsInt()
  @Min(0)
  user_token_count?: number;

  @ApiPropertyOptional({ example: 100, description: "Cache token count" })
  @IsOptional()
  @IsInt()
  @Min(0)
  cache_token_count?: number;

  @ApiPropertyOptional({ example: 1600, description: "Total token count" })
  @IsOptional()
  @IsInt()
  @Min(0)
  total_token_count?: number;

  @ApiPropertyOptional({ example: "gpt-4", description: "Model name" })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: "chat", description: "Model usage context" })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiProperty({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af", description: "User ID" })
  user_id!: string;

  @ApiProperty({ example: "workspace-uuid-123", description: "Workspace ID" })
  workspace_id!: string;

  @ApiPropertyOptional({ example: 1, description: "Project ID" })
  @IsOptional()
  project_id?: number;

  @ApiProperty({ example: 123, description: "Agent ID" })
  agent_id!: number;
}

export class ModelUsageOverview {
  @ApiProperty({ example: 123456 })
  id!: number;

  @ApiProperty({ example: 1000, nullable: true })
  model_token_count?: number | null;

  @ApiProperty({ example: 500, nullable: true })
  user_token_count?: number | null;

  @ApiProperty({ example: 1600, nullable: true })
  total_token_count?: number | null;

  @ApiProperty({ example: "gpt-4", nullable: true })
  model?: string | null;

  @ApiProperty({
    type: ProfileOverview,
    example: {
      user_id: "b3fb243f-8368-47aa-bcc7-072f049db8af",
      username: "johnsmith",
      avatar_url: null,
    },
  })
  user!: ProfileOverview;

  @ApiProperty({
    type: AgentOverview,
  })
  agent?: AgentOverview;
}

export class ModelUsageDto extends ModelUsageOverview {
  @ApiProperty({ example: "2025-09-23T10:30:15.456Z" })
  created_at!: string;

  @ApiProperty({ example: 100, nullable: true })
  cache_token_count?: number | null;

  @ApiProperty({ example: "chat", nullable: true })
  from?: string | null;

  @ApiProperty({
    type: WorkspaceOverview,
  })
  workspace!: WorkspaceOverview;

  @ApiProperty({
    type: ProjectOverview,
    nullable: true,
  })
  project?: ProjectOverview;
}

export class ModelUsageListDto extends BasePaginationDto<ModelUsageDto> {
  @ApiProperty({
    type: [ModelUsageDto],
    description: "Array of model usage overview objects",
  })
  items!: ModelUsageDto[];
}
