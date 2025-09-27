import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsBoolean, IsDateString } from "class-validator";
import { ProfileOverview } from "../profile/dtos";

export class CreateUserNotificationSettingsDto {
  @ApiPropertyOptional({ example: true, description: "Global notifications enabled" })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ example: "2025-09-30T23:59:59.999Z", description: "Notifications muted until this time" })
  @IsOptional()
  @IsDateString()
  muted_until?: string;

  @ApiPropertyOptional({ example: true, description: "Email notifications enabled" })
  @IsOptional()
  @IsBoolean()
  email_enabled?: boolean;

  @ApiPropertyOptional({ example: true, description: "Push notifications enabled" })
  @IsOptional()
  @IsBoolean()
  push_enabled?: boolean;

  @ApiPropertyOptional({ example: true, description: "In-app notifications enabled" })
  @IsOptional()
  @IsBoolean()
  in_app_enabled?: boolean;

  @ApiPropertyOptional({ example: false, description: "SMS notifications enabled" })
  @IsOptional()
  @IsBoolean()
  sms_enabled?: boolean;

  @ApiPropertyOptional({ example: true, description: "Notify when ticket is assigned" })
  @IsOptional()
  @IsBoolean()
  on_ticket_assigned?: boolean;

  @ApiPropertyOptional({ example: true, description: "Notify when ticket is completed" })
  @IsOptional()
  @IsBoolean()
  on_ticket_completed?: boolean;

  @ApiPropertyOptional({ example: true, description: "Notify when ticket has new comment" })
  @IsOptional()
  @IsBoolean()
  on_ticket_comment?: boolean;

  @ApiPropertyOptional({ example: true, description: "Notify when ticket is due" })
  @IsOptional()
  @IsBoolean()
  on_ticket_due?: boolean;

  @ApiPropertyOptional({ example: true, description: "Notify when mentioned in comments" })
  @IsOptional()
  @IsBoolean()
  on_mentioned?: boolean;

  @ApiPropertyOptional({ example: true, description: "Notify when project is updated" })
  @IsOptional()
  @IsBoolean()
  on_project_update?: boolean;

  @ApiPropertyOptional({ example: true, description: "Notify when sprint starts" })
  @IsOptional()
  @IsBoolean()
  on_sprint_start?: boolean;

  @ApiPropertyOptional({ example: true, description: "Notify when sprint ends" })
  @IsOptional()
  @IsBoolean()
  on_sprint_end?: boolean;

  @ApiPropertyOptional({ example: false, description: "Daily digest enabled" })
  @IsOptional()
  @IsBoolean()
  daily_digest?: boolean;

  @ApiPropertyOptional({ example: true, description: "Weekly digest enabled" })
  @IsOptional()
  @IsBoolean()
  weekly_digest?: boolean;

  @ApiPropertyOptional({ example: "09:00", description: "Digest notification time (HH:MM)" })
  @IsOptional()
  @IsString()
  digest_time?: string;
}

export class UpdateUserNotificationSettingsDto {
  @ApiPropertyOptional({ example: false, description: "Global notifications enabled" })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ example: "2025-10-01T00:00:00.000Z", description: "Notifications muted until this time" })
  @IsOptional()
  @IsDateString()
  muted_until?: string;

  @ApiPropertyOptional({ example: false, description: "Email notifications enabled" })
  @IsOptional()
  @IsBoolean()
  email_enabled?: boolean;

  @ApiPropertyOptional({ example: false, description: "Push notifications enabled" })
  @IsOptional()
  @IsBoolean()
  push_enabled?: boolean;

  @ApiPropertyOptional({ example: false, description: "In-app notifications enabled" })
  @IsOptional()
  @IsBoolean()
  in_app_enabled?: boolean;

  @ApiPropertyOptional({ example: true, description: "SMS notifications enabled" })
  @IsOptional()
  @IsBoolean()
  sms_enabled?: boolean;

  @ApiPropertyOptional({ example: false, description: "Notify when ticket is assigned" })
  @IsOptional()
  @IsBoolean()
  on_ticket_assigned?: boolean;

  @ApiPropertyOptional({ example: false, description: "Notify when ticket is completed" })
  @IsOptional()
  @IsBoolean()
  on_ticket_completed?: boolean;

  @ApiPropertyOptional({ example: false, description: "Notify when ticket has new comment" })
  @IsOptional()
  @IsBoolean()
  on_ticket_comment?: boolean;

  @ApiPropertyOptional({ example: false, description: "Notify when ticket is due" })
  @IsOptional()
  @IsBoolean()
  on_ticket_due?: boolean;

  @ApiPropertyOptional({ example: false, description: "Notify when mentioned in comments" })
  @IsOptional()
  @IsBoolean()
  on_mentioned?: boolean;

  @ApiPropertyOptional({ example: false, description: "Notify when project is updated" })
  @IsOptional()
  @IsBoolean()
  on_project_update?: boolean;

  @ApiPropertyOptional({ example: false, description: "Notify when sprint starts" })
  @IsOptional()
  @IsBoolean()
  on_sprint_start?: boolean;

  @ApiPropertyOptional({ example: false, description: "Notify when sprint ends" })
  @IsOptional()
  @IsBoolean()
  on_sprint_end?: boolean;

  @ApiPropertyOptional({ example: true, description: "Daily digest enabled" })
  @IsOptional()
  @IsBoolean()
  daily_digest?: boolean;

  @ApiPropertyOptional({ example: false, description: "Weekly digest enabled" })
  @IsOptional()
  @IsBoolean()
  weekly_digest?: boolean;

  @ApiPropertyOptional({ example: "14:30", description: "Digest notification time (HH:MM)" })
  @IsOptional()
  @IsString()
  digest_time?: string;
}

export class UserNotificationSettingsDto {
  @ApiProperty({ example: "b3fb243f-8368-47aa-bcc7-072f049db8af" })
  id!: string;

  @ApiProperty({ example: true })
  enabled!: boolean;

  @ApiProperty({ example: "2025-09-30T23:59:59.999Z", nullable: true })
  muted_until?: string | null;

  @ApiProperty({ example: true })
  email_enabled!: boolean;

  @ApiProperty({ example: true })
  push_enabled!: boolean;

  @ApiProperty({ example: true })
  in_app_enabled!: boolean;

  @ApiProperty({ example: false })
  sms_enabled!: boolean;

  @ApiProperty({ example: true })
  on_ticket_assigned!: boolean;

  @ApiProperty({ example: true })
  on_ticket_completed!: boolean;

  @ApiProperty({ example: true })
  on_ticket_comment!: boolean;

  @ApiProperty({ example: true })
  on_ticket_due!: boolean;

  @ApiProperty({ example: true })
  on_mentioned!: boolean;

  @ApiProperty({ example: true })
  on_project_update!: boolean;

  @ApiProperty({ example: true })
  on_sprint_start!: boolean;

  @ApiProperty({ example: true })
  on_sprint_end!: boolean;

  @ApiProperty({ example: false })
  daily_digest!: boolean;

  @ApiProperty({ example: true })
  weekly_digest!: boolean;

  @ApiProperty({ example: "09:00" })
  digest_time!: string;

  @ApiProperty({ example: "2025-09-23T09:41:59.298Z" })
  created_at!: string;

  @ApiProperty({ example: "2025-09-23T14:25:33.456Z", nullable: true })
  updated_at?: string | null;

  @ApiPropertyOptional({
    description: "Informations sur l'utilisateur qui a créé l'équipe",
    type: ProfileOverview,
  })
  profile?: ProfileOverview;

  @ApiPropertyOptional({
    description: "Informations sur l'utilisateur qui a créé l'équipe",
    type: ProfileOverview,
  })
  created_by?: ProfileOverview;

  @ApiPropertyOptional({
    description: "Informations sur l'utilisateur qui a modifié l'équipe",
    type: ProfileOverview,
  })
  updated_by?: ProfileOverview;
}
