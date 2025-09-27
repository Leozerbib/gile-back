import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsObject, IsEnum } from "class-validator";
import { Expose, Type } from "class-transformer";
import { BasePaginationDto, PaginationQueryDto, PaginationMeta } from "./page";

/**
 * Options de tri pour les requêtes de recherche
 */
export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

export class SortOption {
  @ApiProperty({
    description: "Champ sur lequel trier",
    example: "createdAt",
    type: "string",
  })
  @Expose()
  @IsString()
  field!: string;

  @ApiProperty({
    description: "Ordre de tri",
    example: SortOrder.DESC,
    enum: SortOrder,
  })
  @Expose()
  @IsEnum(SortOrder)
  order!: SortOrder;
}

/**
 * Options de groupement pour les requêtes de recherche
 */
export class GroupByOption {
  @ApiProperty({
    description: "Champ principal de groupement",
    example: "status",
    type: "string",
  })
  @Expose()
  @IsString()
  field!: string;

  @ApiProperty({
    description: "Sous-champ de groupement optionnel",
    example: "priority",
    type: "string",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString()
  subField?: string;
}

/**
 * Interface pour les filtres génériques
 */
export interface SearchFilter {
  [key: string]: any;
}

/**
 * DTO de base pour les requêtes de recherche
 * Contient tous les paramètres de recherche communs
 * À étendre par les DTOs spécifiques de chaque entité
 */
export class BaseSearchQueryDto extends PaginationQueryDto {
  @ApiProperty({
    description: "Terme de recherche général",
    example: "mot-clé",
    type: "string",
    required: false,
  })
  @Expose()
  @Type(() => String)
  @IsOptional()
  @IsString({ message: "Le terme de recherche doit être une chaîne de caractères" })
  search?: string;

  @ApiProperty({
    description: "Options de tri",
    example: [{ field: "createdAt", order: SortOrder.DESC }],
    type: "array",
    items: {
      type: "object",
      properties: {
        field: { type: "string" },
        order: { type: "string", enum: ["ASC", "DESC"] },
      },
    },
    required: false,
  })
  @Expose()
  @Type(() => SortOption)
  @IsOptional()
  sortBy?: SortOption[];

  @ApiProperty({
    description: "Options de groupement",
    example: { field: "status", subField: "priority" },
    type: GroupByOption,
    required: false,
  })
  @Expose()
  @Type(() => GroupByOption)
  @IsOptional()
  groupBy?: GroupByOption;

  @ApiProperty({
    description: "Options de sous-groupement",
    example: { field: "priority" },
    type: GroupByOption,
    required: false,
  })
  @Expose()
  @Type(() => GroupByOption)
  @IsOptional()
  subGroupBy?: GroupByOption;

  @ApiProperty({
    description: "Filtres spécifiques à appliquer",
    example: { status: "active", priority: "high", category: "bug" },
    type: "object",
    additionalProperties: true,
  })
  @Expose()
  @IsOptional()
  @IsObject({ message: "Les filtres doivent être un objet" })
  filters?: SearchFilter;
}

/**
 * Interface générique pour les résultats de recherche paginés
 * Compatible avec les standards REST et gRPC
 */
export interface SearchResult<T> extends PaginationMeta {
  /** Liste des éléments correspondant à la recherche */
  items: T[];
}

/**
 * Classe abstraite pour les DTOs de résultat de recherche
 * Fournit une structure standardisée pour les réponses paginées
 */
export abstract class BaseSearchResultDto<T> extends BasePaginationDto<T> {
  /**
   * Méthode utilitaire pour créer une instance de résultat de recherche
   */
  static createSearchResult<T extends BaseSearchResultDto<any>>(items: T["items"], total: number, skip: number, take: number, targetClass: new () => T): T {
    return BasePaginationDto.create(items, total, skip, take, targetClass);
  }
}

/**
 * Utilitaires pour la construction de requêtes de recherche
 */
export class SearchQueryBuilder {
  /**
   * Construit les options de tri pour Prisma
   */
  static buildSortOptions(sortOptions?: SortOption[]): Record<string, "asc" | "desc"> {
    if (!sortOptions || sortOptions.length === 0) {
      return { createdAt: "desc" as const }; // Tri par défaut
    }

    const sort: Record<string, "asc" | "desc"> = {};
    sortOptions.forEach(option => {
      sort[option.field] = option.order.toLowerCase() as "asc" | "desc";
    });

    return sort;
  }

  /**
   * Construit les conditions de recherche pour Prisma
   */
  static buildSearchConditions(search?: string, searchFields: string[] = ["name", "description"]): Record<string, any> {
    if (!search) {
      return {};
    }

    return {
      OR: searchFields.map(field => ({
        [field]: {
          contains: search,
          mode: "insensitive" as const,
        },
      })),
    };
  }

  /**
   * Applique les filtres à une requête
   */
  static applyFilters<T extends Record<string, any>>(query: T, filters?: SearchFilter): T {
    if (!filters) {
      return query;
    }

    return { ...query, ...filters };
  }

  /**
   * Calcule les métadonnées de pagination
   */
  static calculatePaginationMeta(total: number, skip: number, take: number): PaginationMeta {
    return {
      total,
      skip,
      take,
      hasNext: skip + take < total,
      hasPrev: skip > 0,
    };
  }
}
