import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, IsBoolean, IsInt, Min, Max, IsArray } from "class-validator";

export enum ThemeMode {
  LIGHT = "LIGHT",
  DARK = "DARK",
  SYSTEM = "SYSTEM",
}

export enum TimeFormat {
  H12 = "12h",
  H24 = "24h",
}

export enum DateFormat {
  DD_MM_YYYY = "DD/MM/YYYY",
  MM_DD_YYYY = "MM/DD/YYYY",
  YYYY_MM_DD = "YYYY-MM-DD",
}

export class CreateUserPreferencesDto {
  @ApiProperty({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af", description: "User ID" })
  user_id!: string;

  @ApiPropertyOptional({ enum: ThemeMode, example: ThemeMode.SYSTEM, description: "Theme preference" })
  @IsOptional()
  @IsEnum(ThemeMode)
  theme?: ThemeMode;

  @ApiPropertyOptional({ example: "fr", description: "Language code (ISO 639-1)" })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ example: "Europe/Paris", description: "Timezone (IANA format)" })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ enum: DateFormat, example: DateFormat.DD_MM_YYYY, description: "Date format" })
  @IsOptional()
  @IsEnum(DateFormat)
  date_format?: DateFormat;

  @ApiPropertyOptional({ enum: TimeFormat, example: TimeFormat.H24, description: "Time format" })
  @IsOptional()
  @IsEnum(TimeFormat)
  time_format?: TimeFormat;

  @ApiPropertyOptional({ example: false, description: "Compact mode enabled" })
  @IsOptional()
  @IsBoolean()
  compact_mode?: boolean;

  @ApiPropertyOptional({ example: true, description: "Show completed tasks" })
  @IsOptional()
  @IsBoolean()
  show_completed_tasks?: boolean;

  @ApiPropertyOptional({ example: "kanban", description: "Default view mode" })
  @IsOptional()
  @IsString()
  default_view?: string;

  @ApiPropertyOptional({ example: 25, description: "Items per page", minimum: 10, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(100)
  items_per_page?: number;

  @ApiPropertyOptional({ example: "board", description: "Default project view" })
  @IsOptional()
  @IsString()
  default_project_view?: string;

  @ApiPropertyOptional({ type: [String], example: ["project-1", "project-2"], description: "Favorite project IDs" })
  @IsOptional()
  @IsArray()
  favorite_projects?: string[];

  @ApiPropertyOptional({ type: [String], example: ["project-3", "project-4"], description: "Pinned project IDs" })
  @IsOptional()
  @IsArray()
  pinned_projects?: string[];

  @ApiPropertyOptional({ type: Object, example: {}, description: "Dashboard layout configuration" })
  @IsOptional()
  dashboard_layout?: Record<string, any>;

  @ApiPropertyOptional({ type: Object, example: {}, description: "Dashboard widgets configuration" })
  @IsOptional()
  dashboard_widgets?: Record<string, any>;

  @ApiPropertyOptional({ type: Object, example: {}, description: "Custom keyboard shortcuts" })
  @IsOptional()
  custom_shortcuts?: Record<string, any>;

  @ApiPropertyOptional({ type: Object, example: {}, description: "Custom filters configuration" })
  @IsOptional()
  custom_filters?: Record<string, any>;
}

export class UpdateUserPreferencesDto {
  @ApiPropertyOptional({ enum: ThemeMode, example: ThemeMode.DARK, description: "Theme preference" })
  @IsOptional()
  @IsEnum(ThemeMode)
  theme?: ThemeMode;

  @ApiPropertyOptional({ example: "en", description: "Language code (ISO 639-1)" })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ example: "America/New_York", description: "Timezone (IANA format)" })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ enum: DateFormat, example: DateFormat.MM_DD_YYYY, description: "Date format" })
  @IsOptional()
  @IsEnum(DateFormat)
  date_format?: DateFormat;

  @ApiPropertyOptional({ enum: TimeFormat, example: TimeFormat.H12, description: "Time format" })
  @IsOptional()
  @IsEnum(TimeFormat)
  time_format?: TimeFormat;

  @ApiPropertyOptional({ example: true, description: "Compact mode enabled" })
  @IsOptional()
  @IsBoolean()
  compact_mode?: boolean;

  @ApiPropertyOptional({ example: false, description: "Show completed tasks" })
  @IsOptional()
  @IsBoolean()
  show_completed_tasks?: boolean;

  @ApiPropertyOptional({ example: "list", description: "Default view mode" })
  @IsOptional()
  @IsString()
  default_view?: string;

  @ApiPropertyOptional({ example: 50, description: "Items per page", minimum: 10, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(100)
  items_per_page?: number;

  @ApiPropertyOptional({ example: "timeline", description: "Default project view" })
  @IsOptional()
  @IsString()
  default_project_view?: string;

  @ApiPropertyOptional({ type: [String], example: ["project-1", "project-2"], description: "Favorite project IDs" })
  @IsOptional()
  @IsArray()
  favorite_projects?: string[];

  @ApiPropertyOptional({ type: [String], example: ["project-3", "project-4"], description: "Pinned project IDs" })
  @IsOptional()
  @IsArray()
  pinned_projects?: string[];

  @ApiPropertyOptional({ type: Object, example: {}, description: "Dashboard layout configuration" })
  @IsOptional()
  dashboard_layout?: Record<string, any>;

  @ApiPropertyOptional({ type: Object, example: {}, description: "Dashboard widgets configuration" })
  @IsOptional()
  dashboard_widgets?: Record<string, any>;

  @ApiPropertyOptional({ type: Object, example: {}, description: "Custom keyboard shortcuts" })
  @IsOptional()
  custom_shortcuts?: Record<string, any>;

  @ApiPropertyOptional({ type: Object, example: {}, description: "Custom filters configuration" })
  @IsOptional()
  custom_filters?: Record<string, any>;
}

export class UserPreferencesDto {
  @ApiProperty({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af" })
  id!: string;

  @ApiProperty({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af" })
  user_id!: string;

  @ApiProperty({ enum: ThemeMode, example: ThemeMode.SYSTEM })
  theme!: ThemeMode;

  @ApiProperty({ example: "fr" })
  language!: string;

  @ApiProperty({ example: "Europe/Paris" })
  timezone!: string;

  @ApiProperty({ enum: DateFormat, example: DateFormat.DD_MM_YYYY })
  date_format!: DateFormat;

  @ApiProperty({ enum: TimeFormat, example: TimeFormat.H24 })
  time_format!: TimeFormat;

  @ApiProperty({ example: false })
  compact_mode!: boolean;

  @ApiProperty({ example: true })
  show_completed_tasks!: boolean;

  @ApiProperty({ example: "kanban" })
  default_view!: string;

  @ApiProperty({ example: 25 })
  items_per_page!: number;

  @ApiProperty({ example: "board" })
  default_project_view!: string;

  @ApiProperty({ type: [String], example: ["project-1", "project-2"] })
  favorite_projects!: string[];

  @ApiProperty({ type: [String], example: ["project-3", "project-4"] })
  pinned_projects!: string[];

  @ApiProperty({ type: Object, example: {} })
  dashboard_layout!: Record<string, any>;

  @ApiProperty({ type: Object, example: {} })
  dashboard_widgets!: Record<string, any>;

  @ApiProperty({ type: Object, example: {} })
  custom_shortcuts!: Record<string, any>;

  @ApiProperty({ type: Object, example: {} })
  custom_filters!: Record<string, any>;

  @ApiProperty({ example: "2025-09-23T09:41:59.298Z" })
  created_at!: string;

  @ApiProperty({ example: "2025-09-23T14:25:33.456Z", nullable: true })
  updated_at?: string | null;

  @ApiProperty({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af", nullable: true })
  created_by?: string | null;

  @ApiProperty({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af", nullable: true })
  updated_by?: string | null;
}

export class UserPreferencesOverview {
  @ApiProperty({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af" })
  id!: string;

  @ApiProperty({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af" })
  user_id!: string;

  @ApiProperty({ enum: ThemeMode, example: ThemeMode.SYSTEM })
  theme!: ThemeMode;

  @ApiProperty({ example: "fr" })
  language!: string;

  @ApiProperty({ example: "Europe/Paris" })
  timezone!: string;

  @ApiProperty({ example: false })
  compact_mode!: boolean;

  @ApiProperty({ example: "kanban" })
  default_view!: string;

  @ApiProperty({ type: [String], example: ["project-1", "project-2"] })
  favorite_projects!: string[];
}

export class UserPreferencesListDto {
  @ApiProperty({ type: [UserPreferencesDto] })
  items!: UserPreferencesDto[];

  @ApiProperty({ example: 10 })
  total!: number;

  @ApiProperty({ example: 0 })
  skip!: number;

  @ApiProperty({ example: 25 })
  take!: number;
}
