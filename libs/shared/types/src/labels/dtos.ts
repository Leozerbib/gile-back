import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Length, Matches, IsUUID } from "class-validator";

export class CreateLabelDto {
  @ApiProperty({
    description: "Nom du label",
    example: "High Priority",
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @Length(1, 100)
  name!: string;

  @ApiPropertyOptional({
    description: "Description du label",
    example: "Issues that need immediate attention",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: "Couleur hexadécimale du label",
    example: "#FF6B6B",
    pattern: "^#?[0-9a-fA-F]{6}$",
  })
  @IsOptional()
  @IsString()
  @Matches(/^#?[0-9a-fA-F]{6}$/)
  color?: string;

  @ApiProperty({
    description: "ID du workspace",
    example: "workspace-uuid-123",
  })
  @IsUUID()
  workspace_id!: string;
}

export class UpdateLabelDto {
  @ApiPropertyOptional({
    description: "Nom du label",
    example: "Critical Priority",
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional({
    description: "Description du label",
    example: "Critical issues requiring immediate attention",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: "Couleur hexadécimale du label",
    example: "#FF4444",
    pattern: "^#?[0-9a-fA-F]{6}$",
  })
  @IsOptional()
  @IsString()
  @Matches(/^#?[0-9a-fA-F]{6}$/)
  color?: string;
}

export class LabelDto {
  @ApiProperty({
    description: "ID du label",
    example: 123,
  })
  id!: number;

  @ApiProperty({
    description: "Nom du label",
    example: "High Priority",
  })
  name!: string;

  @ApiPropertyOptional({
    description: "Description du label",
    example: "Issues that need immediate attention",
  })
  description?: string;

  @ApiPropertyOptional({
    description: "Couleur hexadécimale du label",
    example: "#FF6B6B",
  })
  color?: string;
}
