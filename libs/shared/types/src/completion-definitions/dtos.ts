import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, Min, Max, IsEnum, IsNumber } from "class-validator";
import { ProfileOverview } from "../profile/dtos";

export enum CompletionDefinitionStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  DEPRECATED = "DEPRECATED",
  ARCHIVED = "ARCHIVED",
}

export enum CompletionType {
  CODE_COMPLETION = "CODE_COMPLETION",
  TEXT_COMPLETION = "TEXT_COMPLETION",
  CHAT_COMPLETION = "CHAT_COMPLETION",
  EDIT_COMPLETION = "EDIT_COMPLETION",
  INSERT_COMPLETION = "INSERT_COMPLETION",
  FUNCTION_CALL = "FUNCTION_CALL",
  CUSTOM_COMPLETION = "CUSTOM_COMPLETION",
}

export enum CompletionModel {
  GPT_4 = "GPT_4",
  GPT_3_5_TURBO = "GPT_3_5_TURBO",
  CLAUDE_3_OPUS = "CLAUDE_3_OPUS",
  CLAUDE_3_SONNET = "CLAUDE_3_SONNET",
  CLAUDE_3_HAIKU = "CLAUDE_3_HAIKU",
  GEMINI_PRO = "GEMINI_PRO",
  GEMINI_PRO_VISION = "GEMINI_PRO_VISION",
  LOCAL_MODEL = "LOCAL_MODEL",
  CUSTOM_MODEL = "CUSTOM_MODEL",
}

export class CreateCompletionDefinitionDto {
  @ApiProperty({ example: "Code Completion Assistant", description: "Completion definition name" })
  name!: string;

  @ApiPropertyOptional({ example: "Advanced code completion for multiple programming languages", description: "Completion definition description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "#06B6D4", description: "UI color for the completion definition" })
  @IsOptional()
  @IsString()
  ui_color?: string;

  @ApiPropertyOptional({ type: Object, example: { model: "gpt-4", temperature: 0.2, max_tokens: 100 }, description: "Completion definition configuration data" })
  @IsOptional()
  config_data?: Record<string, any>;

  @ApiPropertyOptional({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af", description: "Created by user ID" })
  @IsOptional()
  @IsUUID()
  created_by?: string;

  @ApiPropertyOptional({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af", description: "Updated by user ID" })
  @IsOptional()
  @IsUUID()
  updated_by?: string;
}

export class UpdateCompletionDefinitionDto {
  @ApiPropertyOptional({ example: "Updated Code Completion Assistant", description: "Updated completion definition name" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "Updated advanced code completion description", description: "Updated completion definition description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "#0891B2", description: "Updated UI color" })
  @IsOptional()
  @IsString()
  ui_color?: string;

  @ApiPropertyOptional({ type: Object, example: { model: "gpt-4-turbo", temperature: 0.1, max_tokens: 150 }, description: "Updated configuration data" })
  @IsOptional()
  config_data?: Record<string, any>;

  @ApiPropertyOptional({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af", description: "Updated by user ID" })
  @IsOptional()
  @IsUUID()
  updated_by?: string;
}

export class CompletionDefinitionDto {
  @ApiProperty({ example: 123 })
  id!: number;

  @ApiProperty({ example: "2025-09-23T10:30:15.456Z" })
  created_at!: string;

  @ApiProperty({ example: "2025-09-23T14:25:33.456Z", nullable: true })
  updated_at?: string | null;

  @ApiProperty({ example: "Code Completion Assistant" })
  name!: string;

  @ApiProperty({ example: "Advanced code completion for multiple programming languages", nullable: true })
  description?: string | null;

  @ApiProperty({ example: "#06B6D4", nullable: true })
  ui_color?: string | null;

  @ApiProperty({ type: Object, example: { model: "gpt-4", temperature: 0.2, max_tokens: 100 }, nullable: true })
  config_data?: Record<string, any> | null;

  @ApiProperty({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af", nullable: true })
  created_by?: string | null;

  @ApiProperty({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af", nullable: true })
  updated_by?: string | null;

  @ApiProperty({
    type: ProfileOverview,
    example: {
      user_id: "b3fb243f-8368-47aa-bcc7-072f049db8af",
      username: "johnsmith",
      avatar_url: null,
    },
    nullable: true,
  })
  created_by_user?: ProfileOverview | null;

  @ApiProperty({
    type: ProfileOverview,
    example: {
      user_id: "b3fb243f-8368-47aa-bcc7-072f049db8af",
      username: "johnsmith",
      avatar_url: null,
    },
    nullable: true,
  })
  updated_by_user?: ProfileOverview | null;
}

export class CompletionDefinitionOverview {
  @ApiProperty({ example: 123 })
  id!: number;

  @ApiProperty({ example: "Code Completion Assistant" })
  name!: string;

  @ApiProperty({ example: "Advanced code completion for multiple programming languages", nullable: true })
  description?: string | null;

  @ApiProperty({ example: "#06B6D4", nullable: true })
  ui_color?: string | null;

  @ApiProperty({ enum: CompletionType, example: CompletionType.CODE_COMPLETION })
  type!: CompletionType;

  @ApiProperty({ enum: CompletionModel, example: CompletionModel.GPT_4 })
  model!: CompletionModel;

  @ApiProperty({ enum: CompletionDefinitionStatus, example: CompletionDefinitionStatus.ACTIVE })
  status!: CompletionDefinitionStatus;
}

export class CompletionDefinitionListDto {
  @ApiProperty({ type: [CompletionDefinitionDto] })
  items!: CompletionDefinitionDto[];

  @ApiProperty({ example: 12 })
  total!: number;

  @ApiProperty({ example: 0 })
  skip!: number;

  @ApiProperty({ example: 25 })
  take!: number;
}

export class CompletionDefinitionStatsDto {
  @ApiProperty({ example: 15 })
  total_definitions!: number;

  @ApiProperty({ example: 10 })
  active_definitions!: number;

  @ApiProperty({ example: 3 })
  inactive_definitions!: number;

  @ApiProperty({ example: 2 })
  draft_definitions!: number;

  @ApiProperty({ type: Object, example: { CODE_COMPLETION: 8, TEXT_COMPLETION: 4, CHAT_COMPLETION: 3 } })
  definitions_by_type!: Record<CompletionType, number>;

  @ApiProperty({ type: Object, example: { GPT_4: 7, GPT_3_5_TURBO: 5, CLAUDE_3_SONNET: 3 } })
  definitions_by_model!: Record<CompletionModel, number>;

  @ApiProperty({ example: 1250 })
  total_completions!: number;

  @ApiProperty({ example: 95000 })
  total_tokens_used!: number;
}

export class CompletionDefinitionFilterDto {
  @ApiPropertyOptional({ example: "Code", description: "Search in name and description" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: CompletionDefinitionStatus, example: CompletionDefinitionStatus.ACTIVE, description: "Filter by status" })
  @IsOptional()
  @IsEnum(CompletionDefinitionStatus)
  status?: CompletionDefinitionStatus;

  @ApiPropertyOptional({ enum: CompletionType, example: CompletionType.CODE_COMPLETION, description: "Filter by completion type" })
  @IsOptional()
  @IsEnum(CompletionType)
  type?: CompletionType;

  @ApiPropertyOptional({ enum: CompletionModel, example: CompletionModel.GPT_4, description: "Filter by model" })
  @IsOptional()
  @IsEnum(CompletionModel)
  model?: CompletionModel;

  @ApiPropertyOptional({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af", description: "Filter by created by user" })
  @IsOptional()
  @IsUUID()
  created_by?: string;

  @ApiPropertyOptional({ example: 0, description: "Number of records to skip", minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({ example: 25, description: "Number of records to take", minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  take?: number;
}

export class CompletionExecutionDto {
  @ApiProperty({ example: 456 })
  id!: number;

  @ApiProperty({ example: 123 })
  completion_definition_id!: number;

  @ApiProperty({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af" })
  user_id!: string;

  @ApiProperty({ example: "function calculateTotal(a, b) {\n  return a + b;\n}" })
  prompt!: string;

  @ApiProperty({ example: "  console.log(calculateTotal(5, 10));\n}" })
  completion!: string;

  @ApiProperty({ example: "2025-09-23T10:30:15.456Z" })
  created_at!: string;

  @ApiProperty({ example: 2.5 })
  execution_time_seconds!: number;

  @ApiProperty({ example: 150 })
  prompt_tokens!: number;

  @ApiProperty({ example: 75 })
  completion_tokens!: number;

  @ApiProperty({ example: 225 })
  total_tokens!: number;

  @ApiProperty({ example: "gpt-4" })
  model_used!: string;

  @ApiProperty({ example: true })
  is_successful!: boolean;

  @ApiProperty({
    type: CompletionDefinitionOverview,
    example: {
      id: 123,
      name: "Code Completion Assistant",
      description: "Advanced code completion for multiple programming languages",
      ui_color: "#06B6D4",
      type: "CODE_COMPLETION",
      model: "GPT_4",
      status: "ACTIVE",
    },
  })
  completion_definition!: CompletionDefinitionOverview;
}

export class CreateCompletionExecutionDto {
  @ApiProperty({ example: 123, description: "Completion definition ID" })
  completion_definition_id!: number;

  @ApiProperty({ example: "function calculateTotal(a, b) {\n  return a + b;\n}", description: "Input prompt" })
  prompt!: string;

  @ApiPropertyOptional({ type: Object, example: { suffix: "\n  return result;", language: "javascript" }, description: "Additional completion parameters" })
  @IsOptional()
  parameters?: Record<string, any>;

  @ApiPropertyOptional({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af", description: "User ID" })
  @IsOptional()
  @IsUUID()
  user_id?: string;
}

export class CompletionAnalyticsDto {
  @ApiProperty({ example: "2025-09-23" })
  date!: string;

  @ApiProperty({ example: 125 })
  total_executions!: number;

  @ApiProperty({ example: 95000 })
  total_tokens_used!: number;

  @ApiProperty({ example: 150 })
  average_prompt_tokens!: number;

  @ApiProperty({ example: 75 })
  average_completion_tokens!: number;

  @ApiProperty({ example: 225 })
  average_total_tokens!: number;

  @ApiProperty({ example: 2.3 })
  average_execution_time_seconds!: number;

  @ApiProperty({ example: 96 })
  success_rate_percentage!: number;

  @ApiProperty({ type: Object, example: { CODE_COMPLETION: 80, TEXT_COMPLETION: 30, CHAT_COMPLETION: 15 } })
  executions_by_type!: Record<CompletionType, number>;

  @ApiProperty({ type: Object, example: { GPT_4: 65000, GPT_3_5_TURBO: 25000, CLAUDE_3_SONNET: 5000 } })
  tokens_by_model!: Record<string, number>;
}

export class CompletionDefinitionTemplateDto {
  @ApiProperty({ example: "code-completion-pro" })
  id!: string;

  @ApiProperty({ example: "Professional Code Completion Template" })
  name!: string;

  @ApiProperty({ example: "Template for professional code completion with advanced features" })
  description!: string;

  @ApiProperty({ example: "#06B6D4" })
  ui_color!: string;

  @ApiProperty({ enum: CompletionType, example: CompletionType.CODE_COMPLETION })
  type!: CompletionType;

  @ApiProperty({ enum: CompletionModel, example: CompletionModel.GPT_4 })
  default_model!: CompletionModel;

  @ApiProperty({ type: Object, example: { temperature: 0.2, max_tokens: 100, stop_sequences: ["\n\n"] } })
  default_config!: Record<string, any>;

  @ApiProperty({ example: "3.0" })
  version!: string;

  @ApiProperty({ type: [String], example: ["code", "completion", "professional", "advanced"] })
  tags!: string[];

  @ApiProperty({ example: true })
  is_premium!: boolean;

  @ApiProperty({ example: ["javascript", "typescript", "python", "java", "c++"] })
  supported_languages!: string[];

  @ApiProperty({ example: ["multi-line", "context-aware", "error-handling"] })
  features!: string[];
}

export class CompletionUsageDto {
  @ApiProperty({ example: 123 })
  completion_definition_id!: number;

  @ApiProperty({ example: "Code Completion Assistant" })
  completion_definition_name!: string;

  @ApiProperty({ example: 250 })
  execution_count!: number;

  @ApiProperty({ example: 185000 })
  total_tokens_used!: number;

  @ApiProperty({ example: 740 })
  average_tokens_per_execution!: number;

  @ApiProperty({ example: 2.1 })
  average_execution_time_seconds!: number;

  @ApiProperty({ example: 98 })
  success_rate_percentage!: number;

  @ApiProperty({ example: "2025-09-23T10:30:15.456Z" })
  last_used_at!: string;

  @ApiProperty({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af" })
  most_active_user_id!: string;
}
