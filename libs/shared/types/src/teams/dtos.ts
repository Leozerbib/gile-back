import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, IsEnum } from "class-validator";
import { ProfileOverview } from "../profile/dtos";
import { ProjectOverview } from "../projects/dtos";
import { BasePaginationDto } from "../common/page";

export enum TeamRole {
  LEADER = "LEADER",
  MEMBER = "MEMBER",
  CONTRIBUTOR = "CONTRIBUTOR",
  OBSERVER = "OBSERVER",
}

export class CreateTeamDto {
  @ApiProperty({
    description: "ID du workspace",
    format: "uuid",
    example: "workspace-uuid-123",
  })
  @IsUUID()
  workspace_id!: string;

  @ApiProperty({
    description: "Nom de l'équipe",
    example: "Development Team",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    description: "Description de l'équipe",
    required: false,
    example: "Core development team responsible for backend and frontend development",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "URL de l'avatar de l'équipe",
    required: false,
    example: "https://example.com/teams/dev-team-avatar.png",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar_url?: string;
}

export class UpdateTeamDto {
  @ApiPropertyOptional({
    description: "Nom de l'équipe",
    example: "Senior Development Team",
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: "Description de l'équipe",
    example: "Senior development team with expertise in full-stack development",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: "URL de l'avatar de l'équipe",
    example: "https://example.com/teams/senior-dev-avatar.png",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar_url?: string;

  @ApiPropertyOptional({
    description: "L'équipe est active",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class TeamOverview {
  @ApiProperty({
    description: "ID de l'équipe",
    example: "team-uuid-123",
  })
  id!: string;

  @ApiProperty({
    description: "Nom de l'équipe",
    example: "Development Team",
  })
  name!: string;

  @ApiProperty({
    description: "Slug de l'équipe",
    example: "dev-team",
  })
  slug!: string;

  @ApiProperty({
    description: "Description de l'équipe",
    required: false,
    example: "Core development team responsible for backend and frontend development",
  })
  description?: string;

  @ApiProperty({
    description: "L'équipe est active",
    example: true,
  })
  is_active!: boolean;

  @ApiProperty({
    description: "URL de l'avatar de l'équipe",
    required: false,
    example: "https://example.com/teams/dev-team-avatar.png",
  })
  avatar_url?: string;
}

export class TeamDto extends TeamOverview {
  @ApiProperty({
    description: "Date de création",
    example: "2024-01-15T10:00:00Z",
  })
  created_at!: Date;

  @ApiProperty({
    description: "Date de dernière modification",
    required: false,
    example: "2024-01-15T14:30:00Z",
  })
  updated_at?: Date;

  @ApiProperty({
    description: "ID de l'utilisateur qui a créé l'équipe",
    required: false,
    example: "user-uuid-789",
  })
  created_by?: string;

  @ApiProperty({
    description: "ID de l'utilisateur qui a modifié l'équipe",
    required: false,
    example: "user-uuid-101",
  })
  updated_by?: string;

  @ApiPropertyOptional({
    description: "Informations sur l'utilisateur qui a créé l'équipe",
    type: ProfileOverview,
  })
  created_by_user?: ProfileOverview;

  @ApiPropertyOptional({
    description: "Informations sur l'utilisateur qui a modifié l'équipe",
    type: ProfileOverview,
  })
  updated_by_user?: ProfileOverview;

  @ApiPropertyOptional({
    description: "Membres de l'équipe",
    type: [Object],
  })
  members?: TeamMemberDto[];

  @ApiPropertyOptional({
    description: "Projets associés à l'équipe",
    type: [Object],
  })
  projects?: ProjectOverview[];
}

export class TeamListDto extends BasePaginationDto<TeamDto | TeamOverview> {
  @ApiProperty({
    type: [TeamDto],
    description: "Array of task overview objects",
  })
  items!: (TeamDto | TeamOverview)[];
}

export class AddTeamMemberDto {
  @ApiProperty({
    description: "ID de l'utilisateur à ajouter",
    format: "uuid",
    example: "user-uuid-123",
  })
  @IsUUID()
  user_id!: string;

  @ApiPropertyOptional({
    description: "Rôle du membre dans l'équipe",
    enum: TeamRole,
    example: TeamRole.MEMBER,
  })
  @IsOptional()
  @IsEnum(TeamRole)
  role?: TeamRole;
}

export class UpdateTeamMemberDto {
  @ApiPropertyOptional({
    description: "Rôle du membre dans l'équipe",
    enum: TeamRole,
    example: TeamRole.LEADER,
  })
  @IsOptional()
  @IsEnum(TeamRole)
  role?: TeamRole;
}

export class TeamMemberOverview {
  @ApiProperty({
    description: "ID du membre de l'équipe",
    example: "member-uuid-123",
  })
  id!: string;

  @ApiProperty({
    description: "Rôle du membre dans l'équipe",
    enum: TeamRole,
    example: TeamRole.MEMBER,
  })
  role!: TeamRole;

  @ApiPropertyOptional({
    description: "Informations sur l'utilisateur",
    type: ProfileOverview,
  })
  user?: ProfileOverview;
}

export class TeamMemberDto extends TeamMemberOverview {
  @ApiProperty({
    description: "Date d'ajout à l'équipe",
    example: "2024-01-15T10:00:00Z",
  })
  created_at!: Date;

  @ApiProperty({
    description: "ID de l'utilisateur qui a ajouté le membre",
    required: false,
    example: "user-uuid-101",
  })
  created_by?: string;
}

export class TeamMemberListDto extends BasePaginationDto<TeamMemberDto | TeamMemberOverview> {
  @ApiProperty({
    type: [TeamMemberDto],
    description: "Array of team member overview objects",
  })
  items!: (TeamMemberDto | TeamMemberOverview)[];
}

// ============================================================================
// PRISMA SELECT TYPES
// ============================================================================

/**
 * Type de sélection Prisma pour TeamOverview
 * Utilisé pour les listes et aperçus d'équipes
 */
export const TeamOverviewSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  is_active: true,
  avatar_url: true,
} as const;

/**
 * Type de sélection Prisma pour TeamDto complet
 * Inclut toutes les informations détaillées de l'équipe avec relations
 */
export const TeamDtoSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  is_active: true,
  avatar_url: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
  created_by_user: {
    select: {
      profiles: {
        select: {
          user_id: true,
          username: true,
          avatar_url: true,
        },
      },
    },
  },
  updated_by_user: {
    select: {
      profiles: {
        select: {
          user_id: true,
          username: true,
          avatar_url: true,
        },
      },
    },
  },
} as const;

export const TeamMemberOverviewSelect = {
  id: true,
  user_id: true,
  user: {
    select: {
      profiles: {
        select: {
          user_id: true,
          username: true,
          avatar_url: true,
        },
      },
    },
  },
  role: true,
};

/**
 * Type de sélection Prisma pour TeamMemberDto
 * Inclut les informations complètes du membre avec relations utilisateur
 */
export const TeamMemberDtoSelect = {
  id: true,
  team_id: true,
  user_id: true,
  role: true,
  created_at: true,
  created_by: true,
  user: {
    select: {
      profiles: {
        select: {
          user_id: true,
          username: true,
          avatar_url: true,
        },
      },
    },
  },
} as const;

/**
 * Type de sélection Prisma pour les listes d'équipes
 * Optimisé pour les requêtes de pagination avec relations minimales
 */
export const TeamListSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  is_active: true,
  avatar_url: true,
  created_at: true,
  updated_at: true,
  created_by_user: {
    select: {
      profiles: {
        select: {
          user_id: true,
          username: true,
          avatar_url: true,
        },
      },
    },
  },
} as const;

/**
 * Type de sélection Prisma pour les listes de membres d'équipe
 * Optimisé pour les requêtes de pagination des membres
 */
export const TeamMemberListSelect = {
  id: true,
  team_id: true,
  user_id: true,
  role: true,
  created_at: true,
  user: {
    select: {
      profiles: {
        select: {
          user_id: true,
          username: true,
          avatar_url: true,
        },
      },
    },
  },
} as const;

// ============================================================================
// TYPE HELPERS
// ============================================================================

/**
 * Type helper pour extraire le type de retour d'une requête Prisma
 * avec TeamOverviewSelect
 */
export type PrismaTeamOverview = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  avatar_url: string | null;
};

/**
 * Type helper pour extraire le type de retour d'une requête Prisma
 * avec TeamDtoSelect
 */
export type PrismaTeamDto = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date | null;
  created_by: string | null;
  updated_by: string | null;
  created_by_user?: {
    profiles: {
      user_id: string;
      username: string;
      avatar_url: string | null;
    } | null;
  } | null;
  updated_by_user?: {
    profiles: {
      user_id: string;
      username: string;
      avatar_url: string | null;
    } | null;
  } | null;
};

/**
 * Type helper pour extraire le type de retour d'une requête Prisma
 * avec TeamMemberDtoSelect
 */
export type PrismaTeamMemberDto = {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  created_at: Date;
  created_by: string | null;
  user: {
    profiles: {
      user_id: string;
      username: string;
      avatar_url: string | null;
    } | null;
  } | null;
  created_by_user?: {
    profiles: {
      user_id: string;
      username: string;
      avatar_url: string | null;
    } | null;
  } | null;
};
