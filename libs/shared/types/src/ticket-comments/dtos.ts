import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsOptional, IsString, IsInt } from "class-validator";
import { ProfileOverview } from "../profile/dtos";
import { BasePaginationDto } from "../common/page";

export class CreateTicketCommentDto {
  @ApiProperty({
    description: "Contenu du commentaire",
    example: "This issue has been resolved by implementing the suggested fix.",
  })
  @IsString()
  content!: string;

  @ApiPropertyOptional({
    description: "ID du ticket parent",
    example: 123,
  })
  @IsOptional()
  @IsInt()
  ticket_id?: number;

  @ApiPropertyOptional({
    description: "Le commentaire est interne (visible seulement par l'équipe)",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  is_internal?: boolean;

  @ApiPropertyOptional({
    description: "Liste des utilisateurs mentionnés (UUIDs)",
    type: [String],
    example: ["user-uuid-1", "user-uuid-2"],
  })
  @IsOptional()
  @IsArray()
  mentioned_users?: string[];

  @ApiPropertyOptional({
    description: "Pièces jointes",
    type: Object,
    example: {
      files: [
        {
          name: "screenshot.png",
          url: "https://example.com/files/screenshot.png",
          size: 1024000,
          type: "image/png",
        },
      ],
    },
  })
  @IsOptional()
  attachments?: Record<string, any>;
}

export class UpdateTicketCommentDto {
  @ApiPropertyOptional({
    description: "Contenu mis à jour du commentaire",
    example: "Updated comment with additional information.",
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: "Le commentaire est interne",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_internal?: boolean;

  @ApiPropertyOptional({
    description: "Liste des utilisateurs mentionnés",
    type: [String],
    example: ["user-uuid-3"],
  })
  @IsOptional()
  @IsArray()
  mentioned_users?: string[];

  @ApiPropertyOptional({
    description: "Pièces jointes mises à jour",
    type: Object,
    example: {
      files: [
        {
          name: "updated-screenshot.png",
          url: "https://example.com/files/updated-screenshot.png",
        },
      ],
    },
  })
  @IsOptional()
  attachments?: Record<string, any>;
}

export class TicketCommentOverview {
  @ApiProperty({
    description: "ID du commentaire",
    example: 456,
  })
  id!: number;

  @ApiProperty({
    description: "Contenu du commentaire (tronqué)",
    example: "This issue has been resolved...",
  })
  content!: string;

  @ApiProperty({
    description: "Date de création",
    example: "2024-01-15T10:30:00Z",
  })
  created_at!: string;

  @ApiProperty({
    type: ProfileOverview,
    example: {
      user_id: "b3fb243f-8368-47aa-bcc7-072f049db8af",
      username: "bibz",
      avatar_url: null,
    },
  })
  author?: ProfileOverview;
}

export class TicketCommentDto extends TicketCommentOverview {
  @ApiPropertyOptional({
    description: "Le commentaire est interne",
    example: false,
  })
  is_internal?: boolean;

  @ApiPropertyOptional({
    description: "Liste des utilisateurs mentionnés",
    type: [String],
    example: ["user-uuid-1", "user-uuid-2"],
  })
  mentioned_users?: string[];

  @ApiPropertyOptional({
    description: "Pièces jointes",
    type: Object,
    example: {
      files: [
        {
          name: "screenshot.png",
          url: "https://example.com/files/screenshot.png",
          size: 1024000,
          type: "image/png",
        },
      ],
    },
  })
  attachments?: Record<string, any>;

  @ApiPropertyOptional({
    description: "Date de dernière modification",
    example: "2024-01-15T11:00:00Z",
  })
  updated_at?: string;

  @ApiProperty({
    type: ProfileOverview,
    example: {
      user_id: "b3fb243f-8368-47aa-bcc7-072f049db8af",
      username: "bibz",
      avatar_url: null,
    },
  })
  created_by_user?: ProfileOverview;

  @ApiProperty({
    type: ProfileOverview,
    example: {
      user_id: "b3fb243f-8368-47aa-bcc7-072f049db8af",
      username: "bibz",
      avatar_url: null,
    },
  })
  updated_by_user?: ProfileOverview;
}

export class TicketCommentListDto extends BasePaginationDto<TicketCommentDto> {
  @ApiProperty({
    type: [TicketCommentDto],
    description: "Array of ticket overview objects",
  })
  items!: TicketCommentDto[];
}
