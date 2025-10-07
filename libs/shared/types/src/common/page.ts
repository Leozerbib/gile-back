import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, Min, Max } from "class-validator";
import { Expose, Type } from "class-transformer";

/**
 * Interface générique pour la pagination
 * Utilisée comme base pour tous les DTOs de liste paginée
 * Compatible avec Prisma findMany args et gRPC
 */
export interface PaginationMeta {
  /** Nombre total d'éléments disponibles */
  total: number;
  /** Index de départ (offset) */
  skip: number;
  /** Nombre d'éléments demandés */
  take: number;
  /** Indique s'il y a une page suivante */
  hasNext: boolean;
  /** Indique s'il y a une page précédente */
  hasPrev: boolean;
}

/**
 * Classe de base pour la pagination
 * À étendre par tous les DTOs de liste paginée
 * Compatible avec les standards REST et gRPC
 */
export abstract class BasePaginationDto<T> {
  @ApiProperty({
    description: "Liste des éléments",
    isArray: true,
  })
  @Expose()
  abstract items: T[];

  @ApiProperty({
    description: "Nombre total d'éléments disponibles",
    example: 100,
    type: "integer",
    minimum: 0,
  })
  @Expose()
  @IsNumber({}, { message: "Le total doit être un nombre" })
  @Min(0, { message: "Le total ne peut pas être négatif" })
  total!: number;

  @ApiProperty({
    description: "Nombre d'éléments à sauter (offset)",
    example: 0,
    type: "integer",
    minimum: 0,
    default: 0,
  })
  @Expose()
  @IsNumber({}, { message: "Le skip doit être un nombre" })
  @Min(0, { message: "Le skip ne peut pas être négatif" })
  skip!: number;

  @ApiProperty({
    description: "Nombre d'éléments à prendre (limit)",
    example: 25,
    type: "integer",
    minimum: 1,
    maximum: 100,
    default: 25,
  })
  @Expose()
  @IsNumber({}, { message: "Le take doit être un nombre" })
  @Min(1, { message: "Le take doit être au minimum 1" })
  @Max(100, { message: "Le take ne peut pas dépasser 100" })
  take!: number;

  @ApiProperty({
    description: "Indique s'il y a une page suivante",
    example: true,
    type: "boolean",
  })
  @Expose()
  @IsOptional()
  has_next?: boolean;

  @ApiProperty({
    description: "Indique s'il y a une page précédente",
    example: false,
    type: "boolean",
  })
  @Expose()
  @IsOptional()
  has_prev?: boolean;

  /**
   * Calcule automatiquement les propriétés de navigation
   */
  protected calculateNavigationProperties(): void {
    this.has_next = this.skip + this.take < this.total;
    this.has_prev = this.skip > 0;
  }

  /**
   * Méthode utilitaire pour créer une instance avec les propriétés de navigation calculées
   */
  static create<T extends BasePaginationDto<any>>(items: T["items"], total: number, skip: number, take: number, targetClass: new () => T): T {
    const instance = new targetClass();
    instance.items = items;
    instance.total = total;
    instance.skip = skip;
    instance.take = take;
    instance.calculateNavigationProperties();
    return instance;
  }
}

/**
 * Options de pagination pour les requêtes
 * Utilisé dans les DTOs de requête avec pagination
 */
export class PaginationQueryDto {
  @ApiProperty({
    description: "Nombre d'éléments à sauter (offset)",
    example: 0,
    type: "integer",
    minimum: 0,
    default: 0,
    required: false,
  })
  @Expose()
  @Type(() => Number)
  @IsOptional()
  @IsNumber({}, { message: "Le skip doit être un nombre" })
  @Min(0, { message: "Le skip ne peut pas être négatif" })
  skip?: number = 0;

  @ApiProperty({
    description: "Nombre d'éléments à prendre (limit)",
    example: 25,
    type: "integer",
    minimum: 1,
    maximum: 100,
    default: 25,
    required: false,
  })
  @Expose()
  @Type(() => Number)
  @IsOptional()
  @IsNumber({}, { message: "Le take doit être un nombre" })
  @Min(1, { message: "Le take doit être au minimum 1" })
  @Max(100, { message: "Le take ne peut pas dépasser 100" })
  take?: number = 25;
}
